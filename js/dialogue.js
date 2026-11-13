"use strict";

/* ---------------- dialogue ---------------- */
const dialogEl=$('#dialog'),D={modal:false,lines:[],idx:0,who:'',choices:null,onEnd:null,npc:null,preview:null};let dialogTimer=0;
function say(who,txt,ms){
  if(D.modal)return;
  dialogEl.classList.remove('modal');
  dialogEl.querySelector('.who').textContent=who;dialogEl.querySelector('.txt').textContent=txt;
  dialogEl.querySelector('.choices').innerHTML='';dialogEl.querySelector('.more').classList.add('hidden');
  dialogEl.classList.remove('hidden');clearTimeout(dialogTimer);dialogTimer=setTimeout(()=>{if(!D.modal)dialogEl.classList.add('hidden');},ms||3600);
}
function talk(who,lines,choices,onEnd,preview=null){
  D.modal=true;D.who=who;D.lines=Array.isArray(lines)?lines:[lines];D.idx=0;D.choices=choices||null;D.onEnd=onEnd||null;D.preview=preview;
  keys.clear();touchKeys.clear();document.querySelectorAll('#pad button.on').forEach(b=>b.classList.remove('on'));
  clearTimeout(dialogTimer);renderDialog();
}
function renderDialog(){
  sfx('blip',D.npc&&D.who===nm(D.npc)?VOICE[D.npc.id]:undefined);
  dialogEl.classList.add('modal');dialogEl.classList.remove('hidden');
  dialogEl.querySelector('.who').textContent=D.who;dialogEl.querySelector('.txt').textContent=D.lines[D.idx];
  const last=D.idx===D.lines.length-1,box=dialogEl.querySelector('.choices');box.innerHTML='';
  dialogEl.querySelector('.more').classList.toggle('hidden',last&&!!D.choices);
  if(last&&D.preview)box.append(D.preview);
  if(last&&D.choices){
    D.choices.forEach((c,i)=>{const b=el('button','choice');b.type='button';const k=el('kbd',null,String(i+1));b.append(k,document.createTextNode(c.label));b.disabled=!!c.disabled;
      b.addEventListener('click',e=>{e.stopPropagation();choose(i);});box.append(b);});
    const first=box.querySelector('.choice:not(:disabled)');if(first)first.focus({preventScroll:true});
  }
}
function advance(){if(!D.modal)return;if(D.idx<D.lines.length-1){D.idx++;renderDialog();return;}if(D.choices)return;const f=D.onEnd;closeDialog();if(f)f();}
function choose(i){const c=D.choices&&D.choices[i];if(!c||c.disabled||D.idx!==D.lines.length-1)return;sfx('select');closeDialog();if(c.fn)c.fn();}
function closeDialog(){D.modal=false;D.onEnd=null;D.choices=null;D.preview=null;dialogEl.classList.add('hidden');dialogEl.classList.remove('modal');if(!dressOpen&&!diaryOpen&&!albumOpen)cv.focus({preventScroll:true});}
dialogEl.addEventListener('click',()=>{if(D.modal)advance();else if(!FISH.on)dialogEl.classList.add('hidden');});
const toastEl=$('#toast');let toastTimer=0;
function notify(txt){if(!txt)return;toastEl.textContent=txt;toastEl.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.add('hidden'),2600);}
