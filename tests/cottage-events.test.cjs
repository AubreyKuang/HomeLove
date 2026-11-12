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

test('four seven-day seasons repeat and only covered soil grows during winter', () => {
  assert.deepEqual([1,7,8,14,15,21,22,28,29].map(activities.seasonOf),
    ['spring','spring','summer','summer','autumn','autumn','winter','winter','spring']);
  const garden=activities.loadGarden();
  garden[2]={...activities.seed('carrot'),watered:true};
  garden[3]={...activities.seed('carrot'),watered:true};
  const inv={shell:8},tunnels=[];
  assert.equal(activities.installTunnel(tunnels,3,inv),true);
  assert.equal(activities.installTunnel(tunnels,3,inv),false);
  assert.equal(inv.shell,6);
  activities.grow(garden,22,tunnels);
  assert.equal(garden[2].growth,0);
  assert.equal(garden[2].watered,false);
  assert.equal(activities.ripe(garden[3]),true);
  assert.equal(activities.installTunnel(tunnels,4,inv),true);
  assert.equal(activities.installTunnel(tunnels,5,inv),true);
  assert.equal(activities.installTunnel(tunnels,6,inv),false);
  assert.deepEqual(Array.from(activities.loadTunnels([3,3,-1,4,12,5,6])),[3,4,5]);
  garden[2].watered=true;activities.grow(garden,29,tunnels);
  assert.equal(activities.ripe(garden[2]),true);
  assert.equal(activities.rollCatch('ice',false,false,.42),'shell');
  assert.equal(activities.rollCatch('ice',true,true,.4),'moonfish');
});

const xiaoman=vm.runInNewContext(read('cottage-events.js')+'\nXiaomanStory');
test('The confession scene unfolds in order and the answer changes visits and mail after reload', () => {
  const story=xiaoman.load();
  assert.equal(xiaoman.next(story,1,10),null);
  assert.equal(xiaoman.next(story,2,3),'ribbon');
  story.offered=story.ribbon=2;
  assert.equal(xiaoman.next(story,2,10),null);
  assert.equal(xiaoman.next(story,3,5),'flowers');
  story.offered=story.flowers=3;
  assert.equal(xiaoman.next(story,4,10),null);
  assert.equal(xiaoman.next(story,5,7),'confession');
  story.answered=5;
  const friends=xiaoman.load({...story,answer:'friends'},5);
  const space=xiaoman.load({...story,answer:'space'},5);
  assert.equal(xiaoman.next(friends,12,10),null);
  assert.equal(xiaoman.visits(friends,11),false);
  assert.equal(xiaoman.visits(friends,12),true);
  assert.equal(xiaoman.visits(friends,13),false);
  assert.equal(xiaoman.visits(friends,17),true);
  assert.equal(xiaoman.visits(space,100),false);
  assert.equal(xiaoman.postcard(space,100),null);
  assert.equal(xiaoman.postcard(friends,11),null);
  assert.equal(xiaoman.postcard(friends,12).event,'xmPostcard');
  assert.equal(xiaoman.cards(space,100).at(-1).choice,'space');
});

const Snow=vm.runInNewContext(read('cottage-events.js')+'\nSnowFishing');
test('winter knock is checked once a morning and fires by the third eligible morning',()=>{
  const event=Snow.load();
  assert.equal(Snow.morning(event,21,'autumn',540,0),false);
  assert.equal(Snow.morning(event,22,'winter',660,0),false);
  assert.equal(Snow.morning(event,22,'winter',540,.9),false);
  assert.equal(Snow.morning(event,22,'winter',541,0),false);
  assert.equal(Snow.morning(event,23,'winter',540,.9),false);
  assert.equal(Snow.morning(event,24,'winter',540,.9),true);
  assert.equal(Snow.morning(event,25,'winter',540,0),false);
  assert.equal(event.invited,24);
});

test('ice fishing stores both times, rematches, timeout losses and dinner across reloads',()=>{
  const event=Snow.load();
  const race=Snow.start('race',0);
  race.player=2;
  race.elapsed=5;
  assert.equal(Snow.raceReady(race),false);
  race.elapsed=5.5;
  assert.equal(Snow.raceReady(race),true);
  assert.equal(Snow.record(event,23,race).outcome,'won');
  const rematch=Snow.start('race',.5);
  rematch.elapsed=Snow.raceLimit;
  assert.equal(Snow.raceReady(rematch),true);
  assert.equal(Snow.record(event,23,rematch).outcome,'lost');
  event.ready=23;event.dinner=24;
  const restored=Snow.load(JSON.parse(JSON.stringify(event)),24);
  assert.equal(restored.stats.last.player,null);
  assert.equal(restored.stats.best,2);
  assert.equal(restored.stats.rivalBest,5.5);
  assert.equal(restored.stats.won,1);
  assert.equal(restored.stats.lost,1);
  assert.equal(restored.dinner,24);
  assert.deepEqual(Array.from(Snow.cards(restored),card=>card.event),['snowRace','snowDinner']);
});
