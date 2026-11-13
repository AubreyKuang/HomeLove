"use strict";

/* ---------------- player, cat, residents, particles ---------------- */
const P={x:4*16+8,y:6*16+10,dir:'down',moving:false,anim:0};
let walkRoute=[];
playerReady=true;
if(state.position&&Number.isFinite(state.position.x)&&Number.isFinite(state.position.y)){
  if(!blocked(state.position.x,state.position.y))Object.assign(P,state.position);
}
let savedOnHide=false;
window.addEventListener('pagehide',()=>{if(!savedOnHide)save(true);});

const WALK=[1,0,2,0];
const DV={down:[0,1],up:[0,-1],left:[-1,0],right:[1,0]};
const npcs=NPCS.map(d=>Object.assign({},d,{x:-100,y:-100,dir:'down',state:'away',path:null,idle:0,anim:0,moving:false,leaving:false}));
function blocked(x,y){
  const x0=Math.floor((x-4)/16),x1=Math.floor((x+3)/16),y0=Math.floor((y-4)/16),y1=Math.floor((y-1)/16);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){if(tx<0||ty<0||tx>=MW||ty>=MH||isSolid(tx,ty))return true;}
  return false;
}
function tryMove(nx,ny){if(!blocked(nx,ny)){P.x=nx;P.y=ny;return true;}return false;}
function movePlayerBy(mx,my){
  if(mx&&!tryMove(P.x+mx,P.y)&&!my){
    for(let k=1;k<=7;k++){if(!blocked(P.x+mx,P.y-k)){tryMove(P.x,P.y-1);break;}if(!blocked(P.x+mx,P.y+k)){tryMove(P.x,P.y+1);break;}}
  }
  if(my&&!tryMove(P.x,P.y+my)&&!mx){
    for(let k=1;k<=7;k++){if(!blocked(P.x-k,P.y+my)){tryMove(P.x-1,P.y);break;}if(!blocked(P.x+k,P.y+my)){tryMove(P.x+1,P.y);break;}}
  }
}
const cat={x:19*16+8,y:9*16+10,dir:1,state:'sit',t:2,vx:0,vy:0,anim:0};
function catFree(x,y){
  const tx=Math.floor(x/16),ty=Math.floor(y/16);
  if(tx<1||ty<1||tx>=MW-1||ty>=MH-1)return false;
  if(solid[ty*MW+tx])return false;
  const t=map[ty*MW+tx];if(t===FLOOR||t===DOOR)return false;
  if(Math.hypot(x-P.x,y-P.y)<10)return false;
  return true;
}
function updCat(dt){
  cat.t-=dt;
  if(cat.t<=0){
    if(cat.state==='sit'){cat.state='walk';const a=Math.random()*Math.PI*2;cat.vx=Math.cos(a)*22;cat.vy=Math.sin(a)*22;cat.t=1+Math.random()*2;}
    else{cat.state='sit';cat.t=2+Math.random()*3;}
  }
  if(cat.state==='walk'){
    const nx=cat.x+cat.vx*dt,ny=cat.y+cat.vy*dt;
    if(catFree(nx,ny)){cat.x=nx;cat.y=ny;}else{cat.state='sit';cat.t=1+Math.random()*2;}
    if(Math.abs(cat.vx)>1)cat.dir=cat.vx>0?1:-1;cat.anim+=dt;
  }
}
function npcPassable(tx,ty,indoor){
  if(tx<0||ty<0||tx>=MW||ty>=MH||isSolid(tx,ty))return false;
  const t=map[ty*MW+tx];return indoor||(t!==FLOOR&&t!==DOOR);
}
function bfs(sx,sy,gx,gy,indoor){
  const prev=new Int16Array(MW*MH).fill(-1),start=sy*MW+sx,goal=gy*MW+gx,q=[start];prev[start]=start;
  for(let h=0;h<q.length;h++){const c=q[h];if(c===goal)break;const cx=c%MW,cy=(c/MW)|0;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy;if(!npcPassable(nx,ny,indoor))continue;const ni=ny*MW+nx;if(prev[ni]!==-1)continue;prev[ni]=c;q.push(ni);}}
  if(prev[goal]===-1)return null;
  const path=[];for(let c=goal;c!==start;c=prev[c])path.push([c%MW,(c/MW)|0]);return path.reverse();
}
function setWalkDestination(x,y){
  const sx=Math.floor(P.x/16),sy=Math.floor((P.y-2)/16);
  const gx=Math.floor(x/16),gy=Math.floor(y/16);
  if(!npcPassable(sx,sy,true)||!npcPassable(gx,gy,true))return false;
  const tiles=bfs(sx,sy,gx,gy,true);
  if(!tiles)return false;
  const route=tiles.map(([tx,ty])=>[tx*16+8,ty*16+12]);
  if(route.length)route.unshift([sx*16+8,sy*16+12]);
  route.push(blocked(x,y+2)?[gx*16+8,gy*16+12]:[x,y+2]);
  walkRoute=route;
  return true;
}
function followWalkRoute(distance){
  let moved=false;
  while(distance>0&&walkRoute.length){
    const [x,y]=walkRoute[0];
    const dx=x-P.x,dy=y-P.y,len=Math.hypot(dx,dy);
    if(len===0){walkRoute.shift();continue;}
    const step=Math.min(len,distance);
    const ratio=step/len;
    if(!tryMove(step===len?x:P.x+dx*ratio,step===len?y:P.y+dy*ratio)){
      walkRoute=[];break;
    }
    P.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
    moved=true;distance-=step;
    if(step===len)walkRoute.shift();
  }
  return moved;
}
function birthdayOf(n){return 1+NPCS.indexOf(NPCS.find(npc=>npc.id===n.id))*4;}
function visitWindow(n){
  const r=rel(n);
  const offset=r.met?((state.day*17+n.id.charCodeAt(0)*11)%91)-45:0;
  return {start:n.arrive+offset,end:n.leave+offset};
}
const present=n=>{
  if(xiaomanRoute(n)&&!XiaomanStory.visits(state.xiaoman,state.day))return false;
  return rel(n).livesIn||summoned(n)||calling(n)||fishingInvitationReady(n)||inCottageWindow(n)||!!villageDuty(n);
};
const inCottageWindow=n=>{
  const {start,end}=visitWindow(n);
  return state.time>=start&&state.time<end;
};
const weekendGuestSpots=Object.fromEntries(Object.entries(VillageWeekend.activities).map(([id,event])=>[id,{spot:event.spot}]));
const blackoutCafeGuest={spot:[15,22]},blackoutStageGuest={spot:[24,29]};
function villageDuty(n){
  const meeting=plannedDateMeeting(n);
  if(meeting)return meeting;
  if(blackoutActive()){
    const record=state.blackout.last;
    if(record?.day===state.day){
      if(record.place==='cafe'&&record.choice===n.id)return blackoutCafeGuest;
      if(record.place==='stage'&&record.choice==='circle'&&n.id==='by')return blackoutStageGuest;
    }
    for(const [id,scene] of Object.entries(VillageBlackout.scenes)){
      if(scene.host===n.id)return VillageMap.places[id];
    }
  }
  if(summoned(n)||calling(n)||fishingInvitationReady(n))return null;
  for(const [id,event] of Object.entries(VillageWeekend.activities)){
    if((event.host===n.id||event.guest===n.id)&&VillageWeekend.active(id,state.day,state.time)){
      return event.host===n.id?VillageMap.places[id]:weekendGuestSpots[id];
    }
  }
  if(n.id==='gy'&&acceptedNeighborRequest(n)){
    const duty=VillageMap.duty(n.id,state.time);
    if(duty?.id==='cafe')return duty;
  }
  if(n.id==='gy'&&state.time>=1080&&state.time<1170)return VillageMap.places.cafe;
  if(n.id==='by')return VillageMap.duty(n.id,state.time);
  return rel(n).livesIn||inCottageWindow(n)?null:VillageMap.duty(n.id,state.time);
}
// An unannounced visit: the resident shows up at any hour and comes looking for you, even indoors.
const calling=n=>CottageBonds.calling(state.bonds,n.id,state.day,state.time);
function npcGo(n,tx,ty){const sx=Math.floor(n.x/16),sy=Math.floor((n.y-2)/16),t=at(sx,sy);n.path=bfs(sx,sy,tx,ty,rel(n).livesIn||summoned(n)||calling(n)||t===FLOOR||t===DOOR);}
function npcSpots(n){const tk=partnerTask(n);if(tk==='sweep')return SWEEP_SPOTS;if(summoned(n)||calling(n)){const t=nearPlayerTiles();return t.length?t:n.spots;}if(!rel(n).livesIn){const duty=villageDuty(n);return duty?[duty.spot]:n.spots;}const night=state.time>=20*60||state.time<7*60;return night?HOME_IN:HOME_IN.concat(HOME_OUT);}
function placeHome(n){const s=pick(HOME_IN);n.x=s[0]*16+8;n.y=s[1]*16+12;n.state='here';n.path=null;n.idle=10;n.leaving=false;}
function updNpc(n,dt){
  const r=rel(n);
  if(FISH.on&&(FISH.companion===n||FISH.snow&&n.id==='xy'))return;
  if(snowDining&&(n.id==='xy'||n.id==='gy'))return;
  const invitation=fishingInvitationReady(n),duty=villageDuty(n);
  if(n.state==='here'&&!n.leaving&&!n.working&&r.met&&!D.modal&&!busy&&!startOpen&&!dressOpen&&!diaryOpen&&!albumOpen&&!mapOpen&&!FISH.on){
    if(invitation&&seekFishingInvitation(n))return;
    const distance=Math.hypot(n.x-P.x,n.y-P.y);
    const scene=xiaomanScene(n);
    if(dt>0&&scene&&distance<36&&present(n)){startXiaomanScene(n,scene);return;}
    if(dt>0&&calling(n)){
      const drop=state.bonds.dropIn;
      if(!drop.arrived){drop.arrived=true;sfx('ding');notify(tr('dropInArrive',{n:nm(n)}));}
      if(distance<56){greetDropIn(n);return;}
      if(!n.path&&Math.random()<dt*.6){
        const spot=nearPlayerTiles().sort((a,b)=>Math.hypot(a[0]*16+8-P.x,a[1]*16+12-P.y)-Math.hypot(b[0]*16+8-P.x,b[1]*16+12-P.y))[0];
        if(spot)npcGo(n,spot[0],spot[1]);
      }
    }
    if(!invitation&&!r.done.visit&&n.seekingPlayer&&distance<43){
      n.seekingPlayer=false;r.done.visit=true;n.path=null;n.idle=12;
      const line=outfitScore(n)>=4?nt(n).outfitHi:nt(n).greet[Math.min(2,Math.floor(hearts(r)/3))];
      say(nm(n),line);save();
    }else if(!duty&&!invitation&&!r.done.visit&&!n.path&&distance<115&&distance>=43&&Math.random()<dt*.08){
      const spot=nearPlayerTiles().sort((a,b)=>Math.hypot(a[0]*16+8-P.x,a[1]*16+12-P.y)-Math.hypot(b[0]*16+8-P.x,b[1]*16+12-P.y))[0];
      if(spot){npcGo(n,spot[0],spot[1]);n.seekingPlayer=!!n.path?.length;}
    }
  }
  if(n.state==='away'){
    if(r.livesIn&&!duty){placeHome(n);return;}
    if(present(n)&&(duty||invitation||summoned(n)||calling(n)||state.time<visitWindow(n).end-40)){
      const [x,y]=duty?.spot??VillageMap.gates[0];
      n.x=x*16+8;n.y=y*16+12;n.state='here';n.path=null;n.idle=0;n.leaving=false;n.lastVillageDuty=duty;
      const drop=state.bonds.dropIn;
      if(calling(n)&&!drop.arrived){drop.arrived=true;sfx('ding');notify(tr('dropInArrive',{n:nm(n)}));}
    }
    return;
  }
  if(((D.modal||busy)&&D.npc===n)||(lanternReaction?.n===n&&lanternReaction.time>3.8)){
    n.moving=false;n.anim=0;return;
  }
  if(duty!==n.lastVillageDuty&&present(n)){
    n.lastVillageDuty=duty;n.leaving=false;n.path=null;n.idle=0;
    if(duty)npcGo(n,...duty.spot);
    else if(!invitation&&!summoned(n)&&!calling(n))npcGo(n,...pick(r.livesIn?HOME_IN:n.spots));
  }
  if(!present(n)&&!n.leaving){n.leaving=true;npcGo(n,6,19);if(!n.path){n.state='away';n.x=n.y=-100;return;}}
  if(n.path&&n.path.length){
    const [tx,ty]=n.path[0],gx=tx*16+8,gy=ty*16+12,dx=gx-n.x,dy=gy-n.y,d=Math.hypot(dx,dy),sp=38*dt;
    const nx=d<=sp?gx:n.x+dx/d*sp,ny=d<=sp?gy:n.y+dy/d*sp,dNew=Math.hypot(nx-P.x,ny-P.y);
    n.working=partnerTask(n)==='sweep'?'sweep':null;
    if(!summoned(n)&&dNew<10&&dNew<Math.hypot(n.x-P.x,n.y-P.y)){n.wait=(n.wait||0)+dt;if(n.wait<0.6){n.moving=false;return;}}else n.wait=0;
    n.x=nx;n.y=ny;n.moving=true;n.anim+=dt;
    if(Math.abs(dx)>Math.abs(dy))n.dir=dx<0?'left':'right';else if(d>0)n.dir=dy<0?'up':'down';
    n.working=partnerTask(n)==='sweep'?'sweep':null;
    if(d<=sp)n.path.shift();
    if(!invitation&&summoned(n)&&n.path.length){n.rp=(n.rp||0)-dt;if(n.rp<=0){n.rp=1.2;const e=n.path[n.path.length-1];if(Math.hypot(e[0]*16+8-P.x,e[1]*16+12-P.y)>60){const s=pick(npcSpots(n));npcGo(n,s[0],s[1]);if(!n.path)n.path=[];}}}
    if(!n.path.length){n.path=null;if(n.leaving){n.state='away';n.leaving=false;n.x=n.y=-100;}}
  } else {
    n.moving=false;n.anim=0;n.path=null;
    const dx=P.x-n.x,dy=P.y-n.y,dp=Math.hypot(dx,dy),task=partnerTask(n);
    if(task!==n.lastTask){n.lastTask=task;n.idle=0;}
    if(duty){
      n.working=null;
      if(Math.hypot(n.x-duty.spot[0]*16-8,n.y-duty.spot[1]*16-12)>3)npcGo(n,...duty.spot);
      else if(dp<30)n.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
      return;
    }
    const fixed=task==='cook'?STOVE_SPOT:task==='gym'?GYM_SPOT:null;
    if(fixed){const there=Math.hypot(fixed[0]*16+8-n.x,fixed[1]*16+12-n.y)<3;n.working=there?task:null;
      if(there){n.dir=task==='cook'?'up':'down';return;}
      n.idle-=dt*TIME_RATE;if(n.idle<=0){npcGo(n,fixed[0],fixed[1]);n.idle=3;}return;}
    n.working=task==='sweep'?'sweep':null;
    if(task==='sweep'){n.idle-=dt*TIME_RATE;if(n.idle<=0){const s=pick(SWEEP_SPOTS);npcGo(n,s[0],s[1]);n.idle=6;}return;}
    if(dp<(summoned(n)?70:30))n.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
    n.idle-=dt*TIME_RATE;
    if(n.idle<=0&&dp>=(summoned(n)?60:30)){const s=pick(npcSpots(n));npcGo(n,s[0],s[1]);n.idle=summoned(n)?2:25+Math.random()*35;}
  }
}
const parts=[];
function heart(x,y){parts.push({x,y,t:0});}

/* ---------------- pets & golden charm ---------------- */
const MEN=['gy','xy','jy','by'];
const GOLD_TILE=[25,17];
const PET_KINDS=['cat','dog','bird','rabbit'];
const PET_ICON={cat:'🐱',dog:'🐶',bird:'🐦',rabbit:'🐰'};
const PET_FOOD={cat:'fish',dog:'cookie',bird:'berry',rabbit:'flower'};
const PET_GIFT={cat:'fish',dog:'shell',bird:'flower',rabbit:'berry'};
const NPC_PET={gy:'cat',xm:'rabbit',xy:'dog',jy:'bird',by:'cat'};
const PET_PAL={
  cat:[['#9aa0a8','#6f757d','#e8eaee'],['#3a3540','#1f1b24','#f0eef2'],['#f4f2ee','#d2cabe','#ffffff']],
  dog:[['#b07a4a','#86562f','#f0dcc0'],['#e09a4a','#b8702c','#fff3e0'],['#f2eee6','#cfc6b8','#ffffff']],
  bird:[['#5b9bd5','#3b74ad','#e8f4ff'],['#f5d256','#d9ad2c','#fff8d8'],['#f39ac2','#d9709a','#ffe6f0']],
  rabbit:[['#f4f2ee','#d8d2c8','#f6b0c0'],['#c09070','#9a6e50','#f2d2c2'],['#a8a8b0','#80808a','#ecc8d4']],
};
const petSprCache={};
/* frame: 0 = idle, 1/2 = moving */
function petSprite(kind,ci,f){
  const key=kind+ci+f;if(petSprCache[key])return petSprCache[key];
  const [c,d,l]=(PET_PAL[kind]||PET_PAL.cat)[ci]||PET_PAL[kind][0];let s;
  if(kind==='cat')s=spr(18,15,R=>{
    if(!f){R(2,11,4,2,c);R(2,9,1,2,c);R(5,7,7,6,c);R(9,9,2,4,l);R(6,8,1,2,d);R(8,7,1,2,d);
      R(8,2,6,5,c);R(8,1,1,1,c);R(13,1,1,1,c);R(12,4,1,1,EYE);R(12,5,2,1,l);R(9,3,1,1,d);R(11,2,1,1,d);R(10,13,1,1,c);R(6,13,1,1,c);}
    else{R(3,6,10,4,c);R(5,6,1,2,d);R(8,6,1,2,d);R(4,9,8,1,l);R(11,3,5,5,c);R(11,2,1,1,c);R(15,2,1,1,c);R(14,5,1,1,EYE);R(14,6,2,1,l);R(12,3,1,1,d);R(1,2,1,3,c);R(2,4,1,2,c);
      if(f===1){R(4,10,1,3,c);R(7,10,1,2,c);R(10,10,1,3,c);R(12,10,1,2,c);}else{R(5,10,1,2,c);R(6,10,1,3,c);R(9,10,1,2,c);R(11,10,1,3,c);}}
  });
  else if(kind==='dog')s=spr(19,15,R=>{
    R(4,6,9,5,c);R(10,7,3,4,l);R(2,4,2,2,c);R(3,3,1,1,c);
    R(11,1,6,6,c);R(11,1,2,5,d);R(16,4,2,2,l);R(17,4,1,1,EYE);R(14,3,1,1,EYE);R(13,7,3,1,'#e85f5f');
    if(f===1){R(4,11,1,3,c);R(7,11,1,2,c);R(10,11,1,3,c);R(12,11,1,2,c);}
    else if(f===2){R(5,11,1,2,c);R(6,11,1,3,c);R(9,11,1,2,c);R(11,11,1,3,c);}
    else{R(5,11,1,3,c);R(7,11,1,3,c);R(10,11,1,3,c);R(12,11,1,3,c);}
  });
  else if(kind==='bird')s=spr(16,14,(R,g)=>{
    ell(g,7,8,4,3,c);ell(g,8,9,2,2,l);ell(g,10,5,3,3,c);R(11,4,1,1,EYE);R(13,5,2,1,'#f2a157');R(1,8,3,1,d);R(2,7,2,1,d);
    if(f===1)R(4,4,4,2,d);else R(4,7,4,2,d);
    if(!f){R(7,11,1,1,'#e08a3a');R(9,11,1,1,'#e08a3a');}
  });
  else s=spr(16,17,(R,g)=>{
    const o=f===1?-2:0;
    ell(g,6,12+o,4,3,c);ell(g,10,9+o,3,3,c);R(9,2+o,1,5,c);R(11,2+o,1,5,c);R(11,3+o,1,3,l);R(11,8+o,1,1,EYE);R(13,9+o,1,1,'#e87a90');
    ell(g,2,11+o,1.5,1.5,'#ffffff');
    if(f===1){R(3,14,3,1,d);R(9,13,2,2,c);}else{R(4,15,3,1,d);R(8,15,2,1,c);}
  });
  return petSprCache[key]=s;
}
const trail=[];
function petName(p){return p.name;}
function petHearts(p){return Math.min(5,Math.floor(p.bond/20));}
function snapPets(){trail.length=0;let k=0;for(const p of state.pets){if(p.mode==='follow'){k++;p.x=P.x-10*k*(P.dir==='left'?-1:1);p.y=P.y+2;}else if(p.hx==null){p.hx=P.x;p.hy=P.y;p.x=p.hx;p.y=p.hy;}else{p.x=p.hx;p.y=p.hy;}}}
function updPets(dt){
  if(P.moving){const l=trail[trail.length-1];if(!l||Math.hypot(l.x-P.x,l.y-P.y)>=2){trail.push({x:P.x,y:P.y});if(trail.length>300)trail.shift();}}
  let k=0;
  for(const p of state.pets){
    let tx,ty,sp=95;
    if(p.mode==='follow'){k++;const t=trail[trail.length-1-k*8];if(!t){p.moving=false;continue;}tx=t.x;ty=t.y;}
    else{p.wt=(p.wt||0)-dt;if(p.wt<=0||p.tx==null){p.wt=1.5+Math.random()*3;const a=Math.random()*6.28,r=Math.random()*10;p.tx=p.hx+Math.cos(a)*r;p.ty=p.hy+Math.sin(a)*r*.6;}tx=p.tx;ty=p.ty;sp=20;}
    const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy);
    /* hysteresis: start walking past 3px, keep the walk pose until it has been still for 0.3s, so the sprite doesn't flicker between poses */
    if(d>(p.moving?0.6:3)){const m=Math.min(d,sp*dt*(d>40?2.5:1));p.x+=dx/d*m;p.y+=dy/d*m;p.moving=true;p.still=0;p.anim=(p.anim||0)+dt;if(Math.abs(dx)>1.5)p.dir=dx>0?1:-1;}
    else if(p.moving){p.still=(p.still||0)+dt;if(p.still>0.3)p.moving=false;else p.anim=(p.anim||0)+dt;}
  }
}
function drawPet(g,p,time){
  const x=Math.round(p.x),y=Math.round(p.y);
  let f=0;if(p.moving)f=p.kind==='rabbit'?(Math.floor(p.anim*6)%2):1+(Math.floor(p.anim*(p.kind==='bird'?10:7))%2);
  p.lift=(p.lift||0)+((p.kind==='bird'&&p.moving?3:0)-(p.lift||0))*0.15;const s=petSprite(p.kind,p.ci,f),lift=Math.round(p.lift);
  g.fillStyle='rgba(40,30,30,.2)';g.fillRect(x-4,y-1,8,2);
  const sx=x-Math.floor(s.width/2),sy=y-s.height+1-lift;
  if((p.dir||1)<0){g.save();g.translate(sx+s.width,sy);g.scale(-1,1);g.drawImage(s,0,0);g.restore();}else g.drawImage(s,sx,sy);
}
function petMenu(p){
  const food=PET_FOOD[p.kind],have=state.inv[food],K=Lp.pets.kinds[p.kind];
  sfx(p.kind);const mood=p.bond>=60?'petMood2':p.bond>=25?'petMood1':'petMood0';
  talk(p.name,[K.sound+' '+tr(mood,{p:p.name})],[
    {label:doneTag(p,'pet',tr('petPet',{p:p.name})),disabled:!!p.done.pet,fn:()=>petAct(p,'pet')},
    {label:doneTag(p,'feed',tr('petFeed',{f:ITEM_ICONS[food]+itemLabel(food),x:have})),disabled:!!p.done.feed||have<1,fn:()=>petAct(p,'feed')},
    {label:doneTag(p,'play',tr('petPlay')),disabled:!!p.done.play,fn:()=>petAct(p,'play')},
    {label:p.mode==='follow'?tr('petStay'):tr('petFollow'),fn:()=>togglePetMode(p)},
    {label:tr('petBye'),fn:null}]);
}
function petBond(p,d){sfx('heart');const before=petHearts(p);p.bond=Math.min(100,p.bond+d);heart(p.x,p.y-14);if(petHearts(p)>before||d>0)notify(tr('bondToast',{p:p.name,x:petHearts(p)}));save();}
function petAct(p,k){
  p.done[k]=true;const N=state.need;
  if(k==='pet'){N.mood=clampN(N.mood+5);petBond(p,4);say(p.name,tr('petPetDone',{p:p.name}));}
  else if(k==='feed'){state.inv[PET_FOOD[p.kind]]--;petBond(p,10);updateHud();say(p.name,tr('petFed',{p:p.name}));}
  else busyFade(()=>{advanceTime(30);N.energy=clampN(N.energy-5);N.mood=clampN(N.mood+8);updateHud();},()=>{petBond(p,8);say(p.name,tr('petPlayDone',{p:p.name}));});
}
function togglePetMode(p){
  if(p.mode==='follow'){p.mode='stay';p.hx=p.x;p.hy=p.y;p.tx=null;say(p.name,tr('petStayDone',{p:p.name}));}
  else{p.mode='follow';say(p.name,tr('petFollowDone',{p:p.name}));}
  save();
}
function adoptMenu(){
  const full=state.pets.length>=3,cands=PET_KINDS.map(k=>({k,ci:Math.floor(Math.random()*3)}));
  talk(objName('adopt'),[full?tr('adoptFull'):tr('adoptQ')],
    cands.map(c=>({label:`${PET_ICON[c.k]} `+tr('adoptOpt',{c:Lp.pets.colors[c.k][c.ci],k:Lp.pets.kinds[c.k].name}),disabled:full,fn:()=>nameMenu(c)}))
      .concat([{label:tr('never'),fn:null}]));
}
function nameMenu(c){
  const pool=Lp.pets.names.filter(x=>!state.pets.some(p=>p.name===x)),picks=[];
  while(picks.length<3&&pool.length)picks.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  talk(objName('adopt'),[tr('adoptName',{k:Lp.pets.kinds[c.k].name})],picks.map(x=>({label:x,fn:()=>adopt(c,x)})).concat([{label:tr('optBack'),back:true,fn:adoptMenu}]));
}
function adopt(c,name){
  const p={kind:c.k,ci:c.ci,name,bond:10,mode:'follow',done:{},x:P.x,y:P.y+4,dir:1,anim:0};
  sfx(c.k);setTimeout(()=>sfx('levelup'),350);state.pets.push(p);state.need.mood=clampN(state.need.mood+15);
  for(let i=0;i<4;i++)setTimeout(()=>heart(p.x+(Math.random()*12-6),p.y-14),i*120);
  updateHud();save();notify(tr('adoptDone',{p:name}));say(name,Lp.pets.kinds[c.k].sound);
}
function petAt(fx,fy){return state.pets.find(p=>Math.hypot(p.x-fx,p.y-4-fy)<12);}
function petSeenBy(n){return state.pets.find(p=>p.kind===NPC_PET[n.id]&&Math.hypot(p.x-n.x,p.y-n.y)<56);}
const summoned=n=>state.summon===state.day&&MEN.includes(n.id);
function nearPlayerTiles(){
  /* a loose ring 2-3 tiles out, skipping spots other people are standing on or heading to */
  const px=Math.floor(P.x/16),py=Math.floor((P.y-2)/16),taken=new Set();
  for(const m of npcs){if(m.state==='away')continue;taken.add(Math.floor(m.x/16)+','+Math.floor((m.y-2)/16));if(m.path&&m.path.length){const e=m.path[m.path.length-1];taken.add(e[0]+','+e[1]);}}
  const ring=[],near=[];
  for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const d=Math.abs(dx)+Math.abs(dy);if(d<1||d>3)continue;const x=px+dx,y=py+dy;if(!npcPassable(x,y,true))continue;
    if(d>=2&&!taken.has(x+','+y))ring.push([x,y]);else if(d>=2)near.push([x,y]);}
  return ring.length?ring:near;
}
function pickGold(){
  state.goldFound=true;state.inv.gold=(state.inv.gold||0)+1;updateHud();save();
  talk(tr('goldWho'),[tr('goldFound')],[{label:tr('goldUse'),fn:useGold},{label:tr('goldKeep'),fn:()=>say(tr('goldWho'),tr('goldKept'))}]);
}
function useGold(){
  if((state.inv.gold||0)<1)return;
  sfx('magic');state.inv.gold--;state.summon=state.day;
  npcs.filter(n=>MEN.includes(n.id)).forEach(n=>{Object.assign(rel(n),{pts:100,met:true,knowGift:true,knowStyle:true,m3:true,m6:true,m8:true});n.idle=0;n.path=null;n.leaving=false;});
  for(let i=0;i<10;i++)setTimeout(()=>heart(P.x+(Math.random()*24-12),P.y-24-Math.random()*10),i*90);
  updateHud();save();notify(tr('goldUsed'));
  talk(tr('goldWho'),[tr('goldCall')].concat(npcs.filter(n=>MEN.includes(n.id)).map(n=>tr('quoteLine',{n:nm(n),s:nt(n).summon}))));
}

/* ---------------- home life (living together) ---------------- */
const ROUTINE=[
  {k:'cook1',task:'cook',a:7*60,b:8.5*60,meal:'breakfast'},
  {k:'sweep',task:'sweep',a:9.5*60,b:11*60},
  {k:'gym',task:'gym',a:14*60,b:15.5*60},
  {k:'cook2',task:'cook',a:17.5*60,b:19*60,meal:'dinner'},
];
const STOVE_SPOT=[13,5],GYM_SPOT=[14,7],LAMP_POS=[10*16+8,8*16+2];
const SWEEP_SPOTS=[[4,6],[5,7],[8,7],[9,6],[4,8],[8,8],[13,6],[14,5],[12,6]];
const puffs=[];
function routineNow(){const t=state.time;return ROUTINE.find(r=>t>=r.a&&t<r.b)||null;}
function partnerTask(n){if(!rel(n).livesIn||summoned(n))return null;const r=routineNow();return r?r.task:null;}
function checkChores(){
  const ph=partnerHome();if(!ph)return;
  if(!state.chores||state.chores.day!==state.day){state.chores={day:state.day};}
  const c=state.chores;
  for(const r of ROUTINE){
    if(c[r.k]||state.time<r.b||state.time>=r.b+240)continue;
    c[r.k]=true;
    if(r.meal){state.meal=r.meal;state.mealDay=state.day;notify(tr('choreCook',{n:nm(ph),m:tr(r.meal)}));sfx('ding');}
    else if(r.task==='sweep'){state.need.mood=clampN(state.need.mood+5);notify(tr('choreSweep',{n:nm(ph)}));sfx('pickup');updateHud();}
    else{notify(tr('choreGym',{n:nm(ph)}));sfx('heart');}
    save();
  }
}
function updPuffs(dt,time){
  const ph=partnerHome();
  if(ph&&ph.working){ph.pt=(ph.pt||0)-dt;if(ph.pt<=0){
    if(ph.working==='cook'){ph.pt=0.35;puffs.push({x:STOVE_SPOT[0]*16+5+Math.random()*6,y:4*16+2,t:0,k:'steam'});}
    else if(ph.working==='sweep'){ph.pt=0.45;puffs.push({x:ph.x+(ph.dir==='left'?-8:8),y:ph.y-1,t:0,k:'dust'});}
    else ph.pt=1;}}
  for(let i=puffs.length-1;i>=0;i--){puffs[i].t+=dt;if(puffs[i].t>1.1)puffs.splice(i,1);}
}
function drawPuffs(g){
  for(const p of puffs){const a=Math.max(0,1-p.t/1.1);
    if(p.k==='steam'){g.fillStyle=`rgba(255,255,255,${(a*.7).toFixed(2)})`;const r=1+Math.floor(p.t*3);g.fillRect(Math.round(p.x+Math.sin(p.t*6)*2),Math.round(p.y-p.t*14),r,r);}
    else{g.fillStyle=`rgba(190,160,120,${(a*.6).toFixed(2)})`;const r=1+Math.floor(p.t*3);g.fillRect(Math.round(p.x-r/2+p.t*4),Math.round(p.y-p.t*5),r,r);}}
}
function drawChoreProps(g,n,time){
  const x=Math.round(n.x),y=Math.round(n.y);
  if(n.working==='sweep'){
    const s=n.dir==='left'?-1:1,sw=Math.sin(time*8)>0?1:0,bx=x+s*7+sw*s;
    g.fillStyle='#2a1e24';for(let i=0;i<9;i++)g.fillRect(bx-s*Math.floor(i/3),y-14+i,2,1);
    g.fillStyle='#a46f45';for(let i=0;i<9;i++)g.fillRect(bx-s*Math.floor(i/3),y-14+i,1,1);
    g.fillStyle='#2a1e24';g.fillRect(bx-s*3-2,y-5,6,4);g.fillStyle='#f2c46b';g.fillRect(bx-s*3-1,y-4,4,2);
  } else if(n.working==='gym'){
    const up=Math.sin(time*5)>0;const hy=y-(up?17:12);
    g.fillStyle='#2a1e24';g.fillRect(x-10,hy-1,5,4);g.fillRect(x+5,hy-1,5,4);
    g.fillStyle='#7d8b9a';g.fillRect(x-9,hy,3,2);g.fillRect(x+6,hy,3,2);
  }
}
function personY(n,time){return n.working==='gym'&&Math.sin(time*5)<=0?n.y+1:n.y;}
function eatMeal(){
  const ph=partnerHome(),N=state.need;if(!ph||!state.meal)return;
  const m=state.meal;state.meal=null;sfx('eat');
  busyFade(()=>{advanceTime(30);N.hunger=clampN(N.hunger+50);N.mood=clampN(N.mood+10);updateHud();save();},
    ()=>{D.npc=ph;talk(objName('table'),[tr('mealAte',{n:nm(ph),m:tr(m)})],null,()=>addPts(ph,2));});
}
const RECIPES=[
  {label:'cookFish', ingredients:{fish:1}, hunger:60, mood:4},
  {label:'cookCake', ingredients:{berry:2}, hunger:35, mood:10},
  {label:'cookStew', ingredients:{carrot:1,pumpkin:1}, hunger:65, mood:12},
  {label:'cookCarp', ingredients:{carp:1}, hunger:68, mood:6},
  {label:'cookMoonfish', ingredients:{moonfish:1}, hunger:60, mood:12}
];
const canCook=recipe=>Object.entries(recipe.ingredients).every(([k,count])=>state.inv[k]>=count);
function stoveMenu(){
  const opts=RECIPES.map(recipe=>{
    const stock=Object.keys(recipe.ingredients).map(k=>`${ITEM_ICONS[k]} ×${state.inv[k]}`).join(' · ');
    return {label:`${tr(recipe.label)} · ${stock}`,disabled:!canCook(recipe),fn:()=>cookDish(recipe)};
  });
  talk(objName('stove'),[tr('stoveQ')],opts.concat({label:tr('walkAway'),fn:null}));
}
function cookDish(recipe){
  if(!canCook(recipe))return;
  const N=state.need,ph=partnerHome();sfx('ding');
  busyFade(()=>{
    advanceTime(40);
    for(const [k,count] of Object.entries(recipe.ingredients))state.inv[k]-=count;
    N.hunger=clampN(N.hunger+recipe.hunger);
    N.mood=clampN(N.mood+recipe.mood+(ph?5:0));
    updateHud();save();
  },
    ()=>{say(objName('stove'),tr('cookDone')+(ph?' '+tr('cookWith',{n:nm(ph)}):''));if(ph)addPts(ph,2);});
}
function workout(){
  const N=state.need,ph=partnerHome();
  if(N.energy<15){say(objName('gym'),tr('gymTired'));return;}
  sfx('pop');
  busyFade(()=>{advanceTime(30);N.energy=clampN(N.energy-12);N.mood=clampN(N.mood+10);updateHud();save();},
    ()=>{say(objName('gym'),ph?tr('gymWith',{n:nm(ph)}):tr('gymDone'));if(ph)addPts(ph,2);});
}
function helpChore(n){
  const r=rel(n),N=state.need;r.done.help=true;D.npc=n;
  busyFade(()=>{advanceTime(30);N.energy=clampN(N.energy-6);N.mood=clampN(N.mood+6);updateHud();},
    ()=>{D.npc=n;talk(nm(n),[tr('helpDone',{n:nm(n)})],null,()=>addPts(n,3));});
}
function cuddle(n){
  const r=rel(n);r.done.cuddle=true;D.npc=n;
  for(let i=0;i<4;i++)setTimeout(()=>heart((n.x+P.x)/2+(Math.random()*12-6),Math.min(n.y,P.y)-24),i*130);
  talk(nm(n),[nt(n).cuddle],null,()=>{addPts(n,2);state.need.mood=clampN(state.need.mood+12);updateHud();});
}
function nightTogether(n){
  D.npc=n;sfx('heart');
  talk(nm(n),[nt(n).night],null,()=>{
    for(let i=0;i<8;i++)setTimeout(()=>heart((n.x+P.x)/2+(Math.random()*20-10),Math.min(n.y,P.y)-26-Math.random()*8),i*90);
    setTimeout(()=>talk(tr('home'),[tr('nightFade',{n:nm(n)})],null,()=>sleepNight(n)),500);
  });
}
function homeOptions(n){
  const r=rel(n),o=[];
  if(!r.livesIn)return o;
  if(n.working)o.push({label:doneTag(r,'help',tr('optHelp',{n:nm(n),x:tr('task_'+n.working)})),disabled:!!r.done.help,fn:()=>helpChore(n)});
  o.push({label:doneTag(r,'cuddle',tr('optCuddle')),disabled:!!r.done.cuddle,fn:()=>cuddle(n)});
  if(state.time>=21*60||state.time<5*60)o.push({label:tr('optNight'),fn:()=>nightTogether(n)});
  return o;
}
