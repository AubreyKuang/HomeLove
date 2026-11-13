const ResidentStories = (() => {
  const residents=['gy','xy','jy','by'];
  const chapters=[{hearts:3,gap:0},{hearts:5,gap:1},{hearts:7,gap:2}];

  function load(saved,day=1){
    return Object.fromEntries(residents.map(id=>{
      const history=[];
      for(const entry of Array.isArray(saved?.[id])?saved[id].slice(0,chapters.length):[]){
        const chapter=chapters[history.length],previous=history.at(-1)?.day??2;
        if(!Number.isInteger(entry?.day)||entry.day<previous+chapter.gap||entry.day>day||
            ![0,1].includes(entry.choice))break;
        history.push({day:entry.day,choice:entry.choice});
      }
      return [id,history];
    }));
  }
  function next(stories,id,day,hearts){
    const history=stories[id];
    if(!history||history.length===chapters.length)return null;
    const chapter=chapters[history.length];
    const earliest=(history.at(-1)?.day??2)+chapter.gap;
    return day>=earliest&&hearts>=chapter.hearts?history.length:null;
  }
  function complete(stories,id,day,hearts,index,choice){
    if(![0,1].includes(choice)||!Number.isInteger(index)||next(stories,id,day,hearts)!==index)return false;
    stories[id].push({day,choice});
    return true;
  }
  function cards(stories){
    return residents.flatMap(id=>stories[id].map(({day,choice},index)=>({
      key:`story:${id}:${index}`,kind:'story',resident:id,day,index,choice
    })));
  }
  return {load,next,complete,cards,chapters};
})();

const ResidentMoments = (() => {
  const scenes={
    gy:{place:'cafe',start:750,end:1020,weather:'rain'},
    xy:{place:'court',start:480,end:600,weather:'wind'},
    jy:{place:'stage',start:660,end:840},
    by:{place:'lookout',start:1020,end:1140,weather:'clear'}
  };
  function load(saved,day=1){
    const records={},declined={};
    for(const id of Object.keys(scenes)){
      const entry=saved?.records?.[id];
      if(Number.isInteger(entry?.day)&&entry.day>=2&&entry.day<=day&&[0,1].includes(entry.choice)){
        records[id]={day:entry.day,choice:entry.choice,
          recalled:Number.isInteger(entry.recalled)&&entry.recalled>=entry.day&&entry.recalled<=day?entry.recalled:0};
      }
      if(saved?.declined?.[id]===day)declined[id]=day;
    }
    return {records,declined};
  }
  function available(state,id,day,time,weather){
    if(!Object.hasOwn(scenes,id))return false;
    const scene=scenes[id];
    if(!scene||state.records[id]||state.declined[id]===day||day<2||
      time<scene.start||time>=scene.end||(scene.weather&&scene.weather!==weather))return false;
    return !Object.values(state.records).some(entry=>day-entry.day<2);
  }
  function complete(state,id,day,choice){
    if(!Object.hasOwn(scenes,id)||state.records[id]||![0,1].includes(choice)||!Number.isInteger(day)||day<2)return false;
    state.records[id]={day,choice,recalled:0};
    return true;
  }
  function cards(state){
    return Object.entries(state.records).map(([resident,entry])=>({
      key:'moment:'+resident,event:'moment_'+resident,kind:'world',resident,day:entry.day,choice:entry.choice
    }));
  }
  function paint(g,id,x,y,choice,time=0){
    const R=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x+a),Math.round(y+b),w,h);};
    const ink='#513b3e',cream='#fff0cd';
    if(id==='gy'){
      R(-9,-3,18,4,ink);R(-8,-3,16,2,'#b98262');
      for(const a of [-6,2]){R(a,-8,5,5,ink);R(a+1,-7,3,3,cream);R(a+5,-7,2,3,ink);}
      R(-4,-7,1,1,choice?'#b38a5b':'#859a71');
      const rise=Math.floor(time)%3;R(-3,-12-rise,1,2,'#e4dbcc');R(5,-11-rise,1,2,'#e4dbcc');
    }else if(id==='xy'){
      R(0,-11,1,13,ink);R(-2,1,5,2,ink);
      const turn=Math.floor(time*2)%2;
      const colors=choice?['#78a8b4','#f1d49b']:['#df91a0','#f1d49b'];
      R(-5,-19,5,5,ink);R(1,-19,5,5,ink);R(-5,-13,5,5,ink);R(1,-13,5,5,ink);
      R(-4,-18,4,4,colors[turn]);R(1,-18,4,4,colors[1-turn]);
      R(-4,-13,4,4,colors[1-turn]);R(1,-13,4,4,colors[turn]);R(-1,-15,3,3,cream);
    }else if(id==='jy'){
      R(-8,-10,17,12,ink);R(-7,-9,15,10,cream);R(-1,-9,1,10,'#c4a583');
      for(const a of [-5,2]){R(a,-6,4,1,'#ad8a78');R(a,-3,4,1,'#ad8a78');}
      R(choice?4:-4,-5,2,2,'#695875');R(choice?5:-3,-8,1,4,'#695875');
    }else{
      R(-10,-12,21,14,ink);R(-9,-11,19,12,cream);
      R(-6,-8,13,7,choice?'#d5ad82':'#dba795');
      R(-3,-7,7,4,choice?'#8f9e82':'#9c8298');R(0,-8,1,7,ink);
    }
  }
  return {scenes,load,available,complete,cards,paint};
})();
