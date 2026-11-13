"use strict";

const $ = s => document.querySelector(s);
const TILE = 16, MW = VillageMap.width, MH = VillageMap.height, TIME_RATE = 2; // 2 game minutes per real second

/* ---------------- helpers ---------------- */
function hexToRgb(h){h=h.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function shade(h,f){const [r,g,b]=hexToRgb(h);const c=v=>Math.max(0,Math.min(255,Math.round(f>=1?v+(255-v)*(f-1):v*f)));return '#'+[c(r),c(g),c(b)].map(v=>v.toString(16).padStart(2,'0')).join('');}
function isLight(h){const [r,g,b]=hexToRgb(h);return (0.299*r+0.587*g+0.114*b)/255>0.72;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function hash2(x,y){let h=(x*374761393+y*668265263)|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
const pick = a => a[Math.floor(Math.random()*a.length)];
const byId = (arr,id) => arr.find(i=>i.id===id) || arr[0];
const clampN = v => Math.max(0,Math.min(100,v));
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
function outline(c,col){
  col=col||'#2a1e24';
  const g=c.getContext('2d'),w=c.width,h=c.height,d=g.getImageData(0,0,w,h),s=d.data,src=new Uint8ClampedArray(s),[r,gg,b]=hexToRgb(col);
  const on=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&src[(y*w+x)*4+3]>0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(src[i+3]>0)continue;
    if(on(x-1,y)||on(x+1,y)||on(x,y-1)||on(x,y+1)){s[i]=r;s[i+1]=gg;s[i+2]=b;s[i+3]=255;}}
  g.putImageData(d,0,0);return c;
}
function ell(g,cx,cy,rx,ry,col){g.fillStyle=col;for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry;if(dx*dx+dy*dy<=1)g.fillRect(x,y,1,1);}}
function spr(w,h,fn,ol){const c=mk(w,h),g=c.getContext('2d');const R=(x,y,ww,hh,col)=>{g.fillStyle=col;g.fillRect(x,y,ww,hh);};fn(R,g);if(ol!==false)outline(c,typeof ol==='string'?ol:undefined);return c;}

/* ---------------- i18n ---------------- */
const PACKS=window.HL_LANG||{};
const LANG_ORDER=['zh','en','ja'].filter(c=>PACKS[c]);
const LANG_KEY='homelove-lang';
function detectLang(){
  try{const s=localStorage.getItem(LANG_KEY);if(s&&PACKS[s])return s;}catch(e){}
  const nav=(navigator.languages&&navigator.languages[0]||navigator.language||'').toLowerCase();
  if(nav.startsWith('zh')&&PACKS.zh)return 'zh';if(nav.startsWith('ja')&&PACKS.ja)return 'ja';if(PACKS.en)return 'en';return LANG_ORDER[0]||'zh';
}
let LANG=detectLang(),Lp=PACKS[LANG];
const FONTS={
  zh:{display:'"ZCOOL KuaiLe","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif',body:'"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",system-ui,sans-serif'},
  en:{display:'"Pixelify Sans","Trebuchet MS",system-ui,sans-serif',body:'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif'},
  ja:{display:'"DotGothic16","Hiragino Sans","Yu Gothic","Noto Sans JP",sans-serif',body:'"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP",system-ui,sans-serif'},
};
function fill(s,v){return v?s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m):s;}
function tr(key,v){const s=(Lp.ui&&Lp.ui[key])??(PACKS.zh&&PACKS.zh.ui[key])??key;return fill(s,v);}
const nt=n=>Lp.npcs[n.id];
const nm=n=>nt(n).name;
const itemName=id=>(Lp.clothes&&Lp.clothes[id])||id;
const itemLabel=k=>k==='mysteryBloom'?tr('worldBloomName'):Lp.items[k].name;
const listJoin=a=>a.join(tr('listSep'));
