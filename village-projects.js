const VillageProjects = (() => {
  const ingredients=['berry','pumpkin','cookie','carrot'];
  const sounds=['water','letter','chime'];
  const lights=['clear','rain','dusk'];
  const artChoices=[0,1];
  const styles=['bright','soft'];
  const endings=['open','quiet'];
  const names=['bell','river'];
  const flag=(value,allowed)=>allowed.includes(value);
  const list=(value,allowed,size)=>Array.isArray(value)&&value.length===size&&new Set(value).size===size&&value.every(x=>flag(x,allowed));
  const caption=value=>typeof value==='string'?value.trim().slice(0,24):'';

  function load(saved,day=1){
    const valid=d=>Number.isInteger(d)&&d>=1&&d<=day;
    const cafe=saved?.cafe,ball=saved?.ball,music=saved?.music;
    const drafts={};
    for(const light of lights){
      const draft=saved?.drafts?.[light];
      if(valid(draft?.day)&&flag(draft.frame,artChoices)&&flag(draft.palette,artChoices)){
        drafts[light]={day:draft.day,frame:draft.frame,palette:draft.palette};
      }
    }
    return {
      cafe:valid(cafe?.day)&&list(cafe.items,ingredients,2)&&flag(cafe.style,styles)&&flag(cafe.name,names)?
        {day:cafe.day,items:cafe.items.slice(),style:cafe.style,name:cafe.name,caption:caption(cafe.caption)}:null,
      ball:valid(ball?.day)&&Number.isInteger(ball.best)&&ball.best>=0&&ball.best<=3?
        {day:ball.day,best:ball.best}:null,
      recording:saved?.recording===true,
      sounds:sounds.filter(sound=>Array.isArray(saved?.sounds)&&saved.sounds.includes(sound)),
      music:valid(music?.day)&&list(music.order,sounds,3)&&flag(music.ending,endings)?
        {day:music.day,order:music.order.slice(),ending:music.ending}:null,
      drafts,
      hung:Object.hasOwn(drafts,saved?.hung)?saved.hung:null
    };
  }
  const menuDay=day=>day+7-(day-1)%7;
  const lightAt=(day,time)=>{
    if(time>=17*60&&time<20*60)return 'dusk';
    if(time<6*60||time>=17*60)return null;
    if(VillageRiverside.exposed(day))return 'rain';
    return VillageRiverside.weather(day)==='clear'?'clear':null;
  };
  function shot(round,move,play){
    const open=round%2===0?'left':'right';
    return Number((move===open&&play==='shoot')||(move!==open&&play==='pass'));
  }
  function cards(state){
    const cards=[];
    if(state.cafe)cards.push({key:'project:cafe',event:'project_cafe',resident:'gy',day:state.cafe.day});
    if(state.ball)cards.push({key:'project:court',event:'project_court',resident:'xy',day:state.ball.day});
    if(state.music)cards.push({key:'project:stage',event:'project_stage',resident:'jy',day:state.music.day});
    for(const [light,draft] of Object.entries(state.drafts)){
      cards.push({key:'project:lookout:'+light,event:'project_lookout',resident:'by',day:draft.day,light,draft});
    }
    return cards.map(card=>({...card,kind:'world'}));
  }
  return {ingredients,sounds,lights,styles,endings,names,caption,load,menuDay,lightAt,shot,cards};
})();
