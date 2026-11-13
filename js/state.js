"use strict";

/* ---------------- items & activities ---------------- */
const ITEM_ICONS={flower:'🌼',berry:'🍓',carrot:'🥕',pumpkin:'🎃',cookie:'🍪',fish:'🐟',carp:'🐠',moonfish:'🌙',shell:'🐚',star:'⭐',letter:'💌',gold:'✨'};
const ITEM_KEYS=Object.keys(ITEM_ICONS);
const GIFT_KEYS=ITEM_KEYS.filter(k=>k!=='gold');
const FISHING_INVITE={resident:'by',gift:'moonfish',delay:2,opens:19*60,closes:23.5*60};
const ACT_E={walk:5,fish:5,read:2,sport:15,stars:3},ACT_DARK={stars:true};
const DATES={pond:{minutes:45,p:[19,7],n:[20,7]},garden:{minutes:60,p:[19,12],n:[20,12]},stars:{minutes:90,dark:true,p:[4,13],n:[5,13]},home:{minutes:105,p:[13,6],n:[14,6]}};
const BREAKFAST_BOX={prepMinutes:40,eatMinutes:5,until:720,hunger:55,mood:6,outdoorUntil:840,outdoorHunger:40};
const LUNCH_SHARE={minutes:15,hunger:22,mood:8,points:5};
const DATE_MEETINGS={garden:{start:600,end:660,spot:DATES.garden.n},pond:{start:960,end:1020,spot:DATES.pond.n}};

/* ---------------- residents ---------------- */
/* Numbers only; every line of text lives in lang/<code>.js under npcs.<id>. */
const NPCS=[
  {id:'gy',arrive:7*60,leave:11.5*60,
    outfit:{skin:1,hair:'short',hairColor:1,top:'sweater',topColor:0,bottom:'pants',bottomColor:10,shoes:'loafer',shoesColor:10,hat:'none',hatColor:0,acc:'glasses',accColor:1},
    spots:[[14,11],[9,13],[12,10]],likeColors:[0,10,5],likeItems:['sweater','glasses','scarf','longskirt','loafer','lilyGown'],
    gifts:{letter:16,cookie:12,star:8,berry:6,flower:6,shell:4,fish:2,carrot:7,pumpkin:11,carp:5,moonfish:7},social:{praise:8,joke:2,flirt:9},
    acts:{walk:8,fish:4,read:14,sport:1,stars:7},dates:{pond:6,garden:8,stars:7,home:13},qv:[[8,5,2],[8,6,1],[9,5,2]],dv:[9,4,8]},
  {id:'xm',arrive:9*60,leave:15*60,
    outfit:{skin:0,hair:'long',hairColor:2,top:'dress',topColor:9,bottom:'skirt',bottomColor:0,shoes:'loafer',shoesColor:10,hat:'wreath',hatColor:0,acc:'none',accColor:0},
    spots:[[20,8],[17,12],[18,9],[22,9]],likeColors:[9,0,4],likeItems:['dress','longskirt','wreath','bow','straw','roseGown'],
    gifts:{flower:16,letter:10,cookie:9,shell:8,star:6,berry:4,fish:1,carrot:8,pumpkin:9,carp:3,moonfish:5},social:{praise:9,joke:6,flirt:8},
    acts:{walk:10,fish:3,read:12,sport:2,stars:9},dates:{pond:8,garden:13,stars:8,home:6},qv:[[8,4,1],[8,5,2],[9,5,2]],dv:[8,4,6]},
  {id:'xy',arrive:11*60,leave:17*60,
    outfit:{skin:3,hair:'spiky',hairColor:3,top:'tee',topColor:2,bottom:'shorts',bottomColor:0,shoes:'sneaker',shoesColor:2,hat:'cap',hatColor:7,acc:'none',accColor:0},
    spots:[[20,12],[25,14],[13,13],[8,16]],likeColors:[2,3,4],likeItems:['tee','shorts','sneaker','cap','hoodie'],
    gifts:{fish:16,berry:10,cookie:9,star:5,letter:5,shell:4,flower:2,carrot:10,pumpkin:7,carp:15,moonfish:8},social:{praise:7,joke:11,flirt:4},
    acts:{walk:7,fish:13,read:1,sport:15,stars:4},dates:{pond:7,garden:5,stars:6,home:11},qv:[[9,5,2],[9,2,7],[8,5,2]],dv:[9,4,8]},
  {id:'jy',arrive:15*60,leave:21*60,
    outfit:{skin:2,hair:'spiky',hairColor:0,top:'jacket',topColor:1,bottom:'pants',bottomColor:11,shoes:'sneaker',shoesColor:0,hat:'none',hatColor:0,acc:'bag',accColor:10},
    spots:[[10,13],[21,8],[12,11],[26,13]],likeColors:[1,7,11],likeItems:['jacket','cap','hoodie','shades','pants','peacockGown'],
    gifts:{berry:16,shell:10,cookie:9,star:8,letter:7,flower:3,fish:3,carrot:4,pumpkin:6,carp:9,moonfish:10},social:{praise:5,joke:9,flirt:7},
    acts:{walk:6,fish:8,read:2,sport:5,stars:12},dates:{pond:13,garden:4,stars:10,home:6},qv:[[8,5,1],[8,4,6],[9,3,6]],dv:[8,5,6]},
  {id:'by',arrive:20*60,leave:25*60,
    outfit:{skin:0,hair:'long',hairColor:10,top:'jacket',topColor:1,bottom:'pants',bottomColor:1,shoes:'boots',shoesColor:1,hat:'none',hatColor:0,acc:'scarf',accColor:8},
    spots:[[17,8],[23,8],[19,7]],likeColors:[1,8,11],likeItems:['jacket','boots','scarf','crown','longskirt','moonGown'],
    gifts:{star:18,shell:10,letter:9,flower:6,cookie:4,berry:3,fish:1,carrot:3,pumpkin:5,carp:4,moonfish:16},social:{praise:3,joke:5,flirt:11},
    acts:{walk:6,fish:5,read:8,sport:1,stars:16},dates:{pond:8,garden:4,stars:14,home:5},qv:[[9,2,8],[8,6,9]],dv:[9,5,8]},
];
const ALBUM_RESIDENTS=NPCS.map(n=>n.id);
const HOME_IN=[[4,6],[8,7],[5,7],[9,6],[4,8],[13,6],[14,5]],HOME_OUT=[[14,11],[10,13],[19,8]];

/* ---------------- state ---------------- */
function newRel(){return {pts:0,met:false,done:{},couple:false,livesIn:false,m3:false,m6:false,m8:false,knowGift:false,knowStyle:false,notes:{}};}
const state={
  o:{skin:1,hair:'twin',hairColor:1,top:'sailor',topColor:0,bottom:'skirt',bottomColor:7,shoes:'loafer',shoesColor:10,hat:'none',hatColor:9,acc:'none',accColor:4},
  day:1,time:8*60,need:{energy:90,hunger:70,mood:70},
  inv:Object.fromEntries(ITEM_KEYS.map(k=>[k,0])),flowersTotal:0,picked:[],
  garden:CottageActivities.loadGarden(),tunnels:[],fishLog:{},capsuleDresses:[],capsuleHairs:[],capsuleTops:[],capsuleBottoms:[],neighborRequest:null,album:MemoryAlbum.load(),events:CottageEvents.load(),snowFishing:SnowFishing.load(),xiaoman:XiaomanStory.load(),stories:ResidentStories.load(),
  lamp:true,looks:[],seen:false,firstGreetingDismissed:false,changedToday:false,lastRead:-999,lastPet:-999,goldFound:false,summon:-1,pets:[],chores:{},meal:null,mealDay:-1,
  rel:Object.fromEntries(NPCS.map(n=>[n.id,newRel()])),
  moments:ResidentMoments.load(),offlineProgress:false,datePlan:null,breakfastBoxDay:null,
  villageVisits:{},riverside:VillageRiverside.load(),projects:VillageProjects.load(),blackout:VillageBlackout.load(),riverRest:0,weekend:VillageWeekend.load(),travel:CottageTravel.load(),bonds:CottageBonds.load(null,NPCS.map(n=>n.id))
};
const LS=document.body.dataset.mode==='test'?'homelove-save-dev':'homelove-save-v1';
function snapshot(){return JSON.parse(JSON.stringify(state));}
let playerReady=false,replacingSave=false,lastSaveIssue='';
function reportSaveFailure(){
  const issue=SaveManager.status(SaveManager.getStorage(),LS);
  const message=issue==='conflict'?'saveConflict':issue==='newer'?'saveNewer':'weekSaveFailed';
  if(lastSaveIssue!==message){lastSaveIssue=message;notify(tr(message));}
}
const validSave=s=>Number.isFinite(s.day)&&Number.isFinite(s.time)&&!!s.o&&!!s.rel&&!!s.inv;
function save(touch=false){
  if(replacingSave)return false;
  if(playerReady)state.position={x:P.x,y:P.y,dir:P.dir};
  const ok=SaveManager.save(SaveManager.getStorage(),LS,{...state,savedAt:Date.now()},validSave,{touch:touch===true});
  if(ok)lastSaveIssue='';
  else reportSaveFailure();
  return ok;
}
// v1 saves have no trust/jealousy block; CottageBonds.load fills it in when the save is applied.
function migrateSave(s,from){return s&&typeof s==='object'?s:null;}
let savedAtLoad=0;
function lifeOf(n){return state.life[n.id] ||= {cards:{}};}
function queueFishingInvitation(n,giftDay=state.day){
  const life=lifeOf(n);
  life.fishingInvitation ||= {dueDay:giftDay+FISHING_INVITE.delay};
}
function applySave(s){
  if(!s||typeof s!=='object')return;
  state.npcMemory=s.npcMemory;
  state.life=s.life&&typeof s.life==='object'?s.life:{};
  state.position=s.position;
  if(s.o&&typeof s.o==='object')Object.assign(state.o,s.o);
  ['day','time','flowersTotal','lastRead','lastPet','summon','mealDay'].forEach(k=>{if(typeof s[k]==='number')state[k]=s[k];});
  state.villageVisits=VillageMap.loadVisits(s.villageVisits,state.day);
  state.travel=CottageTravel.load(s.travel,state.day);
  state.weekend=VillageWeekend.load(s.weekend,state.day);
  state.riverside=VillageRiverside.load(s.riverside,state.day);
  state.projects=VillageProjects.load(s.projects,state.day);
  state.blackout=VillageBlackout.load(s.blackout,state.day);
  state.riverRest=s.riverRest===state.day?state.day:0;
  state.album=MemoryAlbum.load(s.album,ALBUM_RESIDENTS,state.day);
  state.events=CottageEvents.load(s.events,state.day);
  state.snowFishing=SnowFishing.load(s.snowFishing,state.day);
  state.xiaoman=XiaomanStory.load(s.xiaoman,state.day);
  state.stories=ResidentStories.load(s.stories,state.day);
  state.moments=ResidentMoments.load(s.moments,state.day);
  state.offlineProgress=s.offlineProgress===true;
  state.bonds=CottageBonds.load(s.bonds,NPCS.map(n=>n.id),state.day);
  savedAtLoad=Number.isFinite(s.savedAt)?s.savedAt:0;
  ['lamp','seen','changedToday','goldFound'].forEach(k=>{if(typeof s[k]==='boolean')state[k]=s[k];});
  state.firstGreetingDismissed=s.firstGreetingDismissed===true;
  if(Array.isArray(s.pets))state.pets=s.pets.filter(p=>p&&['cat','dog','bird','rabbit'].includes(p.kind)&&typeof p.name==='string').slice(0,3).map(p=>({kind:p.kind,ci:p.ci|0,name:p.name,bond:+p.bond||0,mode:p.mode==='stay'?'stay':'follow',done:(p.done&&typeof p.done==='object')?p.done:{},hx:p.hx,hy:p.hy,x:0,y:0,dir:1,anim:0}));
  if(s.need)['energy','hunger','mood'].forEach(k=>{if(typeof s.need[k]==='number')state.need[k]=clampN(s.need[k]);});
  if(s.inv)Object.keys(state.inv).forEach(k=>{if(typeof s.inv[k]==='number')state.inv[k]=Math.max(0,s.inv[k]);});
  if(Array.isArray(s.picked))state.picked=s.picked.filter(n=>typeof n==='number');
  state.garden=CottageActivities.loadGarden(s.garden,s.plots);
  state.tunnels=CottageActivities.loadTunnels(s.tunnels);
  state.fishLog=CottageActivities.loadFishLog(s.fishLog);
  state.neighborRequest=CottageActivities.loadRequest(s.neighborRequest);
  const boxDay=s.breakfastBoxDay;
  state.breakfastBoxDay=boxDay===state.day+1||(boxDay===state.day&&state.time+BREAKFAST_BOX.eatMinutes<=BREAKFAST_BOX.outdoorUntil)
    ? boxDay:null;
  const plan=s.datePlan;
  state.datePlan=plan&&ALBUM_RESIDENTS.includes(plan.resident)&&Object.hasOwn(DATE_MEETINGS,plan.place)&&
    Number.isInteger(plan.day)&&plan.day>=state.day&&plan.day<=state.day+1
    ? {resident:plan.resident,place:plan.place,day:plan.day}:null;
  for(const pool of Object.values(CAPSULE_POOLS)){
    const saved=s[pool.owned];
    state[pool.owned]=Array.isArray(saved)?pool.items.filter(item=>saved.includes(item.id)).map(item=>item.id):[];
  }
  if(s.meal==='breakfast'||s.meal==='dinner')state.meal=s.meal;if(s.chores&&typeof s.chores==='object')state.chores=s.chores;
  if(Array.isArray(s.looks))state.looks=s.looks.filter(l=>l&&typeof l==='object').slice(0,6);
  if(s.rel)NPCS.forEach(n=>{const src=s.rel[n.id];if(src&&typeof src==='object'){const r=state.rel[n.id];Object.assign(r,src);if(!r.done||typeof r.done!=='object')r.done={};if(!r.notes||typeof r.notes!=='object')r.notes={};}});
  const fisher=NPCS.find(n=>n.id===FISHING_INVITE.resident);
  const priorGift=NPCMemory.recall(state,fisher.id).findLast(entry=>
    entry.type==='gift'&&entry.interpretation?.object===FISHING_INVITE.gift);
  if(Number.isFinite(priorGift?.time))queueFishingInvitation(fisher,Math.floor(priorGift.time/1440)+1);
}
applySave(SaveManager.load(SaveManager.getStorage(),LS,validSave,migrateSave));
state.life ||= {};
const hot=window.claude&&window.claude.hot;
if(hot&&hot.data&&hot.data.o)applySave(hot.data);
if(hot&&hot.snapshot){try{hot.snapshot(snapshot);}catch(e){}}
const capsulePoolFor=it=>Object.values(CAPSULE_POOLS).find(pool=>pool.items.some(item=>item.id===it.id));
const unlocked=it=>{
  const pool=capsulePoolFor(it);
  return pool?state[pool.owned].includes(it.id):!it.lock||state.flowersTotal>=it.lock;
};
const rel=n=>state.rel[n.id];
const hearts=r=>Math.floor(r.pts/10);
const absMin=()=>state.day*1440+state.time;
const anyCouple=()=>NPCS.some(n=>rel(n).couple);
const bagCount=()=>Object.values(state.inv).reduce((a,b)=>a+b,0);
