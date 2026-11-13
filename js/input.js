"use strict";

const keys=new Set(),touchKeys=new Set();
const has=(...ks)=>ks.some(k=>keys.has(k)||touchKeys.has(k));
$('#fishCancel').onclick=()=>{cancelFishing();cv.focus({preventScroll:true});};
addEventListener('keydown',e=>{
  if(e.code==='Escape'&&cottageMenu.open){e.preventDefault();cottageMenu.open=false;cottageMenu.querySelector('summary').focus();return;}
  if(['Enter','Space'].includes(e.code)&&e.target instanceof Element&&e.target.closest('#hud button,#hudR button,#villageGuide button,#fishCancel,#cottageMenu>summary'))return;
  if(startOpen){if(e.code==='Enter'&&!(document.activeElement&&document.activeElement.closest&&document.activeElement.closest('.langpick'))){e.preventDefault();begin();}return;}
  if(mapOpen){if(e.code==='Escape'||e.code==='KeyG'){e.preventDefault();closeVillageMap();}return;}
  if(dressOpen){if(e.code==='Escape'||e.code==='KeyC'){e.preventDefault();closeDress();}else if(e.code==='KeyQ')rot(-1);else if(e.code==='KeyR')rot(1);return;}
  if(albumOpen){if(e.code==='Escape'||e.code==='KeyB'){e.preventDefault();closeAlbum();}return;}
  if(diaryOpen){if(e.code==='Escape'||e.code==='KeyJ'){e.preventDefault();closeDiary();}return;}
  if(D.modal){
    if(e.target?.classList.contains('projectName')&&e.code!=='Escape')return;
    if(e.repeat)return;
    const last=D.idx===D.lines.length-1,btns=[...dialogEl.querySelectorAll('.choice:not(:disabled)')];
    const m=/^(?:Digit|Numpad)([1-9])$/.exec(e.code);if(m){e.preventDefault();choose(+m[1]-1);return;}
    if(last&&D.choices){
      if(['ArrowDown','ArrowUp','KeyW','KeyS'].includes(e.code)){e.preventDefault();const i=btns.indexOf(document.activeElement),dn=e.code==='ArrowDown'||e.code==='KeyS';const ni=i<0?0:(i+(dn?1:-1)+btns.length)%btns.length;if(btns[ni])btns[ni].focus();return;}
      if(e.code==='Escape'){e.preventDefault();const ci=D.choices.findIndex(c=>c.back||!c.fn);if(ci>=0)choose(ci);return;}
      if(['Enter','Space','KeyE'].includes(e.code)){if(btns.includes(document.activeElement)&&e.code!=='KeyE')return;e.preventDefault();const b=btns.includes(document.activeElement)?document.activeElement:btns[0];if(b)b.click();}
      return;
    }
    if(['KeyE','Space','Enter','Escape'].includes(e.code)){e.preventDefault();advance();}
    return;
  }
  if(FISH.on){
    if(['KeyE','Space','Enter'].includes(e.code)&&!e.repeat){e.preventDefault();reel();}
    else if(e.code==='Escape'){e.preventDefault();cancelFishing();}
    return;
  }
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
  if(e.code==='Escape')cancelVillageRoute();
  keys.add(e.code);
  if(e.code==='KeyU'&&!e.repeat)toggleUmbrella();
  if(!e.repeat){if(e.code==='KeyE'||e.code==='Space'||e.code==='Enter')interact();if(e.code==='KeyC')openDress();if(e.code==='KeyJ')openDiary();if(e.code==='KeyB')openAlbum();if(e.code==='KeyL')cycleLang();if(e.code==='KeyM')setSound(!sndOn);if(e.code==='KeyG')openVillageMap();if(e.code==='KeyV')openTravelShop();}
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{keys.clear();touchKeys.clear();});
document.querySelectorAll('#pad button').forEach(b=>{
  const k=b.dataset.k;
  const on=e=>{e.preventDefault();if(D.modal||FISH.on||mapOpen)return;touchKeys.add(k);b.classList.add('on');try{b.setPointerCapture(e.pointerId);}catch(_){}};
  const off=()=>{touchKeys.delete(k);b.classList.remove('on');};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('lostpointercapture',off);
});
$('#abtn').addEventListener('pointerdown',e=>{e.preventDefault();interact();});
$('#btnWardrobe').addEventListener('click',()=>openDress());
$('#btnAlbum').addEventListener('click',()=>openAlbum());
$('#btnDiary').addEventListener('click',()=>openDiary());
$('#btnLang').addEventListener('click',()=>{cycleLang();cv.focus({preventScroll:true});});
$('#btnSound').addEventListener('click',()=>{setSound(!sndOn);cv.focus({preventScroll:true});});
$('#btnSound').textContent=sndOn?'🔊':'🔇';
const cottageMenu=$('#cottageMenu');
cottageMenu.addEventListener('click',e=>{if(e.target.closest('button'))cottageMenu.open=false;});
document.addEventListener('pointerdown',e=>{if(cottageMenu.open&&!cottageMenu.contains(e.target))cottageMenu.open=false;});
let startLabel=state.seen?'resume':'start';
$('#btnHelp').addEventListener('click',()=>{if(D.modal||busy||dressOpen||diaryOpen||albumOpen||mapOpen||FISH.on)return;startOpen=true;startLabel='continue';$('#btnStart').textContent=tr(startLabel);$('#start').classList.remove('hidden');$('#start').classList.add('show-controls');$('#btnStart').focus();});
{const box=$('#langPick');LANG_ORDER.forEach(c=>{const b=el('button','pbtn',PACKS[c].meta.label);b.type='button';b.dataset.lang=c;b.lang=PACKS[c].meta.htmlLang;b.onclick=()=>setLang(c);box.append(b);});}
let helloShown=false;
function begin(){audioInit();if(AC&&sndOn)AC.resume().then(()=>sfx('start')).catch(()=>{});startOpen=false;state.seen=true;save();$('#start').classList.add('hidden');cv.focus({preventScroll:true});
  if(!helloShown){helloShown=true;if(state.day!==1||state.rel.gy.met)setTimeout(()=>say(tr('home'),tr('welcomeBack')),300);
    let rewound=null;try{rewound=sessionStorage.getItem('homelove-rewound');sessionStorage.removeItem('homelove-rewound');}catch(e){}
    if(rewound)setTimeout(()=>notify(tr('rewindDone',{d:rewound})),1600);
    else if(offlineMinutes>=60)setTimeout(()=>notify(tr('offlineBack',{h:Math.round(offlineMinutes/60)})),1600);}}
$('#btnStart').addEventListener('click',begin);

function bindWorldPointer(){
  cv.addEventListener('click',e=>{
    if(e.button!==0||startOpen||dressOpen||diaryOpen||albumOpen||mapOpen||D.modal||busy||FISH.on)return;
    const bounds=cv.getBoundingClientRect();
    if(!bounds.width||!bounds.height)return;
    const [cx,cy]=cameraOrigin();
    const x=cx+(e.clientX-bounds.left)*cv.width/(bounds.width*scale);
    const y=cy+(e.clientY-bounds.top)*cv.height/(bounds.height*scale);
    if(setWalkDestination(x,y)){
      villageDestination = null;
      updateVillageGuide();
      cv.focus({preventScroll:true});
    }
  });
}
