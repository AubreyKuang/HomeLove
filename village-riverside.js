const VillageRiverside = (() => {
  const apronTile=[37,31],glassTile=[38,30],landing=[37,30],riverFish=[38,28];
  const recipients=['gy','xy','jy','by'];
  const warmDay=day=>Math.floor((day-1)/7)%4!==3;
  function weather(day){
    if(day<2||!warmDay(day))return 'clear';
    const roll=((day*day*13+day*31+17)%103)/103;
    return roll<.24?'rain':roll<.52?'wind':'clear';
  }
  const exposed=day=>day>2&&warmDay(day)&&weather(day-1)==='rain'&&weather(day)!=='rain';
  function load(saved,day=1){
    const valid=d=>Number.isInteger(d)&&d>0&&d<=day;
    const apron=saved?.apron,glass=saved?.glass,letter=saved?.letter;
    return {
      apron:valid(apron?.day)&&['found','returned','posted'].includes(apron.status)
        ?{day:apron.day,status:apron.status,heard:apron.heard===true}:null,
      glass:valid(glass?.day)&&['keep','leave'].includes(glass.choice)?{day:glass.day,choice:glass.choice}:null,
      letter:valid(letter?.day)&&recipients.includes(letter.to)?{day:letter.day,to:letter.to}:null
    };
  }
  const apronVisible=(state,day,time)=>!state.apron&&day>=3&&weather(day)==='wind'&&time>=960&&time<1200;
  const glassVisible=(state,day)=>!state.glass&&exposed(day);
  function cards(state){
    const cards=[];
    if(state.apron?.status==='returned'||state.apron?.status==='posted'){
      cards.push({key:'river:apron',kind:'world',event:'riverApron',resident:'gy',day:state.apron.day,choice:state.apron.status});
    }
    if(state.glass)cards.push({key:'river:glass',kind:'world',event:'riverGlass',day:state.glass.day,choice:state.glass.choice});
    return cards;
  }
  return {apronTile,glassTile,landing,riverFish,recipients,weather,exposed,load,apronVisible,glassVisible,cards};
})();
