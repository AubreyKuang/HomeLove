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

test('two letters survive reload and only the chosen alternate becomes an active request', () => {
  const state={day:1,neighborRequest:null,rel:{gy:{met:true},xy:{met:true}},inv:{berry:0,cookie:0,fish:2,carp:0}};
  const npcs=[{id:'gy'},{id:'xy'}];
  let choices,saved;
  const runtime=game({state,npcs,VillageMap:{places:{cafe:{hours:[750,1020]}}},fmt:String,
    ITEM_ICONS:{flower:'🌼',shell:'🐚'},tr:(key,vars)=>key+JSON.stringify(vars??{}),
    itemLabel:key=>key,nm:npc=>npc.id,objName:key=>key,say(){},
    talk(_who,_lines,options){choices=options;},save(){saved=JSON.parse(JSON.stringify(state.neighborRequest));}});
  runSection(runtime,'function unreadAlbumPostcard(','function petCat(');
  runtime.checkNeighborMail();
  assert.equal(saved.alternate,'xy');
  assert.match(choices[1].label,/owned\\"\s*:\s*2/);
  choices[0].fn();
  const acceptFirst=choices[0].fn;
  choices[1].fn();
  assert.equal(state.neighborRequest.status,'offered');
  state.neighborRequest=runtime.activities.loadRequest(saved);
  runtime.checkNeighborMail();
  choices[1].fn();
  choices[0].fn();
  acceptFirst();
  assert.equal(saved.resident,'xy');
  assert.equal(saved.alternate,undefined);
  assert.equal(saved.status,'accepted');
  assert.equal(runtime.acceptedNeighborRequest(npcs[0]),null);
  assert.equal(runtime.acceptedNeighborRequest(npcs[1]).day,1);
  assert.equal(runtime.hasNeighborMail(),false);
  assert.equal(state.inv.fish,2);
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

test('a missed garden date can move to the remaining pond slot or tomorrow with the same resident', () => {
  const n={id:'gy'},plan={resident:'gy',place:'garden',day:2};
  const state={day:2,time:659,datePlan:plan,rel:{gy:{done:{}}}};
  const runtime=game({state,npcs:[n],xiaomanRoute:()=>false,
    DATE_MEETINGS:{garden:{start:600,end:660},pond:{start:960,end:1020}}});
  runSection(runtime,'function activeDatePlan(','function planDateMenu(');
  const options=()=>JSON.parse(JSON.stringify(runtime.dateRebookingChoices(plan)));
  assert.deepEqual(options(),[]);
  state.time=660;
  assert.deepEqual(options(),[
    {resident:'gy',place:'pond',day:2},{resident:'gy',place:'garden',day:3},{resident:'gy',place:'pond',day:3}
  ]);
  state.time=1020;
  assert.deepEqual(options().map(choice=>choice.day),[3,3]);
  state.rel.gy.done.date=true;
  assert.deepEqual(options(),[]);
  state.rel.gy.done.date=false;
  state.datePlan={...plan,place:'pond'};
  assert.deepEqual(options(),[]);
  state.day++;
  assert.equal(runtime.missedDatePlan(),undefined);
});

test('a short date consumes the appointment and day only when both meet on site', () => {
  const n={id:'gy',state:'here',x:328,y:124};
  const plan={resident:'gy',place:'pond',day:2};
  const relation={done:{}};
  const state={day:2,time:960,datePlan:plan,need:{mood:40},life:{}};
  const P={x:0,y:0};
  let saved;
  const runtime=game({state,P,busy:false,rel:()=>relation,DATE_MEETINGS:{pond:{start:960,end:1020,spot:[20,7]}},
    SHORT_DATE:{minutes:20,mood:6,points:5},clampN:n=>n,advanceTime:m=>{state.time+=m;},
    addPts(n,points){saved=[state.datePlan,relation.done.date,state.time,state.need.mood,points];},
    updateHud(){},D:{},talk(){},tr:k=>k,nm:()=>''});
  runSection(runtime,'function activeDatePlan(','function planDateMenu(');
  runSection(runtime,'function finishShortDate(','function dateWith(');
  runtime.finishShortDate(n,plan);
  assert.equal(state.datePlan,plan);
  Object.assign(P,{x:312,y:124});
  runtime.finishShortDate(n,plan);
  runtime.finishShortDate(n,plan);
  assert.deepEqual(saved,[null,true,980,46,5]);
  assert.equal(state.time,980);
  assert.deepEqual(state.life,{});
});

test('a rainy date can change venue and award tea only at the cottage', () => {
  const plan={resident:'gy',place:'garden',day:3};
  const relation={done:{}};
  const state={day:2,time:599,datePlan:plan,rel:{gy:relation},need:{mood:40}};
  const outside={start:600,end:660,spot:[20,12]};
  const inside={...outside,spot:[7,7],indoors:true};
  const n={id:'gy',state:'here',x:328,y:204},P={x:312,y:204};
  let rainy=true,writesSucceed=false;
  const runtime=game({state,P,busy:false,rel:()=>relation,DATE_MEETINGS:{garden:outside},
    SHELTERED_DATE_MEETINGS:{garden:inside},DATE_SHELTER:{minutes:30,mood:9,points:7},
    VillageRiverside:{weather:()=>rainy?'rain':'clear'},save:()=>writesSucceed,clampN:n=>n,
    advanceTime:m=>{state.time+=m;},addPts(_,points){relation.points=points;},
    updateHud(){},D:{},talk(){},tr:k=>k,nm:()=>''});
  runSection(runtime,'function activeDatePlan(','function planDateMenu(');
  runSection(runtime,'function finishShortDate(','function dateWith(');
  assert.equal(runtime.changeDateShelter(plan),false);
  state.day=3;rainy=false;
  assert.equal(runtime.changeDateShelter(plan),false);
  rainy=true;
  assert.equal(runtime.changeDateShelter(plan),false);
  assert.equal(state.datePlan,plan);
  writesSucceed=true;
  assert.equal(runtime.changeDateShelter(plan),true);
  assert.deepEqual({...state.datePlan},{...plan,shelter:true});
  assert.equal(runtime.plannedDateMeeting(n),inside);
  state.time=600;
  runtime.finishShortDate(n,state.datePlan);
  assert.equal(state.datePlan.shelter,true);
  assert.equal(runtime.changeDateShelter(state.datePlan),true);
  assert.deepEqual({...state.datePlan},plan);
  assert.equal(runtime.plannedDateMeeting(n),outside);
  runtime.changeDateShelter(state.datePlan);
  Object.assign(n,{x:120,y:124});
  Object.assign(P,{x:104,y:124});
  state.time=660;
  assert.equal(runtime.changeDateShelter(state.datePlan),false);
  runtime.finishShortDate(n,state.datePlan);
  assert.equal(state.datePlan.shelter,true);
  state.time=659;
  runtime.finishShortDate(n,state.datePlan);
  assert.deepEqual([state.datePlan,relation.done.date,state.time,state.need.mood,relation.points],[null,true,689,49,7]);
});

test('a rainy date can move to a dry tomorrow without creating a second reservation', () => {
  const plan={resident:'gy',place:'pond',day:3,shelter:true};
  const done={};
  const state={day:3,time:970,datePlan:plan,rel:{gy:{done}}};
  let tomorrow='wind', writesSucceed=false;
  const runtime=game({state,DATE_MEETINGS:{pond:{start:960,end:1020}},
    VillageRiverside:{weather:day=>day===3?'rain':tomorrow},save:()=>writesSucceed});
  runSection(runtime,'function activeDatePlan(','function planDateMenu(');
  assert.equal(runtime.postponeRainDate(plan),false);
  assert.equal(state.datePlan,plan);
  writesSucceed=true;
  tomorrow='rain';
  assert.equal(runtime.rainDateTomorrow(plan),null);
  tomorrow='clear';
  done.date=true;
  assert.equal(runtime.postponeRainDate(plan),false);
  delete done.date;
  state.time=1020;
  assert.equal(runtime.postponeRainDate(plan),false);
  state.time=1019;
  assert.equal(runtime.postponeRainDate(plan),true);
  assert.deepEqual({...state.datePlan},{resident:'gy',place:'pond',day:4});
  assert.equal(runtime.postponeRainDate(plan),false);
  assert.equal(runtime.plannedDateMeeting({id:'gy'}),undefined);
  assert.deepEqual(done,{});
});

test('a rain detour can be reversed and requires both people to reach the new spot', () => {
  const plan={resident:'gy',place:'garden',day:3},relation={done:{}};
  const state={day:3,time:600,datePlan:plan,rel:{gy:relation},need:{mood:40}};
  const meeting={start:600,end:660,spot:[20,12]},detour={...meeting,spot:[13,12],p:[12,12],name:'dateRainLane'};
  const n={id:'gy',state:'here',x:328,y:204},P={x:312,y:204};
  let points=0;
  const runtime=game({state,P,busy:false,npcs:[n],rel:()=>relation,DATE_MEETINGS:{garden:meeting},
    RAIN_DATE_MEETINGS:{garden:detour},RAIN_DETOUR_DATE:{minutes:35,mood:13,points:8},
    VillageRiverside:{weather:day=>day===3?'rain':'clear'},save:()=>true,activeUmbrella:()=>true,clampN:n=>n,
    advanceTime:m=>{state.time+=m;},addPts(_,p){points+=p;},updateHud(){},D:{},talk(){},tr:k=>k,nm:()=>''});
  runSection(runtime,'function activeDatePlan(','function planDateMenu(');
  runSection(runtime,'function finishShortDate(','function dateWith(');
  assert.equal(runtime.changeRainDateRoute(plan),true);
  assert.equal(runtime.changeRainDateRoute(state.datePlan),true);
  assert.deepEqual({...state.datePlan},plan);
  assert.equal(runtime.changeRainDateRoute(state.datePlan),true);
  const revised=state.datePlan;
  Object.assign(n,{x:216,y:204});
  runtime.finishShortDate(n,revised,true);
  assert.equal(state.datePlan,revised);
  Object.assign(P,{x:200,y:204});
  runtime.finishShortDate(n,revised,true);
  runtime.finishShortDate(n,revised,true);
  assert.deepEqual([state.datePlan,relation.done.date,state.time,state.need.mood,points],[null,true,635,53,8]);
  assert.deepEqual({...state.rainReturn},{resident:'gy',place:'garden',day:4,done:false});
});

test('rain reflection can be viewed only on the next dry day at the original puddle', () => {
  const revisit={resident:'gy',place:'garden',day:4,done:false};
  const state={day:3,time:600,rainReturn:revisit,need:{mood:40},rel:{gy:{done:{}}}};
  const P={x:0,y:0};
  let writesSucceed=false,rain=false;
  const runtime=game({state,P,RAIN_DATE_MEETINGS:{garden:{p:[12,12]}},RAIN_RETURN:{minutes:15,mood:8},
    VillageRiverside:{weather:()=>rain?'rain':'clear'},save:()=>writesSucceed,clampN:n=>n,
    advanceTime:m=>{state.time+=m;},updateHud(){},talk(){},tr:k=>k});
  runSection(runtime,'function rainReturnReady(','function hasSharedExperience(');
  assert.equal(runtime.rainReturnReady(),null);
  state.day=4;rain=true;
  assert.equal(runtime.rainReturnReady(),null);
  rain=false;runtime.finishRainReturn(revisit);
  assert.equal(state.time,600);
  Object.assign(P,{x:200,y:204});
  runtime.finishRainReturn(revisit);
  assert.deepEqual([revisit.done,state.time,state.need.mood],[false,600,40]);
  writesSucceed=true;
  runtime.finishRainReturn(revisit);runtime.finishRainReturn(revisit);
  assert.deepEqual([revisit.done,state.time,state.need.mood,state.rel.gy.done],[true,615,48,{}]);
});

test('companion revisits require the appointment and both people at the puddle', () => {
  const revisit={resident:'gy',place:'garden',day:4,done:false};
  const state={day:3,time:600,rainReturn:revisit,rainSketches:{},need:{mood:40}};
  const meeting={start:600,end:660,p:[12,12],spot:[13,12],name:'dateRainLane'};
  const firstStop={...meeting,p:[19,12],spot:[20,12]};
  const pauseStop={...meeting,p:[16,12],spot:[15,12]};
  const P={x:200,y:204},n={id:'gy',state:'here',x:300,y:204};
  const bonds={trust:{gy:10}};
  let write=false,plan,route;
  const runtime=game({state,P,RAIN_DATE_MEETINGS:{garden:meeting},RAIN_COMPANION_STARTS:{garden:firstStop},RAIN_RETURN:{minutes:15,mood:8},
    RAIN_WALK_STOPS:{garden:pauseStop},RAIN_WALK_PAUSE:{minutes:10,mood:4},RAIN_WALK_TRAVEL_BUFFER:10,say(){},
    RAIN_COMPANION_WALK:{minutes:30,mood:13,trust:6},setWalkDestination:(x,y)=>{route=[x,y];return true;},
    RAIN_COMPANION:{minutes:25,mood:11,trust:4},VillageRiverside:{weather:()=> 'clear'},
    B:()=>bonds,trustNpc:(_,d)=>{bonds.trust.gy+=d;},activeDatePlan:()=>plan,
    save:()=>write,advanceTime:m=>{state.time+=m;},clampN:n=>n,updateHud(){},D:{},talk(){},tr:k=>k,nm:()=>''});
  runSection(runtime,'function rainReturnReady(','function hasSharedExperience(');
  runSection(runtime,'function atPlannedDate(','function datePlanPlace(');
  assert.equal(runtime.setRainCompanion(revisit),false);
  assert.equal(revisit.together,undefined);
  write=true;plan={...revisit};
  assert.equal(runtime.setRainCompanion(revisit),false);
  plan=null;assert.equal(runtime.setRainCompanion(revisit),true);
  assert.equal(runtime.rainCompanionMeeting(n),undefined);
  state.day=4;state.time=580;
  assert.equal(runtime.rainCompanionMeeting(n),meeting);
  assert.equal(runtime.canFinishRainCompanion(revisit,n),false);
  state.time=600;
  assert.equal(runtime.canFinishRainCompanion(revisit,n),false);
  n.x=216;write=false;
  runtime.finishRainCompanion(revisit,n);
  assert.deepEqual([state.time,state.need.mood,revisit.done,bonds.trust.gy],[600,40,false,10]);
  write=true;runtime.finishRainCompanion(revisit,n);runtime.finishRainCompanion(revisit,n);
  assert.deepEqual([state.time,state.need.mood,revisit.done,bonds.trust.gy],[625,51,true,14]);
  state.time=590;revisit.done=false;
  assert.equal(runtime.setRainCompanionWalk(revisit),true);
  assert.equal(runtime.rainCompanionMeeting(n),firstStop);
  state.time=600;
  Object.assign(P,{x:312});n.x=328;
  assert.equal(runtime.canFinishRainCompanion(revisit,n),false);
  write=false;runtime.startRainCompanionWalk(revisit,n);
  assert.deepEqual([revisit.walk,route],['meet',undefined]);
  write=true;runtime.startRainCompanionWalk(revisit,n);
  assert.deepEqual([revisit.walk,route],['walking',[200,202]]);
  assert.equal(runtime.rainCompanionMeeting(n),meeting);
  assert.equal(runtime.canFinishRainCompanion(revisit,n),false);
  Object.assign(P,{x:200});n.x=216;
  state.time=660;
  assert.equal(runtime.canFinishRainCompanion(revisit,n),false);
  state.time=650;
  runtime.finishRainCompanion(revisit,n);
  assert.deepEqual([state.time,state.need.mood,revisit.done,bonds.trust.gy],[680,64,true,20]);
  revisit.done=false;revisit.walk='meet';state.time=610;
  Object.assign(P,{x:312});n.x=328;
  runtime.startRainCompanionWalk(revisit,n,true);
  assert.deepEqual([revisit.walk,route],['pause',[264,202]]);
  Object.assign(P,{x:264});n.x=248;
  write=false;runtime.leaveRainWalkStop(revisit,n,true);
  assert.deepEqual([state.time,state.need.mood,revisit.walk],[610,64,'pause']);
  write=true;runtime.leaveRainWalkStop(revisit,n,true);
  runtime.leaveRainWalkStop(revisit,n,true);
  assert.deepEqual([state.time,state.need.mood,revisit.walk,route],[620,68,'walking',[200,202]]);
  revisit.walk='pause';state.time=640;
  runtime.leaveRainWalkStop(revisit,n,true);
  assert.equal(revisit.walk,'pause');
  runtime.leaveRainWalkStop(revisit,n,false);
  assert.deepEqual([state.time,state.need.mood,revisit.walk],[640,68,'walking']);
  P.x=200;n.x=216;
  assert.equal(runtime.rainCompanionOptions(revisit,n).length,2);
  write=false;runtime.finishRainCompanion(revisit,n,true);
  assert.deepEqual([state.time,state.need.mood,revisit.done,bonds.trust.gy,state.rainSketches.garden],[640,68,false,20,undefined]);
  write=true;runtime.finishRainCompanion(revisit,n,true);runtime.finishRainCompanion(revisit,n,true);
  assert.deepEqual([state.time,state.need.mood,revisit.done,bonds.trust.gy],[680,77,true,24]);
  assert.deepEqual({...state.rainSketches.garden},{resident:'gy',day:4,shared:true});
  revisit.done=false;delete revisit.walk;state.time=620;
  assert.equal(runtime.rainCompanionOptions(revisit,n).length,1);
  runtime.finishRainCompanion(revisit,n,true);
  assert.deepEqual([state.time,revisit.done],[620,false]);
  delete state.rainSketches.garden;
  runtime.finishRainCompanion(revisit,n,true);
  assert.deepEqual([state.time,state.need.mood,revisit.done,bonds.trust.gy],[655,84,true,26]);
});

test('an early draft saves time together and can still be completed alone', () => {
  const revisit={resident:'gy',place:'garden',day:4,done:false,together:true};
  const state={day:4,time:600,rainReturn:revisit,rainSketches:{},need:{mood:40}};
  const n={id:'gy',state:'away',x:216,y:204},P={x:200,y:204},bonds={trust:{gy:10}};
  let write=false,choices;
  const runtime=game({state,P,npcs:[n],RAIN_DATE_MEETINGS:{garden:{start:600,end:660,p:[12,12],spot:[13,12],name:'garden'}},
    RAIN_RETURN:{minutes:15,mood:8},RAIN_SKETCH:{minutes:30,mood:4},RAIN_SKETCH_DRAFT_MINUTES:10,RAIN_SHARED_DRAFT_SAVING:15,RAIN_DRAFT_BANK_BONUS:5,
    RAIN_COMPANION:{minutes:25,mood:11,trust:4},RAIN_DRAFT_CHANGE:{minutes:10,trust:2},RAIN_DRAFT_RELOCATION_MINUTES:5,
    RAIN_LOCAL_SKETCH:{minutes:30,mood:7},RAIN_LOCAL_CHANGE_MINUTES:5,RAIN_LOCAL_SUBJECT:{garden:'reflection',pond:'bank'},
    RAIN_PAIRED_SKETCH:{minutes:15,mood:5},
    VillageRiverside:{weather:()=> 'clear'},save:()=>write,
    advanceTime:m=>{state.time+=m;},clampN:n=>n,B:()=>bonds,trustNpc:(_,delta)=>{bonds.trust.gy+=delta;},
    updateHud(){},D:{},talk(_who,_lines,options){choices=options;},tr:k=>k,nm:n=>n.id});
  runSection(runtime,'function rainReturnReady(','function hasSharedExperience(');
  runSection(runtime,'function atPlannedDate(','function datePlanPlace(');
  runtime.rainReturnMenu(revisit);
  assert.equal(choices[0].label,'rainSketchSubjectAction');
  choices[0].fn();
  assert.deepEqual([state.time,revisit.draft],[600,undefined]);
  assert.equal(revisit.subject,undefined);
  write=true;state.time=650;runtime.draftRainSketch(revisit);
  assert.equal(revisit.draft,undefined);
  state.time=590;n.state='here';runtime.draftRainSketch(revisit);
  assert.equal(revisit.draft,undefined);
  state.time=600;n.state='away';runtime.draftRainSketch(revisit);runtime.draftRainSketch(revisit);
  assert.deepEqual([state.time,revisit.draft,revisit.done,state.rainSketches],[610,true,false,{}]);
  n.state='here';runtime.finishRainCompanion(revisit,n,true);
  assert.deepEqual([state.time,revisit.done,bonds.trust.gy,state.rainSketches.garden.shared],[630,true,12,true]);
  assert.equal(state.rainSketches.garden.subject,'reflection');
  const bank={...revisit,subject:'bank'};
  assert.equal(runtime.rainCompanionActivity(bank,true).minutes,25);
  assert.equal(runtime.soloRainSketch(bank).minutes,15);
  assert.equal(runtime.soloRainSketch({...bank,relocated:true}).minutes,20);
  assert.equal(runtime.rainCompanionActivity({...bank,relocated:true},true).minutes,30);
  state.rainSketches={};state.rainReturn={...bank,done:false};state.time=610;
  const change=runtime.rainCompanionOptions(state.rainReturn,n).find(choice=>choice.label==='rainSketchChangeSubject');
  write=false;change.fn();
  assert.deepEqual([state.time,state.rainReturn.done,state.rainReturn.subject,bonds.trust.gy,state.rainSketches.garden],
    [610,false,'bank',12,undefined]);
  write=true;change.fn();change.fn();
  assert.deepEqual([state.time,state.rainReturn.done,bonds.trust.gy,state.rainSketches.garden.subject,state.rainSketches.garden.shared],
    [645,true,16,'reflection',true]);
  state.rainSketches={};state.rainReturn={...revisit,done:false,together:false};state.time=1535;
  runtime.finishRainReturn(state.rainReturn,true);
  assert.deepEqual([state.time,state.rainReturn.done,state.rainSketches.garden.shared],[1555,true,undefined]);
  state.rainSketches={};state.rainReturn={...bank,done:false,together:false};state.time=1540;
  runtime.finishRainReturn(state.rainReturn,true);
  assert.deepEqual([state.time,state.rainReturn.done,state.rainSketches.garden.subject],[1555,true,'bank']);
  state.rainSketches={};state.rainReturn={...bank,done:false,relocated:true};state.time=1530;
  assert.equal(runtime.rainCompanionActivity(state.rainReturn,true,true).minutes,35);
  runtime.rainReturnMenu(state.rainReturn);
  assert.equal(choices.find(choice=>choice.label==='rainSketchLocalAction').disabled,true);
  runtime.finishRainReturn(state.rainReturn,true,true);
  assert.equal(state.rainReturn.done,false);
  state.time=1529;
  const mood=state.need.mood;
  write=false;
  runtime.finishRainReturn(state.rainReturn,true,true);
  assert.deepEqual([state.time,state.need.mood,state.rainReturn.done,state.rainSketches.garden],[1529,mood,false,undefined]);
  write=true;
  runtime.finishRainReturn(state.rainReturn,true,true);
  assert.deepEqual([state.time,state.need.mood,state.rainReturn.done,state.rainSketches.garden.subject],[1559,mood+7,true,'reflection']);
  state.rainSketches={};state.rainReturn={...bank,done:false,relocated:true};state.time=600;
  const pair=runtime.rainCompanionOptions(state.rainReturn,n).find(choice=>choice.label==='rainSketchPairedAction');
  assert.ok(pair);
  const before=[state.time,state.need.mood,bonds.trust.gy];
  write=false;pair.fn();
  assert.deepEqual([state.time,state.need.mood,bonds.trust.gy],before);
  assert.equal(state.rainReturn.done,false);
  assert.equal(state.rainSketches.garden,undefined);
  write=true;pair.fn();pair.fn();
  assert.deepEqual([state.time,state.need.mood,bonds.trust.gy],[645,before[1]+12,before[2]+2]);
  assert.deepEqual({...state.rainSketches.garden},{resident:'gy',day:4,shared:true,subject:'paired'});
});

test('an unfinished draft can be rebooked once after a missed meetup', () => {
  const draft={resident:'gy',place:'garden',day:4,done:false,together:true,draft:true,subject:'bank',walk:'walking'};
  const state={day:4,time:659,rainReturn:draft,rainSketches:{}};
  let rainy=false,write=false,plan;
  const runtime=game({state,RAIN_RETURN:{minutes:15},RAIN_DATE_MEETINGS:{garden:{start:600,end:660},pond:{start:960,end:1020}},
    activeDatePlan:()=>plan,VillageRiverside:{weather:day=>rainy&&day===5?'rain':'clear'},save:()=>write});
  runSection(runtime,'function rainReturnReady(','function startRainCompanionWalk(');
  assert.equal(runtime.rebookRainDraft(draft),false);
  state.time=660;rainy=true;
  assert.equal(runtime.canRebookRainDraft(draft),false);
  rainy=false;plan={resident:'gy',place:'garden',day:5};
  assert.equal(runtime.canRebookRainDraft(draft),false);
  assert.equal(runtime.canRebookRainDraft(draft,'pond'),true);
  state.rainSketches.pond={resident:'gy',day:2};
  assert.equal(runtime.canRebookRainDraft(draft,'pond'),false);
  delete state.rainSketches.pond;
  plan=null;
  assert.equal(runtime.canRebookRainDraft(draft),true);
  assert.equal(runtime.rebookRainDraft(draft),false);
  assert.equal(state.rainReturn,draft);
  write=true;
  assert.equal(runtime.rebookRainDraft(draft),true);
  const rebooked=state.rainReturn;
  assert.deepEqual({...rebooked},{resident:'gy',place:'garden',day:5,done:false,together:true,draft:true,subject:'bank',rebooked:true});
  assert.equal(runtime.rainReturnReady(),null);
  assert.equal(runtime.setRainCompanionWalk(rebooked),false);
  state.day=5;state.time=600;
  assert.equal(runtime.rainReturnReady(),rebooked);
  state.time=660;
  assert.equal(runtime.rebookRainDraft(rebooked),false);
  assert.equal(runtime.rainReturnReady(),rebooked);
  state.day=4;state.time=660;state.rainReturn=draft;
  assert.equal(runtime.rebookRainDraft(draft,'pond'),true);
  assert.deepEqual([state.rainReturn.day,state.rainReturn.place,state.rainReturn.subject,state.rainReturn.relocated],[5,'pond','bank',true]);
});

test('rain sketches use the revisit, save once per place, and roll back on write failure', () => {
  const revisit={resident:'gy',place:'garden',day:4,done:false};
  const state={day:4,time:1530,rainReturn:revisit,rainSketches:{},need:{mood:40}};
  const P={x:200,y:204};
  let writesSucceed=false,choices;
  const runtime=game({state,P,RAIN_DATE_MEETINGS:{garden:{p:[12,12]},pond:{p:[23,8]}},
    RAIN_RETURN:{minutes:15,mood:8},RAIN_SKETCH:{minutes:30,mood:4},
    VillageRiverside:{weather:()=> 'clear'},save:()=>writesSucceed,clampN:n=>n,
    advanceTime:m=>{state.time+=m;},updateHud(){},talk(_who,_lines,options){choices=options;},tr:k=>k});
  runSection(runtime,'function rainReturnReady(','function hasSharedExperience(');
  runtime.rainReturnMenu(revisit);
  assert.equal(choices[1].disabled,true);
  runtime.finishRainReturn(revisit,true);
  assert.deepEqual([revisit.done,state.time,state.rainSketches],[false,1530,{}]);
  state.time=600;
  runtime.finishRainReturn(revisit,true);
  assert.deepEqual([revisit.done,state.time,state.need.mood,state.rainSketches],[false,600,40,{}]);
  writesSucceed=true;
  runtime.finishRainReturn(revisit,true);
  runtime.finishRainReturn(revisit);
  assert.deepEqual([revisit.done,state.time,state.need.mood],[true,630,44]);
  assert.deepEqual({...state.rainSketches.garden},{resident:'gy',day:4});
  state.day=5;
  state.rainReturn={...revisit,day:5,done:false};
  runtime.finishRainReturn(state.rainReturn,true);
  assert.equal(state.rainReturn.done,false);
  state.rainReturn.place='pond';
  Object.assign(P,{x:376,y:140});
  runtime.finishRainReturn(state.rainReturn,true);
  assert.deepEqual({...state.rainSketches.pond},{resident:'gy',day:5});
  assert.equal(state.rainSketches.garden.day,4);
});

test('a rain sketch gift requires its companion and rolls back before a successful one-time transfer', () => {
  const resident={id:'gy'},other={id:'xy'};
  const frame={key:'rain-sketch:garden'},sketch={resident:'gy',day:4};
  const state={day:5,time:600,rainSketches:{garden:sketch},album:{framed:frame},need:{mood:60}};
  const relationship={done:{}},bonds={trust:{gy:4}};
  let target=other,write=false;
  const runtime=game({state,rel:()=>relationship,B:()=>bonds,findTarget:()=>({n:target}),
    RAIN_DATE_MEETINGS:{garden:{name:'dateRainLane'}},save:()=>write,
    advanceTime:m=>{state.time+=m;state.need.mood--;},trustNpc:(n,d)=>{bonds.trust[n.id]+=d;},
    updateHud(){},talk(){},D:{},nm:n=>n.id,tr:k=>k});
  runSection(runtime,'const RAIN_SKETCH_GIFT=','function giftMenu(');
  assert.equal(runtime.rainSketchGifts(other).length,0);
  runtime.giveRainSketch(resident,'garden');
  assert.equal(state.time,600);
  target=resident;
  runtime.giveRainSketch(resident,'garden');
  assert.deepEqual([state.time,state.need.mood,sketch.given,state.album.framed,bonds.trust.gy,relationship.done],
    [600,60,undefined,frame,4,{}]);
  write=true;
  runtime.giveRainSketch(resident,'garden');
  assert.deepEqual([state.time,sketch.given,state.album.framed,bonds.trust.gy,relationship.done.gift],[605,true,null,12,true]);
  delete relationship.done.gift;
  runtime.giveRainSketch(resident,'garden');
  assert.equal(state.time,605);
  assert.equal(runtime.rainSketchGifts(resident).length,0);
});

test('sharing an umbrella requires an outdoor meeting and an active umbrella', () => {
  const plan={resident:'gy',place:'garden',day:3};
  const n={id:'gy',state:'here',x:328,y:204},P={x:312,y:204};
  const state={day:3,time:600,datePlan:plan,need:{mood:40}};
  const relation={done:{}};
  let open=false, points=0;
  const meeting={start:600,end:660,spot:[20,12]};
  const runtime=game({state,P,busy:false,rel:()=>relation,DATE_MEETINGS:{garden:meeting},
    SHELTERED_DATE_MEETINGS:{garden:meeting},UMBRELLA_DATE:{minutes:25,mood:10,points:6},
    activeUmbrella:()=>open,clampN:n=>n,advanceTime:m=>{state.time+=m;},addPts(_,p){points+=p;},
    updateHud(){},D:{},talk(){},tr:k=>k,nm:()=>''});
  runSection(runtime,'function activeDatePlan(','function planDateMenu(');
  runSection(runtime,'function finishShortDate(','function dateWith(');
  runtime.finishShortDate(n,plan,true);
  assert.equal(state.datePlan,plan);
  open=true;
  const indoor={...plan,shelter:true};
  state.datePlan=indoor;
  runtime.finishShortDate(n,indoor,true);
  assert.equal(state.datePlan,indoor);
  state.datePlan=plan;
  runtime.finishShortDate(n,plan,true);
  runtime.finishShortDate(n,plan,true);
  assert.deepEqual([state.datePlan,relation.done.date,state.time,state.need.mood,points],[null,true,625,50,6]);
});

test('a packed breakfast spends produce once and can be eaten only the next morning', () => {
  const state={day:1,time:1200,need:{hunger:20,mood:30},inv:{carrot:1,pumpkin:1}};
  const runtime=game({state,busy:false,BREAKFAST_BOX:{prepMinutes:40,eatMinutes:5,until:720,hunger:55,mood:6,outdoorUntil:840,outdoorHunger:40},
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

test('the market bench uses the same box and keeps it available two hours longer', () => {
  const state={day:2,time:835,breakfastBoxDay:2,need:{hunger:20,mood:30},inv:{carrot:1,pumpkin:1}};
  const runtime=game({state,busy:false,BREAKFAST_BOX:{prepMinutes:40,eatMinutes:5,until:720,hunger:55,mood:6,outdoorUntil:840,outdoorHunger:40},
    sfx(){},busyFade(mid){mid();},advanceTime(m){state.time+=m;},clampN:n=>Math.min(100,n),updateHud(){},save(){}});
  runSection(runtime,'function breakfastBoxReady(','function eat(){');
  runSection(runtime,'const RECIPES=','function workout(');
  const recipe=vm.runInContext("RECIPES.find(recipe=>recipe.label==='cookStew')",runtime);
  assert.equal(runtime.breakfastBoxReady(),false);
  assert.equal(runtime.breakfastBoxReady(true),true);
  assert.equal(runtime.breakfastBoxBlock(recipe),'boxAlready');
  state.time=836;
  runtime.eatBreakfastBox(true);
  assert.equal(state.breakfastBoxDay,2);
  state.time=835;
  runtime.eatBreakfastBox();
  runtime.eatBreakfastBox(true);
  runtime.eatBreakfastBox(true);
  assert.equal(state.time,840);
  assert.deepEqual(state.need,{hunger:60,mood:36});
  assert.equal(state.breakfastBoxDay,null);
});

test('lunch with Gu Yan spends the same box once and must finish before the cutoff', () => {
  const cafe={hours:[750,1020],spot:[14,22]},n={id:'gy',state:'here',x:232,y:364};
  const life={};
  const state={day:2,time:749,breakfastBoxDay:2,need:{hunger:20,mood:30}};
  let points=0;
  const runtime=game({state,busy:false,VillageMap:{places:{cafe}},P:{x:216,y:364},villageDuty:()=>cafe,rel:()=>({met:true}),
    BREAKFAST_BOX:{eatMinutes:5,outdoorUntil:840},LUNCH_SHARE:{minutes:15,hunger:22,mood:8,points:5},
    sfx(){},busyFade(mid){mid();},advanceTime(m){state.time+=m;},clampN:n=>Math.min(100,n),updateHud(){},lifeOf:()=>life,addPts(_,delta){points+=delta;}});
  runSection(runtime,'function breakfastBoxReady(','function eat(){');
  runSection(runtime,'function atCafeWithResident(','function cafeRequestBlock(');
  assert.equal(runtime.canShareLunch(n),false);
  state.time=826;
  runtime.shareLunch(n);
  assert.equal(state.breakfastBoxDay,2);
  state.time=825;
  n.leaving=true;
  assert.equal(runtime.canShareLunch(n),false);
  n.leaving=false;
  assert.equal(runtime.canShareLunch(n),true);
  runtime.shareLunch(n);
  runtime.shareLunch(n);
  assert.deepEqual(state.need,{hunger:42,mood:38});
  assert.equal(state.time,840);
  assert.equal(state.breakfastBoxDay,null);
  assert.equal(points,5);
  assert.equal(life.lunchReturn.day,3);
});

test('the cafe return invitation starts the next day and offers one successful redemption', () => {
  const n={id:'gy'}, invitation={day:3};
  const state={day:2,time:750,life:{gy:{lunchReturn:invitation}},need:{hunger:20,mood:30},inv:{cookie:0}};
  let saved=false;
  const runtime=game({state,busy:false,VillageMap:{places:{cafe:{hours:[750,1020]}}},LUNCH_RETURN:{minutes:20,hunger:30,mood:12},
    atCafeWithResident:()=>true,tr:k=>k,advanceTime:m=>{state.time+=m;},clampN:n=>Math.min(100,n),
    save:()=>saved,updateHud(){},sfx(){},D:{},nm:()=>'',talk(){}});
  runSection(runtime,'function pendingLunchReturn(','function eat(){');
  assert.equal(runtime.lunchReturnOption(n).length,0);
  state.day=3;state.time=1001;
  assert.equal(runtime.lunchReturnOption(n).length,1);
  runtime.finishLunchReturn(n,true);
  assert.equal(invitation.done,undefined);
  runtime.finishLunchReturn(n,false);
  assert.equal(state.inv.cookie,0);
  saved=true;
  runtime.finishLunchReturn(n,false);
  runtime.finishLunchReturn(n,false);
  assert.equal(state.inv.cookie,1);
  assert.equal(runtime.lunchReturnOption(n).length,0);
  delete invitation.done;
  state.time=1000;
  runtime.finishLunchReturn(n,true);
  assert.deepEqual([state.time,state.need.hunger,state.need.mood,state.inv.cookie],[1020,50,42,1]);
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
