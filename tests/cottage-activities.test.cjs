const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');

const read = name => readFileSync(join(__dirname, '..', name), 'utf8');
const html = read('index.html');

function game(context = {}) {
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
    state, NPCS: [], npcs: [], flowers: [], save() {}, updateHud() {}, sfx() {}, say() {},
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

test('capsule draws grant new gowns once and charge only accepted game items', () => {
  const state = {capsuleDresses: [], inv: {shell: 2, flower: 6}, o: {top: 'tee'}};
  let options, preview;
  const runtime = game({
    state, D: {}, pick: choices => choices[0], unlocked: dress => state.capsuleDresses.includes(dress.id),
    tr: key => key, itemLabel: key => key, itemName: key => key, objName: key => key,
    talk(_speaker, _lines, choices, _onEnd, art) { options = choices; preview = art; },
    el: () => ({setAttribute() {}, append() {}}), mk: () => ({getContext() {}}), blitChar() {},
    openDress() {}, changed() {}, save() {}, updateHud() {}, sfx() {}
  });
  runSection(runtime,'const CAPSULE_DRESSES=','const TOPS=');
  runSection(runtime,'const CAPSULE_COST=','function checkMail(');
  vm.runInContext("let curCat = 'hair';",runtime);
  runtime.capsuleMenu();
  options[0].fn();
  assert.ok(preview);
  assert.equal(state.inv.shell,2);
  options[0].fn();
  assert.equal(state.o.top,'roseGown');
  assert.equal(state.o.topColor,9);
  runtime.drawCapsule('star');
  assert.equal(state.capsuleDresses.length,1);
  runtime.drawCapsule('shell');
  runtime.drawCapsule('shell');
  assert.equal(state.inv.shell,0);
  assert.equal(state.capsuleDresses.length,2);
  runtime.drawCapsule('flower');
  runtime.drawCapsule('flower');
  state.inv.flower=3;
  runtime.drawCapsule('flower');
  assert.equal(state.inv.flower,3);
  assert.equal(new Set(state.capsuleDresses).size,4);
});
