const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');

const read = name => readFileSync(join(__dirname, '..', name), 'utf8');
const html = read('index.html');

function game(context = {}) {
  // Trust and morning bookkeeping live in cottage-bonds tests; here they are no-ops.
  for (const name of ['trustNpc', 'courtNpc', 'bondsNewDay']) context[name] ??= () => {};
  const runtime = vm.createContext(context);
  vm.runInContext(read('cottage-activities.js'), runtime);
  runtime.activities = vm.runInContext('CottageActivities', runtime);
  return runtime;
}

function runSection(runtime, start, end) {
  const from = html.indexOf(start);
  const to = html.indexOf(end, from);
  assert.ok(from >= 0 && to > from);
  vm.runInContext(html.slice(from, to), runtime);
}

test('neighbor letters rotate among familiar residents and cannot be farmed on delivery day', () => {
  const {activities} = game();
  const relations = {gy: {met: true}, xm: {met: true}, xy: {met: false}};
  const request = activities.nextRequest(1,null,relations);
  assert.equal(request.resident,'gy');
  request.status = 'accepted';
  assert.equal(activities.nextRequest(2,request,relations),null);
  const inventory = {cookie: 1, berry: 0, flower: 0};
  assert.equal(activities.fulfillRequest(request,'xm',3,inventory,'cookie'),null);
  assert.equal(activities.fulfillRequest(request,'gy',3,inventory,'berry'),null);
  assert.equal(activities.fulfillRequest(request,'gy',3,inventory,'cookie'),'flower');
  assert.equal(activities.fulfillRequest(request,'gy',3,inventory,'cookie'),null);
  assert.deepEqual(inventory,{cookie: 0, berry: 0, flower: 2});
  const saved = activities.loadRequest(JSON.parse(JSON.stringify(request)));
  assert.equal(activities.nextRequest(3,saved,relations),null);
  assert.equal(activities.nextRequest(4,saved,relations).resident,'xm');
  assert.equal(activities.fulfillRequest({...request,status:'accepted'},'gy',4,inventory,'cookie'),null);
  assert.equal(activities.loadRequest({day:1,resident:'unknown',status:'accepted'}),null);
});

test('mailbox and delivery handlers persist acceptance, first keepsake and memory', () => {
  const n = {id:'gy'};
  const state = {day:1,neighborRequest:null,rel:{gy:{met:true}},inv:{berry:2,cookie:0,flower:0}};
  const life = {cards:{}}, memories = [];
  let options, saved;
  const runtime = game({
    state,npcs:[n],D:{},ITEM_ICONS:{berry:'🍓',cookie:'🍪',flower:'🌼'},
    tr:key=>key,itemLabel:key=>key,nm:npc=>npc.id,objName:key=>key,say(){},updateHud(){},
    talk(_who,_lines,choices){options=choices;},
    save(){saved=JSON.parse(JSON.stringify(state.neighborRequest));},
    lifeOf:()=>life,rememberPlayer(...args){memories.push(args);},
    addPts(_who,points){assert.equal(points,6);runtime.save();}
  });
  runSection(runtime,'function unreadAlbumPostcard(','function petCat(');
  assert.equal(runtime.hasNeighborMail(),true);
  runtime.checkMail();
  assert.equal(saved.status,'offered');
  options[0].fn();
  assert.equal(saved.status,'accepted');
  const request=runtime.acceptedNeighborRequest(n);
  assert.ok(request);
  runtime.offerNeighborDelivery(n,request);
  assert.equal(options[1].disabled,true);
  options[0].fn();
  assert.equal(saved.status,'delivered');
  assert.equal(life.cards.neighborRequest,1);
  assert.equal(memories[0][1],'neighborRequest');
  assert.equal(state.inv.flower,2);
  assert.equal(runtime.hasNeighborMail(),false);
});

test('garden preserves legacy crops and waters exactly one day of growth per night', () => {
  const {activities} = game();
  const fresh = activities.loadGarden();
  assert.equal(fresh.filter(Boolean).length, 2);
  assert.equal(activities.pickCrop(fresh, 0), 'berry');
  assert.equal(activities.pickCrop(fresh, 0), null);
  const legacy = activities.loadGarden(undefined, [true, ...Array(11).fill(false)]);
  assert.equal(activities.ripe(legacy[0]), false);
  assert.equal(activities.ripe(legacy[1]), true);
  fresh[2] = activities.seed('pumpkin');
  fresh[3] = activities.seed('carrot');
  fresh[0].watered = fresh[2].watered = fresh[3].watered = true;
  const restored = activities.loadGarden(JSON.parse(JSON.stringify(fresh)), Array(12).fill(false));
  assert.equal(restored[4], null);
  activities.grow(restored);
  activities.grow(restored);
  assert.equal(activities.pickCrop(restored, 0), 'berry');
  assert.equal(activities.pickCrop(restored, 3), 'carrot');
  assert.equal(restored[3], null);
  assert.equal(restored[2].growth, 1);
  for (let day = 0; day < 2; day++) {
    restored[2].watered = true;
    activities.grow(restored);
  }
  assert.equal(activities.pickCrop(restored, 2), 'pumpkin');
});

test('normal plot interaction plants, waters, advances overnight and grants one harvest', () => {
  let options;
  const state = {day: 1, time: 480, inv: {carrot: 0}, picked: [], pets: []};
  const runtime = game({
    state, NPCS: [], npcs: [], flowers: [], deliverAlbumPostcard() {}, save() {}, updateHud() {}, sfx() {}, say() {},
    tr: key => key, itemLabel: key => key,
    talk(_speaker, _lines, choices) { options = choices; },
    advanceTime(minutes) { state.time += minutes; }
  });
  state.garden = runtime.activities.loadGarden();
  runSection(runtime, 'function newDay(', 'function wakeAtBed(');
  runSection(runtime, 'function plotVerb(', '/* ---------------- fishing');
  runtime.tendPlot(2);
  options[1].fn();
  assert.equal(state.garden[2].crop, 'carrot');
  runtime.tendPlot(2);
  options[0].fn();
  assert.equal(state.garden[2].watered, true);
  runtime.newDay(420);
  runtime.tendPlot(2);
  assert.equal(state.inv.carrot, 1);
  assert.equal(state.garden[2], null);
  runtime.tendPlot(2);
  assert.equal(state.inv.carrot, 1);
});

test('day, bank and bait change the catch and the journal keeps first day and best size', () => {
  const {activities} = game();
  assert.equal(activities.rollCatch('reeds', false, false, .2), 'shell');
  assert.equal(activities.rollCatch('openWater', false, false, .2), 'carp');
  assert.equal(activities.rollCatch('reeds', false, true, .2), 'carp');
  assert.equal(activities.rollCatch('openWater', true, false, .2), 'moonfish');
  assert.equal(activities.rollCatch('openWater', true, false, .1), 'star');
  const log = {};
  activities.logFish(log, 'carp', 2, .95);
  assert.equal(activities.logFish(log, 'carp', 3, 0).record, false);
  assert.equal(activities.logFish(log, 'shell', 3, 0), null);
  const loaded = activities.loadFishLog(JSON.parse(JSON.stringify(log)));
  assert.deepEqual(JSON.parse(JSON.stringify(loaded)), {carp: {count: 2, firstDay: 2, best: 51}});
});

test('normal fishing menu consumes one bait, records a successful catch and allows early failure', () => {
  const state = {day: 2, need: {energy: 90}, inv: {berry: 1, moonfish: 0}, fishLog: {}};
  let options;
  const runtime = game({
    state, P: {x: 1, y: 1}, ITEM_ICONS: {moonfish: '🐟'}, keys: new Set(), touchKeys: new Set(),
    isTouch: false, darkness: () => 1, tr: key => key, itemLabel: key => key, clampN: x => x,
    talk(_speaker, _lines, choices) { options = choices; },
    save() {}, updateHud() {}, sfx() {}, say() {}, heart() {}, advanceTime() {}
  });
  vm.runInContext('Math.random = () => .2;', runtime);
  runSection(runtime, 'const FISH=', '/* ---------------- romance');
  runtime.fishMenu(23, 4);
  assert.equal(options[1].disabled, false);
  options[1].fn();
  assert.equal(state.inv.berry, 0);
  runtime.updFish(3);
  runtime.reel();
  runtime.reel();
  assert.equal(state.inv.moonfish, 1);
  assert.equal(state.fishLog.moonfish.count, 1);
  assert.equal(state.need.energy, 87);
  runtime.fishMenu(23, 4);
  assert.equal(options[1].disabled, true);
  options[0].fn();
  runtime.reel();
  assert.equal(state.inv.moonfish, 1);
  assert.equal(state.need.energy, 85);
});

test('first moonfish gift schedules a night invitation, retry, and one shared catch memory', () => {
  const state = {day: 2, time: 21*60, life: {}, need: {energy: 90, mood: 50},
    inv: {moonfish: 2}, fishLog: {}};
  const resident = {id: 'by', gifts: {moonfish: 16}};
  const relation = {done: {}};
  let options, lastSave;
  const runtime = game({
    state, P: {}, D: {}, rel: () => relation, ITEM_ICONS: {moonfish: '🌙'},
    keys: new Set(), touchKeys: new Set(), isTouch: false, darkness: () => 1,
    tr: key => key, itemLabel: key => key, clampN: x => x, nm: n => n.id,
    nt: () => ({giftLines: ['Thanks {i}']}), tierOf: () => 0, addPts: () => runtime.save(),
    talk(_speaker, _lines, choices) { options = choices; },
    busyFade(mid, end) { mid(); end(); },
    save() { lastSave = JSON.parse(JSON.stringify(state)); },
    updateHud() {}, sfx() {}, say() {}, heart() {}, snapPets() {}, note() {}, milestone() {},
    advanceTime(minutes) { state.time += minutes; }
  });
  vm.runInContext(read('npc-memory.js'),runtime);
  vm.runInContext('Math.random = () => .2; this.memory = NPCMemory;',runtime);
  runSection(runtime,'const FISHING_INVITE=','const ACT_E=');
  runSection(runtime,'function lifeOf(','function birthdayOf(');
  runSection(runtime,'const FISH=','/* ---------------- romance');
  runSection(runtime,'function rememberPlayer(','function memoryLine(');
  runSection(runtime,'function give(','function actMenu(');

  runtime.give(resident,'moonfish');
  assert.equal(lastSave.life.by.fishingInvitation.dueDay,4);
  assert.equal(lastSave.inv.moonfish,1);
  assert.equal(lastSave.npcMemory.events['event-1'].object,'moonfish');
  assert.equal(runtime.fishingInvitationReady(resident),false);
  state.day = 4;
  state.time = 18*60;
  assert.equal(runtime.fishingInvitationReady(resident),false);
  state.time = 20*60;
  assert.equal(runtime.fishingInvitationReady(resident),true);
  runtime.offerFishingInvitation(resident);
  options[1].fn();
  assert.equal(lastSave.life.by.fishingInvitation.dueDay,5);
  state.day++;
  relation.done = {};
  runtime.give(resident,'moonfish');
  assert.equal(lastSave.life.by.fishingInvitation.dueDay,5);
  runtime.offerFishingInvitation(resident);
  options[0].fn();
  runtime.reel();
  assert.equal(state.fishLog.moonfish,undefined);
  assert.equal(options[0].label,'sharedFishingRetry');
  options[0].fn();
  runtime.updFish(4);
  runtime.reel();
  runtime.reel();
  assert.equal(lastSave.inv.moonfish,1);
  assert.equal(lastSave.fishLog.moonfish.count,1);
  assert.deepEqual(lastSave.life.by.fishingInvitation.catch,{day:5,time:1215,kind:'moonfish',size:20});
  assert.equal(runtime.memory.recall(state,'by')[0].type,'sharedFishing');
  assert.equal(runtime.fishingInvitationReady(resident),false);
});

test('capsule pools share the free draw, grant new items, and refund failed saves', () => {
  const state = {capsuleDresses: [], capsuleHairs: [], capsuleTops: [], capsuleBottoms: [], inv: {shell: 2, flower: 6}, o: {top: 'tee'}};
  let options, preview, canSave=true, wardrobeOpens=0;
  const runtime = game({
    state, D: {}, HAIRS: [], pick: choices => choices[0],
    unlocked: item => [...state.capsuleDresses,...state.capsuleHairs,...state.capsuleTops,...state.capsuleBottoms].includes(item.id),
    byId: (list,id) => list.find(item=>item.id===id),
    tr: key => key, itemLabel: key => key, itemName: key => key, objName: key => key,
    talk(_speaker, _lines, choices, _onEnd, art) { options = choices; preview = art; },
    el: () => ({setAttribute() {}, append() {}}), mk: () => ({getContext() {}}), blitChar() {},
    lifeText: zh=>zh, openDress(){wardrobeOpens++;}, rewardNewLook(){}, say(){},
    save(){return canSave;}, updateHud() {}, sfx() {}
  });
  runSection(runtime,'const CAPSULE_DRESSES=','const BOTTOMS=');
  runSection(runtime,'const CAPSULE_HAIRS=','function torso(');
  runSection(runtime,'const CAPSULE_POOLS=','const CATS=');
  const pools=vm.runInContext('CAPSULE_POOLS',runtime);
  runSection(runtime,'const CAPSULE_COST=','function checkMail(');
  vm.runInContext("let curCat = 'hair';",runtime);
  runtime.capsuleMenu();
  options[0].fn();
  options[0].fn();
  assert.ok(preview);
  assert.equal(state.inv.shell,2);
  assert.deepEqual(Array.from(options,option=>option.label),['capsuleTry','capsuleView','capsuleAgain']);
  const tryFirstDress=options[0].fn;
  options[2].fn();
  assert.equal(options[0].label,'capsuleTrade');
  assert.equal(state.inv.shell,2);
  assert.equal(state.capsuleDresses.length,1);
  tryFirstDress();
  assert.equal(state.o.top,'roseGown');
  assert.equal(state.o.topColor,9);
  assert.equal(wardrobeOpens,0);
  runtime.drawCapsule(pools.dress,'star');
  assert.equal(state.capsuleDresses.length,1);
  canSave=false;
  runtime.drawCapsule(pools.dress,'shell');
  assert.equal(state.inv.shell,2);
  assert.equal(state.capsuleDresses.length,1);
  canSave=true;
  runtime.capsulePoolMenu(pools.dress);
  options[0].fn();
  options[2].fn();
  assert.equal(options[0].disabled,true);
  runtime.drawCapsule(pools.dress,'shell');
  assert.equal(state.inv.shell,0);
  assert.equal(state.capsuleDresses.length,2);
  runtime.drawCapsule(pools.dress,'flower');
  runtime.drawCapsule(pools.dress,'flower');
  state.inv.flower=(pools.dress.items.length-state.capsuleDresses.length)*3+3;
  for(let i=state.capsuleDresses.length;i<pools.dress.items.length;i++)runtime.drawCapsule(pools.dress,'flower');
  assert.equal(options[2].label,'capsuleNoMore');
  assert.equal(options[2].disabled,true);
  runtime.drawCapsule(pools.dress,'flower');
  assert.equal(state.inv.flower,3);
  assert.equal(new Set(state.capsuleDresses).size,18);
  assert.ok(state.capsuleDresses.includes('snowCapeDress'));
  assert.ok(state.capsuleDresses.includes('goldenMasquerade'));
  runtime.capsuleMenu();
  options[1].fn();
  assert.equal(options[0].label,'capsuleTrade');
  assert.equal(options[0].disabled,true);
  options[1].fn();
  assert.equal(state.inv.flower,0);
  assert.deepEqual(state.capsuleHairs,['cloudBob']);
  options[0].fn();
  assert.equal(state.o.hair,'cloudBob');
  assert.equal(state.o.hairColor,6);
  assert.equal(state.o.top,'roseGown');
  assert.equal(wardrobeOpens,0);
  options[1].fn();
  assert.equal(wardrobeOpens,1);
  assert.equal(vm.runInContext('curCat',runtime),'capsuleHair');
  state.inv.flower=pools.hair.items.length*3;
  for(let i=0;i<pools.hair.items.length;i++)runtime.drawCapsule(pools.hair,'flower');
  assert.equal(new Set(state.capsuleHairs).size,10);
  assert.equal(state.inv.flower,3);
  runtime.drawCapsule(pools.bottom,'flower');
  assert.equal(options[2].label,'capsuleAgain');
  options[0].fn();
  assert.equal(state.o.bottom,'plaidPleats');
  assert.equal(state.o.top,'tee');
  state.inv.shell=2;
  runtime.drawCapsule(pools.top,'shell');
  assert.equal(options.length,2);
  options[0].fn();
  assert.equal(state.o.top,'apricotCardigan');
  assert.equal(state.o.bottom,'plaidPleats');
});

test('click route goes around an obstacle, walks to the nearest reachable tile for blocked targets, and stops on arrival', () => {
  const width=5,height=5;
  const solid=new Uint8Array(width*height);
  for(let y=1;y<=3;y++)solid[y*width+2]=1;
  const P={x:24,y:44,dir:'right'};
  const runtime=game({MW:width,MH:height,solid,P,FLOOR:1,DOOR:2,map:new Uint8Array(width*height),
    at:()=>0,walkRoute:[]});
  runSection(runtime,'function blocked(','function moveBy(');
  runSection(runtime,'function npcPassable(','function lifeOf(');
  assert.equal(runtime.setWalkDestination(40,42),true);
  assert.equal(runtime.walkRoute.at(-1)[0],56);
  assert.equal(runtime.walkRoute.at(-1)[1],44);
  assert.equal(runtime.setWalkDestination(-5,42),false);
  assert.equal(runtime.setWalkDestination(55,41),true);
  assert.ok(runtime.walkRoute.some(([,y])=>y===12||y===76));
  for(let i=0;i<100&&runtime.walkRoute.length;i++){
    runtime.followWalkRoute(3.2);
    assert.equal(runtime.blocked(P.x,P.y),false);
  }
  assert.equal(P.x,55);
  assert.equal(P.y,43);
  assert.equal(runtime.walkRoute.length,0);
  assert.equal(runtime.followWalkRoute(3.2),false);
});
