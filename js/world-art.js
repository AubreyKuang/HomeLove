"use strict";

/* ---------------- sprites ---------------- */
const SPR={};
const SEASON_ART={
  spring:{grass:['#a8d985','#90c875','#c1e6a1'],tree:['#668e54','#82b36e','#c4df8c','#f2a9bf']},
  summer:{grass:['#8fd16f','#76bb5a','#a9e08a'],tree:['#3f8a46','#55a552','#72c062','#f5d477']},
  autumn:{grass:['#d8b86e','#bd9a58','#ebd28d'],tree:['#a66c3e','#d69a42','#f0bc59','#e07648']},
  winter:{grass:['#e6eff4','#cadce8','#f9fbf5'],tree:['#607e7a','#779693','#bbd6dd','#eef5f4']}
};
function mkTree(v,season){return spr(26,34,(R,g)=>{
  R(11,22,4,10,'#8a5a36');R(11,22,1,10,'#a06c42');R(14,22,1,10,'#6e4528');R(9,31,8,1,'#6e4528');
  const [shadow,leaf,light,accent]=SEASON_ART[season].tree;
  ell(g,13,13,11,10,shadow);ell(g,12,11,9,8,v===2&&season==='autumn'?'#c07b43':leaf);
  ell(g,10,8,5,4,light);
  const rnd=mulberry32(v*99+7);
  for(let i=0;i<10;i++)R(4+(rnd()*18|0),5+(rnd()*12|0),1,1,shadow);
  if(season==='winter'){
    R(6,6,10,2,accent);R(4,8,17,2,accent);R(5,10,8,2,light);R(14,9,7,2,accent);
    R(3,31,20,2,light);R(5,30,15,1,accent);return;
  }
  if(season==='spring'||season==='autumn'){
    for(let i=0;i<9;i++){const x=5+(rnd()*16|0),y=6+(rnd()*12|0);R(x,y,2,2,accent);R(x,y,1,1,light);}
    return;
  }
  if(v===1)for(let i=0;i<7;i++){const x=5+(rnd()*16|0),y=6+(rnd()*12|0);R(x,y,2,2,'#f6a5c0');R(x,y,1,1,'#ffd6e4');}
  if(v===2)for(let i=0;i<5;i++){const x=5+(rnd()*16|0),y=8+(rnd()*10|0);R(x,y,2,2,'#e85f5f');R(x,y,1,1,'#ff9a8a');}
});}
for(const season of CottageActivities.seasons){
  const [shadow,leaf,light,accent]=SEASON_ART[season].tree;
  SEASON_ART[season].trees=[mkTree(0,season),mkTree(1,season),mkTree(2,season)];
  SEASON_ART[season].bush=spr(18,15,(R,g)=>{
    ell(g,9,8,8,6,shadow);ell(g,8,7,6,4,leaf);
    if(season==='winter'){R(4,4,10,3,light);R(6,3,7,2,accent);}
    else{R(5,9,1,1,accent);R(12,6,1,1,accent);R(10,10,1,1,accent);}
  });
}
SPR.wardrobe=spr(32,34,R=>{
  R(2,3,28,29,'#a86a40');R(1,1,30,3,'#8c5532');R(1,1,30,1,'#b97a4c');
  R(4,6,11,24,'#c4844f');R(17,6,11,24,'#c4844f');
  [[6,8],[6,19],[19,8],[19,19]].forEach(([x,y])=>{R(x,y,7,9,'#b47343');R(x,y,7,1,'#d39563');});
  R(14,16,1,3,'#f5c842');R(17,16,1,3,'#f5c842');R(3,32,3,1,'#6e4228');R(26,32,3,1,'#6e4228');
});
SPR.mirror=spr(16,32,R=>{
  R(3,3,10,24,'#d1a061');R(6,1,4,2,'#d1a061');R(5,5,6,20,'#c4e6f2');R(5,21,6,4,'#a9d6e6');
  R(6,7,1,5,'#ffffff');R(7,6,1,2,'#ffffff');R(9,14,1,3,'#e6f6fb');
  R(3,26,10,1,'#b98a50');R(4,27,2,3,'#a86a40');R(10,27,2,3,'#a86a40');
});
SPR.computer=spr(32,27,R=>{
  R(3,19,26,4,'#78503d');R(4,22,3,4,'#78503d');R(25,22,3,4,'#78503d');
  R(2,16,28,4,'#916249');R(3,16,26,2,'#dcab79');R(5,20,22,1,'#ad7855');
  R(9,2,15,11,'#4a3a48');R(10,3,13,8,'#638a9d');R(11,4,11,6,'#a3cbcf');
  R(12,5,6,1,'#e7f1dd');R(12,7,3,1,'#7299aa');R(20,5,1,4,'#789aab');
  R(15,13,3,3,'#66515a');R(13,15,7,1,'#4a3a48');
  R(10,17,12,2,'#534651');R(11,17,10,1,'#c9b7a6');R(24,17,3,2,'#e2c8a5');
  R(4,13,3,3,'#da9490');R(5,12,1,2,'#7b9a76');
});
SPR.shelf=spr(32,34,R=>{
  R(1,1,30,32,'#8c5532');R(1,1,30,1,'#a86a40');R(3,3,26,28,'#5e3a22');R(3,12,26,2,'#8c5532');R(3,22,26,2,'#8c5532');
  const rnd=mulberry32(42),cols=['#e85f5f','#5b8ee0','#f5d256','#8bc46a','#9b7ad9','#f2a157','#55a89c','#f39ac2'];
  [12,22,31].forEach(bot=>{let x=4;while(x<27){const w=rnd()<.5?2:3,h=5+(rnd()*3|0),c=cols[rnd()*cols.length|0];if(x+w>28)break;R(x,bot-h,w,h,c);R(x,bot-h,w,1,shade(c,1.3));x+=w+(rnd()<.2?1:0);}});
});
SPR.bed=spr(32,40,R=>{
  R(1,1,30,11,'#a86a40');R(2,2,28,1,'#c4844f');R(1,11,1,26,'#8c5532');R(30,11,1,26,'#8c5532');R(2,11,28,25,'#fbf7f0');
  R(3,8,12,6,'#ffffff');R(17,8,12,6,'#ffffff');R(3,13,12,1,'#e6dfd3');R(17,13,12,1,'#e6dfd3');
  R(2,17,28,19,'#e86a6a');R(2,17,28,3,'#f6f2ea');
  for(let y=22;y<35;y+=4)for(let x=4;x<29;x+=4)R(x+((y/4)%2?2:0)-1,y,1,1,'#f6b0b0');
  R(1,36,30,3,'#a86a40');R(2,36,28,1,'#c4844f');
});
SPR.fridge=spr(16,34,R=>{R(2,2,12,30,'#eef2f4');R(2,2,12,1,'#ffffff');R(13,2,1,30,'#cfd8dd');R(2,13,12,1,'#b8c4ca');R(11,6,1,5,'#8a98a0');R(11,16,1,8,'#8a98a0');
  R(4,5,3,3,'#f39ac2');R(5,8,2,2,'#f5d256');R(4,18,4,3,'#ffffff');R(4,18,4,1,'#5b8ee0');R(3,32,2,1,'#6e4228');R(11,32,2,1,'#6e4228');});
SPR.stove=spr(16,26,R=>{R(1,8,14,16,'#d8d2ca');R(1,8,14,2,'#3b3b4f');R(3,8,4,2,'#5a5a6e');R(9,8,4,2,'#5a5a6e');R(3,12,10,8,'#3b3b4f');R(4,13,8,6,'#5b4a3a');R(4,13,8,1,'#f2a157');
  R(5,21,6,1,'#8a98a0');R(2,4,6,4,'#e85f5f');R(2,4,6,1,'#f28080');R(8,5,4,1,'#3b3b4f');R(10,3,3,4,'#a8a8b0');R(10,3,3,1,'#d8d8e0');});
SPR.counter=spr(32,26,R=>{R(1,8,30,16,'#a86a40');R(1,8,30,3,'#e8dcc8');R(1,10,30,1,'#c9b8a0');R(4,13,10,9,'#c4844f');R(17,13,11,9,'#c4844f');R(13,16,1,3,'#f5c842');R(17,16,1,3,'#f5c842');
  R(17,7,10,3,'#a9c6d6');R(18,8,8,1,'#d6eaf2');R(21,3,2,5,'#a8a8b0');R(21,3,4,1,'#a8a8b0');R(4,5,9,3,'#d99a52');R(6,4,3,2,'#8bc46a');R(9,4,2,2,'#e85f5f');});
SPR.gym=spr(16,26,R=>{R(2,6,2,18,'#3b3b4f');R(12,6,2,18,'#3b3b4f');R(2,6,12,2,'#5a5a6e');R(2,14,12,1,'#5a5a6e');
  R(3,9,10,1,'#7d8b9a');R(3,8,2,3,'#e85f5f');R(11,8,2,3,'#e85f5f');R(3,16,10,1,'#7d8b9a');R(3,15,2,3,'#5b8ee0');R(11,15,2,3,'#5b8ee0');
  R(5,20,6,4,'#3b3b4f');R(6,19,4,2,'#5a5a6e');R(7,18,2,1,'#3b3b4f');});
SPR.lamp=spr(16,26,R=>{
  R(2,13,12,11,'#a86a40');R(2,13,12,2,'#c4844f');R(3,18,10,1,'#8c5532');R(7,20,2,1,'#f5c842');
  R(6,10,4,3,'#7d8b9a');R(7,8,2,2,'#7d8b9a');R(5,3,6,1,'#f5d256');R(4,4,8,5,'#f5d256');R(4,8,8,1,'#d9b23d');
});
SPR.table=spr(32,24,R=>{
  R(3,13,3,9,'#9c6438');R(26,13,3,9,'#9c6438');R(1,6,30,8,'#b97a48');R(2,6,28,6,'#d9a066');R(2,6,28,1,'#e8b880');
  R(7,2,5,5,'#f6f2ea');R(12,3,1,3,'#f6f2ea');R(8,2,3,1,'#7a4a2c');
  R(18,5,8,2,'#f6f2ea');R(19,3,6,3,'#d99a52');R(20,4,1,1,'#7a4a2c');R(23,3,1,1,'#7a4a2c');
});
SPR.plant=spr(16,26,(R,g)=>{
  R(4,16,8,8,'#d36b45');R(3,15,10,2,'#e8825a');R(5,18,1,4,'#e8825a');
  ell(g,8,9,6,6,'#4f9a4a');ell(g,6,7,3,3,'#6fbf5c');ell(g,10,10,2,2,'#6fbf5c');R(8,12,1,3,'#3f7a3a');
});
SPR.mailbox=spr(16,26,R=>{
  R(7,12,3,12,'#8a5a36');R(2,4,11,8,'#e85f5f');R(3,3,9,1,'#e85f5f');R(2,4,11,1,'#f28080');R(4,7,6,1,'#9c3a3a');
  R(13,3,1,6,'#3b3b4f');R(13,3,2,2,'#f5d256');R(5,23,7,1,'#6e4228');
});
SPR.capsule=spr(18,29,(R,g)=>{
  R(4,19,10,8,'#c5636b');R(3,25,12,3,'#a74957');R(4,25,10,1,'#ee8d92');
  R(3,16,12,3,'#e59a97');R(4,16,10,1,'#ffe0c8');
  ell(g,9,9,7,7,'#89b8bc');ell(g,9,8,6,6,'#c8e5dd');
  R(5,5,1,5,'#f1f7dd');R(6,4,3,1,'#f1f7dd');
  [[5,10,'#e88aa8'],[10,7,'#b393d0'],[10,12,'#eab36f']].forEach(([x,y,c])=>{
    R(x,y,3,3,c);R(x,y,2,1,'#fff0d5');
  });
  R(6,20,4,2,'#6d454c');R(11,20,2,2,'#f2c476');R(7,23,4,2,'#864852');
});
SPR.sign=spr(16,24,R=>{
  R(3,11,2,11,'#8a5a36');R(11,11,2,11,'#8a5a36');R(1,3,14,9,'#a86a40');R(2,4,12,7,'#d9a066');R(4,6,8,1,'#8c5532');R(4,8,5,1,'#8c5532');
});
SPR.flower={};
FLOWER_COLS.forEach(col=>{SPR.flower[col]=spr(16,16,R=>{R(7,8,1,5,'#4f9a4a');R(8,10,2,1,'#6fbf5c');R(5,11,2,1,'#6fbf5c');R(6,5,3,3,col);R(7,4,1,5,col);R(5,6,5,1,col);R(7,6,1,1,col==='#f5d256'?'#e87a3a':'#f5d256');},'#3d5a33');});
SPR.berryLeaf=spr(16,16,(R,g)=>{ell(g,8,9,5,4,'#4f9a4a');ell(g,7,8,3,2,'#6fbf5c');R(8,12,1,2,'#3f7a3a');},'#2f4f2a');
SPR.berryRipe=spr(16,16,(R,g)=>{ell(g,8,9,5,4,'#4f9a4a');ell(g,7,8,3,2,'#6fbf5c');R(8,12,1,2,'#3f7a3a');
  [[4,8],[10,7],[7,10],[11,10]].forEach(([x,y])=>{R(x,y,2,2,'#e8384f');R(x,y,1,1,'#ff8a9a');});},'#2f4f2a');
SPR.sprout=spr(16,16,R=>{R(7,8,1,5,'#4f9a4a');R(4,8,3,2,'#6fbf5c');R(8,7,4,2,'#82ca65');});
SPR.carrot=spr(16,16,R=>{
  R(7,4,2,6,'#4f9a4a');R(5,5,2,3,'#6fbf5c');R(9,3,2,5,'#6fbf5c');
  R(5,8,6,3,'#ed873e');R(6,11,4,2,'#de6933');R(7,13,2,1,'#de6933');R(6,9,3,1,'#ffc56b');
},'#44342d');
SPR.pumpkin=spr(16,16,(R,g)=>{
  ell(g,8,10,6,4,'#d87037');ell(g,8,9,4,4,'#f4a548');
  R(7,4,2,3,'#518044');R(5,6,2,1,'#7dac59');R(9,8,1,4,'#ffc56b');
},'#44342d');
const CATC='#f0a557',CATD='#d27e38',CATL='#fff0dc';
SPR.catSit=spr(18,15,R=>{
  R(2,11,4,2,CATC);R(2,9,1,2,CATC);R(5,7,7,6,CATC);R(9,9,2,4,CATL);R(6,8,1,2,CATD);R(8,7,1,2,CATD);
  R(8,2,6,5,CATC);R(8,1,1,1,CATC);R(13,1,1,1,CATC);R(12,4,1,1,EYE);R(12,5,2,1,CATL);R(9,3,1,1,CATD);R(11,2,1,1,CATD);
  R(10,13,1,1,CATC);R(6,13,1,1,CATC);
});
function catWalk(f){return spr(18,15,R=>{
  R(3,6,10,4,CATC);R(5,6,1,2,CATD);R(8,6,1,2,CATD);R(4,9,8,1,CATL);
  R(11,3,5,5,CATC);R(11,2,1,1,CATC);R(15,2,1,1,CATC);R(14,5,1,1,EYE);R(14,6,2,1,CATL);R(12,3,1,1,CATD);
  R(1,2,1,3,CATC);R(2,4,1,2,CATC);
  if(f){R(4,10,1,3,CATC);R(7,10,1,2,CATC);R(10,10,1,3,CATC);R(12,10,1,2,CATC);}
  else{R(5,10,1,2,CATC);R(6,10,1,3,CATC);R(9,10,1,2,CATC);R(11,10,1,3,CATC);}
});}
SPR.catW=[catWalk(0),catWalk(1)];
SPR.gold=spr(13,13,R=>{R(6,1,1,11,'#f5c842');R(1,6,11,1,'#f5c842');R(4,4,5,5,'#f5c842');R(3,5,7,3,'#f5c842');R(5,3,3,7,'#f5c842');R(5,5,3,3,'#ffe58a');R(6,5,1,1,'#ffffff');},'#7a5212');
SPR.adopt=spr(18,24,R=>{
  R(8,1,2,1,'#d9534f');R(6,2,6,1,'#d9534f');R(4,3,10,1,'#d9534f');R(2,4,14,2,'#c94440');R(2,5,14,1,'#a83632');
  R(3,6,12,15,'#c88a52');R(3,10,12,1,'#a86a40');R(3,15,12,1,'#a86a40');R(3,6,12,1,'#e0a870');
  R(7,12,4,9,'#4a3020');R(8,11,2,1,'#4a3020');
  R(5,7,8,3,'#f6f2ea');R(7,8,1,1,'#a46f45');R(9,8,1,1,'#a46f45');R(8,9,1,1,'#a46f45');
  R(13,19,4,2,'#5b8ee0');R(14,19,2,1,'#d99a52');
});

/* ---------------- ground ---------------- */
function paintGround(season){
  const [grass,shadeGrass,lightGrass]=SEASON_ART[season].grass;
  const winter=season==='winter';
  const c=mk(MW*TILE,MH*TILE),g=c.getContext('2d');
  const R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
    const t=map[y*MW+x],px=x*16,py=y*16,rnd=mulberry32((x*73856093)^(y*19349663)^1234);
    if(t===G||t===DIRT){
      R(px,py,16,16,grass);
      for(let i=0;i<5;i++){const a=rnd()*15|0,b=rnd()*14|0;R(px+a,py+b,1,2,shadeGrass);R(px+a+1,py+b+1,1,1,shadeGrass);}
      for(let i=0;i<3;i++)R(px+(rnd()*15|0),py+(rnd()*15|0),1,1,lightGrass);
      if(rnd()<.1){const a=rnd()*13|0,b=rnd()*13|0;R(px+a,py+b,1,1,'#fffbe8');R(px+a+2,py+b+1,1,1,'#ffe08a');}
    }
    if(t===DIRT){
      R(px,py+1,16,14,winter?'#c0b8b0':'#a57449');for(let r=0;r<14;r+=4)R(px,py+1+r+3,16,1,winter?'#a8a4a5':'#8a5d39');
    } else if(t>=STONE){
      VillageMap.tile(g,px,py,['stone','bridge','court','deck'][t-STONE],winter);
    } else if(t===PATH){
      R(px,py,16,16,winter?'#d9dee1':'#e2cb9f');
      for(let i=0;i<4;i++){const a=rnd()*13|0,b=rnd()*14|0;R(px+a,py+b,3,2,winter?'#cbd4da':'#d0b383');R(px+a,py+b,2,1,winter?'#eef3f1':'#ecdcb8');}
      const e=winter?'#bdced8':'#c9a978',isP=t2=>t2===PATH||t2===DOOR||t2===-1;
      if(!isP(at(x,y-1)))R(px,py,16,1,e);if(!isP(at(x,y+1)))R(px,py+15,16,1,e);
      if(!isP(at(x-1,y)))R(px,py,1,16,e);if(!isP(at(x+1,y)))R(px+15,py,1,16,e);
    } else if(t===FLOOR||t===DOOR){
      if(t===FLOOR&&x>=12){R(px,py,16,16,'#f1e6d2');R(px,py,8,8,'#e3d3b8');R(px+8,py+8,8,8,'#e3d3b8');R(px,py+15,16,1,'#d6c4a6');R(px+15,py,1,16,'#d6c4a6');continue;}
      R(px,py,16,16,'#d9a46b');
      for(let r=0;r<4;r++){R(px,py+r*4+3,16,1,'#bb8452');const s=((r*7+x*5+y*3)%14)+1;R(px+s,py+r*4,1,3,'#bb8452');R(px+((s+8)%15),py+r*4+1,2,1,'#e6b680');}
      if(t===DOOR){R(px,py,2,16,'#7d4b2d');R(px+14,py,2,16,'#7d4b2d');R(px+2,py+13,12,3,'#a8724c');}
    } else if(t===WALLF){
      if(y===2){R(px,py,16,16,'#f4e2c6');for(let i=0;i<16;i+=4)R(px+i,py,1,16,'#ead2ad');R(px,py,16,3,'#8c5a3c');R(px,py+3,16,1,'#b07a52');}
      else{R(px,py,16,8,'#f4e2c6');for(let i=0;i<16;i+=4)R(px+i,py,1,8,'#ead2ad');R(px,py+8,16,8,'#c48a58');R(px,py+8,16,1,'#e3ad78');for(let i=3;i<16;i+=8)R(px+i,py+10,1,4,'#a87244');R(px,py+14,16,2,'#7d4b2d');}
    } else if(t===WALL){
      if(y===9){R(px,py,16,6,'#8c5a3c');R(px,py,16,1,'#a8724c');R(px,py+6,16,10,'#d49f6c');
        for(let r=0;r<3;r++){R(px,py+6+r*3+2,16,1,'#b8844f');const off=r%2?4:0;for(let i=off;i<16;i+=8)R(px+i,py+6+r*3,1,2,'#b8844f');}}
      else{R(px,py,16,16,'#8c5a3c');R(px+3,py,10,16,'#a8724c');R(px+3,py,1,16,'#bf8a5f');}
    } else if(t===WATER&&winter){
      R(px,py,16,16,'#a9d1e3');
      for(let i=0;i<3;i++)R(px+(rnd()*12|0),py+(rnd()*14|0),4,1,'#c9e7ec');
      if((x+y)%3===0){R(px+2,py+5,5,1,'#83b9d1');R(px+7,py+6,3,1,'#83b9d1');R(px+10,py+7,4,1,'#d6eef0');}
      if(at(x,y-1)!==WATER)R(px,py,16,2,'#eff6f6');
      if(at(x,y+1)!==WATER)R(px,py+14,16,2,'#eff6f6');
      if(at(x-1,y)!==WATER)R(px,py,2,16,'#eff6f6');
      if(at(x+1,y)!==WATER)R(px+14,py,2,16,'#eff6f6');
      if(isIceHole(x,y)){
        R(px+3,py+5,10,6,'#e6f4ee');R(px+5,py+4,6,8,'#e6f4ee');
        R(px+5,py+6,6,4,'#3d7797');R(px+4,py+7,8,2,'#3d7797');R(px+6,py+7,4,1,'#79c6d7');
      }
    } else if(t===WATER){
      R(px,py,16,16,'#5db6de');
      for(let i=0;i<3;i++)R(px+(rnd()*12|0),py+(rnd()*14|0),4,1,'#7fcbe9');
      const sand='#eadca6',deep='#4aa0cc';
      if(at(x,y-1)!==WATER){R(px,py,16,2,sand);R(px,py+2,16,1,deep);}
      if(at(x,y+1)!==WATER){R(px,py+14,16,2,sand);R(px,py+13,16,1,deep);}
      if(at(x-1,y)!==WATER){R(px,py,2,16,sand);R(px+2,py,1,16,deep);}
      if(at(x+1,y)!==WATER){R(px+14,py,2,16,sand);R(px+13,py,1,16,deep);}
      if(rnd()<.18&&at(x,y-1)===WATER&&at(x,y+1)===WATER){R(px+5,py+6,6,4,'#5aa64a');R(px+6,py+6,4,1,'#76c262');R(px+8,py+8,3,2,'#5db6de');}
    }
  }
  VillageMap.courtLines(g);
  R(13*16+1,7*16+2,3*16-2,2*16-4,'#3f7a6e');R(13*16+2,7*16+3,3*16-4,2*16-6,'#6fae9e');for(let i=0;i<5;i++)R(13*16+4,7*16+6+i*5,3*16-8,1,'#86c2b2');
  R(84,100,56,40,'#b54c48');R(86,102,52,36,'#f2c46b');R(88,104,48,32,'#e0786a');
  for(let i=0;i<5;i++){const cx=94+i*9;R(cx,118,3,3,'#f2c46b');R(cx+1,117,1,5,'#f2c46b');R(cx-1,119,5,1,'#f2c46b');}
  R(98,161,12,6,'#c95b4f');R(99,163,10,1,'#e8877a');
  return c;
}
for(const season of CottageActivities.seasons)SEASON_ART[season].ground=paintGround(season);
const waterTiles=[];for(let y=0;y<MH;y++)for(let x=0;x<MW;x++)if(map[y*MW+x]===WATER)waterTiles.push([x,y]);

/* ---------------- entities ---------------- */
function drawFence(g,x,y){
  const px=x*16,py=y*16-4,L=isF(x-1,y),Rt=isF(x+1,y),U=isF(x,y-1),D=isF(x,y+1);
  const F=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(px+a,py+b,w,h);};
  const rail='#eac393',ol='#6e4a2c';
  if(L||Rt||(!U&&!D)){const a=L?0:6,b=Rt?16:10;F(a,6,b-a,4,ol);F(a,7,b-a,2,rail);F(a,12,b-a,4,ol);F(a,13,b-a,2,rail);}
  if(U||D){const a=U?-4:4,b=D?16:12;F(6,a,4,b-a,ol);F(7,a,2,b-a,rail);}
  F(5,1,6,18,ol);F(6,2,4,16,'#dcae7a');F(6,2,4,1,'#f4d8b0');F(9,3,1,15,'#b9895a');
}
const statics=[];
trees.forEach(([x,y])=>{const v=Math.floor(hash2(x,y)*7)%3===0?(hash2(y,x)<.5?1:2):0;statics.push({key:y*16+14,x:x*16-5,y:y*16-19,w:26,h:34,draw:(g,art)=>g.drawImage(art.trees[v],x*16-5,y*16-19)});});
bushes.forEach(([x,y])=>statics.push({key:y*16+14,x:x*16-1,y:y*16+1,w:18,h:15,draw:(g,art)=>g.drawImage(art.bush,x*16-1,y*16+1)}));
fences.forEach(([x,y])=>statics.push({key:y*16+12,x:x*16,y:y*16-8,w:16,h:24,draw:g=>drawFence(g,x,y)}));
OBJS.forEach(o=>{const s=SPR[o.id];o.spr=s;const px=o.tx*16+Math.floor((o.tw*16-s.width)/2),py=(o.ty+o.th)*16-s.height;o.px=px;o.py=py;
  statics.push({key:(o.ty+o.th)*16-1,x:px,y:py,w:s.width,h:s.height,draw:g=>g.drawImage(s,px,py)});});
