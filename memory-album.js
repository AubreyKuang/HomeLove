const MemoryAlbum = (() => {
  const kinds=['firstDate','birthday','visitSick','rareDate','neighborRequest','firstGift','sharedFishing'];
  const postcardKey=card=>`postcard:${card.resident}:${card.variant}`;
  function load(saved,residents,day){
    const postcards=[],keys=new Set();
    for(const card of Array.isArray(saved?.postcards)?saved.postcards:[]){
      if(!card||!residents.includes(card.resident)||![0,1].includes(card.variant)||
          !Number.isInteger(card.day)||card.day<1||card.day>day)continue;
      const key=postcardKey(card);
      if(keys.has(key))continue;
      keys.add(key);
      postcards.push({resident:card.resident,variant:card.variant,day:card.day});
    }
    return {postcards,seen:Array.isArray(saved?.seen)?[...new Set(saved.seen.filter(key=>typeof key==='string'))]:[]};
  }
  function nextPostcard(day,residents,album){
    if(day%3!==0||album.postcards.some(card=>card.day===day))return null;
    const last=album.postcards.at(-1)?.resident;
    const start=residents.indexOf(last)+1;
    for(let offset=0;offset<residents.length;offset++){
      const resident=residents[(start+offset)%residents.length];
      const variant=[0,1].find(i=>!album.postcards.some(card=>card.resident===resident&&card.variant===i));
      if(variant!==undefined)return {resident,variant,day};
    }
    return null;
  }
  function collect(residents,life,album){
    const cards=[];
    for(const resident of residents){
      const record=life?.[resident];
      for(const kind of kinds){
        const info=kind==='sharedFishing'?record?.fishingInvitation?.catch:
          kind==='firstGift'?record?.firstGift:null;
        const day=info?.day??record?.cards?.[kind];
        if(!Number.isInteger(day)||day<1)continue;
        const place=kind==='firstDate'?record?.firstDate?.place:kind==='rareDate'?record?.rareDatePlace:null;
        cards.push({key:`${resident}:${kind}`,resident,kind,day,place,info});
      }
    }
    for(const card of album.postcards)cards.push({...card,key:postcardKey(card),kind:'postcard'});
    return cards.sort((a,b)=>b.day-a.day);
  }
  function paint(g,scene){
    const r=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
    const night=scene==='stars',pond=scene==='pond'||night,room=['home','birthday','visitSick','firstGift'].includes(scene);
    r(0,0,96,60,room?'#f5d7ba':night?'#35486d':'#b5dce4');
    if(scene==='winterPond'){
      r(0,21,96,39,'#dfeaf1');r(5,35,86,23,'#a9ccdf');r(11,33,74,2,'#bddbe7');
      r(5,35,86,1,'#f4f8f8');r(13,57,70,1,'#f4f8f8');
      for(const [x,y] of [[7,8],[24,13],[32,6],[42,18],[58,8],[71,15],[87,7],[79,28],[14,25]])r(x,y,1,1,'#fbf9ef');
      for(const [x,y,w] of [[12,40,11],[43,46,13],[77,42,7],[16,53,8],[72,54,10]])r(x,y,w,1,'#d9edf0');
      return;
    }
    if(room){
      for(let x=1;x<96;x+=10)r(x,0,1,38,'#eac4a9');
      r(0,37,96,23,'#bd8c67');
      for(let y=39;y<60;y+=6)r(0,y,96,1,'#a87559');
      r(7,6,25,22,'#80564f');r(9,8,21,17,'#a5cedd');
      r(19,8,2,17,'#ffebcc');r(9,15,21,1,'#ffebcc');
      r(64,35,24,4,'#966255');r(66,39,2,10,'#845648');r(84,39,2,10,'#845648');
      if(scene==='birthday'){
        r(70,29,12,6,'#f6dfa2');r(70,29,12,2,'#e9a1ae');r(75,25,2,4,'#fff4d9');r(76,23,1,2,'#ed9c58');
      }else if(scene==='firstGift'){
        r(71,28,10,7,'#e9a1ae');r(75,28,2,7,'#fff0cb');r(72,26,8,2,'#f5c37e');
      }else{
        r(72,30,7,5,'#fff0cb');r(79,31,2,2,'#e2a08c');
      }
      return;
    }
    if(night){
      r(73,7,9,9,'#f9e3a9');r(78,6,5,6,'#35486d');
      for(const [x,y] of [[9,7],[16,14],[29,5],[44,12],[56,6],[86,14],[34,18]])r(x,y,1,1,'#f9e3a9');
    }else{
      r(9,8,19,3,'#fff3d7');r(13,5,9,3,'#fff3d7');r(70,10,15,3,'#fff3d7');
    }
    r(0,22,96,38,night?'#546a63':'#91b882');
    for(let x=3;x<96;x+=11)r(x,27+x%5,6,2,night?'#465d5b':'#739e74');
    if(pond){
      r(4,37,88,18,night?'#465b7c':'#7bb7c7');r(11,34,74,3,night?'#465b7c':'#7bb7c7');
      r(12,55,72,3,night?'#465b7c':'#7bb7c7');
      for(const [x,y,w] of [[10,44,13],[69,41,13],[59,51,20],[24,53,12]])r(x,y,w,1,night?'#8295ad':'#bce0d7');
    }else{
      r(11,44,72,9,'#cba97c');r(4,49,87,3,'#d6b88d');
      for(const [x,y] of [[7,35],[18,52],[77,38],[85,48],[8,55]]){
        r(x,y+2,1,4,'#60886b');r(x-1,y,3,2,'#e8a2ab');
      }
    }
  }
  return {load,nextPostcard,collect,postcardKey,paint};
})();
