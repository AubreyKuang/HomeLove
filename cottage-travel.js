const CottageTravel = (() => {
  const catalog={
    scooter:{cost:6,speed:1.35},
    bicycle:{cost:14,speed:1.65},
    car:{cost:32,speed:2.1}
  };

  function load(saved,day=1){
    const owned=Object.keys(catalog).filter(id=>Array.isArray(saved?.owned)&&saved.owned.includes(id));
    const orders={};
    for(const id of Object.keys(catalog)){
      const due=saved?.orders?.[id];
      if(!owned.includes(id)&&Number.isInteger(due)&&due>=2&&due<=day+1)orders[id]=due;
    }
    const first=saved?.firstOrder;
    const firstOrder=first&&Number.isInteger(first.day)&&first.day>=1&&first.day<=day&&
      (owned.includes(first.id)||Object.hasOwn(orders,first.id))?{id:first.id,day:first.day}:null;
    return {owned,orders,selected:owned.includes(saved?.selected)?saved.selected:null,firstOrder};
  }
  function order(travel,inventory,id,day){
    if(!Object.hasOwn(catalog,id)||travel.owned.includes(id)||travel.orders[id]||
        !(inventory.shell>=catalog[id].cost))return false;
    inventory.shell-=catalog[id].cost;
    travel.orders[id]=day+1;
    travel.firstOrder??={id,day};
    return true;
  }
  function ready(travel,day){
    return Object.keys(travel.orders).filter(id=>travel.orders[id]<=day);
  }
  function receive(travel,id,day){
    if(!travel.orders[id]||travel.orders[id]>day||travel.owned.includes(id))return false;
    delete travel.orders[id];
    travel.owned.push(id);
    return true;
  }
  function riding(travel,surface){
    const id=travel.selected;
    if(!travel.owned.includes(id)||surface==='inside'||(id==='car'&&surface!=='road'))return null;
    return id;
  }

  function paint(g,id,x,y,dir,front){
    x=Math.round(x);y=Math.round(y);
    const side=dir==='left'||dir==='right';
    const R=(a,b,w,h,c)=>{
      if(side&&dir==='left')a=-a-w;
      g.fillStyle=c;g.fillRect(x+a,y+b,w,h);
    };
    const dark='#3d3545',metal='#879aa8',mint='#87c7b1',paint='#b96872',highlight='#e6a090';
    if(id==='car'){
      const w=side?28:18,l=-w/2;
      if(!front){
        R(l+3,-2,w-6,4,'rgba(45,33,46,.24)');
        R(l,-8,w,8,dark);R(l+2,-7,w-4,5,paint);
        R(side?-8:-7,-14,side?16:14,7,paint);
        R(side?-7:-6,-13,side?14:12,4,'#8fbac2');
        if(side){R(-1,-13,2,4,dark);R(-12,-3,5,4,dark);R(7,-3,5,4,dark);}
        else{R(l+2,-2,3,3,dark);R(-l-5,-2,3,3,dark);}
      }else{
        R(l+2,-7,w-4,2,highlight);
        R(side?10:-6,-6,3,2,dir==='up'?'#ed9891':'#ffefb7');
        if(!side)R(3,-6,3,2,dir==='up'?'#ed9891':'#ffefb7');
        R(l+2,-3,w-4,1,'#d9baaa');
      }
      return;
    }
    if(!front){
      const wheels=side?[-7,5]:[0];
      for(const a of wheels){R(a-2,-4,5,5,dark);R(a-1,-3,3,3,metal);}
      if(id==='scooter'){R(-6,-3,12,2,mint);R(side?6:1,-11,1,8,metal);}
      else{R(-5,-5,10,2,'#c98a62');R(-1,-8,2,5,'#c98a62');R(4,-9,2,5,metal);}
    }else{
      const a=side?5:0;
      R(a-2,-11,5,1,id==='scooter'?mint:'#dba477');
    }
  }
  function cards(travel){
    const first=travel.firstOrder;
    return first?[{key:'travel:firstOrder',kind:'world',event:'firstOrder',day:first.day,vehicle:first.id}]:[];
  }
  return {catalog,load,order,ready,receive,riding,paint,cards};
})();
