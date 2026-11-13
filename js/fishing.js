"use strict";

/* ---------------- fishing ---------------- */
const FISH={on:false,phase:'',t:0,tx:0,ty:0,bait:false,night:false,spot:'reeds',window:0,companion:null,snow:null};
const actKey=()=>isTouch?'A':'E';
const pondSpot=tx=>tx<22?'reeds':'openWater';
function fishingInvitationReady(n){
  const invitation=state.life[n.id]?.fishingInvitation;
  return !!invitation&&!invitation.catch&&state.day>=invitation.dueDay&&
    state.time>=FISHING_INVITE.opens&&state.time<FISHING_INVITE.closes;
}
function seekFishingInvitation(n){
  const px=Math.floor(P.x/16),py=Math.floor((P.y-2)/16);
  if(!npcPassable(px,py,rel(n).livesIn||summoned(n)))return false;
  const now=absMin();
  if(now>=n.invitationPathAt&&now-n.invitationPathAt<3)return false;
  n.invitationPathAt=now;
  npcGo(n,px,py);
  if(n.path&&n.path.length<=3&&Math.hypot(n.x-P.x,n.y-P.y)<43){
    offerFishingInvitation(n);
    return true;
  }
  // Leave one tile between the two characters as the resident walks up.
  if(n.path?.length>1)n.path.pop();
  return false;
}
function offerFishingInvitation(n){
  n.path=null;n.idle=12;n.seekingPlayer=false;n.moving=false;
  rel(n).done.visit=true;
  D.npc=n;
  talk(nm(n),[tr('sharedFishingInvite')],[
    {label:tr('sharedFishingAccept'),disabled:state.need.energy<5,fn:()=>goFishingTogether(n)},
    {label:tr('sharedFishingLater'),back:true,fn:()=>deferFishingInvitation(n)}
  ]);
}
function deferFishingInvitation(n){
  lifeOf(n).fishingInvitation.dueDay=state.day+1;
  save();
  say(nm(n),tr('sharedFishingDeferred'));
}
function goFishingTogether(n){
  D.npc=n;
  busyFade(()=>{
    Object.assign(P,{x:23*16+8,y:7*16+12,dir:'up'});
    Object.assign(n,{x:22*16+8,y:7*16+12,dir:'up',state:'here',path:null,
      leaving:false,working:null,moving:false,idle:30});
    snapPets();save();
  },()=>startFish(23,6,false,n));
}
function fishMenu(tx,ty){
  if(state.need.energy<5){say(tr('pond'),tr('tooTired'));return;}
  const winter=CottageActivities.seasonOf(state.day)==='winter';
  if(winter&&!isIceHole(tx,ty)){say(tr('pond'),tr('iceBlocked'));return;}
  const spot=winter?'ice':pondSpot(tx);
  const lines=winter?[tr('iceHint')]:[tr(spot==='reeds'?'reedsHint':'openWaterHint'),tr(darkness()>.5?'pondNightHint':'pondDayHint')];
  talk(tr(spot),lines,[
    {label:tr('castPlain'),fn:()=>startFish(tx,ty,false)},
    {label:tr('castBait',{count:state.inv.berry}),disabled:state.inv.berry<1,fn:()=>startFish(tx,ty,true)},
    {label:tr('walkAway'),fn:null}
  ]);
}
function startFish(tx,ty,bait,companion=null){
  if(FISH.on||state.need.energy<5||(bait&&state.inv.berry<1))return;
  const winter=CottageActivities.seasonOf(state.day)==='winter';
  if(winter&&!isIceHole(tx,ty))return;
  const night=darkness()>.5,spot=winter?'ice':pondSpot(tx);
  if(bait){state.inv.berry--;updateHud();save();}
  sfx('cast');
  Object.assign(FISH,{on:true,phase:'wait',t:1.4+Math.random()*(bait?1.2:2.6),tx,ty,bait,night,spot,companion});
  keys.clear();touchKeys.clear();
  say(companion?nm(companion):tr('pond'),tr(companion?'sharedFishingCast':'fishCast',{k:actKey()}),60000);
}
function reel(){
  if(!FISH.on)return;
  if(FISH.snow){snowBite();return;}
  if(FISH.phase==='bite'){
    const companion=FISH.companion;
    const rolled=CottageActivities.rollCatch(FISH.spot,FISH.night,FISH.bait,Math.random());
    const k=companion&&!Object.hasOwn(CottageActivities.fish,rolled)?'fish':rolled;
    const result=CottageActivities.logFish(state.fishLog,k,state.day,Math.random());
    const i=`${ITEM_ICONS[k]} ${itemLabel(k)}`;
    if(companion){
      const caught={day:state.day,time:Math.floor(state.time),kind:k,size:result.size};
      lifeOf(companion).fishingInvitation.catch=caught;
      rememberPlayer(companion,'sharedFishing','caught',1,95,caught);
      state.need.mood=clampN(state.need.mood+8);
    }
    const bottle=!companion&&state.events&&CottageEvents.discover(state.events,'bottle',state.day,Math.random());
    sfx('catch');state.inv[k]++;endFish(15,3);heart(P.x,P.y-26);
    if(companion){
      D.npc=companion;
      talk(nm(companion),[tr('sharedFishingCaught',{i,size:result.size})]);
    }else if(bottle){
      talk(tr('pond'),[tr('worldBottleFound',{item:i})]);
    }else{
      say(tr('pond'),result?tr(result.record?'fishRecord':'fishSized',{i,size:result.size}):tr('fishGot',{i})+(k==='star'?' '+tr('fishRare'):''));
    }
  }else missFish('fishEarly');
}
function endFish(min,e){
  FISH.on=false;FISH.companion=null;FISH.snow=null;
  advanceTime(min);state.need.energy=clampN(state.need.energy-e);
  updateHud();save();
}
function missFish(reason){
  const {companion,tx,ty}=FISH;
  sfx('miss');endFish(10,2);
  if(!companion){say(tr('pond'),tr(reason));return;}
  D.npc=companion;
  talk(nm(companion),[tr(reason)],[
    {label:tr('sharedFishingRetry'),disabled:state.need.energy<5||state.time>=FISHING_INVITE.closes,
      fn:()=>startFish(tx,ty,false,companion)},
    {label:tr('sharedFishingLater'),back:true,fn:()=>deferFishingInvitation(companion)}
  ]);
}
function cancelFishing(){
  if(FISH.snow){
    endFish(5,1);say(nm(snowResident()),tr('snowStop'));return;
  }
  const companion=FISH.companion;
  FISH.on=false;FISH.companion=null;
  if(companion)deferFishingInvitation(companion);
  else say(tr('pond'),tr('fishStop'));
}
function updFish(dt){
  if(!FISH.on)return;
  if(FISH.snow){
    updateSnowFishing(dt);
    if(!FISH.on||FISH.phase==='snowWait')return;
  }
  FISH.t-=dt;
  if(FISH.phase==='wait'&&FISH.t<=0){
    sfx('bite');FISH.phase='bite';FISH.window=(isTouch?2.2:1.8)+(FISH.bait||FISH.companion ? .5 : 0);FISH.t=FISH.window;
    say(tr('pond'),tr('fishBite',{k:actKey()}),60000);
  }
  else if(FISH.phase==='bite'&&FISH.t<=0){if(FISH.snow)snowRecast();else missFish('fishGone');}
}

/* ---------------- first snow fishing ---------------- */
const snowResident=()=>npcs.find(n=>n.id==='xy');
const snowHost=()=>npcs.find(n=>n.id==='gy');
let snowDining=false;

function checkSnowKnock(){
  const event=state.snowFishing;
  if(FISH.on||D.modal||busy||event.invited||event.checked===state.day||
      state.time<SnowFishing.opens||state.time>=SnowFishing.closes)return;
  const tile=at(Math.floor(P.x/16),Math.floor((P.y-2)/16));
  if(tile!==FLOOR&&tile!==DOOR)return;
  if(CottageActivities.seasonOf(state.day)!=='winter')return;
  const invited=SnowFishing.morning(event,state.day,'winter',state.time,Math.random());
  save();
  if(invited){
    const n=snowResident();
    placeSnowResident(n,6,10,'up');
    sfx('ding');openSnowFishing(true);
  }
}
function placeSnowResident(n,tx,ty,dir){
  Object.assign(n,{x:tx*16+8,y:ty*16+12,dir,state:'here',path:null,leaving:false,working:null,moving:false,idle:35});
}
function snowRaceSummary(last){
  return tr('snowRaceTimes',{player:last.player===null?tr('snowNoCatch'):tr('snowSeconds',{seconds:last.player.toFixed(1)}),
    rival:tr('snowSeconds',{seconds:last.rival.toFixed(1)})});
}
function snowRecords(){
  const {stats}=state.snowFishing;
  if(!stats.last)return;
  D.npc=snowResident();
  talk(nm(D.npc),[tr('snowRace_'+stats.last.outcome),snowRaceSummary(stats.last),
    tr('snowRaceTotals',{won:stats.won,lost:stats.lost,tie:stats.tie}),
    tr('snowRaceBest',{player:stats.best===null?tr('snowNoCatch'):tr('snowSeconds',{seconds:stats.best.toFixed(1)}),
      rival:tr('snowSeconds',{seconds:stats.rivalBest.toFixed(1)})})]);
}
function openSnowFishing(knock=false){
  const event=state.snowFishing;
  if(!event.invited||CottageActivities.seasonOf(state.day)!=='winter')return;
  const n=snowResident();
  const opts=[{label:tr(event.stats.last?'snowRematch':'snowRace'),disabled:state.need.energy<5,fn:()=>beginSnowFishing('race')}];
  if(!event.ready&&!event.dinner)opts.push({label:tr('snowCoop'),disabled:state.need.energy<5,fn:()=>beginSnowFishing('coop')});
  if(event.stats.last)opts.push({label:tr('snowRecords'),fn:snowRecords});
  opts.push({label:tr('snowLater'),back:true,fn:null});
  D.npc=n;
  talk(nm(n),[tr(knock?'snowKnock':'snowReturn')],opts);
}
function beginSnowFishing(mode){
  const event=state.snowFishing;
  if(state.need.energy<5||CottageActivities.seasonOf(state.day)!=='winter'||
      (mode==='coop'&&(event.ready||event.dinner)))return;
  const n=snowResident();
  rel(n).met=true;
  busyFade(()=>{
    Object.assign(P,{x:23*16+8,y:7*16+12,dir:'up'});
    placeSnowResident(n,19,7,'up');snapPets();save();
  },()=>{
    startFish(23,6,false);
    if(!FISH.on)return;
    FISH.snow=SnowFishing.start(mode,Math.random());
    FISH.t=1.6+Math.random()*1.1;
    say(nm(n),tr(mode==='race'?'snowRaceStart':'snowCoopStart',{k:actKey()}),60000);
  });
}
function snowBite(){
  const round=FISH.snow;
  if(round.player!==null)return;
  if(FISH.phase!=='bite'){snowRecast();return;}
  round.player=round.elapsed;
  round.kind=CottageActivities.rollCatch('ice',false,false,Math.random());
  if(!Object.hasOwn(CottageActivities.fish,round.kind))round.kind='fish';
  FISH.phase='snowWait';
  sfx('catch');
  say(nm(snowResident()),tr('snowYourCatch'),60000);
  updateSnowFishing(0);
}
function snowRecast(){
  FISH.phase='wait';FISH.t=1.3+Math.random()*.8;
  sfx('cast');say(nm(snowResident()),tr('snowRecast',{k:actKey()}),60000);
}
function updateSnowFishing(dt){
  const round=FISH.snow,previous=round.elapsed;
  round.elapsed+=dt;
  if(previous<round.rival&&round.elapsed>=round.rival&&round.player===null)
    notify(tr(round.mode==='race'?'snowRivalCatch':'snowRivalIngredient'));
  if(round.mode==='race'){
    if(!SnowFishing.raceReady(round))return;
    if(round.kind){
      state.inv[round.kind]++;
      CottageActivities.logFish(state.fishLog,round.kind,state.day,Math.random());
    }
    const last=SnowFishing.record(state.snowFishing,state.day,round);
    endFish(15,3);
    D.npc=snowResident();
    talk(nm(D.npc),[tr('snowRace_'+last.outcome),snowRaceSummary(last)],[
      {label:tr('snowRematch'),disabled:state.need.energy<5,fn:()=>beginSnowFishing('race')},
      {label:tr('snowRecords'),fn:snowRecords},
      {label:tr('snowLater'),back:true,fn:null}
    ]);
    return;
  }
  if(round.player===null||round.elapsed<round.rival)return;
  const {kind}=round;
  CottageActivities.logFish(state.fishLog,kind,state.day,Math.random());
  state.snowFishing.ready=state.day;
  endFish(15,3);
  D.npc=snowResident();
  talk(nm(D.npc),[tr('snowDinnerReady')],[
    {label:tr('snowGoDinner'),fn:eatSnowDinner},
    {label:tr('snowDinnerLater'),back:true,fn:null}
  ]);
}
function eatSnowDinner(){
  const event=state.snowFishing;
  if(!event.ready||event.dinner)return;
  const n=snowResident(),host=snowHost();
  snowDining=true;
  busyFade(()=>{
    state.time=Math.max(state.time,SnowFishing.supperTime);
    Object.assign(P,{x:7*16+8,y:7*16+12,dir:'up'});
    placeSnowResident(n,5,6,'right');placeSnowResident(host,8,6,'left');
    snapPets();sfx('eat');
    event.dinner=state.day;
    state.need.hunger=clampN(state.need.hunger+50);
    state.need.mood=clampN(state.need.mood+12);
    for(const person of [n,host]){
      rel(person).met=true;
      rememberPlayer(person,'snowDinner','completed',.8,82,'fish');
    }
    save();updateHud();
  },()=>{
    D.npc=n;
    talk(nm(n),[tr('snowDinnerMeal'),tr('snowDinnerConfession'),tr('snowDinnerToast')],null,()=>{snowDining=false;});
  });
}
