"use strict";

/* ---------------- loop ---------------- */
let hudT=0,saveT=0,stepT=0,bondsT=0;
function update(dt){
  const paused=document.hidden||startOpen||dressOpen||diaryOpen||albumOpen||mapOpen||D.modal||busy;
  let dx=0,dy=0;
  if(paused||FISH.on)walkRoute=[];
  if(!paused&&!FISH.on){
    if(has('ArrowLeft','KeyA','left'))dx-=1;if(has('ArrowRight','KeyD','right'))dx+=1;
    if(has('ArrowUp','KeyW','up'))dy-=1;if(has('ArrowDown','KeyS','down'))dy+=1;
  }
  const ride=activeRide(),speed=ride?CottageTravel.catalog[ride].speed:1;
  const sp=64*(state.need.energy<15?0.6:1)*speed*dt;
  let moving=false;
  if(dx||dy){
    if(walkRoute.length || villageDestination) cancelVillageRoute();
    if(dx&&dy){const hd=dx<0?'left':'right',vd=dy<0?'up':'down';if(P.dir!==hd&&P.dir!==vd)P.dir=hd;}
    else P.dir=dx<0?'left':dx>0?'right':dy<0?'up':'down';
    const len=Math.hypot(dx,dy);movePlayerBy(dx/len*sp,dy/len*sp);moving=true;
  }else if(walkRoute.length){
    const destination = villageDestination && walkRoute.at(-1);
    moving=followWalkRoute(sp);
    if(destination && !walkRoute.length){
      if(P.x===destination[0] && P.y===destination[1]){
        notify(tr('villageRouteArrived',{place:tr('village_'+villageDestination)}));
      }else notify(tr('villageNoRoute'));
    }
  }
  if(!walkRoute.length && villageDestination) cancelVillageRoute();
  P.moving=moving;
  if(moving){
    P.anim+=dt;
    stepT+=dt;if(stepT>0.3){stepT=0;const tt=at(Math.floor(P.x/16),Math.floor((P.y-2)/16));sfx('step',tt===FLOOR||tt===DOOR);}
  }else P.anim=0;
  if(!paused){
    const gm=dt*TIME_RATE;state.time+=gm;decay(gm,P.moving);
    updateBlackout();
    updateNightVisitor();
    checkSnowKnock();
    skyWatch();
    bondsT+=dt;if(bondsT>2){bondsT=0;bondsTick();}
    updFish(dt);
    if(state.time>=26*60||state.need.energy<=0){FISH.on=false;FISH.companion=null;FISH.snow=null;passOut();}
  }
  updCat(dt);
  updPets(paused?0:dt);
  if(!paused)checkChores();
  updPuffs(paused?0:dt);
  if(!startOpen)for(const n of npcs)updNpc(n,paused&&!busy?0:dt);
  updateLanternReaction(dt,paused);
  for(let i=parts.length-1;i>=0;i--){parts[i].t+=dt;if(parts[i].t>1.2)parts.splice(i,1);}
  target=findTarget();updatePrompt();
  hudT+=dt;if(hudT>.25){hudT=0;updateHud();}
  saveT+=dt;if(saveT>5){saveT=0;save();}
  if(dressOpen&&pWalk){pTimer+=dt;if(pTimer>.18){pTimer=0;pFrame=(pFrame+1)%4;drawPreview();}}
}
let last=performance.now();
document.addEventListener('visibilitychange',()=>{
  last=performance.now();keys.clear();touchKeys.clear();
  savedOnHide=document.hidden&&save(true);
});
function loop(t){const dt=Math.min(.05,(t-last)/1000);last=t;update(dt);render(t/1000);requestAnimationFrame(loop);}
// Start of session: yesterday's baseline, today's possible visitor, and the hours that passed while the page was closed.
if(!B().dayStart)CottageBonds.startDay(B(),state.day,ptsMap());
planToday();
offlineMinutes=catchUpOffline();
if(!SaveManager.snapshots(SaveManager.getStorage(),LS).some(s=>s.label==='d-'+state.day))snapshotMorning();
bindWorldPointer();
applyLang();
snapPets();
requestAnimationFrame(loop);
$('#btnStart').focus();
