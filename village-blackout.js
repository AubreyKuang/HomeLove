const VillageBlackout = (() => {
  const start=18*60+10,end=22*60;
  const scenes={
    stage:{host:'jy',choices:['circle','stage'],spot:[22,30]},
    court:{host:'xy',choices:['river','court'],spot:[32,24]},
    cafe:{host:'gy',choices:['quiet','jy','xy','by'],spot:[14,22]}
  };
  const night=day=>Number.isInteger(day)&&day>=6&&(day-6)%14===0;
  const active=(day,time)=>night(day)&&time>=start&&time<end;
  function load(saved,day=1){
    const restore=record=>record&&record.day<=day&&night(record.day)&&
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
    return {first,last:latest,visits};
  }
  function complete(state,day,time,place,choice){
    if(!active(day,time)||state.last?.day===day||!Object.hasOwn(scenes,place)||!scenes[place].choices.includes(choice))return null;
    const last={day,place,choice};
    return {first:state.first??last,last,visits:{...state.visits,[place]:last}};
  }
  function cards(state){
    return state.first?[{key:'blackout:first',kind:'world',event:'blackout',resident:scenes[state.first.place].host,
      day:state.first.day,place:state.first.place,choice:state.first.choice}]:[];
  }
  return {start,end,scenes,night,active,load,complete,cards};
})();
