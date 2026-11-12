const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const read = file => readFileSync(join(__dirname, '..', file), 'utf8');
const {events, activities} = vm.runInNewContext(read('cottage-events.js') +
  read('cottage-activities.js') + '\n({events:CottageEvents, activities:CottageActivities})');
const reload = (state,day) => events.load(JSON.parse(JSON.stringify(state)),day);

test('visitor checks once per eligible night, retries missed landings, and keeps only one outcome', () => {
  let state = events.load();
  assert.equal(events.discover(state,'ufo',1,0),false);
  for(let day=2;day<=5;day++){
    assert.equal(events.discover(state,'ufo',day,.99),false);
    assert.equal(events.discover(state,'ufo',day,0),false);
  }
  state=reload(state,6);
  assert.equal(events.discover(state,'ufo',6,.99),true);
  assert.equal(events.landed(state,6,1290),true);
  assert.equal(events.landed(state,6,1530),false);
  assert.equal(events.landed(state,7,1290),false);
  assert.equal(events.finish(state,'ufo',7,'sit'),false);
  assert.equal(events.discover(state,'ufo',7,0),true);
  assert.equal(events.finish(state,'ufo',7,'fish'),true);
  assert.equal(events.finish(state,'ufo',7,'flower'),false);
  assert.equal(events.landed(state,7,1300),false);
  state.ufo.told=8;
  assert.equal(events.postcard(reload(state,10),10),null);
  const cards=events.cards(reload(state,11),11);
  assert.equal(cards[0].choice,'fish');
  assert.equal(cards[1].resident,'by');
  assert.equal(cards[1].day,11);
});

test('the bottle can be found only once and the selected reply survives a reload', () => {
  const state=events.load();
  for(let i=0;i<6;i++)assert.equal(events.discover(state,'bottle',2,.99),false);
  assert.equal(events.discover(state,'bottle',2,.99),true);
  assert.equal(events.discover(state,'bottle',3,0),false);
  assert.equal(events.finish(state,'bottle',4,'reply'),true);
  assert.equal(events.cards(reload(state,5),5)[0].choice,'reply');
});

test('a mystery bloom survives garden save/load and takes two watered nights', () => {
  const state=events.load();
  for(let day=2;day<5;day++)assert.equal(events.discover(state,'seed',day,.99),false);
  assert.equal(events.discover(state,'seed',5,.99),true);
  assert.equal(events.finish(state,'seed',5,'keep'),false);
  state.seed.accepted=5;
  const garden=activities.loadGarden();
  garden[2]=activities.seed('mysteryBloom');
  activities.grow(garden);
  assert.equal(garden[2].growth,0);
  garden[2].watered=true;
  activities.grow(garden);
  assert.equal(activities.ripe(garden[2]),false);
  const restored=activities.loadGarden(JSON.parse(JSON.stringify(garden)));
  restored[2].watered=true;
  activities.grow(restored);
  assert.equal(activities.ripe(restored[2]),true);
  assert.equal(events.finish(state,'seed',7,'keep'),true);
  assert.equal(events.cards(reload(state,7),7)[0].choice,'keep');
});
