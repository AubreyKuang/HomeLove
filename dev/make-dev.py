#!/usr/bin/env python3
"""Local-only: builds dev.html (index.html + a test panel). Not tracked by git.
Run from the repo root after updating the game:  python3 dev/make-dev.py
"""
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'index.html').read_text(encoding='utf-8')

ANCHOR = "applyLang();\nsnapPets();\nrequestAnimationFrame(loop);"
SAVE = "const LS='homelove-save-v1';"
assert ANCHOR in src, 'index.html changed: update ANCHOR in dev/make-dev.py'
assert SAVE in src, 'index.html changed: update SAVE in dev/make-dev.py'

PANEL = r'''
/* ---------------- local test panel (dev.html only) ---------------- */
(function(){
  const dev={lock:false};
  const N=()=>state.need;
  const fillNeeds=()=>{N().energy=N().hunger=N().mood=100;};
  const A={
    gold(){state.inv.gold=(state.inv.gold||0)+1;state.goldFound=true;updateHud();save();notify('🛠 金手指 +1（日记 › 背包 › 使用）');},
    useGold(){state.inv.gold=(state.inv.gold||0)+1;state.goldFound=true;useGold();},
    maxAll(){
      fillNeeds();
      NPCS.forEach(n=>Object.assign(rel(n),{pts:100,met:true,knowGift:true,knowStyle:true,m3:true,m6:true,m8:true}));
      ITEM_KEYS.forEach(k=>{if(k!=='gold')state.inv[k]=99;});
      state.flowersTotal=Math.max(3,state.flowersTotal);
      state.pets.forEach(p=>{p.bond=100;});
      updateHud();save();notify('🛠 状态、好感、道具、宠物亲密度全部拉满');
    },
    lock(b){dev.lock=!dev.lock;b.textContent=(dev.lock?'🔒 状态锁满：开':'🔓 状态锁满：关');if(dev.lock){fillNeeds();updateHud();}},
    resetDay(){NPCS.forEach(n=>{rel(n).done={};});state.pets.forEach(p=>{p.done={};});flowers.forEach(f=>{f.picked=false;});state.picked=[];save();notify('🛠 今天的互动次数和花朵已重置');},
    time(h){state.time=h*60;npcs.forEach(n=>{if(!rel(n).livesIn&&!summoned(n)){n.state='away';n.path=null;n.leaving=false;n.x=n.y=-100;}});updateHud();notify('🛠 时间跳到 '+fmt(state.time));},
    wipe(){try{localStorage.removeItem(LS);localStorage.removeItem(LS+':backup');}catch(e){}location.reload();},
  };
  setInterval(()=>{if(dev.lock){fillNeeds();}if(!document.title.startsWith('[DEV]'))document.title='[DEV] '+document.title;},250);
  const box=document.createElement('div');
  box.style.cssText='position:fixed;left:12px;top:64px;z-index:15;background:rgba(30,24,36,.92);color:#fff6e6;border:2px solid #ffd45e;border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:5px;font:12px/1.3 system-ui,sans-serif;max-width:170px';
  const head=document.createElement('button');head.type='button';head.textContent='🛠 测试面板 ▾';
  head.style.cssText='all:unset;cursor:pointer;font-weight:700;color:#ffd45e';box.append(head);
  const body=document.createElement('div');body.style.cssText='display:flex;flex-direction:column;gap:4px';box.append(body);
  head.onclick=()=>{const hid=body.style.display==='none';body.style.display=hid?'flex':'none';head.textContent=hid?'🛠 测试面板 ▾':'🛠 测试面板 ▸';cv.focus({preventScroll:true});};
  const btn=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;
    b.style.cssText='cursor:pointer;text-align:left;padding:4px 6px;border-radius:5px;border:1px solid #6b5a72;background:#3d3248;color:#fff6e6;font:inherit';
    b.onclick=()=>{fn(b);cv.focus({preventScroll:true});};body.append(b);return b;};
  btn('✨ 给我金手指',A.gold);
  btn('✨ 立刻用金手指',A.useGold);
  btn('💯 全部数值拉满',A.maxAll);
  btn('🔓 状态锁满：关',A.lock);
  btn('🔄 重置今天的次数',A.resetDay);
  const row=document.createElement('div');row.style.cssText='display:flex;flex-wrap:wrap;gap:3px';body.append(row);
  [[7,'07:00'],[10,'10:00'],[13,'13:00'],[16,'16:00'],[18,'18:00'],[21,'21:00']].forEach(([h,l])=>{const b=document.createElement('button');b.type='button';b.textContent=l;
    b.style.cssText='cursor:pointer;padding:2px 4px;border-radius:4px;border:1px solid #6b5a72;background:#3d3248;color:#fff6e6;font:inherit';
    b.onclick=()=>{A.time(h);cv.focus({preventScroll:true});};row.append(b);});
  btn('🗑 清空测试存档',A.wipe);
  document.body.append(box);
  window.__dev=A;
})();
'''

out = src.replace(SAVE, "const LS='homelove-save-dev';").replace(ANCHOR, "applyLang();\nsnapPets();\n" + PANEL + "\nrequestAnimationFrame(loop);")
out = out.replace('<title>', '<title>[DEV] ', 1)
(root / 'dev.html').write_text(out, encoding='utf-8')
print('wrote', root / 'dev.html')
