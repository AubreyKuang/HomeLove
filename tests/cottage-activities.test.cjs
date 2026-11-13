const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');

const read = name => readFileSync(join(__dirname, '..', name), 'utf8');
const gameSource = require('./game-source.cjs')(read('index.html'));

function game(context = {}) {
  // Trust and morning bookkeeping live in cottage-bonds tests; here they are no-ops.
  for (const name of ['trustNpc', 'courtNpc', 'bondsNewDay']) context[name] ??= () => {};
  const runtime = vm.createContext(context);
  vm.runInContext(read('cottage-activities.js'), runtime);
  runtime.activities = vm.runInContext('CottageActivities', runtime);
  return runtime;
}

function runSection(runtime, start, end) {
  const from = gameSource.indexOf(start);
  const to = gameSource.indexOf(end, from);
  assert.ok(from >= 0 && to > from);
  vm.runInContext(gameSource.slice(from, to), runtime);
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
  let options, saved, letter;
  const runtime = game({
    state,npcs:[n],D:{},ITEM_ICONS:{berry:'🍓',cookie:'🍪',flower:'🌼'},
    VillageMap:{places:{cafe:{hours:[750,1020]}}},fmt:String,
    tr:(key,vars)=>key+(key==='requestCafePlan'?JSON.stringify(vars):''),itemLabel:key=>key,nm:npc=>npc.id,objName:key=>key,say(){},updateHud(){},
    talk(_who,lines,choices){options=choices;letter=lines;},
    save(){saved=JSON.parse(JSON.stringify(state.neighborRequest));},
    lifeOf:()=>life,rememberPlayer(...args){memories.push(args);},
    addPts(_who,points){assert.equal(points,6);runtime.save();}
  });
  runSection(runtime,'function unreadAlbumPostcard(','function petCat(');
  assert.equal(runtime.hasNeighborMail(),true);
  runtime.checkMail();
  assert.equal(saved.status,'offered');
  assert.ok(letter.includes('requestCafePlan{"count":2,"minutes":20,"start":"750","latest":"1000"}'));
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

test('mailbox delivery holds the reward overnight and survives the deadline and reload', () => {
  const n={id:'gy'};
  const state={day:3,inv:{cookie:1,berry:0,flower:0},rel:{gy:{met:true}},
    neighborRequest:{day:1,resident:'gy',status:'accepted'}};
  let choices,saved,message;
  const runtime=game({
    state,npcs:[n],D:{},VillageMap:{places:{cafe:{hours:[750,1020]}}},
    ITEM_ICONS:{berry:'🍓',cookie:'🍪',flower:'🌼'},fmt:String,
    tr:key=>key,itemLabel:key=>key,nm:npc=>npc.id,objName:key=>key,
    say(_who,line){message=line;},talk(_who,_lines,options){choices=options;},updateHud(){},
    save(){saved=JSON.parse(JSON.stringify(state.neighborRequest));}
  });
  runSection(runtime,'function unreadAlbumPostcard(','function petCat(');
  runtime.checkMail();
  choices[0].fn();
  assert.equal(choices[0].disabled,true);
  choices[0].fn();
  assert.equal(state.neighborRequest.status,'accepted');
  const drop=choices[1].fn;
  drop();drop();
  assert.equal(saved.status,'dropped');
  assert.equal(saved.closedDay,3);
  assert.deepEqual(state.inv,{cookie:0,berry:0,flower:0});
  assert.equal(runtime.acceptedNeighborRequest(n),null);
  assert.equal(runtime.hasNeighborMail(),false);
  runtime.checkMail();
  assert.equal(message,'requestMailboxPending');
  assert.equal(runtime.activities.collectRequestReward(state.neighborRequest,3,state.inv),null);
  state.neighborRequest=runtime.activities.loadRequest(saved);
  state.day=6;
  assert.equal(runtime.hasNeighborMail(),true);
  assert.equal(runtime.activities.nextRequest(6,state.neighborRequest,state.rel),null);
  runtime.checkMail();
  const collect=choices[0].fn;
  collect();collect();
  assert.equal(saved.status,'delivered');
  assert.equal(saved.closedDay,6);
  assert.equal(state.inv.flower,2);
  assert.equal(message,'requestMailboxReward');
  assert.equal(runtime.hasNeighborMail(),false);
});

test('the café request shares the regular payout, spends time only when feasible, and persists one keepsake', () => {
  const n={id:'gy',state:'here',x:232,y:364};
  const cafe={spot:[14,22],hours:[750,1020]};
  const request={day:1,resident:'gy',status:'accepted'};
  const life={cards:{}}, state={
    day:1,time:1001,need:{energy:90},inv:{berry:2,cookie:0,flower:0},neighborRequest:request
  };
  let choices, saved;
  const runtime=game({state,P:{x:232,y:364},VillageMap:{places:{cafe}},villageDuty:()=>cafe,
    D:{},fmt:String,ITEM_ICONS:{berry:'🍓',cookie:'🍪',flower:'🌼'},
    tr:key=>key,itemLabel:key=>key,nm:npc=>npc.id,lifeOf:()=>life,rememberPlayer(){},updateHud(){},
    talk(_who,_lines,options){choices=options;},
    addPts(_who,amount){assert.equal(amount,6);saved=JSON.parse(JSON.stringify({state,life}));},
    advanceTime(minutes){state.time+=minutes;}
  });
  runSection(runtime,'function unreadAlbumPostcard(','function petCat(');
  runtime.offerNeighborDelivery(n,request);
  const joint=choices.find(option=>option.label.includes('requestCafeTogether'));
  assert.match(joint.label,/requestCafeClosing/);
  assert.equal(choices[0].disabled,false);
  joint.fn();
  assert.equal(request.status,'accepted');
  assert.equal(state.inv.berry,2);
  state.time=1000;
  runtime.offerNeighborDelivery(n,request);
  const prepared=choices.find(option=>option.label.includes('requestCafeTogether'));
  assert.equal(prepared.disabled,false);
  prepared.fn();
  prepared.fn();
  assert.equal(saved.state.time,1020);
  assert.deepEqual(saved.state.inv,{berry:0,cookie:0,flower:2});
  assert.equal(saved.life.cards.cafeRequest,1);
  assert.equal(runtime.activities.loadRequest(saved.state.neighborRequest).status,'delivered');
  const album=vm.runInContext(read('memory-album.js')+'\nMemoryAlbum',runtime);
  const cards=album.collect(['gy'],{gy:saved.life},{postcards:[]});
  assert.equal(cards.filter(card=>card.kind==='cafeRequest').length,1);
});

test('date reservations reserve only the named resident and end without a penalty', () => {
  const n={id:'gy',state:'here',x:328,y:124}, other={id:'xy'};
  const plan={resident:'gy',place:'pond',day:2};
  const state={day:1,time:960,datePlan:plan};
  const meeting={start:960,end:1020,spot:[20,7]};
  let writesSucceed=false;
  const runtime=game({state,DATE_MEETINGS:{pond:meeting},P:{x:312,y:124},save:()=>writesSucceed});
  runSection(runtime,'function activeDatePlan(','function planDateMenu(');
  assert.equal(runtime.activeDatePlan(),plan);
  assert.equal(runtime.plannedDateMeeting(n),undefined);
  state.day=2;state.time=939;
  assert.equal(runtime.plannedDateMeeting(n),undefined);
  state.time=940;
  assert.equal(runtime.plannedDateMeeting(n),meeting);
  assert.equal(runtime.plannedDateMeeting(other),undefined);
  assert.equal(runtime.atPlannedDate(n,meeting),false);
  state.time=960;
  assert.equal(runtime.atPlannedDate(n,meeting),true);
  assert.equal(runtime.setDatePlan(null),false);
  assert.equal(state.datePlan,plan);
  state.time=1020;
  assert.equal(runtime.activeDatePlan(),undefined);
  assert.equal(runtime.plannedDateMeeting(n),undefined);
  writesSucceed=true;
  assert.equal(runtime.setDatePlan(null),true);
  assert.equal(state.datePlan,null);
});

test('a packed breakfast spends produce once and can be eaten only the next morning', () => {
  const state={day:1,time:1200,need:{hunger:20,mood:30},inv:{carrot:1,pumpkin:1}};
  const runtime=game({state,busy:false,BREAKFAST_BOX:{prepMinutes:40,eatMinutes:5,until:720,hunger:55,mood:6},
    sfx(){},busyFade(mid){mid();},advanceTime(m){state.time+=m;},clampN:n=>Math.min(100,n),updateHud(){},save(){}});
  runSection(runtime,'function breakfastBoxReady(','function eat(){');
  runSection(runtime,'const RECIPES=','function workout(');
  const recipe=vm.runInContext("RECIPES.find(recipe=>recipe.label==='cookStew')",runtime);
  runtime.prepareBreakfastBox(recipe);
  runtime.prepareBreakfastBox(recipe);
  assert.deepEqual(state.inv,{carrot:0,pumpkin:0});
  assert.equal(state.time,1240);
  assert.equal(state.need.hunger,20);
  assert.equal(state.breakfastBoxDay,2);
  assert.equal(runtime.breakfastBoxReady(),false);
  state.day=2;state.time=716;
  assert.equal(runtime.breakfastBoxReady(),false);
  state.time=715;
  runtime.eatBreakfastBox();
  runtime.eatBreakfastBox();
  assert.equal(state.time,720);
  assert.equal(state.need.hunger,75);
  assert.equal(state.breakfastBoxDay,null);
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

test('confession requires the right resident’s completed outing as well as eight hearts', () => {
  const resident={id:'by'};
  const relation={pts:80,done:{}};
  const state={life:{gy:{firstDate:{day:2}},by:{fishingInvitation:{dueDay:3}}},
    moments:{records:{}},need:{mood:50}};
  let message;
  const runtime=game({
    state,D:{},rel:()=>relation,hearts:r=>Math.floor(r.pts/10),anyCouple:()=>false,
    xiaomanRoute:()=>false,notify:key=>{message=key;},tr:key=>key,talk(){},
  });
  runSection(runtime,'function hasSharedExperience(','function npcMenu(');
  runSection(runtime,'function confess(','function moveIn(');
  runtime.confess(resident);
  assert.equal(message,'hintSharedExperience');
  assert.equal(relation.done.confess,undefined);
  state.life.by.fishingInvitation.catch={day:3};
  assert.equal(runtime.hasSharedExperience(resident),true);
  runtime.confess(resident);
  assert.equal(relation.done.confess,true);
  delete state.life.by.fishingInvitation;
  state.moments.records.by={day:4};
  assert.equal(runtime.hasSharedExperience(resident),true);
  delete state.moments.records.by;
  state.life.by.firstDate={day:5};
  assert.equal(runtime.hasSharedExperience(resident),true);
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
  runSection(runtime,'function lifeOf(','function applySave(');
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

test('click route goes around an obstacle, rejects blocked targets, and stops on arrival', () => {
  const width=5,height=5;
  const solid=new Uint8Array(width*height);
  for(let y=1;y<=3;y++)solid[y*width+2]=1;
  const P={x:24,y:44,dir:'right'};
  const runtime=game({MW:width,MH:height,solid,P,FLOOR:1,DOOR:2,map:new Uint8Array(width*height),
    at:()=>0,isSolid:(x,y)=>solid[y*width+x],walkRoute:[]});
  runSection(runtime,'function blocked(','function movePlayerBy(');
  runSection(runtime,'function npcPassable(','function birthdayOf(');
  assert.equal(runtime.setWalkDestination(40,42),false);
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
