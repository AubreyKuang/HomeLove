const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const read=file=>readFileSync(join(__dirname,'..',file),'utf8');
const html=read('index.html');
const ctx=vm.createContext({Lp:{objects:{}},state:{picked:[]},pick:xs=>xs[0]});
vm.runInContext(read('village-map.js'),ctx);
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
