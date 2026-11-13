"use strict";

/* ---------------- interaction ---------------- */
/* ---------------- village activities ---------------- */
/* ---------------- village delivery and transport ---------------- */
function readyVehicles(){
  return state.travel?CottageTravel.ready(state.travel,state.day):[];
}
function computerMenu(){
  talk(objName('computer'),[tr('computerIntro')],[
    {label:tr('travelShop'),fn:openTravelShop},
    {label:tr('walkAway'),back:true,fn:null}
  ]);
}
function openTravelShop(){
  if(startOpen||mapOpen||busy||dressOpen||diaryOpen||albumOpen||D.modal||FISH.on)return;
  D.npc=null;walkRoute=[];
  const opts=Object.entries(CottageTravel.catalog).map(([id,{cost,speed}])=>{
    const name=tr('vehicle_'+id),owned=state.travel.owned.includes(id),due=state.travel.orders[id];
    if(owned&&id==='umbrella')return {label:tr(state.travel.umbrellaOpen?'umbrellaClose':'umbrellaOpen'),fn:toggleUmbrella};
    if(owned)return {label:tr(state.travel.selected===id?'vehicleSelected':'vehicleEquip',{name}),
      disabled:state.travel.selected===id,fn:()=>equipVehicle(id)};
    if(due)return {label:tr(due<=state.day?'vehicleAtMailbox':'vehicleInTransit',{name,day:due}),disabled:true,fn:null};
    const label=id==='umbrella'?tr('umbrellaOrder',{cost}):tr('vehicleOrder',{name,cost,speed:Math.round((speed-1)*100)});
    return {label,disabled:state.inv.shell<cost,fn:()=>orderVehicle(id)};
  });
  if(state.travel.selected)opts.push({label:tr('vehicleWalk'),fn:()=>equipVehicle(null)});
  opts.push({label:tr('walkAway'),back:true,fn:null});
  talk(tr('travelShop'),[tr('travelShopIntro',{shells:state.inv.shell})],opts);
}
function orderVehicle(id){
  const first=state.travel.firstOrder;
  if(!CottageTravel.order(state.travel,state.inv,id,state.day))return;
  if(!save()){
    state.inv.shell+=CottageTravel.catalog[id].cost;
    delete state.travel.orders[id];state.travel.firstOrder=first;
    talk(tr('travelShop'),[tr('vehicleSaveFailed')]);return;
  }
  updateHud();sfx('ding');
  talk(tr('travelShop'),[tr('vehicleOrdered',{name:tr('vehicle_'+id)})],[
    {label:tr('travelShop'),fn:openTravelShop},{label:tr('walkAway'),back:true,fn:null}
  ]);
}
function equipVehicle(id){
  const previous=state.travel.selected;
  if(id!==null&&(!CottageTravel.isVehicle(id)||!state.travel.owned.includes(id)))return;
  state.travel.selected=id;
  if(!save()){state.travel.selected=previous;talk(tr('travelShop'),[tr('vehicleSaveFailed')]);return;}
  updateHud();say(tr('travelShop'),id?tr('vehicleEquipped',{name:tr('vehicle_'+id)}):tr('vehicleWalk'));
}
function collectVehicle(id){
  const due=state.travel.orders[id],previous=state.travel.selected;
  if(!CottageTravel.receive(state.travel,id,state.day))return;
  if(CottageTravel.isVehicle(id))state.travel.selected=id;
  if(!save()){
    state.travel.owned.pop();state.travel.orders[id]=due;state.travel.selected=previous;
    talk(objName('mailbox'),[tr('vehicleSaveFailed')]);return;
  }
  updateHud();sfx('pickup');
  updateUmbrellaButton();
  talk(objName('mailbox'),[id==='umbrella'?tr('umbrellaReceived'):tr('vehicleReceived',{name:tr('vehicle_'+id)})],[
    {label:tr('albumOtherMail'),fn:checkMail},{label:tr('walkAway'),back:true,fn:null}
  ]);
}
function activeRide(){
  if(!state.travel.selected||FISH.on||busy||blackoutActive())return null;
  const t=at(Math.floor(P.x/16),Math.floor((P.y-2)/16));
  const surface=t===FLOOR||t===DOOR?'inside':[PATH,STONE,BRIDGE].includes(t)?'road':'outdoor';
  return CottageTravel.riding(state.travel,surface);
}
function activeUmbrella(weather=VillageRiverside.weather(state.day),ride=activeRide()){
  const tile=at(Math.floor(P.x/16),Math.floor((P.y-2)/16));
  const outside=tile!==FLOOR&&tile!==DOOR;
  return CottageTravel.sheltered(state.travel,weather,outside,!ride&&!busy&&!FISH.on&&!blackoutActive());
}
function toggleUmbrella(){
  if(startOpen||mapOpen||busy||dressOpen||diaryOpen||albumOpen||D.modal||FISH.on||
    !state.travel.owned.includes('umbrella'))return;
  const previous=state.travel.umbrellaOpen;
  state.travel.umbrellaOpen=!previous;
  if(!save()){
    state.travel.umbrellaOpen=previous;
    talk(tr('travelShop'),[tr('vehicleSaveFailed')]);return;
  }
  updateUmbrellaButton();
  say(tr('vehicle_umbrella'),tr(previous?'umbrellaClosed':activeUmbrella()?'umbrellaOpened':'umbrellaReady'));
}
function updateUmbrellaButton(){
  const btn=$('#btnUmbrella'),enabled=state.travel.umbrellaOpen;
  btn.classList.toggle('hidden',!state.travel.owned.includes('umbrella'));
  btn.textContent=tr(enabled?'umbrellaClose':'umbrellaOpen');
  btn.setAttribute('aria-pressed',String(enabled));
}

function weekendSchedule(){
  const day=VillageWeekend.saleDay(state.day)+(VillageWeekend.weekday(state.day)>6||
    (VillageWeekend.weekday(state.day)===6&&state.time>=1080)?7:0);
  const [special,extra]=VillageWeekend.demand(day);
  return [tr('weekDemand',{day:tr('day',{d:day}),a:itemLabel(special),b:itemLabel(extra)}),
    ...Object.entries(VillageWeekend.activities).map(([id,event])=>
      tr('weekSchedule',{day:tr('weekDay'+event.day),time:fmt(event.start)+'–'+fmt(event.end),event:tr('worldTitle_weekend_'+id)}))];
}
function openWeekendBoard(){
  talk(tr('village_weekendBoard'),weekendSchedule(),[
    {label:tr('weekStall'),fn:()=>openWeekendStall([])},
    ...soundProjectOption('chime'),
    {label:tr('walkAway'),back:true,fn:null}
  ]);
}
function openWeekendStall(items=[]){
  const title=tr('weekStall');
  if(!VillageWeekend.selling(state.day,state.time)||state.weekend.sale?.day===state.day){
    talk(title,[tr(state.weekend.sale?.day===state.day?'weekAlreadySold':'weekStallHours')]);return;
  }
  const total=items.reduce((sum,item)=>sum+VillageWeekend.price(item,state.day),0);
  const opts=[];
  if(items.length)opts.push({label:tr('weekSell',{total}),fn:()=>sellWeekendStall(items)});
  if(items.length<3){
    for(const item of Object.keys(VillageWeekend.prices)){
      const available=state.inv[item]-items.filter(i=>i===item).length;
      if(available>0)opts.push({label:tr('weekSlot',{item:itemLabel(item),price:VillageWeekend.price(item,state.day),available}),fn:()=>openWeekendStall([...items,item])});
    }
  }
  if(items.length)opts.push({label:tr('weekUndo'),fn:()=>openWeekendStall(items.slice(0,-1))});
  opts.push({label:tr('walkAway'),back:true,fn:null});
  talk(title,[tr('weekStock',{items:items.map(itemLabel).join(' · ')||tr('weekEmpty'),count:items.length})],opts);
}
function sellWeekendStall(items){
  const before=state.weekend;
  state.weekend=VillageWeekend.load(before,state.day);
  const total=VillageWeekend.sell(state.weekend,state.inv,state.day,state.time,items);
  if(!total){state.weekend=before;openWeekendStall();return;}
  if(!save()){
    state.weekend=before;
    for(const item of items)state.inv[item]++;
    state.inv.shell-=total;
    talk(tr('weekStall'),[tr('villageTradeFailed')]);return;
  }
  updateHud();sfx('pickup');
  const special=VillageWeekend.demand(state.day)[0];
  talk(tr('weekStall'),[tr('weekSold',{total}),...(items.includes(special)?[tr('weekCoffeeHint',{item:itemLabel(special)})]:[])]);
}
function tasteMarketCoffee(){
  const item=VillageWeekend.coffee(state.weekend,state.day,state.time);
  if(!item)return;
  const mood=state.need.mood;
  state.weekend.sale.served=true;state.need.mood=clampN(mood+10);
  if(!save()){
    state.weekend.sale.served=false;state.need.mood=mood;
    talk(tr('village_cafe'),[tr('weekSaveFailed')]);return;
  }
  updateHud();sfx('ding');
  talk(nm(npcs.find(n=>n.id==='gy')),[tr('weekCoffeeServed',{item:itemLabel(item)})]);
}
function openWeekendActivity(id){
  if(!VillageWeekend.active(id,state.day,state.time)||state.weekend.played[id]?.last===state.day)return;
  const event=VillageWeekend.activities[id],n=npcs.find(n=>n.id===event.host),guest=npcs.find(n=>n.id===event.guest);
  D.npc=n;
  talk(nm(n),[tr('weekIntro_'+id),...(villageDuty(guest)===weekendGuestSpots[id]?[tr('weekGuest_'+id,{name:nm(guest)})]:[])],[
    {label:tr('weekChoice_'+id+'_0'),fn:()=>id==='court'?weekendShot(1,0):id==='stage'?weekendNotes(1):finishWeekendActivity(id,0)},
    {label:tr('weekChoice_'+id+'_1'),fn:()=>finishWeekendActivity(id,1)},
    {label:tr('walkAway'),back:true,fn:null}
  ]);
}
function weekendShot(shot,score){
  const meter=el('div','weekMeter'),needle=el('i');
  meter.setAttribute('aria-hidden','true');meter.append(needle);
  const start=performance.now();
  talk(tr('worldTitle_weekend_court'),[tr('weekShot',{shot,score})],[
    {label:tr('weekShoot'),fn:()=>{
      const phase=((performance.now()-start)/1350)%2;
      const position=1-Math.abs(1-phase);
      const total=score+Number(reducedMotion||(position>=.4&&position<=.6));
      if(shot<3)weekendShot(shot+1,total);else finishWeekendActivity('court',0,tr('weekScore',{score:total}));
    }},
    {label:tr('walkAway'),back:true,fn:null}
  ],null,meter);
}
function weekendNotes(beat){
  talk(tr('worldTitle_weekend_stage'),[tr('weekNotes',{beat})],[
    ...[0,1,2].map(note=>({label:tr('weekNote'+note),fn:()=>{
      sfx('weekNote',note);
      if(beat<3)weekendNotes(beat+1);else finishWeekendActivity('stage',0);
    }})),
    {label:tr('walkAway'),back:true,fn:null}
  ]);
}
function finishWeekendActivity(id,choice,result){
  const previous=state.weekend.played[id],mood=state.need.mood;
  if(!VillageWeekend.play(state.weekend,id,state.day,state.time,choice))return;
  state.need.mood=clampN(mood+(choice===0?10:7));
  const n=npcs.find(person=>person.id===VillageWeekend.activities[id].host);
  if(!save()){
    if(previous)state.weekend.played[id]=previous;else delete state.weekend.played[id];
    state.need.mood=mood;talk(nm(n),[tr('weekSaveFailed')]);return;
  }
  updateHud();
  if(id==='stage'&&state.projects.music)sfx('villageMix',state.projects.music);
  else sfx(id==='stage'?'villageSong':'ding');
  talk(nm(n),[...(result?[result]:[]),tr('weekResult_'+id+'_'+choice)]);
}
function weekendOption(id){
  if(!VillageWeekend.active(id,state.day,state.time))return [];
  const played=state.weekend.played[id]?.last===state.day;
  return [{label:tr(played?'villageDone':'worldTitle_weekend_'+id),disabled:played,fn:()=>openWeekendActivity(id)}];
}

function ferryMenu(){
  talk(tr('village_ferry'),[tr(VillageRiverside.exposed(state.day)?'riverLow':'riverNormal')],[
    ...soundProjectOption('water'),
    {label:tr('riverRest'),disabled:state.riverRest===state.day,fn:()=>{
      state.riverRest=state.day;advanceTime(15);state.need.mood=clampN(state.need.mood+6);
      updateHud();save();say(tr('village_ferry'),tr('riverRested'));
    }},
    {label:tr('walkAway'),back:true,fn:null}
  ]);
}
function postMenu(){
  const riverside=state.riverside;
  const opts=soundProjectOption('letter');
  if(riverside.apron?.status==='found')opts.push({label:tr('riverPostApron'),fn:()=>returnApron('posted')});
  opts.push({label:tr('riverSend'),disabled:state.inv.letter<1||riverside.letter?.day===state.day,fn:()=>{
    talk(tr('village_post'),[tr('riverSendTo')],VillageRiverside.recipients.map(id=>{
      const n=npcs.find(person=>person.id===id);
      return {label:nm(n),disabled:!rel(n).met,fn:()=>postLetter(n)};
    }).concat({label:tr('walkAway'),back:true,fn:null}));
  }},{label:tr('walkAway'),back:true,fn:null});
  talk(tr('village_post'),[tr('riverPostIntro')],opts);
}
function postLetter(n){
  const previous=state.riverside.letter;
  if(state.inv.letter<1||previous?.day===state.day||!rel(n).met)return;
  state.riverside.letter={day:state.day,to:n.id};state.inv.letter--;
  if(!save()){
    state.riverside.letter=previous;state.inv.letter++;
    talk(tr('village_post'),[tr('weekSaveFailed')]);return;
  }
  rememberPlayer(n,'riverLetter','received',.55,70);
  addPts(n,3);updateHud();
  talk(tr('village_post'),[tr('riverLetterSent',{name:nm(n)})]);
}
function visibleRiverClues(){
  return [
    ['apron',VillageRiverside.apronTile,VillageRiverside.apronVisible(state.riverside,state.day,state.time)],
    ['glass',VillageRiverside.glassTile,VillageRiverside.glassVisible(state.riverside,state.day)]
  ].filter(([, ,visible])=>visible);
}
function riverClue(kind){
  const riverside=state.riverside;
  if(kind==='apron'){
    if(!VillageRiverside.apronVisible(riverside,state.day,state.time))return;
    riverside.apron={day:state.day,status:'found',heard:false};
    if(!save()){
      riverside.apron=null;talk(tr('village_ferry'),[tr('weekSaveFailed')]);return;
    }
    sfx('pickup');talk(tr('village_ferry'),[tr('riverApronFound')]);return;
  }
  if(!VillageRiverside.glassVisible(riverside,state.day))return;
  talk(tr('village_ferry'),[tr('riverGlassFound')],[
    {label:tr('riverGlassKeep'),fn:()=>finishRiverGlass('keep')},
    {label:tr('riverGlassLeave'),fn:()=>finishRiverGlass('leave')},
    {label:tr('walkAway'),back:true,fn:null}
  ]);
}
function finishRiverGlass(choice){
  if(!VillageRiverside.glassVisible(state.riverside,state.day))return;
  state.riverside.glass={day:state.day,choice};
  if(!save()){
    state.riverside.glass=null;talk(tr('village_ferry'),[tr('weekSaveFailed')]);return;
  }
  updateHud();sfx('pickup');talk(tr('village_ferry'),[tr('riverGlass_'+choice)]);
}
function returnApron(status){
  const apron=state.riverside.apron;
  if(apron?.status!=='found')return;
  const gy=npcs.find(n=>n.id==='gy');
  const day=apron.day;
  apron.status=status;apron.day=state.day;
  if(!save()){
    apron.status='found';apron.day=day;talk(tr('village_ferry'),[tr('weekSaveFailed')]);return;
  }
  if(status==='returned'){
    rememberPlayer(gy,'riverApron','returned',.8,86);addPts(gy,5);
  }
  updateHud();talk(status==='returned'?nm(gy):tr('village_post'),[tr('riverApron_'+status)]);
}

function projectOption(id,n){
  return {label:tr('worldTitle_project_'+id),fn:()=>openVillageProject(id,n)};
}
function projectTalk(n,lines,opts,preview){
  D.npc=n;
  talk(nm(n),lines,opts.concat({label:tr('projectLater'),back:true,fn:null}),null,preview);
}
function saveVillageProject(n,change,lines,items=[]){
  const previous=state.projects;
  state.projects={...previous,...change};
  for(const item of items)state.inv[item]--;
  if(!save()){
    state.projects=previous;
    for(const item of items)state.inv[item]++;
    talk(nm(n),[tr('weekSaveFailed')]);return false;
  }
  if(lines){sfx('ding');talk(nm(n),lines);}
  updateHud();
  return true;
}
function openVillageProject(id,n){
  if(id==='cafe'){cafeProject(n);return;}
  if(id==='court'){
    const ball=state.projects.ball;
    projectTalk(n,[tr('projectBallIntro'),...(ball?[tr('projectBallBest',{best:ball.best})]:[])],[
      {label:tr('projectBallPlay'),fn:()=>projectBall(n,0,0)}
    ]);return;
  }
  if(id==='stage'){musicProject(n);return;}
  studioProject(n);
}
function cafeProject(n){
  const menu=state.projects.cafe;
  if(menu){
    const title=menu.caption||tr('projectCafeName_'+menu.name);
    projectTalk(n,[tr(state.day>=VillageProjects.menuDay(menu.day)?'projectCafeOnMenu':'projectCafeScheduled',{
      name:title,day:tr('day',{d:VillageProjects.menuDay(menu.day)})})],[
      {label:tr('projectCafeTaste'),fn:()=>{
        talk(nm(n),[tr('projectCafeTaste_'+menu.style,{name:title})]);
      }}
    ].filter(()=>state.day>=VillageProjects.menuDay(menu.day)));return;
  }
  if(state.time<1080||state.time>=1170){
    projectTalk(n,[tr('projectCafeMapHours')],[]);return;
  }
  projectTalk(n,[tr('projectCafeIntro')],[
    {label:tr('projectCafeStart'),fn:()=>cafeIngredients(n,[])}
  ]);
}
function cafeIngredients(n,items){
  if(items.length===2){
    projectTalk(n,[tr('projectCafeAdjust',{items:items.map(itemLabel).join(' + ')})],
      VillageProjects.styles.map(style=>({label:tr('projectCafeStyle_'+style),fn:()=>cafeName(n,items,style)})));
    return;
  }
  projectTalk(n,[tr('projectCafeChoose',{slot:items.length+1})],
    VillageProjects.ingredients.filter(item=>!items.includes(item)).map(item=>({
      label:itemLabel(item)+' ×'+state.inv[item],disabled:state.inv[item]<1,fn:()=>cafeIngredients(n,[...items,item])
    })));
}
function cafeName(n,items,style){
  const input=el('input','projectName');
  input.type='text';input.maxLength=24;input.setAttribute('aria-label',tr('projectCafeCustom'));input.placeholder=tr('projectCafeCustom');
  projectTalk(n,[tr('projectCafeReply_'+style),tr('projectCafeNameIntro')],
    VillageProjects.names.map(name=>({label:tr('projectCafeSave',{name:tr('projectCafeName_'+name)}),fn:()=>{
      if(state.projects.cafe||items.some(item=>state.inv[item]<1))return;
      const caption=VillageProjects.caption(input.value);
      if(saveVillageProject(n,{cafe:{day:state.day,items,style,name,caption}},
        [tr('projectCafeScheduled',{name:caption||tr('projectCafeName_'+name),day:tr('day',{d:VillageProjects.menuDay(state.day)})})],items)){
        rememberPlayer(n,'villageProject','completed',.8,85,'cafe');save();
      }
    }})),input);
}
function projectCourtView(round,move){
  const canvas=mk(96,60),g=canvas.getContext('2d');
  canvas.className='projectSketch';canvas.setAttribute('aria-hidden','true');
  const r=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
  r(0,0,96,60,'#604943');r(2,2,92,56,'#7f9d87');
  r(5,5,86,1,'#ead8ae');r(5,54,86,1,'#ead8ae');r(5,6,1,48,'#ead8ae');r(90,6,1,48,'#ead8ae');
  r(39,8,18,1,'#ead8ae');r(39,9,1,16,'#ead8ae');r(56,9,1,16,'#ead8ae');r(39,25,18,1,'#ead8ae');
  r(43,7,10,3,'#674e46');r(45,10,6,3,'#c08270');
  const left=round%2===0,x=move==='left'?16:move==='right'?62:38;
  r(left?10:59,29,26,3,'#c7dcb0');r(left?68:23,26,5,7,'#a16970');
  blitChar(g,state.o,'up',0,x,33);
  blitChar(g,npcs.find(n=>n.id==='xy').outfit,'up',0,move==='left'?59:18,12);
  return canvas;
}
function projectBall(n,round,score){
  projectTalk(n,[tr(round%2===0?'projectBallLaneLeft':'projectBallLaneRight',{round:round+1})],
    ['left','right'].map(move=>({label:tr('projectBallMove_'+move),fn:()=>{
      const open=move===(round%2===0?'left':'right');
      projectTalk(n,[tr(open?'projectBallOpen':'projectBallCovered')],
        ['shoot','pass'].map(play=>({label:tr('projectBallPlay_'+play),fn:()=>{
          const basket=VillageProjects.shot(round,move,play);
          const total=score+basket;
          talk(nm(n),[tr(basket?'projectBallBasket_'+play:'projectBallMiss')],null,()=>{
            if(round<2){projectBall(n,round+1,total);return;}
            const old=state.projects.ball;
            if(saveVillageProject(n,{ball:{day:old?.day??state.day,best:Math.max(old?.best??0,total)}},
              [tr('projectBallResult',{score:total})])&&!old){
              rememberPlayer(n,'villageProject','completed',.8,85,'court');save();
            }
          });
        }})),projectCourtView(round,move));
    }})),projectCourtView(round));
}
function soundProjectOption(sound){
  if(!state.projects.recording)return [];
  return [{label:tr(state.projects.sounds.includes(sound)?'projectSoundListen':'projectSoundRecord',{sound:tr('projectSound_'+sound)}),fn:()=>{
    sfx('villageSample',sound);
    if(!state.projects.sounds.includes(sound)){
      const n=npcs.find(person=>person.id==='jy');
      if(!saveVillageProject(n,{sounds:[...state.projects.sounds,sound]},null))return;
    }
    notify(tr('projectSoundSaved',{sound:tr('projectSound_'+sound)}));
  }}];
}
function musicProject(n){
  const music=state.projects.music;
  const opts=[];
  if(!state.projects.recording)opts.push({label:tr('projectMusicStart'),fn:()=>{
    saveVillageProject(n,{recording:true},[tr('projectMusicWhere')]);
  }});
  if(music)opts.push({label:tr('projectMusicPlay'),fn:()=>{sfx('villageMix',music);musicProject(n);}});
  if(state.projects.sounds.length===3)opts.push({label:tr(music?'projectMusicRemix':'projectMusicArrange'),fn:()=>arrangeVillageMusic(n,[])});
  projectTalk(n,[tr(music?'projectMusicMemory':'projectMusicIntro'),...(state.projects.recording&&!music?
    [tr('projectMusicCount',{count:state.projects.sounds.length}),tr('projectMusicWhere')]:[])],opts);
}
function arrangeVillageMusic(n,order){
  if(order.length<3){
    projectTalk(n,[tr('projectMusicBeat',{beat:order.length+1})],VillageProjects.sounds.filter(sound=>!order.includes(sound)).map(sound=>({
      label:tr('projectSound_'+sound),fn:()=>{sfx('villageSample',sound);arrangeVillageMusic(n,[...order,sound]);}
    })));return;
  }
  projectTalk(n,[tr('projectMusicEnding')],VillageProjects.endings.map(ending=>({
    label:tr('projectMusicEnding_'+ending),fn:()=>{
      const old=state.projects.music,music={day:old?.day??state.day,order,ending};
      previewVillageMix(n,music);
    }
  })));
}
function previewVillageMix(n,music){
  projectTalk(n,[tr('projectMusicPreview')],[
    {label:tr('projectMusicPlay'),fn:()=>{sfx('villageMix',music);previewVillageMix(n,music);}},
    {label:tr('projectMusicKeep'),fn:()=>keepVillageMix(n,music)},
    {label:tr('projectMusicRemix'),fn:()=>arrangeVillageMusic(n,[])}
  ]);
}
function keepVillageMix(n,music){
  const old=state.projects.music;
  if(saveVillageProject(n,{music},[tr('projectMusicMemory')])){
    sfx('villageMix',music);
    if(!old){rememberPlayer(n,'villageProject','completed',.8,85,'stage');save();}
  }
}
function studioProject(n){
  const light=VillageProjects.lightAt(state.day,state.time),drafts=state.projects.drafts;
  const opts=[];
  if(light)opts.push({label:tr('projectArtStart',{light:tr('projectLight_'+light)}),fn:()=>chooseSketchFrame(n,light)});
  for(const id of VillageProjects.lights){
    if(drafts[id])opts.push({label:tr('projectArtView',{light:tr('projectLight_'+id)}),fn:()=>viewVillageSketch(n,id)});
  }
  projectTalk(n,[tr('projectArtIntro'),tr('projectArtProgress',{count:Object.keys(drafts).length})],opts);
}
function chooseSketchFrame(n,light){
  projectTalk(n,[tr('projectArtFrame')],[0,1].map(frame=>({label:tr('projectArtFrame_'+frame),fn:()=>{
    projectTalk(n,[tr('projectArtPalette')],[0,1].map(palette=>({
      label:tr('projectArtPalette_'+palette),fn:()=>{
        const first=!Object.keys(state.projects.drafts).length;
        const drafts={...state.projects.drafts,[light]:{day:state.projects.drafts[light]?.day??state.day,frame,palette}};
        if(saveVillageProject(n,{drafts},null)){
          if(first){
            rememberPlayer(n,'villageProject','completed',.8,85,'lookout');save();
          }
          viewVillageSketch(n,light);
        }
      }
    })));
  }})));
}
function viewVillageSketch(n,light){
  const draft=state.projects.drafts[light],canvas=mk(96,60);
  canvas.className='projectSketch';canvas.setAttribute('role','img');canvas.setAttribute('aria-label',tr('projectLight_'+light));
  drawVillageSketch(canvas.getContext('2d'),light,draft);
  projectTalk(n,[tr('projectArtReply_'+draft.frame)],[
    {label:tr('projectArtHang'),disabled:state.projects.hung===light,fn:()=>{
      saveVillageProject(n,{hung:light},[tr('projectArtHung')]);
    }},
    {label:tr('projectArtSave'),fn:()=>{downloadCanvas(canvas,'HomeLove-river-'+light+'.png');viewVillageSketch(n,light);}}
  ],canvas);
}
function drawVillageSketch(g,light,draft){
  const warm=draft.palette===0;
  const sky=light==='dusk'?(warm?'#dba3a2':'#9c99bd'):light==='rain'?'#a8b9bd':'#c3ded9';
  const water=warm?'#75a6a7':'#7295b2';
  const r=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
  r(0,0,96,60,'#634a4c');r(2,2,92,56,sky);
  r(4,26,88,29,water);r(6,20,79,6,'#81938a');r(9,17,29,4,'#81938a');r(48,15,23,6,'#81938a');
  r(4,53,88,3,'#9f9d76');
  if(draft.frame===0){
    r(10,31,70,3,'#654c46');r(13,34,64,2,'#ba9578');r(17,29,3,13,'#654c46');r(72,29,3,13,'#654c46');
  }else{
    r(56,30,19,2,'#eee0b9');r(62,36,21,2,'#b5d9cd');r(69,42,13,2,'#eee0b9');
  }
  for(let i=0;i<5;i++)r(9+i*15,47+(i%2)*3,8-i%3,1,'#c8d9cb');
}

let blackoutPreviewDay=0;
function blackoutActive(){
  return VillageBlackout.active(state.blackout,state.day,state.time,blackoutPreviewDay);
}
function blackoutOption(id){
  if(!blackoutActive()||state.blackout.last?.day===state.day||!Object.hasOwn(VillageBlackout.scenes,id))return [];
  return [{label:tr('blackoutBring_'+id),fn:()=>openBlackoutScene(id)}];
}
function openBlackoutScene(id){
  if(!blackoutOption(id).length)return;
  const scene=VillageBlackout.scenes[id],n=npcs.find(person=>person.id===scene.host);
  const memory=state.blackout.visits[id];
  const repeat=!!memory;
  D.npc=n;
  talk(nm(n),[tr(repeat?'blackoutRepeat_'+id:'blackoutIntro_'+id,repeat?{
    choice:tr('blackoutChoice_'+memory.choice)
  }:undefined)],[
    ...scene.choices.map(choice=>({label:tr('blackoutChoice_'+choice),fn:()=>finishBlackout(id,choice)})),
    {label:tr('projectLater'),back:true,fn:null}
  ]);
}
function finishBlackout(id,choice){
  const previous=state.blackout,next=VillageBlackout.complete(previous,state.day,state.time,id,choice,blackoutPreviewDay);
  if(!next)return;
  state.blackout=next;
  if(!save()){
    state.blackout=previous;talk(tr('worldTitle_blackout'),[tr('weekSaveFailed')]);return;
  }
  const n=npcs.find(person=>person.id===VillageBlackout.scenes[id].host);
  rememberPlayer(n,'blackout','completed',.85,88,{place:id,choice});save();
  if(id==='stage')sfx(state.projects.music?'villageMix':'villageSong',state.projects.music);
  else sfx('ding');
  updateHud();D.npc=n;
  talk(nm(n),[tr('blackoutResult_'+choice)]);
}
let noticedBlackout=false;
function updateBlackout(){
  const active=blackoutActive();
  if(active===noticedBlackout)return;
  noticedBlackout=active;
  sfx(active?'whoosh':'ding');
  notify(tr(active?'blackoutArrives':'blackoutEnds'));
}

const lanternBubble=$('#lanternReaction');
let lanternReaction=null,lanternReactionDay=0;
const lanternSeen=new Set();
function updateLanternReaction(dt,paused){
  if(!blackoutActive()||paused||D.modal||FISH.on){lanternReaction=null;return;}
  if(lanternReactionDay!==state.day){
    lanternReactionDay=state.day;lanternSeen.clear();
  }
  if(lanternReaction){
    lanternReaction.time-=dt;
    const {n,time}=lanternReaction;
    if(time>0&&n.state==='here'&&Math.hypot(n.x-P.x,n.y-P.y)<86){
      const dx=P.x-n.x,dy=P.y-n.y;
      n.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
      return;
    }
    lanternReaction=null;
  }
  const n=npcs.find(n=>n.state==='here'&&!n.leaving&&!lanternSeen.has(n.id)&&Math.hypot(n.x-P.x,n.y-P.y)<58);
  if(!n)return;
  lanternSeen.add(n.id);
  lanternReaction={n,time:4.6};
  n.dir=Math.abs(P.x-n.x)>Math.abs(P.y-n.y)?(P.x<n.x?'left':'right'):(P.y<n.y?'up':'down');
  lanternBubble.textContent=nm(n)+' · '+tr('lanternNotice_'+n.id);
}
function renderLanternReaction(cx,cy){
  const n=lanternReaction?.n;
  lanternBubble.classList.toggle('hidden',!n);
  if(!n)return;
  const ratio=scale*innerWidth/cv.width;
  const margin=Math.min(124,innerWidth*.37);
  const x=Math.min(innerWidth-margin,Math.max(margin,(n.x-cx)*ratio));
  lanternBubble.style.left=x+'px';
  lanternBubble.style.top=Math.max(125,(n.y-cy-31)*ratio)+'px';
}
function villageInteraction(id){
  if(id==='bench'){
    if(!breakfastBoxReady(true))return;
    const {eatMinutes,outdoorHunger,mood}=BREAKFAST_BOX;
    talk(tr('village_bench'),[tr('boxBench')],[
      {label:tr('boxEatOutside',{m:eatMinutes,h:outdoorHunger,mood}),fn:()=>eatBreakfastBox(true)},
      {label:tr('walkAway'),fn:null}
    ]);
    return;
  }
  if(blackoutOption(id).length){openBlackoutScene(id);return;}
  if(id==='ferry'){ferryMenu();return;}
  if(id==='post'){postMenu();return;}
  if(id==='weekendBoard'){openWeekendBoard();return;}
  if(id==='weekendStall'){openWeekendStall();return;}
  const trades=VillageMap.exchanges[id];
  if(trades){
    const opts=VillageMap.marketOpen(state.time)?trades.map(offer=>({
      label:tr('villageTrade',{take:itemLabel(offer.take),count:offer.count,give:itemLabel(offer.give),amount:offer.amount}),
      disabled:state.inv[offer.take]<offer.count,fn:()=>tradeAtVillage(id,offer)
    })):[];
      talk(tr('village_'+id),[tr(opts.length?'villageMarketOffer':'villageMarketClosed')],opts.concat({label:tr('walkAway'),fn:null}));
    return;
  }
  if(id==='guide'){openVillageMap();return;}
  const n=npcs.find(person=>person.id===VillageMap.places[id].resident);
  const here=villageDuty(n)?.id===id&&n.state==='here'&&Math.hypot(n.x-P.x,n.y-P.y)<100;
  const opts=weekendOption(id);
  if(n&&momentAvailable(n))opts.unshift({label:tr('worldTitle_moment_'+n.id),fn:()=>openResidentMoment(n)});
  if(id==='stage'&&state.projects.music)opts.push({label:tr('projectMusicPlay'),fn:()=>sfx('villageMix',state.projects.music)});
  if(id==='lookout'&&state.projects.hung)opts.push({label:tr('projectArtOnWall'),fn:()=>viewVillageSketch(n,state.projects.hung)});
  if(id==='cafe'&&state.projects.cafe&&state.day>=VillageProjects.menuDay(state.projects.cafe.day)&&!here){
    opts.push({label:tr('projectCafeBoard'),fn:()=>talk(tr('village_cafe'),[tr('projectCafeOnMenu',{
      name:state.projects.cafe.caption||tr('projectCafeName_'+state.projects.cafe.name)
    })])});
  }
  if(id==='cafe'&&VillageWeekend.coffee(state.weekend,state.day,state.time))opts.push({label:tr('weekCoffeeTaste'),fn:tasteMarketCoffee});
  if(id==='cafe'&&canShareLunch(n))opts.push({label:tr('boxShare',LUNCH_SHARE),fn:()=>shareLunch(n)});
  if(id==='cafe')opts.push(...lunchReturnOption(n));
  if(here)opts.push(projectOption(id,n),{label:tr('talkTo',{n:nm(n)}),fn:()=>npcMenu(n)});
  opts.push(villageActivityOption(id,here?n:null),{label:tr('walkAway'),fn:null});
  talk(tr('village_'+id),[tr('villageIntro_'+id)],opts);
}
function tradeAtVillage(id,offer){
  if(!VillageMap.marketOpen(state.time)||!VillageMap.trade(state.inv,offer))return;
  if(!save()){
    state.inv[offer.take]+=offer.count;
    state.inv[offer.give]-=offer.amount;
    talk(tr('village_'+id),[tr('villageTradeFailed')]);return;
  }
  sfx('pickup');updateHud();villageInteraction(id);
}
function villageActivityOption(id,n){
  const played=state.villageVisits[id]===state.day;
  const disabled=played||(id==='cafe'&&(!VillageMap.marketOpen(state.time)||state.inv.shell<1))||
    (id==='court'&&state.need.energy<10);
  return {label:tr(played?'villageDone':'villageAction_'+id),disabled,fn:()=>doVillageActivity(id,n)};
}
function doVillageActivity(id,n){
  if(villageActivityOption(id,n).disabled)return;
  const N=state.need;
  if(id==='cafe'){state.inv.shell--;N.hunger=clampN(N.hunger+18);}
  if(id==='court'){advanceTime(20);N.energy=clampN(N.energy-8);}
  N.mood=clampN(N.mood+(n?9:5));
  state.villageVisits[id]=state.day;
  if(n){D.npc=n;addPts(n,4);}else save();
  updateHud();sfx(id==='stage'?'villageSong':'ding');
  talk(n?nm(n):tr('village_'+id),[tr((n?'villageTogether_':'villageResult_')+id)]);
}
let villageDestination = null;

function firstGreetingTarget(){
  if(state.day!==1 || state.firstGreetingDismissed || state.rel.gy.met) return null;
  const resident = npcs.find(n=>n.id==='gy');
  const tx = Math.floor(P.x/16), ty = Math.floor((P.y-2)/16);
  const tile = at(tx,ty);
  if(!inCottageWindow(resident)) return null;
  if(tile===FLOOR || tile===DOOR) return {x:6*16+8,y:9*16,inside:true};
  if(resident.state!=='here' || resident.leaving || Math.hypot(P.x-resident.x,P.y-resident.y)>160) return null;
  return {x:resident.x,y:resident.y-35,resident};
}
$('#firstGreetingDismiss').onclick = ()=>{
  state.firstGreetingDismissed = true;
  save();
  cv.focus({preventScroll:true});
  updateVillageGuide();
};

function cancelVillageRoute(){
  villageDestination = null;
  walkRoute = [];
  updateVillageGuide();
}

function walkToVillagePlace(id, place){
  closeVillageMap();
  if(!setWalkDestination(place.anchor[0]*16+8,place.anchor[1]*16+10)){
    notify(tr('villageNoRoute'));
    return;
  }
  villageDestination = id;
  updateVillageGuide();
}
$('#villageRouteCancel').onclick = ()=>{
  cancelVillageRoute();
  cv.focus({preventScroll:true});
};

const villageMapDialog = $('#villageMap');
function closeVillageMap(){
  villageMapDialog.close();
  mapOpen=false;
  cv.focus({preventScroll:true});
}
function overviewBackdrop(season){
  const art=SEASON_ART[season];
  if(art.overview)return art.overview;
  const c=mk(MW*4,MH*4),g=c.getContext('2d');
  g.imageSmoothingEnabled=false;g.drawImage(art.ground,0,0,c.width,c.height);
  for(const prop of VillageMap.props){
    g.fillStyle='#785b55';g.fillRect(prop.x*4,prop.y*4,prop.w*4,prop.h*4);
  }
  for(const place of Object.values(VillageMap.places)){
    const [x,y]=place.tile;
    g.fillStyle='#6b4e4e';g.fillRect(x*4-1,y*4-1,6,6);
    g.fillStyle=place.color;g.fillRect(x*4,y*4,4,4);
  }
  art.overview=c;
  return c;
}
function drawOverview(canvas,season,viewport){
  const g=canvas.getContext('2d');
  g.drawImage(overviewBackdrop(season),0,0);
  if(VillageRiverside.exposed(state.day)){
    const [x,y]=VillageRiverside.glassTile;
    g.fillStyle='#d7b896';g.fillRect(x*4,y*4,4,4);
  }
  if(viewport){
    const [x,y]=cameraOrigin();
    g.strokeStyle='rgba(255,251,229,.72)';
    g.strokeRect(Math.floor(x/4)+.5,Math.floor(y/4)+.5,Math.floor(cv.width/scale/4),Math.floor(cv.height/scale/4));
  }
  if(villageDestination && walkRoute.length){
    g.fillStyle='#fff0bb';
    for(const [x,y] of walkRoute)g.fillRect(Math.round(x/4),Math.round(y/4),2,2);
    const [x,y]=walkRoute.at(-1);
    g.fillStyle='#ac5b47';g.fillRect(Math.round(x/4)-2,Math.round(y/4)-2,5,5);
    g.fillStyle='#fff0bb';g.fillRect(Math.round(x/4)-1,Math.round(y/4)-1,3,3);
  }
  const px=Math.floor(P.x/4),py=Math.floor((P.y-2)/4);
  g.fillStyle='#fff4db';g.fillRect(px-2,py-2,5,5);
  g.fillStyle='#ae4f68';g.fillRect(px-1,py-1,3,3);
}
let miniOverviewKey='';
function updateMiniMap(){
  const season=CottageActivities.seasonOf(state.day),[x,y]=cameraOrigin();
  const key=[season,VillageRiverside.exposed(state.day),P.x>>2,P.y>>2,x>>2,y>>2,cv.width,cv.height,scale,villageDestination,walkRoute.length].join(':');
  if(key!==miniOverviewKey){
    miniOverviewKey=key;
    drawOverview($('#miniOverview'),season,true);
  }
}
function openVillageMap(){
  if(mapOpen||startOpen||D.modal||busy||dressOpen||diaryOpen||albumOpen||FISH.on)return;
  mapOpen=true;keys.clear();touchKeys.clear();
  const box=$('#villageStops');
  const duties=new Map(npcs.map(n=>[n.id,villageDuty(n)]));
  drawOverview($('#villageOverview'),CottageActivities.seasonOf(state.day),false);
  box.replaceChildren();
  for(const [id,place] of Object.entries(VillageMap.places)){
    const button=el('button','pbtn village-stop');button.type='button';
    const dot=el('span','village-dot');dot.style.background=place.color;
    const words=el('span',null,tr('village_'+id));
    const n=place.resident&&npcs.find(person=>person.id===place.resident);
    if(n)words.append(el('small',null,nm(n)+' · '+fmt(place.hours[0])+'–'+fmt(place.hours[1])));
    if(id==='home')for(const resident of npcs){
      const {start,end}=visitWindow(resident);
      words.append(el('small',null,nm(resident)+' · '+fmt(start)+'–'+fmt(end)));
    }
    if(id==='cafe')words.append(el('small',null,tr('projectCafeMapHours')));
    const here=npcs.filter(resident=>{
      if(resident.state!=='here'||resident.leaving)return false;
      const duty=duties.get(resident.id);
      if(duty){
        const [x,y]=duty.spot;
        const [px,py]=place.spot||[];
        return px!==undefined&&Math.hypot(x-px,y-py)<=3&&Math.hypot(resident.x-x*16-8,resident.y-y*16-12)<48;
      }
      return id==='home'&&(inCottageWindow(resident)||rel(resident).livesIn)
        && resident.x<27*16&&resident.y<19*16;
    });
    if(here.length)words.append(el('small','village-here',tr('villageHere',{names:here.map(nm).join(tr('nameSeparator'))})));
    if(blackoutOption(id).length)words.append(el('small',null,tr('blackoutMap')));
    if(id==='market')words.append(el('small',null,'09:00–18:00'));
    button.append(dot,words);
    button.onclick=()=>walkToVillagePlace(id,place);
    box.append(button);
  }
  villageMapDialog.showModal();
}
$('#btnMap').addEventListener('click',openVillageMap);
$('#miniMap').addEventListener('click',openVillageMap);
$('#btnTravel').addEventListener('click',openTravelShop);
$('#btnUmbrella').addEventListener('click',toggleUmbrella);
$('#villageClose').addEventListener('click',closeVillageMap);
villageMapDialog.addEventListener('click',e=>{if(e.target===villageMapDialog)closeVillageMap();});
villageMapDialog.addEventListener('cancel',e=>{e.preventDefault();closeVillageMap();});

function findTarget(){
  if(blackoutActive()&&state.blackout.last?.day!==state.day){
    for(const id of Object.keys(VillageBlackout.scenes)){
      const [x,y]=VillageMap.places[id].anchor;
      if(Math.hypot(P.x-(x*16+8),P.y-(y*16+12))<13)return {kind:'village',id,verb:tr('blackoutBring_'+id),x:x*16+8,y:y*16-14};
    }
  }
  const visitor=visitorTarget();
  if(visitor)return visitor;
  const d=DV[P.dir],fx=P.x+d[0]*12,fy=P.y-3+d[1]*12;
  for(const n of npcs){if(n.state!=='away'&&Math.hypot(n.x-fx,n.y-4-fy)<13)return {kind:'npc',n,verb:tr('talkTo',{n:nm(n)}),x:n.x,y:n.y-31};}
  const revisit=rainReturnReady();
  if(revisit&&atRainReturn(revisit))return {kind:'rainReturn',revisit,verb:tr('dateRainReturnAction',RAIN_RETURN),x:P.x,y:P.y-30};
  const pt=petAt(fx,fy);if(pt)return {kind:'pet',p:pt,verb:tr('petVerb',{p:pt.name}),x:pt.x,y:pt.y-20};
  if(Math.hypot(cat.x-fx,cat.y-4-fy)<13)return {kind:'cat',verb:tr('petCat'),x:cat.x,y:cat.y-20};
  const tx=Math.floor(fx/16),ty=Math.floor(fy/16),mx=Math.floor(P.x/16),my=Math.floor((P.y-2)/16);
  for(const [kind,[x,y]] of visibleRiverClues()){
    if(((tx===x&&ty===y)||(mx===x&&my===y)))return {kind:'riverClue',id:kind,verb:tr('riverFind_'+kind),x:x*16+8,y:y*16-3};
  }
  const winter=CottageActivities.seasonOf(state.day)==='winter';
  const fl=!winter&&flowers.find(f=>!f.picked&&((f.tx===tx&&f.ty===ty)||(f.tx===mx&&f.ty===my)));
  if(fl)return {kind:'flower',f:fl,verb:tr('pickFlower'),x:fl.tx*16+8,y:fl.ty*16-2};
  for(const [ax,ay] of [[tx,ty],[mx,my]]){const pi=plotIndex(ax,ay);if(pi>=0)return {kind:'plot',i:pi,verb:plotVerb(state.garden[pi],pi),x:ax*16+8,y:ay*16+2};}
  if(!state.goldFound&&[[tx,ty],[mx,my]].some(([a,b])=>a===GOLD_TILE[0]&&b===GOLD_TILE[1]))return {kind:'gold',verb:tr('goldVerb'),x:GOLD_TILE[0]*16+8,y:GOLD_TILE[1]*16-4};
  const o=objAt(tx,ty);
  if(o)return {kind:'obj',o,verb:o.id==='mailbox'&&readyVehicles().length?tr('vehiclePackage'):o.id==='mailbox'&&unreadAlbumPostcard()?tr('albumMailPrompt'):o.id==='mailbox'&&hasNeighborMail()?tr('requestMailPrompt'):Lp.objects[o.id].verb,
    x:(o.tx+o.tw/2)*16,y:o.py-5};
  const prop=villagePropAt(tx,ty);
  if(prop&&(prop.id!=='bench'||breakfastBoxReady(true)))return {kind:'village',id:prop.id,verb:tr('village_'+prop.id),x:(prop.x+prop.w/2)*16,y:prop.y*16-9};
  const wx=Math.floor((P.x+d[0]*16)/16),wy=Math.floor((P.y-3+d[1]*16)/16);
  if((wx<28&&wy<10||!winter&&wx===VillageRiverside.riverFish[0]&&wy===VillageRiverside.riverFish[1])&&at(wx,wy)===WATER)return {kind:'fish',tx:wx,ty:wy,verb:winter?tr(isIceHole(wx,wy)?'iceAction':'iceLook'):tr('fishAt',{spot:tr(pondSpot(wx))}),x:wx*16+8,y:wy*16};
  return null;
}
function interact(){
  if(D.modal){advance();return;}
  if(FISH.on){reel();return;}
  if(busy||dressOpen||diaryOpen||albumOpen||mapOpen||startOpen)return;
  const t=findTarget();if(!t)return;
  walkRoute=[];
  D.npc=null;
  if(t.kind==='visitor')visitAlien();
  else if(t.kind==='rainReturn')finishRainReturn(t.revisit);
  else if(t.kind==='npc')npcMenu(t.n);
  else if(t.kind==='cat')petCat();
  else if(t.kind==='pet')petMenu(t.p);
  else if(t.kind==='gold')pickGold();
  else if(t.kind==='flower')pickFlower(t.f);
  else if(t.kind==='plot')tendPlot(t.i);
  else if(t.kind==='riverClue')riverClue(t.id);
  else if(t.kind==='fish')fishMenu(t.tx,t.ty);
  else if(t.kind==='village')villageInteraction(t.id);
  else t.o.act();
}
