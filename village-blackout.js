const VillageBlackout = (() => {
  const start=18*60+10,end=22*60;
  const scenes={
    stage:{host:'jy',choices:['circle','stage'],spot:[22,30]},
    court:{host:'xy',choices:['river','court'],spot:[32,24]},
    cafe:{host:'gy',choices:['quiet','jy','xy','by'],spot:[14,22]}
  };
  const saturday=day=>Number.isInteger(day)&&day>=6&&(day-6)%7===0;
  const repeatChance=.1;
  function night(state,day){
    if(!saturday(day))return false;
    if(day===6)return true;
    // Mix the save's seed with the week so reloading cannot reroll the evening.
    let roll=Math.imul((day-6)/7,0x9e3779b1)^state.seed;
    roll=Math.imul(roll^(roll>>>16),0x21f0aaad);
    roll=Math.imul(roll^(roll>>>15),0x735a2d97);
    return ((roll^(roll>>>15))>>>0)/0x100000000<repeatChance;
  }
  const active=(state,day,time,previewDay)=>saturday(day)&&(day===previewDay||night(state,day))&&time>=start&&time<end;
  function load(saved,day=1){
    const seed=Number.isInteger(saved?.seed)&&saved.seed>=0&&saved.seed<=0xffffffff?saved.seed:Math.floor(Math.random()*0x100000000);
    const restore=record=>record&&record.day<=day&&saturday(record.day)&&
      Object.hasOwn(scenes,record.place)&&scenes[record.place].choices.includes(record.choice)
      ?{day:record.day,place:record.place,choice:record.choice}:null;
    const first=restore(saved?.first);
    const last=restore(saved?.last);
    const latest=first&&last&&last.day>=first.day?last:first;
    const visits={};
    if(first)visits[first.place]=first;
    if(latest)visits[latest.place]=latest;
    for(const id of Object.keys(scenes)){
      const visit=restore(saved?.visits?.[id]);
      if(visit?.place===id&&first&&visit.day>=first.day&&visit.day<=latest.day&&visit.day>=(visits[id]?.day??0))visits[id]=visit;
    }
    return {seed,first,last:latest,visits};
  }
  function complete(state,day,time,place,choice,previewDay){
    if(!active(state,day,time,previewDay)||state.last?.day===day||!Object.hasOwn(scenes,place)||!scenes[place].choices.includes(choice))return null;
    const last={day,place,choice};
    return {...state,first:state.first??last,last,visits:{...state.visits,[place]:last}};
  }
  function cards(state){
    return state.first?[{key:'blackout:first',kind:'world',event:'blackout',resident:scenes[state.first.place].host,
      day:state.first.day,place:state.first.place,choice:state.first.choice}]:[];
  }
  return {start,end,scenes,saturday,night,active,load,complete,cards};
})();
