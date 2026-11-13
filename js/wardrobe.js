"use strict";

/* ---------------- dressing room ---------------- */
const DIRS=['down','right','up','left'];
let curCat='hair',pDir=0,pWalk=false,pFrame=0,pTimer=0,dressStartKey='';
const pv=$('#preview'),pg=pv.getContext('2d');
function drawPreview(){pg.clearRect(0,0,20,26);blitChar(pg,state.o,DIRS[pDir],pWalk?WALK[pFrame]:0,0,0);$('#rotLabel').textContent=Lp.dirs[pDir];}
function rot(d){pDir=(pDir+d+4)%4;drawPreview();}
function thumbCanvas(o,crop){const c=mk(crop[2],crop[3]);c.getContext('2d').drawImage(getSprite(o,'down',0),crop[0],crop[1],crop[2],crop[3],0,0,crop[2],crop[3]);return c;}
function likedBy(cat,id){if(cat.key==='skin'||cat.key==='hair')return [];return npcs.filter(n=>rel(n).knowStyle&&n.likeItems.includes(id)).map(nm);}
function likedColor(i){return npcs.filter(n=>rel(n).knowStyle&&n.likeColors.includes(i)).map(nm);}
function renderPicker(){
  const tabs=$('#tabs');tabs.innerHTML='';
  CATS.forEach(c=>{
    const label=c.key==='capsule'?lifeText('扭蛋礼裙','Capsule gowns','ガチャドレス'):
      c.key==='capsuleHair'?tr('capsuleHairTab'):c.key==='capsuleTop'||c.key==='capsuleBottom'?tr(c.key+'Tab'):Lp.cats[c.key];
    const b=el('button','tab'+(c.key===curCat?' on':''),label);
    b.type='button';b.setAttribute('aria-pressed',c.key===curCat);
    b.onclick=()=>{curCat=c.key;renderPicker();};tabs.append(b);
  });
  const cat=CATS.find(c=>c.key===curCat),box=$('#items');box.innerHTML='';
  box.dataset.category=cat.key;
  box.scrollTop=0;
  const slot=cat.slot??cat.key;
  const list=cat.key==='skin'?SKINS.map((s,i)=>({id:i,label:Lp.skins[i]})):cat.items.map(it=>Object.assign({},it,{label:itemName(it.id)}));
  list.forEach(it=>{
    const capsule=capsulePoolFor(it);
    const locked=!unlocked(it),sel=state.o[slot]===it.id,fans=likedBy(cat,it.id);
    const b=el('button','item'+(sel?' sel':'')+(locked?' locked':''));b.type='button';b.setAttribute('aria-pressed',sel);
    const variant=sel&&capsule?{...it,color:state.o[capsule.colorKey]}:it;
    const thumb=capsule?capsuleOutfit(capsule,variant):{...state.o,[slot]:it.id};
    b.append(thumbCanvas(thumb,cat.crop),el('span',null,it.label));
    if(fans.length){b.append(el('span','liked','♥'));b.title=tr('likedBy',{x:listJoin(fans)});}
    if(locked){
      b.append(el('span','lock',capsule?tr('capsuleTag'):`🌼${state.flowersTotal}/${it.lock}`));
      b.title=capsule?tr('capsuleLocked'):tr('lockedTitle',{x:it.lock});
    }
    b.onclick=()=>{
      if(locked){notify(capsule?tr('capsuleLocked'):tr('lockedToast',{i:it.label,x:it.lock,y:state.flowersTotal}));return;}
      Object.assign(state.o,thumb);changed();
    };
    box.append(b);
  });
  const cw=$('#colorsWrap'),cs=$('#colors');cs.innerHTML='';
  if(!cat.colorKey||(cat.key==='hat'||cat.key==='acc')&&state.o[cat.key]==='none'){cw.classList.add('hidden');}
  else{cw.classList.remove('hidden');
    cat.colors.forEach((col,i)=>{const isCloth=cat.colors===CLOTH,fans=isCloth?likedColor(i):[];const b=el('button','sw'+(state.o[cat.colorKey]===i?' on':''));b.type='button';b.style.background=col;
      const cname=isCloth?Lp.colors[i]:tr('colorN',{x:i+1});b.setAttribute('aria-label',cname);b.title=cname+(fans.length?' · '+tr('likedBy',{x:listJoin(fans)}):'');
      if(fans.length){b.textContent='♥';b.style.color=isLight(col)?'#e2607a':'#ffffff';b.style.fontSize='12px';}
      b.onclick=()=>{state.o[cat.colorKey]=i;changed();};cs.append(b);});
  }
}
function renderLooks(){
  const box=$('#looks');box.innerHTML='';
  if(!state.looks.length){box.append(el('div','empty',tr('looksEmpty')));return;}
  state.looks.forEach((lk,i)=>{
    const w=el('div','look');const b=el('button');b.type='button';b.style.cssText='border:0;padding:0;background:none';b.title=tr('wearLook');
    const c=mk(20,26);blitChar(c.getContext('2d'),Object.assign({},state.o,lk),'down',0,0,0);b.append(c);
    b.onclick=()=>{Object.assign(state.o,lk);changed();};
    const d=el('button','del','×');d.type='button';d.setAttribute('aria-label',tr('delLook'));d.onclick=()=>{state.looks.splice(i,1);save();renderLooks();};
    w.append(b,d);box.append(w);
  });
}
function changed(){sfx('pop');renderPicker();drawPreview();pv.classList.remove('pop');void pv.offsetWidth;pv.classList.add('pop');save();}
function rewardNewLook(){
  if(state.changedToday)return;
  state.changedToday=true;
  state.need.mood=clampN(state.need.mood+8);
  updateHud();notify(tr('newLook'));
}
function openDress(){if(mapOpen||dressOpen||diaryOpen||albumOpen||busy||startOpen||D.modal||FISH.on)return;sfx('whoosh');dressOpen=true;dressStartKey=outfitKey(state.o);keys.clear();touchKeys.clear();$('#dress').classList.remove('hidden');renderPicker();renderLooks();drawPreview();$('#dClose').focus();}
function closeDress(){
  sfx('whoosh');dressOpen=false;$('#dress').classList.add('hidden');cv.focus({preventScroll:true});
  if(outfitKey(state.o)!==dressStartKey){rewardNewLook();save();}
  say(objName('mirror'),mirrorLine());
}
$('#dClose').addEventListener('click',closeDress);
$('#dress').addEventListener('click',e=>{if(e.target.id==='dress')closeDress();});
$('#rotL').addEventListener('click',()=>rot(-1));
$('#rotR').addEventListener('click',()=>rot(1));
$('#btnWalk').addEventListener('click',()=>{pWalk=!pWalk;$('#btnWalk').textContent=tr(pWalk?'stop':'walk');drawPreview();});
$('#btnRandom').addEventListener('click',()=>{
  const o=state.o,r=a=>a[Math.floor(Math.random()*a.length)],ci=()=>Math.floor(Math.random()*CLOTH.length);
  o.hair=r(HAIRS.filter(unlocked)).id;o.hairColor=Math.floor(Math.random()*HAIR_COLORS.length);
  o.top=r(TOPS.filter(unlocked)).id;o.topColor=ci();o.bottom=r(BOTTOMS).id;o.bottomColor=ci();o.shoes=r(SHOES).id;o.shoesColor=ci();
  o.hat=Math.random()<.4?'none':r(HATS.filter(h=>h.id!=='none'&&unlocked(h))).id;o.hatColor=ci();
  o.acc=Math.random()<.5?'none':r(ACCS.filter(a=>a.id!=='none')).id;o.accColor=ci();
  changed();
});
$('#btnSave').addEventListener('click',()=>{
  const lk={};['hair','hairColor','top','topColor','bottom','bottomColor','shoes','shoesColor','hat','hatColor','acc','accColor'].forEach(k=>lk[k]=state.o[k]);
  if(state.looks.some(l=>JSON.stringify(l)===JSON.stringify(lk))){notify(tr('lookDup'));return;}
  state.looks.unshift(lk);if(state.looks.length>6)state.looks.length=6;save();renderLooks();notify(tr('lookSaved'));
});
