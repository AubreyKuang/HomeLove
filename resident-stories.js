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
