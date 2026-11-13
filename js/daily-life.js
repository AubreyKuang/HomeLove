"use strict";

/* ---------------- life sim ---------------- */
let mapOpen=false;
let busy=false,dressOpen=false,diaryOpen=false,albumOpen=false,startOpen=true,target=null;
const fadeEl=$('#fade');
function busyFade(mid,end){busy=true;fadeEl.style.opacity='1';setTimeout(()=>{mid&&mid();fadeEl.style.opacity='0';setTimeout(()=>{busy=false;end&&end();},450);},650);}
function decay(m,moving){const N=state.need;N.energy=clampN(N.energy-m*(0.07+(moving?0.03:0)));N.hunger=clampN(N.hunger-m*0.09);let md=-0.03;if(N.hunger<20||N.energy<20)md-=0.1;N.mood=clampN(N.mood+m*md);}
function advanceTime(m){state.time+=m;decay(m,false);}
const partnerHome=()=>npcs.find(n=>rel(n).livesIn);
function newDay(wake){
  for(const n of npcs)rememberMissedOccasions(n);
  state.day++;state.time=wake;flowers.forEach(f=>f.picked=false);state.picked=[];CottageActivities.grow(state.garden,state.day,state.tunnels);state.changedToday=false;
  deliverAlbumPostcard();
  NPCS.forEach(n=>{rel(n).done={};});
  state.pets.forEach(p=>{p.done={};});
  npcs.forEach(n=>{n.state='away';n.path=null;n.leaving=false;n.seekingPlayer=false;n.x=n.y=-100;});
  bondsNewDay();
}
function wakeAtBed(){P.x=8*16+8;P.y=5*16+12;P.dir='right';snapPets();}
function bedMenu(){
  const h=state.time/60,late=h>=20||h<5,ph=partnerHome();
  talk(objName('bed'),[late?(ph?tr('bedLatePartner',{n:nm(ph)}):tr('bedLate')):tr('bedEarly')],[].concat(ph&&late?[{label:tr('bedTogether',{n:nm(ph)}),fn:()=>nightTogether(ph)}]:[],[
    {label:tr('sleepNight'),fn:()=>sleepNight()},
    {label:tr('nap'),disabled:late,fn:nap},
    {label:tr('never'),fn:null}]));
}
function sleepNight(withN){
  const gifts=[];sfx('sleep');
  busyFade(()=>{const N=state.need;newDay(7*60);N.energy=100;N.hunger=clampN(N.hunger-25);N.mood=clampN(N.mood+(partnerHome()?12:5)+(withN?20:0));wakeAtBed();
      if(withN){withN.state='here';withN.x=9*16+8;withN.y=6*16+12;withN.dir='up';withN.path=null;withN.idle=20;}
      state.pets.forEach(p=>{if(p.bond>=60&&Math.random()<.5){const k=PET_GIFT[p.kind];state.inv[k]++;gifts.push(tr('petGift',{p:p.name,i:ITEM_ICONS[k]+itemLabel(k)}));}});save();updateHud();},
    ()=>{sfx('morning');const ph=partnerHome();if(withN){D.npc=withN;talk(nm(withN),[tr('morning',{d:state.day}),nt(withN).morningAfter].concat(gifts),null,()=>addPts(withN,5));return;}talk(tr('morningWho'),[tr('morning',{d:state.day})+' '+(ph?tr('morningPartner',{n:nm(ph)}):tr('morningAlone'))].concat(gifts));});
}
function nap(){busyFade(()=>{advanceTime(120);state.need.energy=clampN(state.need.energy+30);save();},()=>say(objName('bed'),tr('napDone')));}
function passOut(){
  sfx('sleep');
  busyFade(()=>{const N=state.need;newDay(9*60);N.energy=55;N.mood=clampN(N.mood-15);N.hunger=clampN(N.hunger-20);wakeAtBed();save();updateHud();},
    ()=>talk(tr('home'),[tr('passOut1'),tr('passOut2',{d:state.day})]));
}
function tableMenu(){
  const ph=partnerHome(),meal=ph&&state.meal&&state.mealDay===state.day;
  const snow=state.snowFishing;
  const dinner=snow.ready&&!snow.dinner;
  const story=dinner?[{label:tr('snowGoDinner'),fn:eatSnowDinner}]:[];
  talk(objName('table'),[tr('tableQ')],story.concat(meal?[{label:tr('mealOpt',{n:nm(ph),m:tr(state.meal)}),fn:eatMeal}]:[],[
    {label:tr('eatOpt'),fn:eat},
    {label:tr('bakeOpt',{x:state.inv.berry}),disabled:state.inv.berry<2,fn:bake},
    {label:tr('walkAway'),fn:null}]));
}
function eat(){
  const N=state.need;if(N.hunger>92){say(objName('table'),tr('notHungry'));return;}
  const ph=partnerHome();
  sfx('eat');busyFade(()=>{advanceTime(30);N.hunger=clampN(N.hunger+45);N.mood=clampN(N.mood+(ph?8:3));updateHud();save();},
    ()=>say(objName('table'),ph?tr('ateWith',{n:nm(ph)}):tr('ate')));
}
function bake(){sfx('ding');busyFade(()=>{state.inv.berry-=2;state.inv.cookie++;advanceTime(60);state.need.mood=clampN(state.need.mood+4);updateHud();save();},()=>say(objName('table'),tr('baked')));}
function shelfMenu(){
  const N=state.need;
  talk(objName('shelf'),[tr('shelfQ')],[
    {label:tr('readOpt'),fn:readBook},
    {label:N.mood>=40?tr('letterOpt'):tr('letterOptNo'),disabled:N.mood<40,fn:writeLetter},
    {label:tr('frameChoose'),fn:()=>openAlbum('events')},
    ...(state.album.framed?[{label:tr('frameRemove'),fn:()=>setKeepsakeFrame(null)}]:[]),
    {label:tr('walkAway'),fn:null}]);
}
function readBook(){
  if(absMin()-state.lastRead<120){say(objName('shelf'),tr('readTired'));return;}
  sfx('page');state.lastRead=absMin();advanceTime(20);state.need.mood=clampN(state.need.mood+5);save();say(objName('shelf'),pick(Lp.books));
}
function writeLetter(){sfx('rustle');busyFade(()=>{advanceTime(40);state.inv.letter++;state.need.energy=clampN(state.need.energy-3);updateHud();save();},()=>say(tr('desk'),tr('letterDone')));}
const CAPSULE_COST={shell:2,flower:3};
const firstCapsule=()=>Object.values(CAPSULE_POOLS).every(pool=>!state[pool.owned].length);
function capsuleMenu(){
  D.npc=null;
  const opts=Object.entries(CAPSULE_POOLS).map(([kind,pool])=>({
    label:tr('capsulePool_'+kind,{owned:state[pool.owned].length,total:pool.items.length}),
    fn:()=>capsulePoolMenu(pool)
  }));
  talk(objName('capsule'),[tr('capsuleChoosePool')],opts.concat({label:tr('walkAway'),fn:null}));
}
function capsulePoolMenu(pool){
  const owned=state[pool.owned].length,total=pool.items.length;
  const opts=owned===total
    ?[{label:tr('capsuleView'),fn:()=>openCapsuleWardrobe(pool)}]
    :firstCapsule()
    ?[{label:tr('capsuleFree'),fn:()=>drawCapsule(pool)}]
    :Object.entries(CAPSULE_COST).map(([item,cost])=>({
      label:tr('capsuleTrade',{item:itemLabel(item),cost,count:state.inv[item]}),
      disabled:state.inv[item]<cost,fn:()=>drawCapsule(pool,item)
    }));
  talk(objName('capsule'),[tr(owned===total?'capsuleComplete':'capsulePoolIntro',{owned,total})],
    opts.concat({label:tr('optBack'),back:true,fn:capsuleMenu}));
}
function drawCapsule(pool,payment){
  const owned=state[pool.owned],remaining=pool.items.filter(item=>!unlocked(item));
  if(!remaining.length)return;
  const free=firstCapsule(),cost=free?0:CAPSULE_COST[payment];
  if(!free){
    if(!Object.hasOwn(CAPSULE_COST,payment)||state.inv[payment]<CAPSULE_COST[payment])return;
    state.inv[payment]-=cost;
  }
  const item=pick(remaining);
  owned.push(item.id);
  if(!save()){
    owned.pop();
    if(cost)state.inv[payment]+=cost;
    talk(objName('capsule'),[lifeText('存档失败，扭蛋没有扣材料。请检查浏览器的存储设置。','The draw could not be saved. Your items were returned. Check browser storage.','保存できなかったため、材料を戻しました。ブラウザのストレージ設定を確認してください。')]);
    return;
  }
  updateHud();sfx('levelup');
  const preview=el('div','capsule-reveal'),sprite=mk(20,26);
  preview.setAttribute('aria-hidden','true');
  blitChar(sprite.getContext('2d'),capsuleOutfit(pool,item),'down',0,0,0);
  preview.append(sprite);
  const options=[
    {label:tr(pool.slot==='hair'?'capsuleTryHair':'capsuleTry'),fn:()=>tryCapsuleItem(pool,item)},
    {label:tr('capsuleView'),back:true,fn:()=>openCapsuleWardrobe(pool)}
  ];
  if(item.hidesBottom||pool.slot==='bottom'){
    const complete=owned.length===pool.items.length;
    options.push({label:tr(complete?'capsuleNoMore':'capsuleAgain'),disabled:complete,fn:()=>capsulePoolMenu(pool)});
  }
  talk(objName('capsule'),[tr('capsuleWon',{dress:itemName(item.id)})],options,null,preview);
}
function capsuleOutfit(pool,item){
  const outfit={...state.o,[pool.slot]:item.id,[pool.colorKey]:item.color};
  if(pool.slot==='bottom'&&byId(TOPS,outfit.top).hidesBottom){outfit.top='tee';outfit.topColor=0;}
  return outfit;
}
function tryCapsuleItem(pool,item){
  const outfit=capsuleOutfit(pool,item);
  const outfitChanged=Object.keys(outfit).some(k=>state.o[k]!==outfit[k]);
  Object.assign(state.o,outfit);
  if(outfitChanged)rewardNewLook();
  save();
  sfx('pop');
  const name=itemName(item.id);
  say(objName('capsule'),lifeText(`已换上「${name}」！`,`Now wearing ${name}!`,`「${name}」に替えたよ！`));
}
function openCapsuleWardrobe(pool){curCat=pool.tab;openDress();}
function deliverAlbumPostcard(){
  const postcard=MemoryAlbum.nextPostcard(state.day,ALBUM_RESIDENTS.filter(id=>state.rel[id].met&&(id!=='xm'||!state.xiaoman?.answer)),state.album);
  if(postcard)state.album.postcards.push(postcard);
}
function unreadAlbumPostcard(){
  const special=state.events&&CottageEvents.postcard(state.events,state.day);
  if(special&&!state.album.seen.includes(special.key))return special;
  const xiaoman=state.xiaoman&&XiaomanStory.postcard(state.xiaoman,state.day);
  if(xiaoman&&!state.album.seen.includes(xiaoman.key))return xiaoman;
  return state.album?.postcards.findLast(card=>!state.album.seen.includes(MemoryAlbum.postcardKey(card)));
}
function checkMail(){
  const vehicles=state.travel?readyVehicles():[];
  if(vehicles.length){
    const opts=vehicles.map(id=>({label:tr('vehicleCollect',{name:tr('vehicle_'+id)}),fn:()=>collectVehicle(id)}));
    opts.push({label:tr('albumOtherMail'),back:true,fn:checkCottageLetters});
    talk(objName('mailbox'),[tr('vehiclePackage')],opts);return;
  }
  checkCottageLetters();
}
function checkCottageLetters(){
  const postcard=unreadAlbumPostcard();
  if(!postcard){checkNeighborMail();return;}
  const n=npcs.find(person=>person.id===postcard.resident);
  talk(objName('mailbox'),[tr('albumMail',{n:nm(n)})],[
    {label:tr('btnAlbum'),fn:()=>openAlbum('postcards')},
    {label:tr('albumOtherMail'),back:true,fn:checkNeighborMail}
  ]);
}
function neighborMailRelations(){
  return state.xiaoman?.answer?{...state.rel,xm:{met:false}}:state.rel;
}
function checkNeighborMail(){
  const current=CottageActivities.openRequest(state.neighborRequest,state.day);
  const request=current??CottageActivities.nextRequest(state.day,state.neighborRequest,neighborMailRelations());
  if(request){
    if(!current){state.neighborRequest=request;save();}
    readNeighborRequest(request);
    return;
  }
  const fans=npcs.filter(n=>hearts(rel(n))>=5&&!rel(n).livesIn&&(n.id!=='xm'||!state.xiaoman?.answer));
  if(fans.length&&Math.random()<.6)say(objName('mailbox'),nt(pick(fans)).mail);else say(objName('mailbox'),pick(Lp.letters));
}
function hasNeighborMail(){
  return CottageActivities.openRequest(state.neighborRequest,state.day)?.status==='offered'||
    !!CottageActivities.nextRequest(state.day,state.neighborRequest,neighborMailRelations());
}
function neighborRequestItems(request){
  const {items}=CottageActivities.requests[request.resident];
  return Object.entries(items).map(([item,count])=>`${ITEM_ICONS[item]} ${itemLabel(item)} ×${count}`);
}
function readNeighborRequest(request){
  const n=npcs.find(n=>n.id===request.resident);
  const {reward}=CottageActivities.requests[request.resident];
  const lines=[tr('requestLetter_'+n.id),tr('requestTerms',{
    items:neighborRequestItems(request).join(tr('requestOr')),
    reward:`${ITEM_ICONS[reward]} ${itemLabel(reward)} ×2`,
    day:tr('day',{d:request.day+2})
  })];
  const options=request.status==='offered'?[
    {label:tr('requestAccept'),fn:()=>{
      request.status='accepted';save();
      say(objName('mailbox'),tr('requestAdded',{name:nm(n)}));
    }},
    {label:tr('requestDecline'),fn:()=>{
      request.status='declined';request.closedDay=state.day;save();
    }}
  ]:[];
  talk(nm(n),lines,options.concat({label:tr('walkAway'),fn:null}));
}
function acceptedNeighborRequest(n){
  const request=CottageActivities.openRequest(state.neighborRequest,state.day);
  return request?.status==='accepted'&&request.resident===n.id?request:null;
}
function offerNeighborDelivery(n,request){
  const {items}=CottageActivities.requests[n.id];
  const options=Object.entries(items).map(([item,count])=>({
    label:tr('requestDeliver',{item:itemLabel(item),count,owned:state.inv[item]}),
    disabled:state.inv[item]<count,fn:()=>deliverNeighborRequest(n,request,item)
  }));
  D.npc=n;
  talk(nm(n),[tr('requestBring')],options.concat({label:tr('optBack'),back:true,fn:()=>npcMenu(n,true)}));
}
function deliverNeighborRequest(n,request,item){
  if(request!==state.neighborRequest)return;
  const reward=CottageActivities.fulfillRequest(request,n.id,state.day,state.inv,item);
  if(!reward)return;
  lifeOf(n).cards.neighborRequest ||= state.day;
  rememberPlayer(n,'neighborRequest','fulfilled',.9,90,item);
  addPts(n,6);updateHud();
  D.npc=n;
  talk(nm(n),[tr('requestThanks_'+n.id),tr('requestReward',{item:`${ITEM_ICONS[reward]} ${itemLabel(reward)}`})],null,()=>milestone(n));
}
function petCat(){
  sfx('cat');
  cat.state='sit';cat.t=3;cat.dir=P.x<cat.x?-1:1;heart(cat.x,cat.y-16);
  if(absMin()-state.lastPet>=60){state.lastPet=absMin();state.need.mood=clampN(state.need.mood+6);notify(tr('petMood'));}
  say(tr('catWho'),pick(Lp.catLines));
}
function pickFlower(f){
  sfx('pickup');f.picked=true;state.picked.push(f.i);state.inv.flower++;state.flowersTotal++;save();updateHud();heart(f.tx*16+8,f.ty*16+2);
  if(CottageBonds.rare(B(),'clover',state.day,Math.random,.03))setTimeout(()=>notify(tr('cloverFound')),1400);
  if(state.flowersTotal===3)say(tr('garden'),tr('flower3'));
  else say(tr('garden'),tr('flowerGot',{x:state.inv.flower})+(state.flowersTotal<3?' '+tr('flowerMore',{x:3-state.flowersTotal}):''));
}
function plotVerb(plot,index){
  if(!CottageActivities.canGrow(CottageActivities.seasonOf(state.day),state.tunnels||[],index)&&!CottageActivities.ripe(plot))return tr('winterPlot');
  if(!plot)return tr('plantCrop');
  if(plot.crop==='mysteryBloom'&&CottageActivities.ripe(plot))return tr('worldSeedLook');
  return tr(CottageActivities.ripe(plot)?'harvestCrop':'tendCrop',{crop:itemLabel(plot.crop)});
}
function tendPlot(i){
  const plot=state.garden[i];
  if(CottageActivities.ripe(plot)){
    if(plot.crop==='mysteryBloom'){bloomMenu(i);return;}
    const crop=CottageActivities.pickCrop(state.garden,i);
    state.inv[crop]++;
    sfx('pickup');save();updateHud();
    say(tr('farm'),tr('cropPicked',{crop:itemLabel(crop),count:state.inv[crop]}));
    return;
  }
  const opts=[];
  const season=CottageActivities.seasonOf(state.day),tunnels=state.tunnels||[];
  const warm=CottageActivities.canGrow(season,tunnels,i);
  const cost=CottageActivities.tunnelCost.shell;
  let line=tr('plantTip');
  if(!warm)line=tr('winterPlotTip');
  else if(!plot){
    for(const [crop,{days,event}] of Object.entries(CottageActivities.crops)){
      if(event)continue;
      opts.push({label:tr('plantOption',{crop:itemLabel(crop),days}),fn:()=>{
        state.garden[i]=CottageActivities.seed(crop);
        sfx('pickup');save();
        say(tr('farm'),tr('cropPlanted',{crop:itemLabel(crop)}));
      }});
    }
    const event=state.events&&seedPlantOption(i);
    if(event)opts.unshift(event);
  }else{
    const days=CottageActivities.crops[plot.crop].days-plot.growth;
    line=tr(plot.watered?'cropWet':'cropDry',{crop:itemLabel(plot.crop),days});
    const dry=state.garden.filter((p,index)=>p&&!p.watered&&!CottageActivities.ripe(p)&&CottageActivities.canGrow(season,tunnels,index));
    if(!plot.watered)opts.push({label:tr('waterPlot'),fn:()=>waterPlots([plot])});
    if(dry.length>1||(plot.watered&&dry.length))opts.push({label:tr('waterGarden',{count:dry.length}),fn:()=>waterPlots(dry)});
    opts.push({label:tr('clearPlot'),fn:()=>talk(tr('farm'),[tr('clearPlotAsk',{crop:itemLabel(plot.crop)})],[
      {label:tr('clearPlot'),fn:()=>{state.garden[i]=null;save();}},
      {label:tr('optBack'),back:true,fn:()=>tendPlot(i)}
    ])});
  }
  if(state.tunnels&&!tunnels.includes(i)){
    if(tunnels.length<CottageActivities.tunnelLimit){
      opts.push({label:tr('winterBuild',{cost}),disabled:state.inv.shell<cost,fn:()=>{
        if(!CottageActivities.installTunnel(tunnels,i,state.inv))return;
        sfx('ding');save();updateHud();tendPlot(i);
      }});
    }else if(!warm)line=tr('winterPlotLimit');
  }
  if(tunnels.includes(i))line=tr('winterCovered')+' '+line;
  talk(tr('farm'),[line],opts.concat({label:tr('walkAway'),fn:null}));
}
function waterPlots(plots){
  for(const plot of plots)plot.watered=true;
  sfx('ding');advanceTime(2*plots.length);save();updateHud();
  say(tr('farm'),tr('wateredPlots',{count:plots.length}));
}
function mirrorLine(){
  const o=state.o,t=byId(TOPS,o.top);
  const lines=[t.hidesBottom?tr('mirrorDress',{t:itemName(o.top)}):tr('mirrorCombo',{t:itemName(o.top),b:itemName(o.bottom)}),tr('mirrorShoes',{s:itemName(o.shoes)}),tr('mirrorHair',{h:itemName(o.hair)}),tr('mirrorSmile')];
  if(o.hat!=='none')lines.push(tr('mirrorHat',{x:itemName(o.hat)}));
  return pick(lines);
}
