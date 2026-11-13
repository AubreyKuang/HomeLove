"use strict";

/* ---------------- HUD & input ---------------- */
const isTouch=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
const fmt=m=>{const h=Math.floor(m/60)%24,mm=Math.floor(m%60);return String(h).padStart(2,'0')+':'+String(mm).padStart(2,'0');};
function darkness(){const h=state.time/60;if(h<5)return 1;if(h<7)return 1-(h-5)/2;if(h<17)return 0;if(h<20)return (h-17)/3;return 1;}
function updateHud(){
  const h=state.time/60,icon=h>=19||h<5?'🌙':h>=17?'🌇':'☀️';
  $('#chipTime').textContent=`${icon} ${tr(CottageActivities.seasonOf(state.day))} · ${tr('day',{d:state.day})} · ${tr('weekDay'+VillageWeekend.weekday(state.day))} ${fmt(state.time)} · ${tr('riverWeather_'+VillageRiverside.weather(state.day))}`+(blackoutActive()?' · '+tr('blackoutHud'):'');
  const N=state.need;
  [['bE','barE',N.energy,'energy'],['bH','barH',N.hunger,'hunger'],['bM','barM',N.mood,'mood']].forEach(([b,w,v,t])=>{$('#'+b).style.width=v.toFixed(0)+'%';$('#'+w).classList.toggle('low',v<20);$('#'+w).title=tr(t)+' '+Math.round(v);});
  $('#cBag').textContent=bagCount();
  updateAlbumBadge();
  const ride=state.travel.selected,badge=$('#miniRide');
  badge.classList.toggle('hidden',!ride);
  if(ride){
    const label=activeRide()?tr('vehicle_'+ride):tr('vehicleParked',{name:tr('vehicle_'+ride)});
    if(badge.textContent!==label)badge.textContent=label;
  }
  updateVillageGuide();
}
const promptEl=$('#prompt');let promptText='';
function updatePrompt(){
  const txt=(!target||busy||dressOpen||diaryOpen||albumOpen||mapOpen||startOpen||D.modal||FISH.on)?'':target.verb;
  if(txt===promptText)return;promptText=txt;
  updateVillageGuide();
  if(!txt){promptEl.classList.add('hidden');return;}
  promptEl.innerHTML='';const k=document.createElement('kbd');k.textContent=actKey();promptEl.append(k,document.createTextNode(txt));promptEl.classList.remove('hidden');
}
function villageGuideVisible(){
  return !startOpen && !busy && !D.modal && !dressOpen && !diaryOpen && !albumOpen && !mapOpen && !FISH.on;
}

function updateVillageGuide(){
  const guide = $('#villageGuide');
  const label = $('#villageGuideText');
  const cancel = $('#villageRouteCancel');
  const dismiss = $('#firstGreetingDismiss');
  const following = villageDestination && walkRoute.length>0;
  const greeting = !following && firstGreetingTarget();
  const visible = villageGuideVisible() && (following || greeting);
  guide.classList.toggle('hidden', !visible);
  cancel.classList.toggle('hidden', !following);
  dismiss.classList.toggle('hidden', !greeting);
  if(!visible) return;
  const text = following ? tr('villageRouteTo',{place:tr('village_'+villageDestination)})
    : greeting.inside ? tr('firstGreetingDoor') : tr('firstGreetingResident',{name:nm(greeting.resident)});
  if(label.textContent!==text) label.textContent = text;
}

function applyLang(){
  Lp=PACKS[LANG];
  const root=document.documentElement;root.lang=Lp.meta.htmlLang;
  const f=FONTS[LANG]||FONTS.zh;root.style.setProperty('--font-display',f.display);root.style.setProperty('--font-body',f.body);
  document.title=tr('title');
  document.querySelectorAll('[data-i18n]').forEach(e=>{e.textContent=tr(e.dataset.i18n);});
  document.querySelectorAll('[data-i18n-aria]').forEach(e=>{e.setAttribute('aria-label',tr(e.dataset.i18nAria));});
  document.querySelectorAll('[data-i18n-title]').forEach(e=>{e.title=tr(e.dataset.i18nTitle);});
  $('#moveHelp').textContent=tr('kMove')+' · '+lifeText('点击地面走过去','Click the ground to walk there','地面をクリックして移動');
  $('#btnStart').textContent=tr(startLabel);
  $('#btnLang').textContent='🌐 '+Lp.meta.label;
  updateUmbrellaButton();
  document.querySelectorAll('.langpick button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===LANG));
  $('#btnWalk').textContent=tr(pWalk?'stop':'walk');
  promptText='\u0000';updatePrompt();updateHud();
  if(dressOpen){renderPicker();renderLooks();drawPreview();}
  if(diaryOpen)renderDiary();
  if(albumOpen)renderAlbum();
}
function setLang(code){if(!PACKS[code])return;LANG=code;try{localStorage.setItem(LANG_KEY,code);}catch(e){}applyLang();}
function cycleLang(){const i=LANG_ORDER.indexOf(LANG);setLang(LANG_ORDER[(i+1)%LANG_ORDER.length]);}
