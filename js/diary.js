"use strict";

/* ---------------- diary ---------------- */
function statusOf(r){const s=Lp.status;if(r.livesIn)return s.livesIn;if(r.couple)return s.couple;const h=hearts(r);if(h>=8)return s.h8;if(h>=6)return s.h6;if(h>=3)return s.h3;if(h>=1)return s.h1;return r.met?s.met:s.none;}
function nextHint(n){
  const story=state.stories[n.id];
  if(story&&rel(n).met&&story.length<ResidentStories.chapters.length){
    const ready=ResidentStories.next(state.stories,n.id,state.day,hearts(rel(n)));
    if(ready!==null)return tr('residentStoryReady');
  }
  if(xiaomanRoute(n))return tr(state.xiaoman.answer==='friends'?'xmHintFriends':state.xiaoman.answer==='space'?'xmHintSpace':'xmHint');
  const r=rel(n),h=hearts(r);
  if(!r.met)return tr('hintMeet',{t:fmt(n.arrive),n:nm(n)});
  if(r.livesIn)return tr('hintLives');
  if(r.couple)return r.pts>=100?tr('hintMoveIn',{n:nm(n)}):h>=9?tr('hint10'):tr('hint9');
  if(h<2)return tr('hint2');
  if(h<4)return tr('hint4');
  if(h<6)return tr('hint6');
  if(!anyCouple()&&!hasSharedExperience(n))return tr('hintSharedExperience');
  if(h<7)return tr('hint7');
  if(h<8)return tr('hint8');
  return anyCouple()?tr('hintTaken'):state.need.mood<40
    ?tr('confessMoodNeeded',{mood:Math.floor(state.need.mood)}):tr('hintConfess');
}
function appendKeepsake(container,n,key,title,details){
  const keepsake=el('article','keepsake');
  keepsake.dataset.kind=key;
  const sprite=mk(20,26);
  blitChar(sprite.getContext('2d'),n.outfit,'down',0,0,0);
  const caption=el('div','keepsake-caption');
  caption.append(el('strong',null,title),el('small',null,details));
  keepsake.append(sprite,caption);
  container.append(keepsake);
}
function renderDiary(){
  $('#diarySub').textContent=`${tr('day',{d:state.day})} · ${fmt(state.time)}`;
  const b=$('#diaryBody');b.innerHTML='';
  const revisit=state.rainReturn;
  if(revisit&&!revisit.done&&(revisit.day===state.day+1||rainReturnReady())){
    const spot=RAIN_DATE_MEETINGS[revisit.place];
    const name=nm(npcs.find(n=>n.id===revisit.resident));
    const section=el('section','dsec');
    section.append(el('h3',null,tr('dateRainReturnTitle')),el('p','rline',tr('dateRainReturnPlan',{
      ...RAIN_RETURN,place:tr(spot.name),day:tr('day',{d:revisit.day}),
      name
    })));
    if(revisit.day>state.day||state.time<spot.end){
      section.append(el('p','rline',tr(!revisit.together?'rainCompanionHint':revisit.walk==='meet'?'rainCompanionWalkBooked':
        revisit.walk==='pause'?'rainWalkPauseBooked':revisit.walk==='walking'?'rainCompanionWalking':'rainCompanionBooked',{
        name,start:fmt(spot.start),end:fmt(spot.end),...RAIN_COMPANION
      })));
      const conflict=!revisit.together&&rainCompanionConflict(revisit);
      const invite=el('button','pbtn',tr(conflict?'rainCompanionConflict':revisit.together?'rainCompanionCancel':'rainCompanionInvite',{name}));
      invite.type='button';
      invite.disabled=conflict;
      invite.onclick=()=>{
        if(setRainCompanion(revisit)){
          renderDiary();
          b.querySelector('[data-rain-companion]')?.focus();
        }
      };
      invite.dataset.rainCompanion='';
      section.append(invite);
      if(revisit.together&&!state.rainSketches[revisit.place]){
        section.append(el('p','rline',tr('rainCompanionSketchHint')));
        if(!revisit.draft)section.append(el('p','rline',tr('rainSketchSubjectHint',{minutes:RAIN_SKETCH_DRAFT_MINUTES})));
      }
      if(revisit.together&&!revisit.rebooked&&(!revisit.walk||revisit.walk==='meet')&&(revisit.day>state.day||state.time<spot.start)){
        section.append(el('p','rline',tr('rainCompanionWalkHint',RAIN_COMPANION_WALK)));
        const walk=el('button','pbtn',tr(revisit.walk==='meet'?'rainCompanionDirect':'rainCompanionWalk'));
        walk.type='button';walk.dataset.rainCompanionWalk='';
        walk.onclick=()=>{
          if(setRainCompanionWalk(revisit)){
            renderDiary();
            b.querySelector('[data-rain-companion-walk]')?.focus();
          }
        };
        section.append(walk);
      }
    }else if(revisit.together){
      section.append(el('p','rline',tr('rainCompanionMissed')));
      if(canRebookRainDraft(revisit)){
        section.append(el('p','rline',tr('rainDraftRebookHint')));
        const retry=el('button','pbtn',tr('rainDraftRebook',{start:fmt(spot.start),end:fmt(spot.end)}));
        retry.type='button';
        retry.onclick=()=>{
          if(rebookRainDraft(revisit)){
            renderDiary();
            b.querySelector('[data-rain-companion]')?.focus();
          }
        };
        section.append(retry);
      }
    }
    if(!state.rainSketches[revisit.place]&&(revisit.day>state.day||!rainSketchLimit(revisit))){
      section.append(el('p','rline',tr(revisit.draft?'rainSketchDraftDiary':'dateRainSketchHint',soloRainSketch(revisit))));
    }
    if(rainReturnReady()){
      const meetingFirst=revisit.together&&revisit.walk==='meet'&&state.time<spot.end;
      const stopping=revisit.together&&revisit.walk==='pause'&&state.time<spot.end;
      const route=el('button','pbtn',tr(meetingFirst?'rainCompanionWalkRoute':stopping?'rainWalkPauseRoute':'dateRainReturnRoute'));
      route.type='button';
      route.onclick=()=>{
        const [x,y]=(meetingFirst||stopping?rainCompanionStop(revisit):spot).p;
        closeDiary();
        if(!setWalkDestination(x*16+8,y*16+10))notify(tr('villageNoRoute'));
      };
      section.append(route);
    }
    b.append(section);
  }
  const boxAvailable=breakfastBoxReady(true);
  if(state.breakfastBoxDay===state.day+1||boxAvailable){
    const section=el('section','dsec');
    const {until,outdoorUntil,eatMinutes,hunger,outdoorHunger}=BREAKFAST_BOX;
    section.append(el('h3',null,tr('boxTitle')),el('p','rline',
      tr(boxAvailable?'boxToday':'boxTomorrow',{m:eatMinutes})));
    if(!boxAvailable||breakfastBoxReady())section.append(el('p','rline',tr('boxTablePlan',{t:fmt(until),h:hunger})));
    section.append(el('p','rline',tr('boxBenchPlan',{t:fmt(outdoorUntil),h:outdoorHunger})));
    const shareEnd=outdoorUntil-LUNCH_SHARE.minutes;
    const cafePlan=state.rel.gy.met&&(!boxAvailable||state.time<=shareEnd);
    if(cafePlan){
      section.append(el('p','rline',tr('boxSharePlan',{start:fmt(VillageMap.places.cafe.hours[0]),end:fmt(shareEnd)})));
    }
    if(boxAvailable){
      const destinations=[['market','boxMarketRoute']];
      if(cafePlan)destinations.push(['cafe','requestCafeRoute']);
      for(const [place,label] of destinations){
        const route=el('button','pbtn',tr(label));
        route.type='button';
        route.onclick=()=>{
          closeDiary();
          walkToVillagePlace(place,VillageMap.places[place]);
        };
        section.append(route);
      }
    }
    b.append(section);
  }
  const lunchInvitation=pendingLunchReturn();
  if(lunchInvitation){
    const section=el('section','dsec');
    const [opens,closes]=VillageMap.places.cafe.hours;
    section.append(el('h3',null,tr('boxReturnOpen')),el('p','rline',tr(
      state.day<lunchInvitation.day?'boxReturnTomorrow':'boxReturnPlan',{start:fmt(opens),end:fmt(closes)})));
    if(state.day>=lunchInvitation.day&&state.time<closes){
      const route=el('button','pbtn',tr('requestCafeRoute'));
      route.type='button';
      route.onclick=()=>{
        closeDiary();
        walkToVillagePlace('cafe',VillageMap.places.cafe);
      };
      section.append(route);
    }
    b.append(section);
  }
  const missed=missedDatePlan();
  const plan=activeDatePlan()||missed;
  if(plan){
    const section=el('section','dsec');
    section.append(el('h3',null,tr('upcomingPlans')),el('p','rline',tr(
      missed?'dateMeetingMissed':plan.shelter?'dateMeetingSheltered':plan.rainWalk?'dateRainBooked':'dateMeetingBooked',describeDatePlan(plan))));
    for(const option of dateRebookingChoices(missed)){
      const change=el('button','pbtn',tr('dateMeetingRebook',describeDatePlan(option)));
      change.type='button';
      change.onclick=()=>{
        const valid=dateRebookingChoices(missed).some(candidate=>candidate.day===option.day&&candidate.place===option.place);
        if(valid&&setDatePlan(option)){
          renderDiary();
          $('#diaryClose').focus();
        }
      };
      section.append(change);
    }
    if(!missed&&plan.day===state.day){
      if(canChangeDateShelter(plan)){
        const weather=tr('riverWeather_'+VillageRiverside.weather(state.day+1));
        section.append(el('p','rline',tr('dateMeetingRainForecast',{weather})));
        if(!plan.shelter&&!plan.rainWalk&&state.travel.owned.includes('umbrella')){
          section.append(el('p','rline',tr('dateMeetingUmbrellaHint',UMBRELLA_DATE)));
        }
        const tomorrow=rainDateTomorrow(plan);
        if(tomorrow){
          const postpone=el('button','pbtn',tr('dateMeetingPostpone',describeDatePlan(tomorrow)));
          postpone.type='button';
          postpone.onclick=()=>{
            if(postponeRainDate(plan)){
              renderDiary();
              $('#diaryClose').focus();
            }
          };
          section.append(postpone);
        }
        const change=el('button','pbtn',plan.shelter
          ?tr('dateMeetingRestore',{place:Lp.dates[plan.place].name})
          :tr('dateMeetingShelter',DATE_SHELTER));
        change.type='button';
        change.onclick=()=>{
          if(changeDateShelter(plan)){
            renderDiary();
            $('#diaryClose').focus();
          }
        };
        section.append(change);
        if(plan.rainWalk){
          const restore=el('button','pbtn',tr('dateMeetingRestore',{place:Lp.dates[plan.place].name}));
          restore.type='button';
          restore.onclick=()=>{
            if(changeRainDateRoute(plan)){
              renderDiary();
              $('#diaryClose').focus();
            }
          };
          section.append(restore);
        }
      }
      const route=el('button','pbtn',tr('dateMeetingRoute'));
      route.type='button';
      route.onclick=()=>{
        const [x,y]=(plan.shelter?DATE_SHELTER:plan.rainWalk?dateMeetingFor(plan):DATES[plan.place]).p;
        closeDiary();
        if(!setWalkDestination(x*16+8,y*16+10))notify(tr('villageNoRoute'));
      };
      section.append(route);
    }
    const cancel=el('button','pbtn',tr('dateMeetingCancel'));
    cancel.type='button';
    cancel.onclick=()=>{
      if(state.datePlan===plan&&setDatePlan(null)){
        renderDiary();
        $('#diaryClose').focus();
      }
    };
    section.append(cancel);
    b.append(section);
  }
  const request=CottageActivities.openRequest(state.neighborRequest,state.day);
  if(request?.status==='accepted'){
    const section=el('section','dsec'),n=npcs.find(person=>person.id===request.resident);
    section.append(el('h3',null,tr('requestJournal')),el('div','rline',tr('requestJournalEntry',{
      name:nm(n),items:neighborRequestItems(request).join(tr('requestOr')),day:tr('day',{d:request.day+2})
    })),el('p','rline',tr('requestMailboxPlan')));
    if(n.id==='gy'){
      section.append(el('p','rline',cafeRequestPlan()));
      const route=el('button','pbtn',tr('requestCafeRoute'));
      route.type='button';
      route.onclick=()=>{
        closeDiary();
        walkToVillagePlace('cafe',VillageMap.places.cafe);
      };
      section.append(route);
    }
    b.append(section);
  }else if(state.neighborRequest?.status==='dropped'){
    const section=el('section','dsec');
    section.append(el('h3',null,tr('requestJournal')),el('p','rline',
      tr(state.day>state.neighborRequest.closedDay?'requestMailboxReady':'requestMailboxPending')));
    b.append(section);
  }
  const invitation=state.life[FISHING_INVITE.resident]?.fishingInvitation;
  if(invitation&&!invitation.catch){
    const n=npcs.find(person=>person.id===FISHING_INVITE.resident);
    const day=Math.max(invitation.dueDay,state.day+Number(state.time>=FISHING_INVITE.closes));
    const plans=el('section','dsec');
    plans.append(el('h3',null,tr('upcomingPlans')),el('div','rline',tr('sharedFishingPlan',{
      name:nm(n),day:tr('day',{d:day}),start:fmt(FISHING_INVITE.opens),end:fmt(FISHING_INVITE.closes)
    })));
    if(day===state.day&&state.need.energy<5)plans.append(el('div','rline',tr('fishingEnergyNeeded')));
    b.append(plans);
  }
  const s1=el('section','dsec');s1.append(el('h3',null,tr('secRel')));const grid=el('div','rel');
  npcs.forEach(n=>{
    const r=rel(n),h=hearts(r),T=nt(n),card=el('div','rcard'),c=mk(20,26);blitChar(c.getContext('2d'),n.outfit,'down',0,0,0);
    const info=el('div','rinfo'),top=el('div','rtop');
    top.append(el('b',null,r.met?T.name:tr('unknownName')),el('span','pill'+(r.couple?' love':''),(xiaomanRoute(n)&&state.xiaoman.answer?tr('xmStatus_'+state.xiaoman.answer):statusOf(r))));
    const hs=el('div','hearts');hs.setAttribute('aria-label',tr('heartsAria',{x:h}));for(let i=0;i<10;i++)hs.append(el('span',i<h?'on':'','♥'));
    const dn=k=>r.done[k]?'✓':'○';
    const today=tr('today')+`${dn('chat')} ${tr('tChat')}　${dn('gift')} ${tr('tGift')}　${dn('act')} ${tr('tAct')}`+(r.m6&&!xiaomanRoute(n)?`　${dn('date')} ${tr('tDate')}`:'');
    const gf=Object.entries(n.gifts).sort((a,b)=>b[1]-a[1]);
    const giftTxt=r.knowGift?tr('favGiftVal',{a:ITEM_ICONS[gf[0][0]]+itemLabel(gf[0][0]),b:ITEM_ICONS[gf[1][0]]+itemLabel(gf[1][0])}):tr('unknown2');
    const styleTxt=r.knowStyle?listJoin(n.likeColors.map(i=>Lp.colors[i]))+' · '+listJoin(n.likeItems.map(itemName)):tr('unknown4');
    const notes=Object.entries(r.notes).map(([k,v])=>{const nmk=k.startsWith('gift_')?ITEM_ICONS[k.slice(5)]+itemLabel(k.slice(5)):k.startsWith('pet_')?PET_ICON[k.slice(4)]+Lp.pets.kinds[k.slice(4)].name:(Lp.notes[k]||k);return nmk+faceOf(v);});
    const nl=el('div','rline');nl.append(document.createTextNode(tr('notes')));nl.append(notes.length?document.createTextNode(notes.join('  ')):el('em',null,tr('notesEmpty')));
    const {start,end}=visitWindow(n);
    info.append(top,el('div','rsub',`${T.title} · `+(r.livesIn?tr('livesHere'):xiaomanRoute(n)&&state.xiaoman.answer?tr('xmVisits_'+state.xiaoman.answer):tr('visits',{a:fmt(start),b:fmt(end)}))),hs,
      el('div','rline',today),el('div','rline',tr('favGift')+giftTxt),el('div','rline',tr('favStyle')+styleTxt),nl,el('div','rnext',nextHint(n)));
    if(r.met){
      const tv=B().trust[n.id],jv=B().jealousy[n.id];
      info.append(el('div','rline',tr('trustLabel')+lifeText('：',': ','：')+tr(CottageBonds.trustWord(tv))+(jv>=10?' · '+tr('jealousyLine',{x:Math.round(jv)}):'')));
    }
    if(r.met){
      const life=state.life[n.id],cards=life?.cards||{};
      const labels={birthday:lifeText('生日快乐','Birthday','誕生日'),visitSick:lifeText('病中探望','A visit','お見舞い'),firstDate:lifeText('初次约会','First date','初デート'),rareDate:lifeText('难忘约会','Rare date','忘れられないデート'),neighborRequest:tr('requestKeepsake')};
      info.append(el('div','rline',lifeText('生日：每个周期第 ','Birthday: day ','誕生日：周期の ')+birthdayOf(n)+lifeText(' 天',' of each cycle',' 日目')));
      const keepsakes=el('div','keepsakes');
      for(const [key,day] of Object.entries(cards)){
        if(labels[key])appendKeepsake(keepsakes,n,key,labels[key],tr('day',{d:day}));
      }
      const caught=life?.fishingInvitation?.catch;
      if(caught&&Object.hasOwn(CottageActivities.fish,caught.kind)){
        appendKeepsake(keepsakes,n,'sharedFishing',tr('sharedFishingKeepsake'),tr('sharedFishingDetails',{
          day:tr('day',{d:caught.day}),time:fmt(caught.time),fish:itemLabel(caught.kind),size:caught.size
        }));
      }
      if(keepsakes.childElementCount)info.append(keepsakes);
    }
    card.append(c,info);grid.append(card);
  });
  s1.append(grid);
  const s2=el('section','dsec');s2.append(el('h3',null,tr('secBag')));const inv=el('div','inv');
  ITEM_KEYS.forEach(k=>{if(k==='gold'&&!state.goldFound&&!state.inv.gold)return;const it=Lp.items[k],c=el('div','icard'),t=el('div');t.append(el('b',null,`${it.name} ×${state.inv[k]}`),el('small',null,it.desc));
    if(k==='gold'&&state.inv.gold>0){const u=el('button','pbtn primary',tr('useItem'));u.type='button';u.style.marginTop='6px';u.onclick=()=>{closeDiary();useGold();};t.append(u);}
    c.append(el('span','ic',ITEM_ICONS[k]),t);inv.append(c);});
  s2.append(inv);
  const s3=el('section','dsec');s3.append(el('h3',null,tr('secTips')));const ul=el('ul','tips');
  Lp.tips.forEach(t=>ul.append(el('li',null,t)));
  s3.append(ul);
  const s4=el('section','dsec');s4.append(el('h3',null,tr('secPets')));
  if(!state.pets.length)s4.append(el('p','rline',tr('petsEmpty')));
  else{const pg=el('div','rel');state.pets.forEach(p=>{const card=el('div','rcard'),c=mk(20,20),cg=c.getContext('2d'),sp=petSprite(p.kind,p.ci,0);cg.drawImage(sp,Math.floor((20-sp.width)/2),20-sp.height);
    const info=el('div','rinfo'),top=el('div','rtop');top.append(el('b',null,p.name),el('span','pill',tr(p.mode==='follow'?'petModeFollow':'petModeStay')));
    const hs=el('div','hearts');hs.setAttribute('aria-label',tr('bondAria',{x:petHearts(p)}));for(let i=0;i<5;i++)hs.append(el('span',i<petHearts(p)?'on':'','♥'));
    const dn=k=>p.done[k]?'✓':'○',food=PET_FOOD[p.kind];
    info.append(top,el('div','rsub',`${PET_ICON[p.kind]} `+tr('adoptOpt',{c:Lp.pets.colors[p.kind][p.ci],k:Lp.pets.kinds[p.kind].name})),hs,
      el('div','rline',tr('today')+`${dn('pet')} ${tr('tPet')}　${dn('feed')} ${tr('tFeed')}　${dn('play')} ${tr('tPlay')}`),el('div','rline',`${tr('petFood')}: ${ITEM_ICONS[food]}${itemLabel(food)}`));
    c.style.cssText='width:60px;height:60px';card.append(c,info);pg.append(card);});s4.append(pg);}
  const pondLog=el('section','dsec');
  pondLog.append(el('h3',null,tr('pondLog')));
  const caught=el('div','inv');
  for(const kind of Object.keys(CottageActivities.fish)){
    const entry=state.fishLog[kind];
    const card=el('div','icard'),caption=el('div');
    caption.append(el('b',null,entry?itemLabel(kind):tr('unknownName')),
      el('small',null,entry
        ?tr('pondRecord',{count:entry.count,size:entry.best,day:entry.firstDay})
        :tr(kind+'Hint')));
    card.append(el('span','ic',entry?ITEM_ICONS[kind]:'?'),caption);
    caught.append(card);
  }
  pondLog.append(caught);
  if(state.projects.recording&&!state.projects.music){
    const sounds=el('section','dsec');
    sounds.append(el('h3',null,tr('worldTitle_project_stage')),
      el('div','rline',tr('projectMusicCount',{count:state.projects.sounds.length})),
      el('div','rline',tr('projectMusicWhere')));
    b.append(sounds);
  }
  const weekend=el('section','dsec');
  weekend.append(el('h3',null,tr('village_weekendBoard')),...weekendSchedule().map(line=>el('div','rline',line)));
  b.append(weekend);
  renderRecap(b);
  b.append(s1,s4,s2,pondLog,s3);
  renderRewind(b);
  renderQuietSettings(b);
}
function renderQuietSettings(body){
  const section=el('section','dsec');
  section.append(el('h3',null,tr('quietSettings')));
  const clock=el('button','pbtn',tr(state.offlineProgress?'offlineOn':'offlineOff'));
  clock.type='button';clock.setAttribute('aria-pressed',String(state.offlineProgress));
  clock.onclick=()=>{
    state.offlineProgress=!state.offlineProgress;
    if(!save())state.offlineProgress=!state.offlineProgress;
    renderDiary();
  };
  const backup=el('button','pbtn',tr('saveExport'));backup.type='button';
  backup.onclick=()=>{
    const data={...snapshot(),position:{x:P.x,y:P.y,dir:P.dir},saveVersion:SaveManager.version,savedAt:Date.now()};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const link=el('a');link.href=url;link.download='HomeLove-day-'+state.day+'.json';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  section.append(el('p','rline',tr('offlineHint')),clock,backup);
  const restore=el('button','pbtn',tr('saveImport'));restore.type='button';
  const file=el('input');file.type='file';file.accept='.json,application/json';file.hidden=true;
  restore.onclick=()=>file.click();
  file.onchange=async()=>{
    const chosen=file.files?.[0];file.value='';
    if(!chosen)return;
    let data;
    try{
      if(chosen.size>2*1024*1024)throw Error('Large save');
      data=SaveManager.decode(await chosen.text(),validSave,migrateSave);
      if(!data||!Number.isInteger(data.day)||data.day<1||data.time<0||data.time>1560||
        ['o','rel','inv'].some(k=>typeof data[k]!=='object'||Array.isArray(data[k])))throw Error('Invalid save');
    }catch(e){notify(tr('saveInvalid'));return;}
    closeDiary();
    talk(tr('saveImport'),[tr('saveImportConfirm',{day:data.day})],[
      {label:tr('saveImportAccept'),fn:()=>{
        data.savedAt=Date.now();
        if(!SaveManager.save(SaveManager.getStorage(),LS,data,validSave,{touch:true})){reportSaveFailure();return;}
        replacingSave=true;location.reload();
      }},
      {label:tr('never'),back:true,fn:null}
    ]);
  };
  section.append(restore,file);
  body.append(section);
}
function openDiary(){if(mapOpen||dressOpen||diaryOpen||albumOpen||busy||startOpen||D.modal||FISH.on)return;sfx('page');diaryOpen=true;keys.clear();touchKeys.clear();renderDiary();$('#diary').classList.remove('hidden');$('#diaryClose').focus();}
function closeDiary(){sfx('page');diaryOpen=false;$('#diary').classList.add('hidden');cv.focus({preventScroll:true});}
$('#diaryClose').addEventListener('click',closeDiary);
$('#diary').addEventListener('click',e=>{if(e.target.id==='diary')closeDiary();});
