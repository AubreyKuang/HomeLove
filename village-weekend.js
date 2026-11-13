const VillageWeekend = (() => {
  const prices={berry:2,carrot:2,pumpkin:3,cookie:3,fish:2,carp:3,moonfish:5,flower:1};
  const specials=['berry','carrot','pumpkin','cookie'];
  const activities={
    cafe:{day:6,start:600,end:720,host:'gy',guest:'by',spot:[15,22]},
    court:{day:6,start:900,end:1020,host:'xy',guest:'gy',spot:[30,23]},
    stage:{day:7,start:660,end:780,host:'jy',guest:'xy',spot:[24,30]},
    lookout:{day:7,start:960,end:1080,host:'by',guest:'jy',spot:[43,14]}
  };
  const weekOf=day=>Math.floor((day-1)/7);
  const weekday=day=>(day-1)%7+1;
  const saleDay=day=>weekOf(day)*7+6;
  const demand=day=>[specials[weekOf(day)%specials.length],['flower','carrot','fish','moonfish'][weekOf(day)%4]];
  const price=(item,day)=>prices[item]+(demand(day).includes(item)?2:0);
  const selling=(day,time)=>weekday(day)===6&&time>=540&&time<1080;
  const active=(id,day,time)=>{
    const event=activities[id];
    return event&&weekday(day)===event.day&&time>=event.start&&time<event.end;
  };
  function load(saved,day=1){
    const valid=d=>Number.isInteger(d)&&d>0&&d<=day;
    const firstSale=valid(saved?.firstSale)&&weekday(saved.firstSale)===6?saved.firstSale:0;
    const sale=saved?.sale;
    const sales=firstSale&&valid(sale?.day)&&weekday(sale.day)===6&&sale.day>=firstSale&&
      sale.day+7>=day&&Array.isArray(sale.items)&&sale.items.length>=1&&sale.items.length<=3&&
      sale.items.every(item=>Object.hasOwn(prices,item));
    const played={};
    for(const [id,event] of Object.entries(activities)){
      const log=saved?.played?.[id];
      if(valid(log?.first)&&weekday(log.first)===event.day&&valid(log.last)&&log.last>=log.first&&
          weekday(log.last)===event.day&&[0,1].includes(log.choice))played[id]={first:log.first,last:log.last,choice:log.choice};
    }
    return {firstSale,sale:sales?{day:sale.day,items:sale.items.slice(),served:sale.served===true}:null,played};
  }
  function sell(state,inv,day,time,items){
    if(!selling(day,time)||state.sale?.day===day||items.length<1||items.length>3)return 0;
    const counts={};
    for(const item of items){
      if(!Object.hasOwn(prices,item))return 0;
      counts[item]=(counts[item]??0)+1;
    }
    if(Object.entries(counts).some(([item,count])=>!(inv[item]>=count)))return 0;
    const shells=items.reduce((sum,item)=>sum+price(item,day),0);
    for(const [item,count] of Object.entries(counts))inv[item]-=count;
    inv.shell+=shells;
    state.firstSale||=day;
    state.sale={day,items:items.slice(),served:false};
    return shells;
  }
  function coffee(state,day,time){
    const sale=state.sale;
    if(!sale||sale.served||day<=sale.day||day>sale.day+7||!VillageMap.marketOpen(time))return null;
    const item=demand(sale.day)[0];
    return sale.items.includes(item)?item:null;
  }
  function play(state,id,day,time,choice){
    if(!active(id,day,time)||state.played[id]?.last===day||![0,1].includes(choice))return false;
    const prev=state.played[id];
    state.played[id]={first:prev?.first??day,last:day,choice:prev?.choice??choice};
    return true;
  }
  function cards(state){
    const result=[];
    if(state.firstSale)result.push({key:'weekend:stall',kind:'world',event:'weekendStall',day:state.firstSale});
    for(const [id,log] of Object.entries(state.played)){
      result.push({key:'weekend:'+id,kind:'world',event:'weekend_'+id,resident:activities[id].host,day:log.first,choice:log.choice});
    }
    return result;
  }
  return {prices,activities,weekday,saleDay,demand,price,selling,active,load,sell,coffee,play,cards};
})();
