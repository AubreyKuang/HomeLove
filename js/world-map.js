"use strict";

/* ---------------- map ---------------- */
const G=0,PATH=1,FLOOR=2,WALLF=3,WALL=4,DOOR=5,WATER=6,DIRT=7,STONE=8,BRIDGE=9,COURT=10,DECK=11;
const map=new Uint8Array(MW*MH),solid=new Uint8Array(MW*MH);
const at=(x,y)=>(x<0||y<0||x>=MW||y>=MH)?-1:map[y*MW+x];
const setT=(x,y,t)=>{map[y*MW+x]=t;};
const fillT=(x,y,w,h,t)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)setT(i,j,t);};
fillT(2,2,15,2,WALLF);fillT(2,2,1,8,WALL);fillT(16,2,1,8,WALL);fillT(11,2,1,8,WALL);fillT(2,9,15,1,WALL);fillT(3,4,8,5,FLOOR);fillT(12,4,4,5,FLOOR);setT(6,9,DOOR);setT(11,6,FLOOR);setT(11,7,FLOOR);
fillT(6,10,1,10,PATH);fillT(6,12,10,1,PATH);
for(let y=1;y<9;y++)for(let x=15;x<26;x++){const dx=(x+.5-21.5)/4.2,dy=(y+.5-4.5)/2.6;if(dx*dx+dy*dy<=1)setT(x,y,WATER);}
fillT(17,13,6,2,DIRT);
VillageMap.layout(fillT,{PATH,WATER,STONE,BRIDGE,COURT,DECK});
for(let i=0;i<MW*MH;i++){const t=map[i];if(t===WALLF||t===WALL||t===WATER)solid[i]=1;}
const block=(x,y)=>{solid[y*MW+x]=1;};
const isSolid=(x,y)=>{
  const [rx,ry]=VillageRiverside.glassTile;
  return solid[y*MW+x]&&!(x===rx&&y===ry&&VillageRiverside.exposed(state.day));
};

let trees=[];
for(let x=0;x<MW;x++){trees.push([x,0]);trees.push([x,MH-1]);}
for(let y=1;y<MH-1;y++){trees.push([0,y]);trees.push([MW-1,y]);}
[[25,10],[3,15],[9,17],[12,15],[26,16],[21,18],[14,18]].forEach(t=>trees.push(t));
for(let x=1;x<28;x++)trees.push([x,19]);
for(let y=1;y<19;y++)trees.push([27,y]);
trees.push(...VillageMap.plantings);
trees=trees.filter(([x,y])=>!VillageMap.gates.some(([gx,gy])=>x===gx&&y===gy));
trees.forEach(([x,y])=>block(x,y));
const bushes=[[11,11],[13,10],[2,12],[26,2],[1,7],[16,18]];
bushes.forEach(([x,y])=>block(x,y));
const fenceSet=new Set();
for(let x=15;x<=24;x++){if(x!==17)fenceSet.add(x+','+10);fenceSet.add(x+','+17);}
for(let y=11;y<=16;y++){if(y!==12)fenceSet.add('15,'+y);fenceSet.add('24,'+y);}
const isF=(x,y)=>fenceSet.has(x+','+y);
const fences=[...fenceSet].map(s=>s.split(',').map(Number));
fences.forEach(([x,y])=>block(x,y));
VillageMap.props.forEach(p=>{
  for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++)block(x,y);
});
const villagePropAt=(tx,ty)=>VillageMap.props.find(p=>(Object.hasOwn(VillageMap.places,p.id)||Object.hasOwn(VillageMap.exchanges,p.id)||['guide','weekendBoard','weekendStall','bench'].includes(p.id))&&
  tx>=p.x&&tx<p.x+p.w&&ty>=p.y&&ty<p.y+p.h);
const ICE_HOLES=[[19,6],[23,6]];
const isIceHole=(x,y)=>ICE_HOLES.some(([tx,ty])=>tx===x&&ty===y);
const plotIndex=(tx,ty)=>(tx>=17&&tx<=22&&ty>=13&&ty<=14)?(ty-13)*6+(tx-17):-1;

const objName=id=>Lp.objects[id].name;
const OBJS=[
  {id:'wardrobe',tx:3,ty:4,tw:2,th:1,act(){openDress();}},
  {id:'mirror',tx:5,ty:4,tw:1,th:1,act(){say(objName('mirror'),mirrorLine());}},
  {id:'shelf',tx:7,ty:4,tw:2,th:1,act(){shelfMenu();}},
  {id:'lamp',tx:10,ty:8,tw:1,th:1,act(){sfx('click');state.lamp=!state.lamp;save();say(objName('lamp'),tr(state.lamp?'lampOn':'lampOff'));}},
  {id:'bed',tx:9,ty:4,tw:2,th:2,act(){bedMenu();}},
  {id:'table',tx:6,ty:6,tw:2,th:1,act(){tableMenu();}},
  {id:'plant',tx:3,ty:8,tw:1,th:1,act(){say(objName('plant'),pick(Lp.plants));}},
  {id:'fridge',tx:12,ty:4,tw:1,th:1,act(){say(objName('fridge'),pick(Lp.fridgeLines));}},
  {id:'stove',tx:13,ty:4,tw:1,th:1,act(){stoveMenu();}},
  {id:'counter',tx:14,ty:4,tw:2,th:1,act(){say(objName('counter'),tr('counterLine'));}},
  {id:'computer',tx:13,ty:8,tw:2,th:1,act(){computerMenu();}},
  {id:'gym',tx:12,ty:8,tw:1,th:1,act(){workout();}},
  {id:'mailbox',tx:7,ty:10,tw:1,th:1,act(){checkMail();}},
  {id:'capsule',tx:9,ty:10,tw:1,th:1,act(){capsuleMenu();}},
  {id:'adopt',tx:8,ty:13,tw:1,th:1,act(){adoptMenu();}},
  {id:'sign',tx:5,ty:10,tw:1,th:1,act(){const row=a=>a.map(n=>`${nm(n)} ${fmt(n.arrive)}–${fmt(n.leave)}`).join(' · ');talk(objName('sign'),[tr('signTitle'),row(NPCS.slice(0,3)),row(NPCS.slice(3))]);}},
];
OBJS.forEach(o=>{for(let j=o.ty;j<o.ty+o.th;j++)for(let i=o.tx;i<o.tx+o.tw;i++)block(i,j);});
const objAt=(tx,ty)=>OBJS.find(o=>tx>=o.tx&&tx<o.tx+o.tw&&ty>=o.ty&&ty<o.ty+o.th);

const FLOWER_COLS=['#f39ac2','#f5d256','#f6f2ea','#9b7ad9','#e85f5f'];
const flowers=[];
for(let x=16;x<=23;x++){if(x%2===0)flowers.push({tx:x,ty:11});else flowers.push({tx:x,ty:16});}
[[3,11],[10,14],[4,17],[19,8],[22,8],[14,14],[8,15],[17,1],[14,10],[20,15]].forEach(([tx,ty])=>flowers.push({tx,ty}));
flowers.forEach((f,i)=>{f.col=FLOWER_COLS[i%FLOWER_COLS.length];f.picked=state.picked.includes(i);f.i=i;});
