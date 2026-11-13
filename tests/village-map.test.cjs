const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const read=file=>readFileSync(join(__dirname,'..',file),'utf8');
const html=read('index.html');
const ctx=vm.createContext({Lp:{objects:{}},state:{picked:[],day:1},pick:xs=>xs[0]});
vm.runInContext(read('village-map.js')+read('village-riverside.js')+'\nthis.river=VillageRiverside;',ctx);
const mapStart=html.indexOf('const G=0,PATH=1');
const mapEnd=html.indexOf('/* ---------------- sprites',mapStart);
const pathStart=html.indexOf('function npcPassable(');
const pathEnd=html.indexOf('function setWalkDestination(',pathStart);
vm.runInContext('const MW=VillageMap.width,MH=VillageMap.height;\n'+html.slice(mapStart,mapEnd)+html.slice(pathStart,pathEnd)+
  '\nthis.mapAPI={VillageMap,bfs,npcPassable,at,WATER,BRIDGE};',ctx);
const {VillageMap:V,bfs,npcPassable,at,WATER,BRIDGE}=ctx.mapAPI;

test('every village landmark is reachable on foot from the original cottage',()=>{
  for(const place of Object.values(V.places)){
    assert.ok(npcPassable(...place.anchor,true));
    assert.ok(bfs(4,6,...place.anchor,true)?.length);
  }
  assert.equal(at(39,27),BRIDGE);
  assert.equal(at(39,22),WATER);
  assert.equal(npcPassable(39,22,true),false);
  assert.ok(bfs(26,15,44,15,true).some(([x,y])=>x===39&&y===15));
});

test('both approaches reach trade counters and market hours and inventory gate trades',()=>{
  for(const prop of V.props.filter(p=>Object.hasOwn(V.exchanges,p.id))){
    const x=prop.x+1;
    assert.ok(bfs(15,25,x,prop.y-1,true));
    assert.ok(bfs(15,25,x,prop.y+prop.h,true));
    assert.equal(npcPassable(x,prop.y,true),false);
  }
  const stock={carrot:3,shell:0},offer=V.exchanges.produce[0];
  assert.equal(V.marketOpen(540),true);
  assert.equal(V.marketOpen(1080),false);
  assert.equal(V.trade(stock,offer),true);
  assert.equal(V.trade(stock,offer),false);
  assert.deepEqual(stock,{carrot:1,shell:1});
});

test('four residents have independent village shifts and daily visits load from old saves',()=>{
  for(const [id,place] of Object.entries(V.places)){
    if(!place.resident)continue;
    assert.equal(V.duty(place.resident,place.hours[0]).id,id);
    assert.equal(V.duty(place.resident,place.hours[1]),null);
  }
  assert.equal(Object.keys(V.loadVisits(undefined,1)).length,0);
  assert.equal(V.loadVisits({cafe:2,court:4,market:2},3).cafe,2);
  assert.equal(V.loadVisits({cafe:2,court:4,market:2},3).court,undefined);
});

vm.runInContext(read('cottage-travel.js')+'\nthis.travelAPI=CottageTravel;',ctx);
const travel=ctx.travelAPI;

test('transport orders charge once, arrive next day and survive a save and reload',()=>{
  const state=travel.load(undefined,4),inventory={shell:20};
  assert.equal(state.selected,null);
  assert.equal(travel.order(state,inventory,'car',4),false);
  assert.equal(travel.order(state,inventory,'constructor',4),false);
  assert.equal(travel.order(state,inventory,'bicycle',4),true);
  assert.equal(travel.order(state,inventory,'bicycle',4),false);
  assert.equal(inventory.shell,6);
  assert.equal(travel.receive(state,'bicycle',4),false);
  const restored=travel.load(JSON.parse(JSON.stringify(state)),5);
  assert.deepEqual(Array.from(travel.ready(restored,5)),['bicycle']);
  assert.equal(travel.receive(restored,'bicycle',5),true);
  assert.equal(travel.receive(restored,'bicycle',5),false);
  assert.equal(travel.order(restored,inventory,'bicycle',5),false);
  assert.equal(travel.ready(restored,5).length,0);
});

test('mounted travel respects indoor tiles and the car needs a road',()=>{
  for(const [id,{speed}] of Object.entries(travel.catalog)){
    const state=travel.load({owned:[id],selected:id});
    assert.ok(speed>1);
    assert.equal(travel.riding(state,'inside'),null);
    assert.equal(travel.riding(state,'road'),id);
    assert.equal(travel.riding(state,'outdoor'),id==='car'?null:id);
  }
  assert.equal(travel.load({owned:[],selected:'car'}).selected,null);
});

vm.runInContext(read('village-weekend.js')+'\nthis.weekendAPI=VillageWeekend;',ctx);
const weekend=ctx.weekendAPI;

test('the Saturday stall limits sales to three stocked slots and pays rotating demand',()=>{
  const state=weekend.load(),inventory={berry:2,flower:2,shell:0};
  assert.equal(weekend.sell(state,inventory,5,600,['berry']),0);
  assert.equal(weekend.sell(state,inventory,6,1080,['berry']),0);
  assert.equal(weekend.sell(state,inventory,6,600,['berry','berry','berry']),0);
  assert.equal(weekend.sell(state,inventory,6,600,['berry','flower','berry','flower']),0);
  assert.equal(weekend.sell(state,inventory,6,540,['berry','flower','berry']),11);
  assert.equal(weekend.sell(state,inventory,6,600,['flower']),0);
  assert.equal(weekend.coffee(state,6,600),null);
  const restored=weekend.load(JSON.parse(JSON.stringify(state)),7);
  assert.equal(weekend.coffee(restored,7,600),'berry');
  restored.sale.served=true;
  assert.equal(weekend.coffee(restored,7,600),null);
  assert.equal(weekend.cards(restored)[0].day,6);
  assert.notEqual(weekend.demand(13)[0],weekend.demand(6)[0]);
  assert.deepEqual(inventory,{berry:0,flower:1,shell:11});
});

test('each weekend event has a reachable guest spot and a first-visit card that survives repeat visits',()=>{
  const state=weekend.load();
  for(const [id,event] of Object.entries(weekend.activities)){
    const place=V.places[id];
    assert.equal(place.resident,event.host);
    assert.ok(bfs(...place.anchor,...event.spot,false)?.length);
    assert.equal(weekend.play(state,id,event.day,event.end,1),false);
    assert.equal(weekend.play(state,id,event.day,event.start,1),true);
    assert.equal(weekend.play(state,id,event.day,event.start,0),false);
    assert.equal(weekend.play(state,id,event.day+7,event.start,0),true);
  }
  const restored=weekend.load(JSON.parse(JSON.stringify(state)),14);
  assert.equal(weekend.cards(restored).length,4);
  assert.equal(restored.played.stage.choice,1);
  assert.equal(restored.played.stage.last,14);
});

test('only the first successful online order earns a durable keepsake',()=>{
  const state=travel.load(),inventory={shell:25};
  assert.equal(travel.order(state,inventory,'car',3),false);
  assert.equal(travel.cards(state).length,0);
  assert.equal(travel.order(state,inventory,'scooter',3),true);
  assert.equal(travel.receive(state,'scooter',4),true);
  assert.equal(travel.order(state,inventory,'bicycle',4),true);
  const restored=travel.load(JSON.parse(JSON.stringify(state)),4);
  assert.equal(travel.cards(restored).length,1);
  assert.equal(travel.cards(restored)[0].vehicle,'scooter');
  assert.equal(travel.cards(restored)[0].day,3);
});

test('both public landmarks have routes and the flooded step opens only after rain',()=>{
  for(const id of ['post','ferry'])assert.ok(bfs(4,6,...V.places[id].anchor,true)?.length);
  const tile=ctx.river.glassTile;
  assert.equal(npcPassable(...tile,true),false);
  ctx.state.day=4;
  assert.equal(ctx.river.weather(3),'rain');
  assert.equal(npcPassable(...tile,true),true);
  assert.ok(bfs(...V.places.ferry.anchor,...tile,true)?.length);
  ctx.state.day=5;
  assert.equal(npcPassable(...tile,true),false);
  ctx.state.day=1;
});

test('wind and water clues have distinct trigger rules and one durable keepsake each',()=>{
  const river=ctx.river,state=river.load();
  assert.equal(river.apronVisible(state,4,959),false);
  assert.equal(river.apronVisible(state,4,960),true);
  assert.equal(river.apronVisible(state,4,1200),false);
  assert.equal(river.glassVisible(state,3),false);
  assert.equal(river.glassVisible(state,4),true);
  state.apron={day:4,status:'posted',heard:true};
  state.glass={day:4,choice:'leave'};
  const restored=river.load(JSON.parse(JSON.stringify(state)),5);
  assert.equal(river.apronVisible(restored,4,960),false);
  assert.equal(river.glassVisible(restored,4),false);
  assert.equal(river.cards(restored).length,2);
  assert.equal(restored.apron.heard,true);
});

vm.runInContext(read('village-projects.js')+'\nthis.projectsAPI=VillageProjects;',ctx);
const projects=ctx.projectsAPI;

test('village projects persist player choices and discard invalid save entries',()=>{
  const loaded=projects.load({
    cafe:{day:7,items:['berry','cookie'],style:'soft',name:'river',caption:'  我的菜单  '},
    ball:{day:6,best:2},recording:true,sounds:['chime','water','chime','invalid','letter'],
    music:{day:7,order:['chime','water','letter'],ending:'quiet'},
    drafts:{rain:{day:4,frame:1,palette:0},clear:{day:50,frame:0,palette:0}},hung:'rain'
  },8);
  assert.equal(loaded.cafe.caption,'我的菜单');
  assert.equal(projects.menuDay(loaded.cafe.day),8);
  assert.equal(projects.menuDay(8),15);
  assert.equal(loaded.sounds.length,3);
  assert.equal(loaded.music.order[0],'chime');
  assert.equal(loaded.hung,'rain');
  assert.equal(projects.cards(loaded).length,4);
  assert.equal(projects.load({hung:'constructor'},8).hung,null);
});

test('court rewards two kinds of teamwork and river light allows three independent sketches',()=>{
  assert.equal(projects.shot(0,'left','shoot'),1);
  assert.equal(projects.shot(0,'right','pass'),1);
  assert.equal(projects.shot(0,'right','shoot'),0);
  assert.equal(projects.shot(1,'right','shoot'),1);
  assert.equal(projects.lightAt(1,15*60),'clear');
  assert.equal(projects.lightAt(4,15*60),'rain');
  assert.equal(projects.lightAt(4,18*60),'dusk');
  assert.equal(projects.lightAt(4,21*60),null);
});

vm.runInContext(read('village-blackout.js')+'\nthis.blackoutAPI=VillageBlackout;',ctx);
const blackout=ctx.blackoutAPI;

test('first blackout is fixed and later Saturday rolls survive reloading',()=>{
  const state=blackout.load({seed:42});
  assert.equal(blackout.active(state,5,1140),false);
  assert.equal(blackout.active(state,6,1089),false);
  assert.equal(blackout.active(state,6,1090),true);
  assert.equal(blackout.active(state,6,1320),false);
  const weeks=Array.from({length:500},(_,week)=>13+week*7);
  const nights=weeks.filter(day=>blackout.active(state,day,1140));
  assert.ok(nights.length>30&&nights.length<70);
  assert.deepEqual(weeks.filter(day=>blackout.active(blackout.load(JSON.parse(JSON.stringify(state)),day),day,1140)),nights);
  assert.equal(blackout.active(state,nights[0]+1,1140),false);

  const first=blackout.complete(state,6,1140,'stage','circle');
  assert.equal(blackout.complete(first,6,1140,'cafe','quiet'),null);
  const next=nights[0];
  const second=blackout.complete(first,next,1140,'cafe','by');
  const restored=blackout.load(JSON.parse(JSON.stringify(second)),next);
  assert.equal(restored.visits.stage.choice,'circle');
  assert.equal(restored.visits.cafe.choice,'by');
  assert.equal(blackout.cards(restored)[0].place,'stage');
  const missed=weeks.find(day=>!nights.includes(day));
  assert.equal(blackout.active(state,missed,1140,missed),true);
});

test('old fortnightly blackout visits and keepsakes remain readable',()=>{
  const first={day:20,place:'court',choice:'river'};
  const state=blackout.load({first,last:first},34);
  assert.equal(state.visits.court.day,20);
  assert.equal(blackout.cards(state)[0].choice,'river');
});
