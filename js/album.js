"use strict";

/* ---------------- keepsake album ---------------- */
const POSTCARD_SCENES={gy:['home','garden'],xm:['garden','home'],xy:['pond','garden'],jy:['garden','stars'],by:['stars','pond']};
let albumTab='events',albumSelected=null;
const albumCards=()=>MemoryAlbum.collect(ALBUM_RESIDENTS,state.life,state.album)
  .concat(CottageEvents.cards(state.events,state.day),XiaomanStory.cards(state.xiaoman,state.day),ResidentStories.cards(state.stories),ResidentMoments.cards(state.moments),SnowFishing.cards(state.snowFishing),VillageWeekend.cards(state.weekend),CottageTravel.cards(state.travel),VillageRiverside.cards(state.riverside),VillageProjects.cards(state.projects),VillageBlackout.cards(state.blackout)).sort((a,b)=>b.day-a.day);
const KEEPSAKE_FRAME={x:117,y:33,width:20,height:12};
function setKeepsakeFrame(frame){
  const previous=state.album.framed;
  state.album.framed=frame;
  if(!save()){
    state.album.framed=previous;
    notify(tr('frameSaveFailed'));
    return false;
  }
  sfx('click');
  return true;
}
function keepsakeFrameLine(n){
  const frame=state.album.framed;
  if(!frame||frame.noticed||frame.resident!==n.id)return '';
  const inLivingRoom=p=>{
    const x=Math.floor(p.x/16);
    return x<11&&at(x,Math.floor((p.y-2)/16))===FLOOR;
  };
  if(!inLivingRoom(n)||!inLivingRoom(P)||Math.hypot(n.x-127,n.y-52)>76||
    hash2(state.day,frame.day+n.id.charCodeAt(0))>=.5)return '';
  frame.noticed=true;
  if(!save())frame.noticed=false;
  return tr(frame.postcard?'frameRecognizePostcard':'frameRecognize_'+n.id);
}
function updateAlbumBadge(){
  const count=albumCards().filter(card=>!state.album.seen.includes(card.key)).length;
  const button=$('#btnAlbum');
  if(count)button.dataset.new=count;else delete button.dataset.new;
  button.setAttribute('aria-label',count?tr('albumUnread',{count}):tr('btnAlbum'));
}
function albumScene(card,n){
  if(card.event?.startsWith('moment_'))return momentArt(n,card.choice);
  const art=mk(96,60),g=art.getContext('2d');
  art.setAttribute('aria-hidden','true');
  if(card.event==='blackout'){
    MemoryAlbum.paint(g,'stars');
    blitChar(g,state.o,'down',0,36,22);blitChar(g,n.outfit,'down',0,58,22);
    drawBlackoutLightForCard(g);return art;
  }
  if(card.event==='project_lookout'){
    drawVillageSketch(g,card.light,card.draft);return art;
  }
  if(card.event?.startsWith('project_')){
    const id=card.event.slice(8);
    MemoryAlbum.paint(g,id==='cafe'?'home':id==='court'?'garden':'pond');
    blitChar(g,n.outfit,'down',0,49,19);blitChar(g,state.o,'down',0,22,23);
    VillageMap.paintProp(g,{id,x:4,y:3,w:1,h:1},false,false,0);
    return art;
  }
  if(card.event==='riverApron'||card.event==='riverGlass'){
    MemoryAlbum.paint(g,'pond');
    drawRiverClue(g,card.event==='riverApron'?'apron':'glass',65,46,0);
    blitChar(g,state.o,'down',0,25,21);
    if(n)blitChar(g,n.outfit,'down',0,48,18);
    return art;
  }
  if(card.event==='firstOrder'){
    MemoryAlbum.paint(g,'home');
    blitChar(g,state.o,'down',0,25,20);
    CottageTravel.paint(g,card.vehicle,65,41,'right',false);
    CottageTravel.paint(g,card.vehicle,65,41,'right',true);
    g.fillStyle='#785441';g.fillRect(47,29,9,8);
    g.fillStyle='#f3d3a5';g.fillRect(48,30,7,6);
    g.fillStyle='#c49873';g.fillRect(51,30,1,6);
    return art;
  }
  if(card.event?.startsWith('weekend')){
    MemoryAlbum.paint(g,card.event==='weekend_lookout'?'stars':card.event==='weekend_stage'?'pond':'garden');
    VillageMap.paintProp(g,{id:card.event==='weekendStall'?'weekendStall':card.event.slice(8),x:4,y:2,w:card.event==='weekendStall'?2:1,h:1},false,false,0);
    blitChar(g,state.o,'down',0,23,22);
    if(n)blitChar(g,n.outfit,'down',0,48,22);
    return art;
  }
  if(card.event==='snowRace'||card.event==='snowDinner'){
    const dinner=card.event==='snowDinner';
    MemoryAlbum.paint(g,dinner?'home':'winterPond');
    blitChar(g,n.outfit,'down',0,23,21);
    blitChar(g,dinner?snowHost().outfit:state.o,'down',0,dinner?63:53,21);
    if(dinner){
      g.fillStyle='#966255';g.fillRect(42,40,32,7);
      g.fillStyle='#fff0cb';g.fillRect(50,40,5,3);g.fillRect(60,40,5,3);
      g.fillStyle='#9bbbce';g.fillRect(55,41,4,1);
      blitChar(g,state.o,'up',0,44,35);
    }else{
      g.fillStyle='#5b819e';g.fillRect(29,52,10,3);g.fillRect(59,52,10,3);
      g.fillStyle='#be777d';g.fillRect(34,51,2,2);g.fillRect(63,51,2,2);
    }
    return art;
  }
  if(card.kind==='story'){
    const scene={gy:'home',xy:'garden',jy:'pond',by:'stars'}[n.id];
    MemoryAlbum.paint(g,scene);
    blitChar(g,n.outfit,'down',0,36,20);
    const [x,y]=[64,scene==='home'?28:40];
    if(n.id==='gy'){
      g.fillStyle='#fff0cd';g.fillRect(x,y,7,6);g.fillRect(x+7,y+1,2,3);
      g.fillStyle='#93634c';g.fillRect(x+1,y,5,1);
    }else if(n.id==='xy'){
      g.fillStyle='#d9975d';g.fillRect(x,y+1,6,4);g.fillRect(x+1,y,4,6);
      g.fillStyle='#9d663f';g.fillRect(x+2,y,1,6);
    }else{
      g.fillStyle='#b38c7d';g.fillRect(x,y,13,9);
      g.fillStyle='#f2ddbb';g.fillRect(x+1,y+1,11,7);
      g.fillStyle=n.id==='jy'?'#a27891':'#728ba0';g.fillRect(x+3,y+3,7,1);g.fillRect(x+3,y+5,5,1);
    }
    return art;
  }
  if(card.event?.startsWith('xm')){
    MemoryAlbum.paint(g,card.event==='xmPostcard'?'home':'garden');
    blitChar(g,n.outfit,'down',0,29,22);
    if(card.event==='xmFlowers'||card.choice==='friends')CottageEvents.bloom(g,62,34);
    else{
      g.fillStyle='#a87379';g.fillRect(58,32,15,10);
      g.fillStyle='#f7dabc';g.fillRect(59,32,13,8);
      g.fillStyle='#db9d9e';g.fillRect(64,35,3,2);
    }
    return art;
  }
  if(card.event){
    MemoryAlbum.paint(g,card.event==='seed'?'garden':card.event==='bottle'?'pond':'stars');
    if(card.event==='seed'){
      blitChar(g,n.outfit,'down',0,27,19);
      CottageEvents.bloom(g,64,40);
      if(card.choice==='keep')CottageEvents.bloom(g,75,46);
    }else if(card.event==='bottle'){
      blitChar(g,n.outfit,'down',0,22,14);
      CottageEvents.bottle(g,61,46);
      if(card.choice==='reply'){g.fillStyle='#fff0c8';g.fillRect(56,25,15,8);}
    }else{
      CottageEvents.ship(g,65,card.event==='ufoPostcard'?19:29,card.event==='ufo');
      if(card.event==='ufo')CottageEvents.alien(g,38,43,card.choice);
    }
    return art;
  }
  const scene=card.kind==='postcard'?POSTCARD_SCENES[n.id][card.variant]:
    card.place??({rareDate:'garden',sharedFishing:'pond',neighborRequest:'garden',firstDate:'garden'}[card.kind]||card.kind);
  MemoryAlbum.paint(g,scene);
  blitChar(g,n.outfit,'down',0,38,['pond','stars'].includes(scene)?13:21);
  if(card.kind==='neighborRequest'||card.kind==='postcard'){
    g.fillStyle='#aa7464';g.fillRect(75,43,13,9);
    g.fillStyle='#ffe5b8';g.fillRect(76,43,11,7);
    g.fillStyle='#d19b7b';g.fillRect(80,46,3,1);
  }
  return art;
}
function albumDetails(card,n){
  if(card.event?.startsWith('moment_'))return Lp.moments[n.id].endings[card.choice].join(' ');
  if(card.event==='blackout')return tr('blackoutResult_'+card.choice);
  if(card.event==='project_cafe'){
    const menu=state.projects.cafe;
    return tr('projectCafeCard',{name:menu.caption||tr('projectCafeName_'+menu.name),items:menu.items.map(itemLabel).join(' + ')});
  }
  if(card.event==='project_court')return tr('projectBallBest',{best:state.projects.ball.best});
  if(card.event==='project_stage')return tr('projectMusicMemory');
  if(card.event==='project_lookout')return tr('projectArtCard',{light:tr('projectLight_'+card.light)});
  if(card.event==='riverApron')return tr('riverApron_'+card.choice);
  if(card.event==='riverGlass')return tr('riverGlass_'+card.choice);
  if(card.event==='firstOrder')return tr('firstOrderCard',{name:tr('vehicle_'+card.vehicle)});
  if(card.event==='weekendStall')return tr('weekStallCard');
  if(card.event?.startsWith('weekend_'))return tr('weekResult_'+card.event.slice(8)+'_'+card.choice);
  if(card.event==='snowRace')return snowRaceSummary(state.snowFishing.stats.last);
  if(card.event==='snowDinner')return tr('snowDinnerConfession');
  if(card.kind==='story')return residentChapter(n.id,card.index)[3+card.choice];
  if(card.event?.startsWith('xm'))return tr(card.choice?'world_xmConfession_'+card.choice:'xmCard_'+card.event);
  if(card.event)return tr(card.choice?'world_'+card.event+'_'+card.choice:'worldUfoPostcard');
  if(card.kind==='postcard')return tr('postcard_'+n.id+'_'+card.variant);
  if(card.kind==='sharedFishing'&&Object.hasOwn(CottageActivities.fish,card.info?.kind)){
    const caught=card.info;
    return tr('sharedFishingDetails',{day:tr('day',{d:caught.day}),time:fmt(caught.time),fish:itemLabel(caught.kind),size:caught.size});
  }
  if(card.kind==='firstGift'&&Object.hasOwn(Lp.items,card.info?.item))return tr('albumGiftDetail',{n:nm(n),i:itemLabel(card.info.item)});
  if(card.place&&Lp.dates[card.place])return tr('albumDateDetail',{place:Lp.dates[card.place].name});
  return tr('albumDetail_'+card.kind);
}
function renderAlbum(){
  const body=$('#albumBody'),cards=albumCards();
  body.replaceChildren();
  body.scrollTop=0;
  const selected=cards.find(card=>card.key===albumSelected);
  const title=card=>card.kind==='story'?residentChapter(card.resident,card.index)[0]:tr(card.event?'worldTitle_'+card.event:'albumCard_'+card.kind);
  const resident=card=>npcs.find(n=>n.id===card.resident);
  const stamp=(card,n)=>(n?nm(n)+' · ':'')+tr('day',{d:card.day});
  if(selected){
    const back=el('button','pbtn',tr('albumBack'));
    back.type='button';
    back.onclick=()=>{
      albumSelected=null;renderAlbum();
      body.querySelector('[data-key="'+selected.key+'"]')?.focus();
    };
    const n=resident(selected),page=el('article','album-page');
    const art=albumScene(selected,n);
    const keep=el('button','pbtn',tr('albumSave'));keep.type='button';
    keep.onclick=()=>downloadCanvas(keepsakeCard(title(selected),stamp(selected,n),albumDetails(selected,n),albumScene(selected,n)),'HomeLove-'+selected.key+'.png');
    const framed=state.album.framed?.key===selected.key&&state.album.framed.day===selected.day;
    const display=el('button','pbtn',tr(framed?'frameRemove':'frameHang'));
    display.type='button';
    display.onclick=()=>{
      let frame=null;
      if(!framed){
        const thumbnail=mk(KEEPSAKE_FRAME.width,KEEPSAKE_FRAME.height);
        const g=thumbnail.getContext('2d');
        g.imageSmoothingEnabled=false;g.drawImage(art,0,0,thumbnail.width,thumbnail.height);
        frame={key:selected.key,day:selected.day,resident:selected.resident??null,
          postcard:selected.kind==='postcard',image:thumbnail.toDataURL('image/png'),noticed:false};
      }
      if(setKeepsakeFrame(frame)){
        renderAlbum();
        $('#albumBody').querySelector('[data-frame-action]')?.focus();
      }
    };
    display.dataset.frameAction='';
    page.append(art,el('h3',null,title(selected)),el('small',null,stamp(selected,n)),el('p',null,albumDetails(selected,n)),keep,display);
    if(selected.event==='project_stage'){
      const play=el('button','pbtn',tr('projectMusicPlay'));
      play.type='button';play.onclick=()=>sfx('villageMix',state.projects.music);page.append(play);
    }
    body.append(back,page);back.focus();
    return;
  }
  const tabs=el('div','album-tabs');
  for(const [tab,label] of [['events','albumEvents'],['postcards','albumPostcards'],['badges','albumBadges']]){
    const b=el('button','pbtn'+(tab===albumTab?' primary':''),tr(label));
    b.type='button';b.dataset.tab=tab;b.setAttribute('aria-pressed',tab===albumTab);
    b.onclick=()=>{albumTab=tab;markAlbumTabSeen(cards);renderAlbum();body.querySelector('[data-tab="'+tab+'"]').focus();};
    tabs.append(b);
  }
  body.append(tabs);
  if(albumTab==='badges'){renderBadges(body);return;}
  const visible=cards.filter(card=>(card.kind==='postcard')===(albumTab==='postcards'));
  if(!visible.length){body.append(el('p',null,tr(albumTab==='events'?'albumEmptyEvents':'albumEmptyPostcards')));return;}
  const grid=el('div','album-grid');
  for(const card of visible){
    const n=resident(card),button=el('button','album-card');
    button.type='button';button.dataset.kind=card.kind;button.dataset.key=card.key;
    button.append(albumScene(card,n),el('strong',null,title(card)),el('small',null,stamp(card,n)));
    button.onclick=()=>{albumSelected=card.key;renderAlbum();};
    grid.append(button);
  }
  body.append(grid);
}
function markAlbumTabSeen(cards){
  if(albumTab==='badges')return;
  const unread=cards.filter(card=>(card.kind==='postcard')===(albumTab==='postcards')&&!state.album.seen.includes(card.key));
  if(unread.length){state.album.seen.push(...unread.map(card=>card.key));save();}
  updateAlbumBadge();
}
function openAlbum(tab){
  if(mapOpen||albumOpen||dressOpen||diaryOpen||startOpen||busy||D.modal||FISH.on)return;
  const cards=albumCards();
  const unread=cards.filter(card=>!state.album.seen.includes(card.key));
  albumTab=tab??(unread[0]?.kind==='postcard'?'postcards':'events');
  albumSelected=null;
  albumOpen=true;
  walkRoute=[];keys.clear();touchKeys.clear();
  markAlbumTabSeen(cards);
  sfx('page');$('#album').classList.remove('hidden');renderAlbum();$('#albumClose').focus();
}
function closeAlbum(){
  sfx('page');albumOpen=false;$('#album').classList.add('hidden');cv.focus({preventScroll:true});
}
$('#albumClose').addEventListener('click',closeAlbum);
$('#album').addEventListener('click',e=>{if(e.target.id==='album')closeAlbum();});
