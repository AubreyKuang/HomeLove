"use strict";

/* ---------------- local test panel (dev.html only) ---------------- */
(function(){
  const dev={lock:false};
  const N=()=>state.need;
  const canPreview=()=>{
    if(startOpen||D.modal||busy||dressOpen||diaryOpen||albumOpen||mapOpen||FISH.on){
      notify('先回到游戏画面再预览');return false;
    }
    return true;
  };
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
    previewEvent(kind){
      if(!canPreview())return;
      const event=state.events[kind];
      if(event.done){notify('这个存档已完成该事件，可以在收藏里回看');return;}
      if(kind==='ufo'){
        const {x,y,start}=CottageEvents.landing;
        state.time=start;
        Object.assign(P,{x:x-19,y,dir:'right'});walkRoute=[];snapPets();
        event.checked=event.found=state.day;
        event.minute=start;
        notify(tr('worldUfoArrival'));
      }else{
        event.found ||= state.day;
        const n=npcs.find(person=>person.id==='xm');
        npcMenu(n);
      }
      save();updateHud();
    },
    previewSeason(season){
      if(!canPreview())return;
      const {seasons,seasonLength,seasonOf}=CottageActivities;
      if(seasonOf(state.day)!==season){
        const start=seasons.indexOf(season)*seasonLength+1,year=seasons.length*seasonLength;
        let day=Math.floor((state.day-1)/year)*year+start;
        if(day<=state.day)day+=year;
        state.day=day-1;newDay(9*60);
      }
      state.time=9*60;
      save();updateHud();
    },
    previewWeekend(sunday=false){
      if(!canPreview())return;
      let day=VillageWeekend.saleDay(state.day)+Number(sunday);
      if(day<state.day)day+=7;
      if(day!==state.day){state.day=day-1;newDay(10*60);}
      A.time(sunday?11:10);
      Object.assign(P,{x:9*16+8,y:24*16+12,dir:'left'});walkRoute=[];snapPets();save();
    },
    previewRiver(kind){
      if(!canPreview())return;
      let day=Math.max(state.day,3);
      while(!(kind==='glass'?VillageRiverside.exposed(day):VillageRiverside.weather(day)==='wind'))day++;
      if(day!==state.day){state.day=day-1;newDay(8*60);}
      A.time(kind==='glass'?8:16);
      const [x,y]=VillageRiverside.landing;
      Object.assign(P,{x:x*16+8,y:y*16+12,dir:kind==='glass'?'right':'down'});
      walkRoute=[];snapPets();save();
    },
    previewBlackout(next=false){
      if(!canPreview())return;
      let day=state.day+Number(next||state.blackout.last?.day===state.day);
      while(!VillageBlackout.saturday(day))day++;
      blackoutPreviewDay=day;
      if(day!==state.day){state.day=day-1;newDay(VillageBlackout.start-1);}
      A.time(18);
      state.time=VillageBlackout.start-0.15;
      Object.assign(P,{x:15*16+8,y:25*16+12,dir:'up'});
      walkRoute=[];snapPets();updateHud();save();
    },
    previewMoment(id){
      if(!canPreview())return;
      const scene=ResidentMoments.scenes[id],n=npcs.find(person=>person.id===id);
      if(state.moments.records[id]){
        openAlbum('events');albumSelected='moment:'+id;renderAlbum();return;
      }
      let day=Math.max(2,state.day);
      while(!ResidentMoments.available(state.moments,id,day,scene.start+5,VillageRiverside.weather(day)))day++;
      state.day=day;state.time=scene.start+5;
      const place=VillageMap.places[scene.place],[x,y]=place.spot;
      rel(n).met=true;
      Object.assign(n,{x:x*16+8,y:y*16+12,state:'here',leaving:false,path:null});
      Object.assign(P,{x:x*16+8,y:(y+1)*16+12,dir:'up'});
      walkRoute=[];snapPets();fillNeeds();updateHud();openResidentMoment(n);
    },
    previewProject(id){
      if(!canPreview())return;
      const place=VillageMap.places[id];
      state.time={cafe:18*60+5,court:9*60,stage:12*60,lookout:18*60}[id];
      if(id==='cafe')for(const item of VillageProjects.ingredients)state.inv[item]=Math.max(state.inv[item],1);
      const n=npcs.find(person=>person.id===place.resident);
      const [x,y]=place.anchor,[nx,ny]=place.spot;
      Object.assign(P,{x:x*16+8,y:y*16+12,dir:'up'});
      Object.assign(n,{x:nx*16+8,y:ny*16+12,state:'here',path:null,leaving:false,moving:false});
      walkRoute=[];snapPets();updateHud();openVillageProject(id,n);
    },
    previewSnowFishing(){
      if(!canPreview())return;
      A.previewSeason('winter');
      state.snowFishing.invited ||= state.day;
      state.snowFishing.checked=state.day;
      save();openSnowFishing(!state.snowFishing.stats.last);
    },
    previewXiaoman(){
      if(!canPreview())return;
      const n=npcs.find(person=>person.id==='xm'),story=state.xiaoman;
      if(!xiaomanRoute(n)||story.answer){notify('这个存档的小满剧情已经有了结局');return;}
      const date=!story.ribbon?2:!story.flowers?story.ribbon+1:story.flowers+2;
      const heartsNeeded=!story.ribbon?3:!story.flowers?5:7;
      if(state.day<date){
        state.day=date-1;newDay(10*60);
      }
      const r=rel(n);r.met=true;r.pts=Math.max(r.pts,heartsNeeded*10);
      story.offered=0;
      const scene=xiaomanScene(n);
      if(scene)startXiaomanScene(n,scene);
    },
    previewStory(id){
      if(!canPreview())return;
      const n=npcs.find(person=>person.id===id),history=state.stories[id];
      const chapter=ResidentStories.chapters[history.length];
      if(!chapter){notify('这条故事已经读完，可在收藏回看');return;}
      const earliest=(history.at(-1)?.day??2)+chapter.gap;
      if(state.day<earliest){state.day=earliest-1;newDay(10*60);}
      const r=rel(n);r.met=true;r.pts=Math.max(r.pts,chapter.hearts*10);
      openResidentStory(n,history.length);
    },
    wipe(){try{localStorage.removeItem(LS);localStorage.removeItem(LS+':backup');}catch(e){}location.reload();},
  };
  setInterval(()=>{if(dev.lock){fillNeeds();}if(!document.title.startsWith('[DEV]'))document.title='[DEV] '+document.title;},250);
  const box=document.createElement('div');
  box.style.cssText='position:fixed;right:12px;bottom:12px;max-height:55vh;overflow:auto;z-index:15;background:rgba(30,24,36,.92);color:#fff6e6;border:2px solid #ffd45e;border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:5px;font:12px/1.3 system-ui,sans-serif;max-width:170px';
  const head=document.createElement('button');head.type='button';head.textContent='🛠 测试面板 ▸';
  head.setAttribute('aria-expanded','false');
  head.style.cssText='all:unset;cursor:pointer;font-weight:700;color:#ffd45e';box.append(head);
  const body=document.createElement('div');body.style.cssText='display:none;flex-direction:column;gap:4px';box.append(body);
  head.onclick=()=>{
    const open=body.style.display==='none';
    body.style.display=open?'flex':'none';
    head.textContent=open?'🛠 测试面板 ▾':'🛠 测试面板 ▸';
    head.setAttribute('aria-expanded',String(open));
  };
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
  btn('🛸 预览飞船来客',()=>A.previewEvent('ufo'));
  btn('🍾 预览漂流瓶',()=>A.previewEvent('bottle'));
  btn('🌱 预览无名种子',()=>A.previewEvent('seed'));
  const seasons=document.createElement('div');seasons.style.cssText='display:flex;flex-wrap:wrap;gap:3px';body.append(seasons);
  for(const [index,label] of ['春','夏','秋','冬'].entries()){
    const b=document.createElement('button');b.type='button';b.textContent=label;b.title='预览四季';
    b.onclick=()=>{A.previewSeason(CottageActivities.seasons[index]);cv.focus({preventScroll:true});};seasons.append(b);
  }
  btn('🛍 跳到周六集市',()=>A.previewWeekend());
  btn('🎶 跳到周日活动',()=>A.previewWeekend(true));
  btn('🍃 跳到渡口有风的傍晚',()=>A.previewRiver('apron'));
  btn('💧 跳到渡口退水后',()=>A.previewRiver('glass'));
  btn('🎣 预览第一场雪冰钓',A.previewSnowFishing);
  btn('🎀 预览小满剧情',A.previewXiaoman);
  const stories=document.createElement('select');stories.setAttribute('aria-label','选择男主');
  for(const [id,name] of [['gy','顾言'],['xy','陆星野'],['jy','江屿'],['by','白夜']]){
    const option=document.createElement('option');option.value=id;option.textContent=name;stories.append(option);
  }
  stories.value='gy';body.append(stories);
  btn('📖 预览男主下一章',()=>A.previewStory(stories.value));
  btn('🏮 预览提灯女神',()=>A.previewBlackout());
  btn('🏮 跳到下一次停电',()=>A.previewBlackout(true));
  btn('🌿 预览共同活动',()=>A.previewProject(({gy:'cafe',xy:'court',jy:'stage',by:'lookout'})[stories.value]));
  btn('🍂 预览不期而遇',()=>A.previewMoment(stories.value));
  btn('🗑 清空测试存档',A.wipe);
  document.body.append(box);
  window.__dev=A;
})();
