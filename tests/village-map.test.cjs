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
