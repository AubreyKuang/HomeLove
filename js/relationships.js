"use strict";

/* ---------------- romance ---------------- */
const tierOf=v=>v>=15?'love':v>=8?'like':v>=4?'ok':'meh';
const faceOf=v=>v>=12?'😍':v>=8?'😊':v>=5?'🙂':v>=2?'😐':'😣';
function note(n,k,v){rel(n).notes[k]=v;}
function outfitScore(n){
  const o=state.o,dress=byId(TOPS,o.top).hidesBottom;let s=0;
  ['top','shoes','hat','acc'].concat(dress?[]:['bottom']).forEach(k=>{if(n.likeItems.includes(o[k]))s++;});
  ['topColor'].concat(dress?[]:['bottomColor']).forEach(k=>{if(n.likeColors.includes(o[k]))s++;});
  return s;
}
function rememberPlayer(n,type,outcome,emotion,impact,object){
  NPCMemory.record(state,{
    type,time:(state.day-1)*1440+state.time,location:{x:n.x,y:n.y},
    participants:['player',n.id],outcome,object
  },[{person:n.id,subject:'player',emotion,impact,
    interpretation:{type,outcome,object,perspective:'recipient'}}]);
}
function memoryLine(n,entry){
  const data=entry.interpretation;
  if(!data||typeof data!=='object')return '';
  if(data.type==='blackout')return tr('blackoutRecall_'+data.object?.place);
  if(data.type==='villageProject')return tr('projectRecall_'+data.object);
  if(data.type==='riverApron'||data.type==='riverLetter')return tr(data.type+'Recall');
  if(data.type==='xiaomanConfession'&&data.object==='friends')return tr('xmRecallFriends');
  if(['worldUfo','worldBottle','worldSeed'].includes(data.type))return tr(data.type+'Recall_'+data.object);
  if(data.type==='neighborRequest'){
    if(n.id==='gy'&&data.outcome==='preparedTogether')return tr('requestCafeRecall');
    return tr('requestRecall_'+n.id,{item:itemLabel(data.object)});
  }
  if(data.type==='sharedFishing')return tr('sharedFishingRecall',{
    fish:itemLabel(data.object.kind),size:data.object.size
  });
  const where=Lp.dates[data.object]?.name||data.object;
  const copy={
    zh:{date:'还记得我们第一次约会吗？',gift:'你送我的礼物，我还记得。',birthday:'谢谢你记得我的生日。',visit:'那天我生病，你来看我，我很开心。',rival:'那天看到你和别人约会，我心里还有点难过。'},
    en:{date:'I still remember our first date.',gift:'I remember your gift.',birthday:'Thank you for remembering my birthday.',visit:'I was glad you visited when I was sick.',rival:'It still stings to remember that date I saw.'},
    ja:{date:'初めてのデート、今も覚えているよ。',gift:'プレゼント、今も覚えているよ。',birthday:'誕生日を覚えていてくれてありがとう。',visit:'お見舞いに来てくれてうれしかった。',rival:'あの日のことを思い出すと、まだ少しつらい。'}
  }[LANG]||{};
  if(data.outcome==='missed'){
    if(data.type==='birthday')return lifeText('那天是我的生日，我本来以为你会记得。','I had hoped you would remember my birthday.','誕生日を覚えていてくれると思っていたよ。');
    if(data.type==='visit')return lifeText('那几天不舒服，有点想见你。','I missed you while I was sick.','具合が悪かったとき、会いたかったよ。');
  }
  const line=copy[data.type]||'';
  const detail=data.type==='date'?where:data.type==='gift'?itemLabel(data.object):'';
  return line&&detail?line+' '+detail:line;
}
function lifeText(zh,en,ja){return ({zh,en,ja})[LANG]||en;}
function birthdayToday(n){return (state.day-1)%28+1===birthdayOf(n);}
function sickToday(n){return state.day>3&&(state.day+NPCS.indexOf(NPCS.find(npc=>npc.id===n.id))*3)%17===0;}
function rememberMissedOccasions(n){
  const relationship=rel(n);
  if(!relationship.met||hearts(relationship)<3||(n.id==='xm'&&state.xiaoman?.answer))return;
  if(birthdayToday(n)&&!relationship.done.birthday){rememberPlayer(n,'birthday','missed',-.48,75);trustNpc(n,-10);}
  if(sickToday(n)&&!relationship.done.visitSick){rememberPlayer(n,'visit','missed',-.30,68);trustNpc(n,-6);}
}
function markLife(n,type){
  const r=rel(n);if(r.done[type])return;
  r.done[type]=true;
  rememberPlayer(n,type==='visitSick'?'visit':type,'completed',.9,95);
  trustNpc(n,type==='visitSick'?15:12);
  lifeOf(n).cards[type]=state.day;
  addPts(n,8);
  talk(nm(n),[memoryLine(n,NPCMemory.recall(state,n.id)[0])],null,()=>npcMenu(n,true));
}
function addPts(n,d){
  const r=rel(n),before=hearts(r);r.pts=Math.max(0,Math.min(100,r.pts+d));
  if(r.pts>=20)r.knowGift=true;if(r.pts>=40)r.knowStyle=true;
  if(d>0)for(let i=0;i<Math.min(4,1+Math.floor(d/5));i++)setTimeout(()=>heart(n.x+(Math.random()*12-6),n.y-22),i*120);
  const h=hearts(r);sfx(d<0?'sad':h>before?'levelup':'heart');notify(tr('ptsToast',{e:d>=0?'💗':'💔',n:nm(n),d:(d>=0?'+':'')+d,h})+(h>before?' '+tr('levelUp'):''));save();
}
function milestone(n){
  if(xiaomanRoute(n))return;
  const r=rel(n),h=hearts(r),T=nt(n);
  if(h>=3&&!r.m3){r.m3=true;D.npc=n;talk(nm(n),T.m3);return;}
  if(h>=6&&!r.m6){r.m6=true;D.npc=n;talk(nm(n),T.m6,null,()=>notify(tr('unlockDate',{n:nm(n)})));return;}
  if(h>=8&&!r.m8){r.m8=true;D.npc=n;talk(nm(n),T.m8,null,()=>{if(!anyCouple())notify(tr(hasSharedExperience(n)?'unlockConfess':'hintSharedExperience',{n:nm(n)}));});}
}
function jealousCheck(n,next){
  const p=npcs.find(m=>m!==n&&rel(m).couple&&m.state!=='away'&&Math.hypot(m.x-P.x,m.y-P.y)<120);
  if(!p){if(next)next();return;}
  D.npc=p;talk(nm(p),[nt(p).jealous],null,()=>{rememberPlayer(p,'rival','witnessed',-.9,95,n.id);CottageBonds.addJealousy(B(),p.id,40);trustNpc(p,-10);addPts(p,-6);if(next)next();});
}

/* ---------------- trust, jealousy, drop-ins, achievements ---------------- */
const B=()=>state.bonds;
const ptsMap=()=>Object.fromEntries(NPCS.map(n=>[n.id,rel(n).pts]));
function courtNpc(n,kind){CottageBonds.court(B(),n.id,kind,state.day);}
function trustNpc(n,d){CottageBonds.addTrust(B(),n.id,d);}
function greetDropIn(n){
  const drop=CottageBonds.meetDropIn(B());if(!drop)return;
  n.path=null;n.idle=20;n.seekingPlayer=false;rel(n).done.visit=true;D.npc=n;
  const lines=[tr('dropIn_'+drop.reason)];let after=()=>{};
  if(drop.reason==='gift'){const k=pick(GIFT_KEYS);state.inv[k]=(state.inv[k]||0)+1;lines.push(tr('dropInGift',{n:nm(n),i:ITEM_ICONS[k]+itemLabel(k)}));updateHud();}
  if(drop.reason==='help')after=()=>{advanceTime(20);notify(tr('dropInHelp',{n:nm(n)}));trustNpc(n,6);};
  rememberPlayer(n,'dropIn','completed',.5,70,drop.reason);
  trustNpc(n,3);
  CottageBonds.unlock(B(),'dropIn',state.day);
  if(drop.reason==='jealous'&&B().heard[n.id]){talk(nm(n),lines,null,()=>confront(n,null));save();return;}
  talk(nm(n),lines,null,()=>{after();addPts(n,drop.reason==='missYou'?4:2);});
  save();
}
// Courting two people at once gets around. The one who heard asks you about it.
function confront(n,next){
  const rival=npcs.find(m=>m.id===B().heard[n.id]);
  if(!rival){CottageBonds.answer(B(),n.id,'soothe');if(next)next();return;}
  const r=nm(rival),trusting=B().trust[n.id]>=15;D.npc=n;
  const reply=(how,text,pts)=>()=>{
    CottageBonds.answer(B(),n.id,how);
    if(how==='honest')CottageBonds.unlock(B(),'honest',state.day);
    rememberPlayer(n,'confront',how,how==='honest'?.1:how==='soothe'?-.1:-.5,80,rival.id);
    D.npc=n;talk(nm(n),[text],null,()=>{if(pts)addPts(n,pts);save();if(next)next();});
  };
  talk(nm(n),[tr('confrontQ',{r})],[
    {label:tr('confrontHonest',{r}),fn:reply('honest',tr('confrontHonestReply'),-2)},
    {label:tr('confrontSoothe'),fn:reply('soothe',trusting?tr('confrontSootheReply'):tr('confrontSootheDoubt'),trusting?0:-2)},
    {label:tr('confrontAvoid'),fn:reply('avoid',tr('confrontAvoidReply'),-4)}]);
}
// Called once the new day has started: overnight gossip, yesterday's recap, today's possible visitor, a morning snapshot.
function bondsNewDay(){
  const b=B();
  const missed=CottageBonds.missDropIn(b,state.day-1,2880);
  if(missed){const n=npcs.find(m=>m.id===missed.id);if(n)rememberPlayer(n,'dropIn','missed',-.2,50,missed.reason);}
  CottageBonds.newDay(b);
  CottageBonds.spreadGossip(b,state.day,id=>hearts(state.rel[id])>=3);
  CottageBonds.recap(b,state.day,ptsMap());
  CottageBonds.startDay(b,state.day,ptsMap());
  planToday();
  snapshotMorning();
}
function planToday(){
  CottageBonds.planDropIn(B(),state.day,NPCS.filter(n=>rel(n).met&&!(xiaomanRoute(n)&&state.xiaoman?.answer)).map(n=>({id:n.id,hearts:hearts(rel(n)),livesIn:rel(n).livesIn})),Math.random);
}
function snapshotMorning(){try{SaveManager.snapshot(SaveManager.getStorage(),LS,state,validSave,{label:'d-'+state.day,day:state.day});}catch(e){}}
function bondsTick(){
  const missed=CottageBonds.missDropIn(B(),state.day,state.time);
  if(missed){const n=npcs.find(m=>m.id===missed.id);if(n){rememberPlayer(n,'dropIn','missed',-.2,50,missed.reason);notify(tr('dropInNote',{n:nm(n)}));}}
  const L=Object.values(state.life||{});
  CottageBonds.checkAchievements(B(),{dates:L.some(l=>l.firstDate)?1:0,birthdays:L.some(l=>l.cards?.birthday)?1:0,
    sickVisits:L.some(l=>l.cards?.visitSick)?1:0,couple:anyCouple(),livesIn:NPCS.some(n=>rel(n).livesIn),dropIns:0,
    rareDate:L.some(l=>l.cards?.rareDate)},state.day);
  if(B().fresh.length&&!D.modal&&!busy){
    const key=B().fresh.shift(),a=CottageBonds.ACHIEVEMENTS.find(x=>x.key===key);
    if(a){notify(tr(a.rare?'rareToast':'badgeToast',{x:tr('badge_'+key)}));sfx('levelup');}
    save();
  }
}
// Rare: a shooting star, once a night at most, only if you are outdoors after 21:00.
function skyWatch(){
  if(state.time<21*60||state.time>=23.5*60||B().shootingDay===state.day)return;
  const t=at(Math.floor(P.x/16),Math.floor((P.y-2)/16));
  if(t===FLOOR||t===DOOR)return;
  B().shootingDay=state.day;
  if(CottageBonds.rare(B(),'shootingStar',state.day,Math.random,.05)){notify(tr('shootingStar'));sfx('levelup');}
}
// Offline progress is optional and capped at four game hours.
let offlineMinutes=0;
function catchUpOffline(){
  if(!savedAtLoad||!state.offlineProgress)return 0;
  const seconds=(Date.now()-savedAtLoad)/1000;
  const gm=Math.min(seconds*TIME_RATE,240,Math.max(0,22*60-state.time));
  if(gm<20)return 0;
  state.time+=gm;decay(gm*.5,false);
  return gm;
}
/* Keepsake cards: a pixel frame around a scene, saved as PNG. */
function keepsakeCard(title,sub,body,art,color){
  const W=300,H=420,c=mk(W*2,H*2),g=c.getContext('2d');g.scale(2,2);g.imageSmoothingEnabled=false;
  g.fillStyle='#4a3340';g.fillRect(0,0,W,H);g.fillStyle='#fff6e8';g.fillRect(10,10,W-20,H-20);
  g.fillStyle=color||'#e2708a';
  for(let x=10;x<W-10;x+=8){g.fillRect(x,10,4,4);g.fillRect(x+4,H-14,4,4);}
  for(let y=10;y<H-10;y+=8){g.fillRect(10,y+4,4,4);g.fillRect(W-14,y,4,4);}
  let y=40;
  if(art){const s=Math.max(1,Math.floor((W-80)/art.width));g.drawImage(art,(W-art.width*s)/2,y,art.width*s,art.height*s);y+=art.height*s+30;}
  const font='"PingFang SC","Hiragino Sans","Microsoft YaHei",system-ui,sans-serif';
  g.textAlign='center';g.fillStyle='#3a2a33';g.font=`700 22px ${font}`;g.fillText(title,W/2,y);
  g.font=`12px ${font}`;g.fillStyle='#8a6a72';g.fillText(sub,W/2,y+22);
  g.font=`13px ${font}`;g.fillStyle='#4a3a40';g.textAlign='left';
  let row='',ty=y+52;
  for(const ch of String(body||'')){if(g.measureText(row+ch).width>W-70&&!'，。、！？」,.!?'.includes(ch)){g.fillText(row,35,ty);ty+=19;row=ch;if(ty>H-50)break;}else row+=ch;}
  if(row&&ty<=H-50)g.fillText(row,35,ty);
  g.textAlign='center';g.fillStyle='#a08890';g.font=`11px ${font}`;g.fillText('HomeLove',W/2,H-28);
  return c;
}
function badgeArt(a,unlocked){
  const c=mk(16,16),g=c.getContext('2d');
  const shape=['0000111111110000','0011111111111100','0111111111111110','0111111111111110','1111111111111111','1111111111111111','1111111111111111','1111111111111111',
    '1111111111111111','1111111111111111','1111111111111111','1111111111111111','0111111111111110','0111111111111110','0011111111111100','0000111111110000'];
  g.fillStyle=unlocked?a.color:'#c9bfae';
  shape.forEach((row,j)=>[...row].forEach((bit,i)=>{if(bit==='1')g.fillRect(i,j,1,1);}));
  g.fillStyle='#fff6e8';g.font='bold 10px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';
  g.fillText(unlocked?a.icon:'?',8,8.5);
  return c;
}
function downloadCanvas(c,name){
  c.toBlob(blob=>{if(!blob)return;const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);},'image/png');
}
function renderBadges(body){
  const b=B(),list=CottageBonds.ACHIEVEMENTS,got=list.filter(a=>b.achievements[a.key]!=null).length;
  body.append(el('p','rline',tr('badgeCount',{x:got,y:list.length})));
  const grid=el('div','badge-grid');
  for(const a of list){
    const day=b.achievements[a.key],open=day!=null,item=el('div','badge'+(open?'':' locked')+(a.rare?' rare':''));
    const art=badgeArt(a,open),pic=mk(48,48),pg=pic.getContext('2d');pg.imageSmoothingEnabled=false;pg.drawImage(art,0,0,48,48);
    item.append(pic,el('strong',null,open||!a.rare?(a.rare?'★ ':'')+tr('badge_'+a.key):tr('badgeLocked')),
      el('small',null,open?tr('badgeDay',{d:day}):a.rare?tr('badgeLockedText'):tr('badgeText_'+a.key)));
    if(open){const save=el('button','pbtn',tr('badgeSave'));save.type='button';
      save.onclick=()=>downloadCanvas(keepsakeCard(tr('badge_'+a.key),tr('badgeDay',{d:day}),tr('badgeText_'+a.key),art,a.color),'HomeLove-'+a.key+'.png');item.append(save);}
    grid.append(item);
  }
  body.append(grid);
}
function renderRecap(container){
  const r=B().report;
  if(!r||r.day!==state.day-1)return;
  const sec=el('section','dsec');sec.append(el('h3',null,tr('recapTitle')));
  const name=id=>{const n=npcs.find(m=>m.id===id);return n?nm(n):id;};
  const lines=r.changes.map(c=>tr(c.delta>0?'recapUp':'recapDown',{n:name(c.id),d:c.delta}));
  for(const j of r.jealous||[])lines.push(tr('recapJealous',{n:name(j.id),r:name(j.rival)}));
  if(r.note)lines.push(tr('recapNote',{n:name(r.note.id)}));
  if(!lines.length)lines.push(tr('recapNone'));
  const ul=el('ul','tips');lines.forEach(t=>ul.append(el('li',null,t)));sec.append(ul);
  container.append(sec);
}
function renderRewind(container){
  const snaps=SaveManager.snapshots(SaveManager.getStorage(),LS).sort((a,b)=>b.day-a.day);
  if(!snaps.length)return;
  const sec=el('section','dsec');sec.append(el('h3',null,tr('rewindTitle')),el('p','rline',tr('rewindHint')));
  const row=el('div','rewind-row');
  for(const snap of snaps){
    const b=el('button','pbtn',tr('rewindBtn',{d:snap.day}));b.type='button';
    b.onclick=()=>{
      if(!confirm(tr('rewindConfirm',{d:snap.day})))return;
      const s=SaveManager.restore(SaveManager.getStorage(),LS,snap.index,validSave,migrateSave,snap);
      if(!s){notify(tr('saveInvalid'));return;}
      s.savedAt=Date.now();
      if(!SaveManager.save(SaveManager.getStorage(),LS,s,validSave,{touch:true})){reportSaveFailure();return;}
      replacingSave=true;
      try{sessionStorage.setItem('homelove-rewound',String(snap.day));}catch(e){}
      location.reload();
    };
    row.append(b);
  }
  sec.append(row);container.append(sec);
}
const doneTag=(r,k,t)=>r.done[k]?tr('doneToday',{x:t}):t;
function hasSharedExperience(n){
  const life=state.life[n.id];
  return !!(life?.firstDate||state.moments.records[n.id]||life?.fishingInvitation?.catch);
}
function npcMenu(n,back){
  const r=rel(n),h=hearts(r),T=nt(n);D.npc=n;
  if(!back&&r.met&&B().heard[n.id]){confront(n,()=>npcMenu(n,true));return;}
  const alreadyMet=r.met,story=xiaomanRoute(n),friends=story&&state.xiaoman.answer==='friends';
  let greet;
  if(back)greet=tr('backGreet');
  else if(!r.met){r.met=true;greet=T.first;save();}
  else if(r.livesIn)greet=n.working?T[n.working]:pick(T.homeLines);
  else if(friends)greet=tr('xmFriendGreet');
  else greet=r.couple?T.greetCouple:T.greet[Math.min(2,Math.floor(h/3))];
  const apron=state.riverside.apron;
  if(n.id==='gy'&&apron?.status==='posted'&&!apron.heard){
    apron.heard=true;
    if(!save())apron.heard=false;
    greet+=' '+tr('riverApronLater');
  }
  const opts=[
    {label:doneTag(r,'chat',tr('optChat')),fn:()=>chat(n)},
    {label:tr('optSocial'),fn:()=>socialMenu(n)},
    {label:doneTag(r,'gift',tr('optGift')),fn:()=>giftMenu(n)}];
  opts.push(h>=2?{label:doneTag(r,'act',tr('optAct')),disabled:!!r.done.act,fn:()=>actMenu(n)}:{label:tr('optActLocked'),disabled:true});
  if(!story&&(h>=6||r.m6)){
    const reserved=activeDatePlan();
    if(reserved?.day===state.day&&reserved.resident===n.id){
      const meeting=DATE_MEETINGS[reserved.place];
      const ready=atPlannedDate(n,meeting);
      const label=ready?'dateMeetingStart':state.time<meeting.start?'dateMeetingWait':'dateMeetingGo';
      opts.push({label:tr(label,{t:fmt(meeting.start),place:Lp.dates[reserved.place].name}),
        disabled:!ready||!!r.done.date,fn:()=>dateWith(n,reserved.place,reserved)});
    }else if(r.done.date&&!reserved)opts.push({label:tr('dateMeetingTomorrow'),fn:()=>planDateMenu(n)});
    else opts.push({label:doneTag(r,'date',tr('optDate')),disabled:!!r.done.date,fn:()=>dateMenu(n)});
  }
  if(!story&&h>=6&&!r.couple&&!anyCouple()){
    if(!hasSharedExperience(n))opts.push({label:tr('hintSharedExperience'),disabled:true});
    else if(h>=8)opts.push({label:r.done.confess?tr('optConfessTomorrow'):state.need.mood<40
      ?tr('confessMoodNeeded',{mood:Math.floor(state.need.mood)}):tr('optConfess'),
      disabled:!!r.done.confess||state.need.mood<40,fn:()=>confess(n)});
  }
  if(r.couple&&r.pts>=100&&!r.livesIn)opts.push({label:tr('optMoveIn',{n:nm(n)}),fn:()=>moveIn(n)});
  homeOptions(n).forEach(o=>opts.push(o));
  const duty=villageDuty(n);
  if(canShareLunch(n))opts.unshift({label:tr('boxShare',LUNCH_SHARE),fn:()=>shareLunch(n)});
  if(n.id==='gy'&&VillageWeekend.coffee(state.weekend,state.day,state.time)&&Math.hypot(n.x-14*16-8,n.y-22*16-12)<32){
    opts.unshift({label:tr('weekCoffeeTaste'),fn:tasteMarketCoffee});
  }
  if(duty?.id&&Math.hypot(n.x-duty.spot[0]*16-8,n.y-duty.spot[1]*16-12)<52){
    opts.unshift(...blackoutOption(duty.id),projectOption(duty.id,n),...weekendOption(duty.id),villageActivityOption(duty.id,n));
  }
  if(n.id==='gy'&&apron?.status==='found')opts.unshift({label:tr('riverReturnApron'),fn:()=>returnApron('returned')});
  if(n.id==='xy'&&state.snowFishing.invited&&CottageActivities.seasonOf(state.day)==='winter')
    opts.unshift({label:tr('worldTitle_snowRace'),fn:()=>openSnowFishing()});
  if(fishingInvitationReady(n))opts.unshift({label:tr('sharedFishingTalk'),fn:()=>offerFishingInvitation(n)});
  const request=acceptedNeighborRequest(n);
  if(request)opts.unshift({label:tr('requestHandIn'),fn:()=>offerNeighborDelivery(n,request)});
  opts.unshift(...worldNpcOptions(n,back));
  const chapter=rel(n).met?ResidentStories.next(state.stories,n.id,state.day,h):null;
  if(chapter!==null)opts.unshift({label:tr('residentStoryOpen',{chapter:residentChapter(n.id,chapter)[0]}),fn:()=>openResidentStory(n,chapter)});
  const scene=xiaomanScene(n);
  if(scene)opts.unshift({label:tr('xmTalk'),fn:()=>startXiaomanScene(n,scene)});
  if(birthdayToday(n)&&!r.done.birthday)opts.push({label:lifeText('祝生日快乐','Wish a happy birthday','誕生日を祝う'),fn:()=>markLife(n,'birthday')});
  if(sickToday(n)&&!r.done.visitSick)opts.push({label:lifeText('探望生病的居民','Visit while sick','お見舞いする'),fn:()=>markLife(n,'visitSick')});
  opts.push({label:tr('optBye'),fn:null});
  if(momentAvailable(n))opts.unshift({label:tr('worldTitle_moment_'+n.id),fn:()=>openResidentMoment(n)});
  const lines=[greet];
  if(!back){
    const line=recallResidentMoment(n);
    if(line)lines.push(line);
  }
  if(!back&&alreadyMet&&!n.working){
    const frameLine=keepsakeFrameLine(n);
    if(frameLine)lines.push(frameLine);
    const life=lifeOf(n);
    const outfit=JSON.stringify(state.o);
    if(life.lastOutfit!==undefined&&life.lastOutfit!==outfit){
      const score=outfitScore(n);
      lines.push(score>=4?T.outfitHi:score>=2?T.outfitMid:lifeText('今天换了新搭配啊。','You put together a different look today.','今日は雰囲気が違うね。'));
    }
    life.lastOutfit=outfit;
  }
  talk(nm(n),lines,opts);
}
function chat(n){
  const r=rel(n),T=nt(n);D.npc=n;
  if(r.done.chat){talk(nm(n),[T.tired],null,()=>npcMenu(n,true));return;}
  r.done.chat=true;advanceTime(15);
  const first=state.life?.[n.id]?.firstDate;
  const recalled=NPCMemory.recall(state,n.id).find(e=>['gift','birthday','visit','rival','sharedFishing','neighborRequest','worldUfo','worldBottle','worldSeed','xiaomanConfession'].includes(e.type));
  const lines=[];
  const earlier=state.stories[n.id]?.[1];
  if(earlier&&state.day>earlier.day&&Math.random()<.4)lines.push(tr('residentRecall_'+n.id+'_'+earlier.choice));
  else if(first&&Math.random()<.4)lines.push(memoryLine(n,{interpretation:{type:'date',object:first.place}}));
  else if(recalled&&Math.random()<.4){const line=memoryLine(n,recalled);if(line)lines.push(line);}
  let gain=6+Math.round(NPCMemory.influence(state,n.id,'player'));const sc=outfitScore(n);
  if(sc>=4){lines.push(T.outfitHi);gain+=8;r.knowStyle=true;}else if(sc>=2){lines.push(T.outfitMid);gain+=4;}
  if(state.need.mood<25){lines.push(tr('tiredMood',{n:nm(n)}));gain-=3;}
  const envy=B().jealousy[n.id],trust=B().trust[n.id];
  if(envy>=50){lines.push(tr('chatJealous',{n:nm(n)}));gain-=3;}
  else if(trust>=40&&Math.random()<.35){lines.push(tr('chatTrusted',{n:nm(n)}));gain+=1;}
  const pet=petSeenBy(n);if(pet){lines.push(tr('petLiked',{n:nm(n),p:pet.name}));gain+=4;note(n,'pet_'+pet.kind,12);}
  const friends=xiaomanRoute(n)&&state.xiaoman.answer==='friends';
  lines.push(friends?tr('xmFriendChat'):pick(r.couple?T.chatCouple:T.chat[Math.min(2,Math.floor(hearts(r)/3))]));
  const after=()=>{addPts(n,gain);state.need.mood=clampN(state.need.mood+5);updateHud();milestone(n);};
  if(!friends&&Math.random()<0.55){const qi=Math.floor(Math.random()*T.questions.length),q=T.questions[qi];
    talk(nm(n),lines.concat([q.q]),q.opts.map(([label,reply],oi)=>({label,fn:()=>{gain+=n.qv[qi][oi];D.npc=n;talk(nm(n),[reply],null,after);}})));}
  else talk(nm(n),lines,null,after);
}
function momentAvailable(n){
  const scene=ResidentMoments.scenes[n?.id];
  if(!scene||!rel(n).met||n.state!=='here'||n.leaving||blackoutActive()||
    Math.hypot(n.x-P.x,n.y-P.y)>80)return false;
  const [x,y]=VillageMap.places[scene.place].spot;
  return Math.hypot(n.x-(x*16+8),n.y-(y*16+12))<30&&
    ResidentMoments.available(state.moments,n.id,state.day,state.time,VillageRiverside.weather(state.day));
}
function momentArt(n,choice){
  const art=mk(96,60),g=art.getContext('2d');
  MemoryAlbum.paint(g,n.id==='gy'?'home':n.id==='by'?'stars':n.id==='xy'?'garden':'pond');
  blitChar(g,n.outfit,'right',0,22,21);
  blitChar(g,state.o,'left',0,57,21);
  ResidentMoments.paint(g,n.id,48,51,choice);
  art.className='moment-art';art.setAttribute('aria-label',tr('worldTitle_moment_'+n.id));
  return art;
}
function openResidentMoment(n){
  if(!momentAvailable(n))return;
  const text=Lp.moments[n.id];
  walkRoute=[];D.npc=n;
  talk(nm(n),text.intro,[
    ...text.choices.map((label,choice)=>({label,fn:()=>finishResidentMoment(n,choice)})),
    {label:tr('momentLater'),back:true,fn:()=>{
      state.moments.declined[n.id]=state.day;save();D.npc=n;
      talk(nm(n),[text.later]);
    }}
  ],null,momentArt(n,0));
}
function finishResidentMoment(n,choice){
  if(!momentAvailable(n))return;
  if(!ResidentMoments.complete(state.moments,n.id,state.day,choice))return;
  if(!save()){
    delete state.moments.records[n.id];
    talk(nm(n),[tr('weekSaveFailed')]);return;
  }
  if(n.id==='jy')sfx('villageMix',{order:['water','letter','chime'],ending:choice?'quiet':'open'});
  else sfx('page');
  D.npc=n;updateHud();
  talk(nm(n),Lp.moments[n.id].endings[choice],[
    {label:tr('momentKeep'),fn:()=>{
      openAlbum('events');albumSelected='moment:'+n.id;renderAlbum();
    }},
    {label:tr('momentStay'),back:true,fn:null}
  ],null,momentArt(n,choice));
}
function recallResidentMoment(n){
  const record=state.moments.records[n.id];
  if(!record||state.day-record.day<3||record.recalled===state.day||
    (state.day-record.day)%4!==0)return '';
  const before=record.recalled;record.recalled=state.day;
  if(!save())record.recalled=before;
  return Lp.moments[n.id].recall[record.choice];
}
function drawResidentMoments(g,time){
  const offsets={gy:[-28,0],xy:[-21,-3],jy:[18,0],by:[-16,0]};
  for(const [id,scene] of Object.entries(ResidentMoments.scenes)){
    const n=npcs.find(person=>person.id===id),record=state.moments.records[id];
    if(!record&&!momentAvailable(n))continue;
    const [x,y]=VillageMap.places[scene.place].spot,[dx,dy]=offsets[id];
    ResidentMoments.paint(g,id,x*16+8+dx,y*16+12+dy,record?.choice??0,reducedMotion?0:time);
  }
}
function socialMenu(n){
  const r=rel(n),h=hearts(r);D.npc=n;
  const o=[
    {label:doneTag(r,'praise',tr('optPraise',{n:nm(n)})),disabled:!!r.done.praise,fn:()=>socialAct(n,'praise')},
    {label:doneTag(r,'joke',tr('optJoke')),disabled:!!r.done.joke,fn:()=>socialAct(n,'joke')}];
  if(!xiaomanRoute(n)){
    o.push(h>=4?{label:doneTag(r,'flirt',tr('optFlirt')),disabled:!!r.done.flirt,fn:()=>socialAct(n,'flirt')}:{label:tr('optFlirtLocked'),disabled:true});
    if(h>=7||r.couple)o.push({label:doneTag(r,'hand',tr('optHand')),disabled:!!r.done.hand,fn:()=>intimate(n,'hand')});
  }
  if(r.couple){o.push({label:doneTag(r,'hug',tr('optHug')),disabled:!!r.done.hug,fn:()=>intimate(n,'hug')});
    o.push(h>=9?{label:doneTag(r,'kiss',tr('optKiss')),disabled:!!r.done.kiss,fn:()=>intimate(n,'kiss')}:{label:tr('optKissLocked'),disabled:true});}
  o.push({label:tr('optBack'),back:true,fn:()=>npcMenu(n,true)});
  talk(nm(n),[tr('socialQ',{n:nm(n)})],o);
}
function socialAct(n,k){
  const r=rel(n);r.done[k]=true;advanceTime(5);D.npc=n;
  let v=n.social[k];const N=state.need,lines=[nt(n).social[k]];
  note(n,k,v);
  if(N.mood>=70)v+=2;else if(N.mood<25){v-=3;lines.push(tr('lowMood'));}
  if(k==='flirt')courtNpc(n,'flirt');
  talk(nm(n),lines,null,()=>{addPts(n,v);milestone(n);if(k==='flirt'&&!r.couple)jealousCheck(n);});
}
function intimate(n,k){
  const r=rel(n);r.done[k]=true;advanceTime(5);D.npc=n;
  const cfg={hand:[5,8],hug:[3,15],kiss:[4,18]}[k];
  courtNpc(n,k);
  heart(n.x,n.y-22);if(k!=='hand')heart(P.x,P.y-24);
  talk(nm(n),[nt(n)[k]],null,()=>{addPts(n,cfg[0]);state.need.mood=clampN(state.need.mood+cfg[1]);updateHud();milestone(n);if(!r.couple)jealousCheck(n);});
}
function giftMenu(n){
  const r=rel(n);D.npc=n;
  if(r.done.gift){talk(nm(n),[tr('giftDone')],null,()=>npcMenu(n,true));return;}
  if(GIFT_KEYS.every(k=>state.inv[k]<=0)){talk(tr('giftWho'),[tr('giftEmpty')],null,()=>npcMenu(n,true));return;}
  const opts=GIFT_KEYS.filter(k=>state.inv[k]>0).map(k=>{const kn=r.notes['gift_'+k];return {label:`${ITEM_ICONS[k]} ${itemLabel(k)} ×${state.inv[k]}`+(kn!=null?` ${faceOf(kn)}`:''),fn:()=>give(n,k)};});
  opts.push({label:tr('optBack'),back:true,fn:()=>npcMenu(n,true)});
  const inviteGift=n.id===FISHING_INVITE.resident&&state.inv[FISHING_INVITE.gift]>0&&!state.life[n.id]?.fishingInvitation;
  talk(tr('giftWho'),[tr('giftQ',{n:nm(n)})+(inviteGift?' '+tr('moonfishGiftHint'):'')],opts);
}
function give(n,k){
  const r=rel(n),d=n.gifts[k];
  if(r.done.gift||!(state.inv[k]>0))return;
  state.inv[k]--;r.done.gift=true;if(d>=15)r.knowGift=true;
  note(n,'gift_'+k,d);advanceTime(5);updateHud();D.npc=n;
  lifeOf(n).firstGift ||= {day:state.day,item:k};
  rememberPlayer(n,'gift',d>=15?'liked':d<0?'disliked':'received',Math.max(-1,Math.min(1,d/15)),65,k);
  if(n.id===FISHING_INVITE.resident&&k===FISHING_INVITE.gift)queueFishingInvitation(n);
  trustNpc(n,d>=15?3:d<0?-3:1);
  state.need.mood=clampN(state.need.mood+3);addPts(n,d);updateHud();
  talk(nm(n),[nt(n).giftLines[tierOf(d)].replace('{i}',itemLabel(k))],null,()=>milestone(n));
}
function actMenu(n){
  const dark=darkness()>0.5,r=rel(n);D.npc=n;
  const o=Object.keys(ACT_E).map(k=>{const kn=r.notes['act_'+k];
    return {label:Lp.acts[k].name+(ACT_DARK[k]&&!dark?tr('needDark'):'')+(kn!=null?` ${faceOf(kn)}`:''),disabled:ACT_DARK[k]&&!dark,fn:()=>doAct(n,k)};});
  o.push({label:tr('optBack'),back:true,fn:()=>npcMenu(n,true)});
  talk(nm(n),[tr('actQ',{n:nm(n)})],o);
}
function doAct(n,k){
  const r=rel(n),v=n.acts[k];r.done.act=true;D.npc=n;let got='';
  busyFade(()=>{advanceTime(60);const N=state.need;N.energy=clampN(N.energy-ACT_E[k]);N.mood=clampN(N.mood+8);
      if(k==='fish'&&Math.random()<.6){state.inv.fish++;got=tr('actFish');}updateHud();},
    ()=>{note(n,'act_'+k,v);const lines=[fill(Lp.acts[k].line,{n:nm(n)}),v>=12?nt(n).actFav:v>=6?tr('actGood',{n:nm(n)}):tr('actMeh',{n:nm(n)})];if(got)lines.push(got);
      D.npc=n;talk(nm(n),lines,null,()=>{addPts(n,v);milestone(n);});});
}
function activeDatePlan(){
  const plan=state.datePlan;
  if(plan&&(plan.day>state.day||(plan.day===state.day&&state.time<DATE_MEETINGS[plan.place].end))){
    if(plan.resident!=='xm'||state.rel.xm.couple||state.rel.xm.livesIn)return plan;
  }
}
function plannedDateMeeting(n){
  const plan=activeDatePlan();
  if(plan?.day!==state.day||plan.resident!==n.id)return;
  const meeting=DATE_MEETINGS[plan.place];
  if(state.time>=meeting.start-20)return meeting;
}
function atPlannedDate(n,meeting){
  return meeting&&state.time>=meeting.start&&n.state==='here'&&!n.leaving&&
    Math.hypot(n.x-meeting.spot[0]*16-8,n.y-meeting.spot[1]*16-12)<32&&
    Math.hypot(n.x-P.x,n.y-P.y)<45;
}
function describeDatePlan(plan){
  const {start,end}=DATE_MEETINGS[plan.place];
  return {name:nm(npcs.find(n=>n.id===plan.resident)), place:Lp.dates[plan.place].name,
    day:tr('day',{d:plan.day}),start:fmt(start),end:fmt(end),minutes:DATES[plan.place].minutes};
}
function setDatePlan(plan){
  const previous=state.datePlan;
  state.datePlan=plan;
  if(save())return true;
  state.datePlan=previous;
  return false;
}
function planDateMenu(n){
  if(activeDatePlan()||xiaomanRoute(n)||(hearts(rel(n))<6&&!rel(n).m6))return;
  const choices=Object.keys(DATE_MEETINGS).map(place=>{
    const plan={resident:n.id,place,day:state.day+1};
    const details=describeDatePlan(plan);
    return {label:tr('dateMeetingChoice',details),fn:()=>{
      if(plan.day!==state.day+1||activeDatePlan()||!setDatePlan(plan))return;
      talk(nm(n),[tr('dateMeetingBooked',details)]);
    }};
  });
  talk(nm(n),[tr('dateMeetingTomorrow')],choices.concat({label:tr('optBack'),back:true,fn:()=>dateMenu(n)}));
}
function dateMenu(n){
  const r=rel(n);D.npc=n;
  const o=Object.keys(DATES).map(k=>{const d=DATES[k],kn=r.notes['date_'+k];
    const block=dateBlock(d);
    return {label:Lp.dates[k].name+(kn!=null?` ${faceOf(kn)}`:'')+(block?tr(block):tr('dateEnds',{m:d.minutes,t:fmt(state.time+d.minutes)})),disabled:!!block||!!r.done.date,fn:()=>dateWith(n,k)};});
  if(!activeDatePlan())o.push({label:tr('dateMeetingTomorrow'),fn:()=>planDateMenu(n)});
  o.push({label:tr('optBack'),back:true,fn:()=>npcMenu(n,true)});
  talk(nm(n),[tr('dateQ',{n:nm(n)})],o);
}
function dateBlock(d){
  if(d.dark&&darkness()<=.5)return 'needDark';
  if(state.time+d.minutes>=26*60)return 'dateTooLate';
}
function dateWith(n,loc,plan=null){
  const r=rel(n),L=DATES[loc],v=n.dates[loc];
  if(r.done.date||dateBlock(L))return;
  const reserved=activeDatePlan();
  if(plan){
    const meeting=plannedDateMeeting(n);
    if(plan!==reserved||plan.place!==loc||!atPlannedDate(n,meeting))return;
    r.done.date=true;
    if(!setDatePlan(null)){delete r.done.date;return;}
  }else if(reserved?.day===state.day&&reserved.resident===n.id)return;
  r.done.date=true;D.npc=n;
  busyFade(()=>{advanceTime(L.minutes);P.x=L.p[0]*16+8;P.y=L.p[1]*16+12;P.dir=L.n[0]>L.p[0]?'right':'left';n.x=L.n[0]*16+8;n.y=L.n[1]*16+12;n.dir=L.n[0]>L.p[0]?'left':'right';n.path=null;n.idle=30;snapPets();},
    ()=>{note(n,'date_'+loc,v);const q=nt(n).dateQ,react=v>=12?tr('dateFav',{n:nm(n)}):v>=7?tr('dateOk',{n:nm(n)}):tr('dateMeh',{n:nm(n)});
      D.npc=n;talk(nm(n),[Lp.dates[loc].line,react,q.q],q.opts.map(([label,reply],oi)=>({label,fn:()=>{D.npc=n;talk(nm(n),[reply],null,()=>{const life=lifeOf(n);life.firstDate ||= {place:loc,day:state.day};life.cards.firstDate ||= state.day;if(Math.random()<.05&&!life.cards.rareDate){life.cards.rareDate=state.day;life.rareDatePlace=loc;}rememberPlayer(n,'date','completed',Math.max(-1,Math.min(1,(v+n.dv[oi])/15)),80,loc);courtNpc(n,'date');trustNpc(n,3);addPts(n,6+v+n.dv[oi]);state.need.mood=clampN(state.need.mood+12);updateHud();milestone(n);if(!r.couple)jealousCheck(n);});}})));});
}
function confess(n){
  const r=rel(n);
  if(xiaomanRoute(n)||hearts(r)<8||anyCouple()||r.done.confess)return;
  if(!hasSharedExperience(n)){notify(tr('hintSharedExperience'));return;}
  D.npc=n;r.done.confess=true;
  talk(tr('you'),[tr('confessStart')],null,()=>{
    D.npc=n;
    if(state.need.mood<40){talk(nm(n),[tr('confessFail1',{n:nm(n)}),tr('confessFail2')],null,()=>{rememberPlayer(n,'confession','rejected',-.5,85);addPts(n,-3);});return;}
    r.couple=true;state.need.mood=clampN(state.need.mood+25);
    for(let i=0;i<8;i++)setTimeout(()=>heart(n.x+(Math.random()*20-10),n.y-20-Math.random()*8),i*100);
    talk(nm(n),nt(n).confess,null,()=>{rememberPlayer(n,'confession','accepted',1,100);courtNpc(n,'confess');trustNpc(n,10);addPts(n,5);updateHud();notify(tr('becameCouple',{n:nm(n)}));});
  });
}
function moveIn(n){const r=rel(n);D.npc=n;talk(nm(n),nt(n).moveIn,null,()=>{r.livesIn=true;n.path=null;n.idle=5;save();notify(tr('movedIn',{n:nm(n)}));});}

/* ---------------- resident stories ---------------- */
const residentChapter=(id,index)=>Lp.residentStories[id][index];
function openResidentStory(n,index){
  const r=rel(n);
  if(ResidentStories.next(state.stories,n.id,state.day,hearts(r))!==index)return;
  const [,intro,choices,firstReply,secondReply]=residentChapter(n.id,index);
  const lines=[intro];
  if(index===2)lines.unshift(tr('residentRecall_'+n.id+'_'+state.stories[n.id][1].choice));
  const replies=[firstReply,secondReply];
  D.npc=n;
  const opts=choices.map((label,choice)=>({label,fn:()=>{
    if(!ResidentStories.complete(state.stories,n.id,state.day,hearts(r),index,choice))return;
    rememberPlayer(n,'residentStory','completed',.5,75,index);
    addPts(n,3);updateHud();
    D.npc=n;talk(nm(n),[replies[choice]]);
  }}));
  opts.push({label:tr('optBack'),back:true,fn:()=>npcMenu(n,true)});
  talk(nm(n),lines,opts);
}

/* ---------------- Xiaoman’s story ---------------- */
function xiaomanRoute(n){
  return n.id==='xm'&&!rel(n).couple&&!rel(n).livesIn;
}
function xiaomanScene(n){
  if(!xiaomanRoute(n)||!rel(n).met)return null;
  return XiaomanStory.next(state.xiaoman,state.day,hearts(rel(n)));
}
function startXiaomanScene(n,scene){
  if(xiaomanScene(n)!==scene)return;
  const story=state.xiaoman;
  story.offered=state.day;
  n.path=null;n.idle=20;n.seekingPlayer=false;
  D.npc=n;save();
  const choices=scene==='confession'?[
    {label:tr('xmChooseFriends'),fn:()=>finishXiaoman(n,'friends')},
    {label:tr('xmChooseSpace'),fn:()=>finishXiaoman(n,'space')}
  ]:[
    {label:tr('xmAccept_'+scene),fn:()=>{
      story[scene]=state.day;
      const dialogue=()=>{D.npc=n;talk(nm(n),[tr('xmScene_'+scene)]);};
      if(scene==='flowers'){
        busyFade(()=>{
          Object.assign(P,{x:19*16+8,y:7*16+12,dir:'up'});
          Object.assign(n,{x:20*16+8,y:7*16+12,dir:'up',state:'here',path:null,leaving:false,moving:false,idle:20});
          snapPets();addPts(n,5);updateHud();
        },dialogue);
      }else{addPts(n,5);updateHud();dialogue();}
    }}
  ];
  choices.push({label:tr('xmLater'),back:true,fn:()=>say(nm(n),tr('xmWait'))});
  talk(nm(n),scene==='confession'?[tr('xmConfess1'),tr('xmConfess2')]:[tr('xmInvite_'+scene)],choices);
}
function finishXiaoman(n,answer){
  const story=state.xiaoman;
  if(story.answer)return;
  story.answer=answer;story.answered=state.day;
  if(state.neighborRequest?.resident==='xm'&&['offered','accepted'].includes(state.neighborRequest.status))state.neighborRequest=null;
  rememberPlayer(n,'xiaomanConfession',answer,-.35,100,answer);
  n.state='away';n.path=null;n.x=n.y=-100;
  save();updateHud();
  D.npc=n;talk(nm(n),[tr('xmPlayer_'+answer),tr('world_xmConfession_'+answer)]);
}

/* ---------------- cottage events ---------------- */
function updateNightVisitor(){
  const {landing}=CottageEvents;
  if(state.day<2||state.time<landing.start||state.time>=landing.end||FISH.on)return;
  const tile=at(Math.floor(P.x/16),Math.floor((P.y-2)/16));
  if(tile===FLOOR||tile===DOOR)return;
  const ufo=state.events.ufo;
  if(ufo.checked===state.day||ufo.done)return;
  if(CottageEvents.discover(state.events,'ufo',state.day,Math.random())){
    ufo.minute=state.time;
    sfx('ding');notify(tr('worldUfoArrival'));
  }
  save();
}
function visitorTarget(){
  if(!CottageEvents.landed(state.events,state.day,state.time))return null;
  const {x,y}=CottageEvents.landing;
  if(state.time-state.events.ufo.minute<4||Math.hypot(x-P.x,y-P.y)>22)return null;
  return {kind:'visitor',verb:tr('worldUfoTalk'),x,y:y-20};
}
let visitorDeparture=-1;
function visitAlien(){
  const flower='flower',fish=['fish','carp','moonfish'].find(k=>state.inv[k]>0);
  const choices=[
    {label:tr('worldUfoFlower'),disabled:state.inv.flower<1,fn:()=>finishVisit('flower',flower)},
    {label:tr('worldUfoFish',{fish:fish?itemLabel(fish):itemLabel('fish')}),disabled:!fish,fn:()=>finishVisit('fish',fish)},
    {label:tr('worldUfoSit'),fn:()=>finishVisit('sit')},
    {label:tr('walkAway'),fn:null}
  ];
  talk(tr('worldVisitor'),[tr('worldUfoIntro')],choices);
}
function finishVisit(choice,item){
  if(item&&state.inv[item]<1)return;
  if(!CottageEvents.finish(state.events,'ufo',state.day,choice))return;
  if(item)state.inv[item]--;
  if(choice==='fish')state.inv.shell++;
  state.need.mood=clampN(state.need.mood+8);
  visitorDeparture=absMin();save();updateHud();sfx('ding');
  talk(tr('worldVisitor'),[tr('world_ufo_'+choice)]);
}
function drawNightVisitor(g,time){
  const landed=CottageEvents.landed(state.events,state.day,state.time);
  const lift=absMin()-visitorDeparture;
  const departing=visitorDeparture>=0&&lift>=0&&lift<6;
  if(!landed&&!departing)return;
  const {x,y}=CottageEvents.landing;
  const elapsed=state.time-state.events.ufo.minute;
  const height=landed?Math.max(0,4-elapsed)*13:lift*12;
  const open=landed&&elapsed>=4;
  const sy=Math.round(y-26-height);
  g.fillStyle='#8ac3c9';g.fillRect(x-17,6*16+6,21,1);g.fillRect(x-12,6*16+9,16,1);
  if(landed){
    glow(g,x,sy+7,24,'rgba(166,225,214,.28)');
    if(open){g.fillStyle='rgba(181,231,205,.18)';g.fillRect(x-11,sy+4,18,20);}
  }
  CottageEvents.ship(g,x-11,sy,open);
  if(open)CottageEvents.alien(g,x,y+(Math.sin(time*2)>0?0:1));
}
function worldNpcOptions(n,back){
  const {ufo,bottle,seed}=state.events;
  const opts=[];
  if(n.id==='by'&&ufo.done&&state.day>ufo.done&&!ufo.told){
    opts.push({label:tr('worldTellBai'),fn:()=>{
      ufo.told=state.day;
      rememberPlayer(n,'worldUfo',ufo.choice,.8,90,ufo.choice);
      save();talk(nm(n),[tr('worldBaiReply')]);
    }});
  }
  if(n.id!=='xm')return opts;
  if(bottle.found&&!bottle.done)opts.push({label:tr('worldBottleTalk'),fn:()=>bottleMenu(n)});
  if(!back&&!seed.found&&seed.checked!==state.day&&state.day>=2&&state.time>=9*60&&state.time<15*60){
    if(CottageEvents.discover(state.events,'seed',state.day,Math.random()))notify(tr('worldSeedOfferHint'));
    save();
  }
  if(seed.found&&!seed.accepted)opts.push({label:tr('worldSeedOffer'),fn:()=>{
    seed.accepted=state.day;
    save();talk(nm(n),[tr('worldSeedGift')]);
  }});
  return opts;
}
function bottleMenu(n){
  talk(nm(n),[tr('worldBottleIntro')],[
    {label:tr('worldBottleDeliver'),fn:()=>resolveWorldEvent(n,'bottle','deliver')},
    {label:tr('worldBottleReply'),fn:()=>resolveWorldEvent(n,'bottle','reply')},
    {label:tr('optBack'),back:true,fn:()=>npcMenu(n,true)}
  ]);
}
function seedPlantOption(i){
  const seed=state.events?.seed;
  if(!seed?.accepted||seed.done||state.garden.some(plot=>plot?.crop==='mysteryBloom'))return null;
  return {label:tr('worldSeedPlant'),fn:()=>{
    if(state.garden[i]||seed.done||state.garden.some(plot=>plot?.crop==='mysteryBloom'))return;
    state.garden[i]=CottageActivities.seed('mysteryBloom');
    save();say(tr('farm'),tr('worldSeedPlanted'));
  }};
}
function bloomMenu(i){
  const seed=state.events.seed;
  const n=npcs.find(n=>n.id==='xm');
  if(!seed.done){
    talk(tr('farm'),[tr('worldSeedBloomed')],[
      {label:tr('worldSeedKeep'),fn:()=>resolveWorldEvent(n,'seed','keep')},
      ...(state.xiaoman.answer==='space'?[]:[{label:tr('worldSeedReturn'),fn:()=>resolveWorldEvent(n,'seed','return',i)}]),
      {label:tr('walkAway'),fn:null}
    ]);
    return;
  }
  talk(tr('farm'),[tr('worldSeedStillHere')],[
    {label:tr('clearPlot'),fn:()=>talk(tr('farm'),[tr('clearPlotAsk',{crop:tr('worldBloomName')})],[
      {label:tr('clearPlot'),fn:()=>{state.garden[i]=null;save();}},
      {label:tr('optBack'),back:true,fn:()=>bloomMenu(i)}
    ])},
    {label:tr('walkAway'),fn:null}
  ]);
}
function resolveWorldEvent(n,kind,choice,plotIndex){
  if(!CottageEvents.finish(state.events,kind,state.day,choice))return;
  if(kind==='seed'&&choice==='return')state.garden[plotIndex]=null;
  if(state.xiaoman.answer==='space')save();
  else{
    rememberPlayer(n,kind==='bottle'?'worldBottle':'worldSeed',choice,.8,80,choice);
    addPts(n,5);
  }
  updateHud();
  talk(kind==='seed'?tr('farm'):nm(n),[tr('world_'+kind+'_'+choice)]);
}
