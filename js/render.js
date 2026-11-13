"use strict";

/* ---------------- render ---------------- */
const cv=$('#game'),ctx=cv.getContext('2d');let scale=3;
function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,3);
  cv.width=Math.max(1,Math.floor(innerWidth*dpr));cv.height=Math.max(1,Math.floor(innerHeight*dpr));
  cv.style.width=innerWidth+'px';cv.style.height=innerHeight+'px';
  scale=Math.max(1,Math.floor(Math.min(cv.width/(16*15),cv.height/(16*10))));
}
addEventListener('resize',resize);resize();
function cameraOrigin(){
  const vw=cv.width/scale,vh=cv.height/scale,mw=MW*16,mh=MH*16;
  const x=vw>=mw?(mw-vw)/2:Math.max(0,Math.min(mw-vw,P.x-vw/2));
  const y=vh>=mh?(mh-vh)/2:Math.max(0,Math.min(mh-vh,P.y-10-vh/2));
  return [Math.round(x*scale)/scale,Math.round(y*scale)/scale];
}
const fireflies=[];{const rnd=mulberry32(77);for(let i=0;i<18;i++){let x,y;do{x=1+rnd()*(MW-2);y=1+rnd()*(MH-2);}while(map[(y|0)*MW+(x|0)]!==G);fireflies.push({x:x*16,y:y*16,p:rnd()*6.28,s:.5+rnd()});}}
function drawArrow(g,x,y){x=Math.round(x);y=Math.round(y);const F=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(x+a,y+b,w,h);};
  F(-3,-1,7,2,'#2a1e24');F(-2,1,5,1,'#2a1e24');F(-1,2,3,1,'#2a1e24');F(0,3,1,1,'#2a1e24');
  F(-2,0,5,1,'#fff6e6');F(-1,1,3,1,'#fff6e6');F(0,2,1,1,'#fff6e6');}
function drawBang(g,x,y,col){x=Math.round(x);y=Math.round(y);g.fillStyle='#2a1e24';g.fillRect(x-2,y-1,5,9);g.fillStyle=col||'#ffd45e';g.fillRect(x-1,y,3,4);g.fillRect(x-1,y+5,3,2);}
function drawHeart(g,x,y,a){g.globalAlpha=a;x=Math.round(x);y=Math.round(y);g.fillStyle='#2a1e24';g.fillRect(x-3,y-1,7,4);g.fillRect(x-2,y+3,5,1);g.fillRect(x-1,y+4,3,1);
  g.fillStyle='#ff6b8a';g.fillRect(x-2,y,2,1);g.fillRect(x+1,y,2,1);g.fillRect(x-2,y+1,5,2);g.fillRect(x-1,y+3,3,1);g.fillStyle='#ffc2d0';g.fillRect(x-2,y,1,1);g.globalAlpha=1;}
function drawWindows(g,night,blackout){
  [6,9,14].forEach(x=>{const px=x*16+2,py=36,F=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(px+a,py+b,w,h);};
    F(-1,-1,14,12,'#7d4b2d');F(0,0,12,10,blackout?'#53647b':night?'#2c3f78':'#bfe6f5');
    if(!blackout){
      if(night){F(8,2,1,1,'#fff3a0');F(3,6,1,1,'#fff3a0');F(9,7,1,1,'#c9d4ff');}
      else{F(1,1,4,1,'#eaf8fd');F(1,2,2,1,'#eaf8fd');F(7,6,3,1,'#ffffff');}
    }
    F(5,0,2,10,'#7d4b2d');F(0,4,12,1,'#7d4b2d');F(-3,-1,3,11,'#f29ac0');F(12,-1,3,11,'#f29ac0');F(-3,-1,3,1,'#d9709a');F(12,-1,3,1,'#d9709a');});
}
let frameImage=null,frameImageSource=null;
function drawKeepsakeFrame(g){
  const {x,y,width,height}=KEEPSAKE_FRAME;
  const source=state.album.framed?.image??null;
  if(frameImageSource!==source){
    frameImageSource=source;
    frameImage=source?new Image():null;
    if(frameImage)frameImage.src=source;
  }
  if(!frameImage)return;
  g.fillStyle='#5f3d35';g.fillRect(x-2,y-2,width+4,height+4);
  g.fillStyle='#c99868';g.fillRect(x-1,y-1,width+2,height+2);
  g.fillStyle='#f3d6a3';g.fillRect(x,y,width,height);
  if(frameImage.complete&&frameImage.naturalWidth===width&&frameImage.naturalHeight===height)g.drawImage(frameImage,x,y);
}
function glow(g,x,y,r,col){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
function drawPerson(g,o,dir,fr,px,py){const x=Math.round(px),y=Math.round(py);g.fillStyle='rgba(40,30,30,.22)';g.fillRect(x-5,y-1,10,2);g.fillRect(x-4,y+1,8,1);blitChar(g,o,dir,fr,x-10,y-25);}
function drawVillageWork(g,n,time){
  const duty=villageDuty(n);
  if(!duty?.id||n.moving||Math.hypot(n.x-duty.spot[0]*16-8,n.y-duty.spot[1]*16-12)>18)return;
  const x=Math.round(n.x),y=Math.round(n.y),t=reducedMotion?0:time;
  const rect=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(x+a,y+b,w,h);};
  if(duty.id==='cafe'){
    rect(5,-12,4,4,'#f4dbb5');rect(9,-11,1,2,'#f4dbb5');
    rect(6,-14-(Math.floor(t*2)%2),1,2,'#e1d8c8');
  }else if(duty.id==='court'){
    const bounce=Math.round(Math.abs(Math.sin(t*4))*10);
    rect(7,-3-bounce,4,4,'#ae6848');rect(8,-3-bounce,2,1,'#f2b276');
  }else if(duty.id==='stage'){
    rect(-7,-12,5,4,'#ba8459');rect(-3,-13,6,2,'#d6a579');
    const note=Math.floor(t*2)%6;rect(8,-20-note,3,2,'#e7c5e7');rect(10,-24-note,1,5,'#e7c5e7');
  }else{
    rect(6,-11,5,4,'#f2dfbd');rect(7,-10,3,1,'#8da5bc');
  }
}
function drawTunnel(g,x,y,winter){
  const r=(a,b,w,h,color)=>{g.fillStyle=color;g.fillRect(x+a,y+b,w,h);};
  r(0,7,16,8,'rgba(150,220,211,.26)');
  r(1,5,14,2,'rgba(198,239,234,.66)');
  r(4,3,8,2,'rgba(214,244,238,.82)');
  r(0,7,1,8,'#5f8e88');r(15,7,1,8,'#5f8e88');
  r(1,13,3,2,'#5f8e88');r(12,13,3,2,'#5f8e88');
  if(winter){r(5,2,6,1,'#ffffff');r(3,4,10,1,'#e7f4f4');}
}
const reducedMotion=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function drawSeasonParticles(g,time,winter){
  const t=reducedMotion?0:time;
  for(let i=0;i<(winter?154:43);i++){
    const x=(hash2(i,7)*MW*TILE+t*(winter?4:11))%(MW*TILE)|0;
    const y=(hash2(i,13)*MH*TILE+t*(7+hash2(i,31)*7))%(MH*TILE)|0;
    const tile=at(x>>4,y>>4);
    if(tile===FLOOR||tile===DOOR||tile===WALL||tile===WALLF)continue;
    g.fillStyle=winter?(i%3===0?'#d5e6f1':'#fbfdf8'):(i%2===0?'#d89248':'#b87043');
    g.fillRect(x,y,i%3===0?2:1,1);
  }
}
function drawRiverClue(g,kind,x,y,time){
  const R=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(x+a,y+b,w,h);};
  if(kind==='apron'){
    R(-4,-3,8,5,'#65464a');R(-3,-3,6,4,'#c8b0a2');R(-2,-5,4,3,'#65464a');R(-1,-4,2,2,'#d8c1ab');R(-2,-1,3,1,'#b97971');
  }else{
    R(-2,-2,5,4,'#4b5b69');R(-1,-2,3,3,'#7bb7b7');R(-1,-2,1,1,'#f5eed1');
    if(Math.sin(time*2)>.4)R(3,-4,1,1,'#fff4cf');
  }
}
function drawRiverWeather(g,time,weather,umbrella){
  if(weather==='clear'||reducedMotion)return;
  for(let i=0;i<96;i++){
    const x=(hash2(i,51)*MW*TILE+time*(weather==='rain'?27:43))%(MW*TILE)|0;
    const y=(hash2(i,83)*MH*TILE+time*(weather==='rain'?101:6))%(MH*TILE)|0;
    const tile=at(x>>4,y>>4);
    if(tile===FLOOR||tile===DOOR||tile===WALL||tile===WALLF)continue;
    if(umbrella&&Math.abs(x-P.x)<14&&y+5>P.y-31&&y<P.y)continue;
    g.fillStyle=weather==='rain'?'rgba(196,223,224,.63)':'rgba(255,238,185,.58)';
    g.fillRect(x,y,weather==='rain'?1:2,weather==='rain'?5:1);
  }
}
function drawProjectDisplay(g,prop){
  if(prop.id==='studio'&&state.projects.hung){
    const light=state.projects.hung,draft=state.projects.drafts[light];
    const key=[light,draft.frame,draft.palette].join(':');
    if(key!==studioDisplayKey){
      studioDisplayKey=key;studioDisplay=mk(96,60);
      drawVillageSketch(studioDisplay.getContext('2d'),light,draft);
    }
    g.drawImage(studioDisplay,prop.x*16+31,(prop.y+prop.h)*16-18,18,11);
  }
  const menu=state.projects.cafe;
  if(prop.id==='cafeHouse'&&menu&&state.day>=VillageProjects.menuDay(menu.day)){
    const x=prop.x*16+48,y=(prop.y+prop.h)*16-28;
    g.fillStyle='#513d38';g.fillRect(x,y,16,8);
    g.fillStyle='#7e6660';g.fillRect(x+1,y+1,14,6);
    g.fillStyle='#eaddb7';g.fillRect(x+3,y+2,10,1);g.fillRect(x+4,y+5,7,1);
  }
}
let studioDisplayKey='',studioDisplay;
function drawLantern(g,x,y){
  x=Math.round(x);y=Math.round(y);
  g.fillStyle='#543940';g.fillRect(x-2,y-10,5,5);g.fillRect(x-4,y-7,9,9);
  g.fillStyle='#ba8757';g.fillRect(x-1,y-9,3,2);g.fillRect(x-3,y-6,7,7);
  g.fillStyle='#ffe5a0';g.fillRect(x-2,y-5,5,5);
  g.fillStyle='#fff6d7';g.fillRect(x,y-4,2,3);
}
function drawBlackoutLight(g,cx,cy,w,h,time){
  const [dx,dy]=DV[P.dir];
  const x=Math.round(P.x+dx*6+(dx===0?7:0)),y=Math.round(P.y-8+dy*4);
  const radius=94+(reducedMotion?0:Math.sin(time*2.2)*1.5);
  drawLanternLighting(g,x,y,radius,cx,cy,w,h);
}
function drawLanternLighting(g,x,y,radius,cx,cy,w,h){
  const mask=g.createRadialGradient(x,y,0,x,y,radius);
  mask.addColorStop(0,'rgba(36,49,91,.02)');
  mask.addColorStop(.32,'rgba(36,49,91,.12)');
  mask.addColorStop(.70,'rgba(36,49,91,.54)');
  mask.addColorStop(1,'rgba(36,49,91,.70)');
  g.fillStyle=mask;g.fillRect(cx,cy,w,h);
  glow(g,x,y,radius*.87,'rgba(255,192,96,.38)');
  drawLantern(g,x,y);
}
function drawBlackoutGathering(g,record){
  const [tx,ty]=VillageMap.places[record.place].anchor;
  const x=tx*16,y=ty*16;
  const R=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(x+a,y+b,w,h);};
  if(record.place==='court'){
    const right=record.choice==='river'?1:-1;
    for(let i=0;i<6;i++){
      R(8+right*(9+i*6),18+(i%2)*3,3,2,'#8c756b');
      R(9+right*(9+i*6),18+(i%2)*3,2,1,'#e0c9a2');
    }
  }else if(record.place==='stage'){
    const row=record.choice==='circle'?[[0,8],[18,8],[0,22],[18,22]]:[[-2,18],[8,18],[18,18]];
    for(const [a,b] of row){R(a,b,7,5,'#5c4240');R(a+1,b,5,3,'#c29470');}
  }else{
    R(15,9,13,7,'#634640');R(16,9,11,4,'#cb9c75');
    R(18,8,2,3,'#ffe3b8');R(22,8,2,3,'#ffe3b8');
  }
}
function drawBlackoutLightForCard(g){
  drawLanternLighting(g,53,37,47,0,0,96,60);
}
const villageSprites=new Map();
function drawOutlinedVillageProp(g,prop,winter,night,time){
  const rate=prop.id==='cafe'?2:prop.id==='fountain'?3:1;
  const frame=rate===1?0:Math.floor(time*rate)%3;
  const key=[prop.id,prop.w,winter,night,frame].join(':');
  let sprite=villageSprites.get(key);
  if(!sprite){
    sprite=mk(prop.w*16+4,54);
    const art=sprite.getContext('2d');
    art.translate(2,52-16);
    VillageMap.paintProp(art,{id:prop.id,x:0,y:0,w:prop.w,h:1},winter,night,(frame+.5)/rate);
    // Same pixel contour as the cottage trees, with a one-pixel margin.
    outline(sprite,'#392a32');villageSprites.set(key,sprite);
  }
  g.drawImage(sprite,prop.x*16-2,(prop.y+prop.h)*16-52);
}
function render(time){
  updateMiniMap();
  ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#2a2230';ctx.fillRect(0,0,cv.width,cv.height);
  const S=scale,vw=cv.width/S,vh=cv.height/S,dark=darkness();
  const [cx,cy]=cameraOrigin(),blackout=blackoutActive();
  const greeting = villageGuideVisible() && !villageDestination ? firstGreetingTarget() : null;
  const weather=VillageRiverside.weather(state.day),ride=activeRide(),umbrella=activeUmbrella(weather,ride);
  ctx.setTransform(S,0,0,S,-cx*S,-cy*S);ctx.imageSmoothingEnabled=false;
  const season=CottageActivities.seasonOf(state.day),art=SEASON_ART[season],winter=season==='winter';
  ctx.drawImage(art.ground,0,0);
  const rainPlan=weather==='rain'&&activeDatePlan();
  if(rainPlan?.rainWalk&&rainPlan.day===state.day){
    const [tx,ty]=RAIN_DATE_MEETINGS[rainPlan.place].p;
    const x=tx*TILE+8,y=ty*TILE+10;
    ctx.fillStyle='#759da5';ctx.fillRect(x-6,y,12,3);ctx.fillRect(x-4,y-2,9,7);
    const ripple=reducedMotion?2:1+Math.floor(time*5)%4;
    ctx.fillStyle='#c7e0dd';ctx.fillRect(x-ripple,y-1,ripple*2,1);ctx.fillRect(x-ripple,y+3,ripple*2,1);
  }
  if(blackout){
    for(const record of Object.values(state.blackout.visits))drawBlackoutGathering(ctx,record);
  }
  if(villageDestination && walkRoute.length){
    ctx.fillStyle='#805148';
    for(const [x,y] of walkRoute) ctx.fillRect(Math.round(x)-2,Math.round(y)-3,4,4);
    ctx.fillStyle='#ffe1a2';
    for(const [x,y] of walkRoute) ctx.fillRect(Math.round(x)-1,Math.round(y)-2,2,2);
  }
  if(walkRoute.length){
    const [x,y]=walkRoute.at(-1).map(Math.round);
    ctx.fillStyle='#704844';ctx.fillRect(x-4,y-4,8,4);
    ctx.fillStyle='#ffe1a2';ctx.fillRect(x-3,y-3,6,2);
  }
  if(!winter)for(const [x,y] of waterTiles){const h=hash2(x,y);if(Math.sin(time*1.6+h*40)>0.82){ctx.fillStyle='#e2f6fc';ctx.fillRect(x*16+3+(h*8|0),y*16+4+(hash2(y,x)*8|0),3,1);}}
  if(VillageRiverside.exposed(state.day)){
    const [x,y]=VillageRiverside.glassTile;
    VillageMap.tile(ctx,x*16,y*16,'stone',false);
  }
  for(const [kind,[x,y]] of visibleRiverClues()){
    drawRiverClue(ctx,kind,x*16+8,y*16+10,reducedMotion?0:time);
  }
  drawWindows(ctx,dark>0.5,blackout);
  drawKeepsakeFrame(ctx);
  state.garden.forEach((plot,i)=>{
    if(!plot)return;
    const x=(17+i%6)*16,y=(13+Math.floor(i/6))*16;
    if(plot.watered){
      ctx.fillStyle='rgba(65,45,58,.26)';ctx.fillRect(x+1,y+2,14,12);
      ctx.fillStyle='#89c7df';ctx.fillRect(x+12,y+10,1,2);
    }
    if(plot.crop==='mysteryBloom'&&CottageActivities.ripe(plot)){
      CottageEvents.bloom(ctx,x+8,y+3);return;
    }
    const sprout=CottageActivities.ripe(plot)
      ?SPR[plot.crop==='berry'?'berryRipe':plot.crop]
      :plot.growth?SPR.berryLeaf:SPR.sprout;
    ctx.drawImage(sprout,x,y);
  });
  for(const i of state.tunnels){
    const x=(17+i%6)*16,y=(13+Math.floor(i/6))*16;
    drawTunnel(ctx,x,y,winter);
  }
  if(!winter)for(const f of flowers)if(!f.picked){const sway=Math.sin(time*2+f.tx)>0.6?1:0;ctx.drawImage(SPR.flower[f.col],f.tx*16+sway,f.ty*16);}
  if(FISH.on&&FISH.snow){
    const rival=FISH.snow,xy=snowResident();
    ctx.strokeStyle='#b0bac3';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(xy.x,xy.y-12);
    ctx.lineTo(xy.x,6*16+8);ctx.stroke();
    ctx.fillStyle=rival.elapsed>=rival.rival?'#ffe89d':'#ce815e';
    ctx.fillRect(xy.x-1,6*16+7,2,2);
  }
  if(FISH.on&&FISH.phase!=='snowWait'){const bx=FISH.tx*16+8,by=FISH.ty*16+8+(FISH.phase==='bite'?2:(Math.sin(time*3)>0?1:0));
    ctx.strokeStyle='rgba(255,245,216,.65)';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(P.x,P.y-12);ctx.lineTo(bx,by);ctx.stroke();
    ctx.fillStyle='#2a1e24';ctx.fillRect(bx-2,by-2,5,5);ctx.fillStyle='#ffffff';ctx.fillRect(bx-1,by-1,3,1);ctx.fillStyle='#e8384f';ctx.fillRect(bx-1,by,3,2);
    if(FISH.phase==='bite'){ctx.fillStyle='#e2f6fc';ctx.fillRect(bx-5,by+3,3,1);ctx.fillRect(bx+3,by+3,3,1);}}
  const ents=[];
  for(const prop of VillageMap.props){
    const x=prop.x*16,y=(prop.y+prop.h)*16;
    if(x+prop.w*16>cx&&x<cx+vw&&y>cy&&y-52<cy+vh)
      ents.push({key:y-1,draw:g=>{
        drawOutlinedVillageProp(g,prop,winter,!blackout&&dark>.5,time);drawProjectDisplay(g,prop);
      }});
  }
  for(const s of statics)if(s.x+s.w>cx&&s.x<cx+vw&&s.y+s.h>cy&&s.y<cy+vh)ents.push(s);
  ents.push({key:P.y,draw:g=>{
    if(ride)CottageTravel.paint(g,ride,P.x,P.y,P.dir,false);
    if(ride!=='car')drawPerson(g,state.o,P.dir,!ride&&P.moving?WALK[Math.floor(P.anim*7)%4]:0,P.x,P.y-(ride?2:0));
    if(ride)CottageTravel.paint(g,ride,P.x,P.y,P.dir,true);
    if(umbrella)CottageTravel.paintUmbrella(g,P.x,P.y,P.dir);
    if(FISH.on&&FISH.phase==='bite'){
      const x=Math.round(P.x)-9,y=Math.round(P.y)-29;
      drawBang(g,P.x,P.y-39,'#ff6b6b');
      g.fillStyle='#44342d';g.fillRect(x,y,18,4);
      g.fillStyle='#ffcf67';g.fillRect(x+1,y+1,Math.ceil(16*FISH.t/FISH.window),2);
    }
  }});
  for(const n of npcs){if(n.state==='away')continue;ents.push({key:n.y,draw:g=>{drawPerson(g,n.outfit,n.dir,n.moving?WALK[Math.floor(n.anim*6)%4]:0,n.x,personY(n,time));drawChoreProps(g,n,time);drawVillageWork(g,n,time);
    if(lanternReaction?.n===n&&n.id==='xy'){
      const x=Math.round(n.x)+(n.dir==='left'?-1:1)*8,y=Math.round(n.y);
      const wave=reducedMotion?0:Math.floor(time*5)%2;
      g.fillStyle='#392a32';g.fillRect(x,y-21-wave,3,6+wave);
      g.fillStyle='#f4c8a4';g.fillRect(x+1,y-22-wave,2,3);
    }
    const r=rel(n);if(r.couple)drawHeart(g,n.x,n.y-33+(Math.sin(time*3)>0?-1:0),0.95);else if(!r.met && greeting?.resident!==n)drawBang(g,n.x,n.y-36+(Math.sin(time*4)>0?-1:0));}});}
  for(const p of state.pets)ents.push({key:p.y,draw:g=>drawPet(g,p,time)});
  if(!state.goldFound){const gx=GOLD_TILE[0]*16+8,gy=GOLD_TILE[1]*16+12;ents.push({key:gy,draw:g=>{const b=Math.sin(time*3)>0?-1:0;g.fillStyle='rgba(40,30,30,.18)';g.fillRect(gx-4,gy-1,8,2);g.drawImage(SPR.gold,gx-6,gy-15+b);
    const tw=(Math.sin(time*5)+1)/2;g.fillStyle=`rgba(255,250,200,${tw.toFixed(2)})`;g.fillRect(gx-8,gy-17,1,3);g.fillRect(gx-9,gy-16,3,1);g.fillRect(gx+7,gy-8,1,3);g.fillRect(gx+6,gy-7,3,1);}});}
  ents.push({key:cat.y,draw:g=>{
    const x=Math.round(cat.x),y=Math.round(cat.y),s=cat.state==='walk'?SPR.catW[Math.floor(cat.anim*6)%2]:SPR.catSit;
    g.fillStyle='rgba(40,30,30,.2)';g.fillRect(x-5,y-1,10,2);
    if(cat.dir<0){g.save();g.translate(x+9,y-14);g.scale(-1,1);g.drawImage(s,0,0);g.restore();}else g.drawImage(s,x-9,y-14);
  }});
  ents.sort((a,b)=>a.key-b.key);for(const e of ents)e.draw(ctx,art);
  drawResidentMoments(ctx,time);
  if(readyVehicles().length||unreadAlbumPostcard()||hasNeighborMail()){
    const x=7*16+4,y=10*16-16+(Math.sin(time*4)>0?1:0);
    ctx.fillStyle='#714c48';ctx.fillRect(x-1,y-1,10,8);
    ctx.fillStyle='#fff1cd';ctx.fillRect(x,y,8,6);
    ctx.fillStyle='#d1917f';ctx.fillRect(x+1,y+1,2,1);ctx.fillRect(x+5,y+1,2,1);
    ctx.fillRect(x+3,y+2,2,2);
  }
  drawPuffs(ctx);
  for(const p of parts)drawHeart(ctx,p.x,p.y-p.t*14,Math.max(0,1-p.t/1.2));
  if(target&&!busy&&!dressOpen&&!diaryOpen&&!albumOpen&&!mapOpen&&!startOpen&&!D.modal&&!FISH.on)drawArrow(ctx,target.x,target.y+(Math.sin(time*6)>0?-1:0));
  if(dark>0&&!blackout){
    const h=state.time/60,dusk=h>=17&&h<20;
    ctx.fillStyle=dusk?`rgba(${Math.round(60-40*dark)},${Math.round(30-8*dark)},60,${(0.52*dark).toFixed(3)})`:`rgba(20,22,62,${(0.52*dark).toFixed(3)})`;
    ctx.fillRect(cx,cy,vw,vh);
    ctx.globalCompositeOperation='lighter';
    for(const lamp of VillageMap.props)if(lamp.id==='lamp'){
      const x=lamp.x*16+8,y=lamp.y*16-5;
      if(x>cx-25&&x<cx+vw+25&&y>cy-25&&y<cy+vh+25)glow(ctx,x,y,28,'rgba(255,204,128,.26)');
    }
    if(state.lamp){glow(ctx,LAMP_POS[0],LAMP_POS[1]-8,72,`rgba(255,190,100,${(0.3*dark).toFixed(3)})`);glow(ctx,LAMP_POS[0],LAMP_POS[1]-14,16,`rgba(255,220,140,${(0.35*dark).toFixed(3)})`);}
    if(dark>0.5){glow(ctx,6*16+8,2*16+9,14,'rgba(150,170,255,0.15)');glow(ctx,9*16+8,2*16+9,14,'rgba(150,170,255,0.15)');glow(ctx,14*16+8,2*16+9,14,'rgba(150,170,255,0.15)');
      state.garden.forEach((plot,i)=>{
        if(plot?.crop==='mysteryBloom'&&CottageActivities.ripe(plot)){
          const x=(17+i%6)*16+8,y=(13+Math.floor(i/6))*16+5;
          glow(ctx,x,y,12,'rgba(255,211,151,.34)');
          ctx.fillStyle='#fff0bc';ctx.fillRect(x,y,1,1);
        }
      });
      if(!winter)for(const f of fireflies){const fx=f.x+Math.sin(time*f.s+f.p)*10,fy=f.y+Math.cos(time*f.s*.7+f.p)*7,a=(Math.sin(time*2.4*f.s+f.p)+1)/2*dark;
        if(a>.3){glow(ctx,fx,fy,5,`rgba(255,240,140,${(a*.5).toFixed(2)})`);ctx.fillStyle=`rgba(255,250,190,${a.toFixed(2)})`;ctx.fillRect(Math.round(fx),Math.round(fy),1,1);}}}
    ctx.globalCompositeOperation='source-over';
    drawNightVisitor(ctx,time);
  }
  if(winter||season==='autumn')drawSeasonParticles(ctx,time,winter);
  drawRiverWeather(ctx,time,weather,umbrella);
  if(blackout)drawBlackoutLight(ctx,cx,cy,vw,vh,time);
  if(greeting && (greeting.inside || target?.n!==greeting.resident)) drawBang(ctx,greeting.x,greeting.y,'#ffe0a5');
  renderLanternReaction(cx,cy);
}
