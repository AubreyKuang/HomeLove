const VillageMap = (() => {
  const width=48,height=34;
  const gates=[[6,19],[27,15]];
  const places={
    home:{tile:[6,11],anchor:[6,11],color:'#df9a89'},
    market:{tile:[15,25],anchor:[15,25],color:'#f5c674'},
    cafe:{id:'cafe',tile:[14,22],anchor:[14,24],color:'#df9a89',resident:'gy',hours:[12*60+30,17*60]},
    court:{id:'court',tile:[32,24],anchor:[31,24],color:'#92bd9a',resident:'xy',hours:[8*60,10*60]},
    stage:{id:'stage',tile:[22,31],anchor:[23,29],color:'#bda1d1',resident:'jy',hours:[11*60,14*60]},
    lookout:{id:'lookout',tile:[44,13],anchor:[44,15],color:'#9abdda',resident:'by',hours:[16*60+30,19*60]}
  };
  const props=[
    {id:'guide',x:7,y:21,w:1,h:1},
    {id:'cafe',x:12,y:21,w:5,h:2},
    {id:'produce',x:10,y:26,w:3,h:1},
    {id:'fishStall',x:15,y:26,w:3,h:1},
    {id:'flowerStall',x:20,y:26,w:3,h:1},
    {id:'fountain',x:20,y:23,w:2,h:1},
    {id:'stage',x:20,y:30,w:6,h:2},
    {id:'hoop',x:28,y:24,w:1,h:1},
    {id:'court',x:35,y:24,w:1,h:1},
    {id:'lookout',x:42,y:11,w:5,h:3},
    {id:'lamp',x:9,y:23,w:1,h:1},{id:'lamp',x:24,y:27,w:1,h:1},
    {id:'lamp',x:37,y:14,w:1,h:1},{id:'lamp',x:42,y:16,w:1,h:1}
  ];
  const plantings=[[3,22],[2,27],[5,30],[8,31],[9,20],[11,30],[17,31],[19,32],[26,31],[30,31],[35,30],[37,29],[37,22],[37,8],[34,4],[30,4],[32,8],[30,12],[35,11],[43,5],[45,8],[43,20],[46,23],[43,30],[46,31]];
  const exchanges={
    produce:[{take:'carrot',count:2,give:'shell',amount:1},{take:'pumpkin',count:1,give:'shell',amount:2}],
    fishStall:[{take:'fish',count:2,give:'shell',amount:1},{take:'shell',count:2,give:'fish',amount:1}],
    flowerStall:[{take:'flower',count:3,give:'berry',amount:2},{take:'shell',count:1,give:'flower',amount:2}]
  };
  const marketOpen=minute=>minute>=9*60&&minute<18*60;
  function loadVisits(saved,day){
    return Object.fromEntries(Object.keys(places).filter(id=>places[id].resident&&
      Number.isInteger(saved?.[id])&&saved[id]>0&&saved[id]<=day).map(id=>[id,saved[id]]));
  }
  function trade(inv,offer){
    if(!(inv[offer.take]>=offer.count))return false;
    inv[offer.take]-=offer.count;
    inv[offer.give]+=offer.amount;
    return true;
  }
  function duty(resident,time){
    return Object.values(places).find(p=>p.resident===resident&&time>=p.hours[0]&&time<p.hours[1])??null;
  }
  function layout(fill,T){
    const {PATH,WATER,STONE,BRIDGE,COURT,DECK}=T;
    fill(6,19,1,10,PATH);fill(6,24,23,2,PATH);fill(8,21,17,8,STONE);
    fill(22,27,2,4,PATH);fill(20,30,6,2,DECK);
    fill(27,15,11,2,PATH);fill(30,16,2,5,PATH);fill(28,21,8,7,COURT);
    fill(34,27,12,1,PATH);fill(42,15,4,12,PATH);fill(42,10,5,6,STONE);
    fill(38,1,3,32,WATER);fill(38,15,3,2,BRIDGE);fill(38,27,3,1,BRIDGE);
  }
  function tile(g,x,y,kind,winter){
    const R=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(x+a,y+b,w,h);};
    if(kind==='bridge'||kind==='deck'){
      R(0,0,16,16,winter?'#c5a68e':'#bd885c');
      for(let i=0;i<16;i+=4){R(0,i,16,1,'#80583f');R(0,i+1,16,1,'#d3a77b');}
      if(kind==='bridge'){R(0,0,16,2,'#9a694c');R(0,14,16,2,'#9a694c');}
    }else if(kind==='court'){
      R(0,0,16,16,winter?'#c1d4d7':'#78a48d');
      R(2,6,1,1,winter?'#ebf1ef':'#91b39a');
    }else{
      R(0,0,16,16,winter?'#cbd6db':'#c9a88d');
      R(0,7,16,1,winter?'#aebfc7':'#a48778');
      R(0,15,16,1,winter?'#aebfc7':'#a48778');
      R(7,0,1,7,winter?'#aebfc7':'#a48778');
      R(3,8,1,7,winter?'#aebfc7':'#a48778');
      R(0,0,7,1,winter?'#dfe7e9':'#dfc3a4');R(4,8,11,1,winter?'#dfe7e9':'#dfc3a4');
    }
  }
  function courtLines(g){
    const x=28*16,y=21*16;
    g.fillStyle='#ede4c2';
    g.fillRect(x+5,y+5,118,1);g.fillRect(x+5,y+106,118,1);
    g.fillRect(x+5,y+5,1,102);g.fillRect(x+122,y+5,1,102);
    g.fillRect(x+63,y+5,1,102);
    for(const [dx,dy,w,h] of [[55,46,17,1],[55,63,17,1],[54,47,1,16],[72,47,1,16],[6,34,24,1],[6,75,24,1],[29,35,1,40],[98,34,24,1],[98,75,24,1],[98,35,1,40]])g.fillRect(x+dx,y+dy,w,h);
  }
  function paintProp(g,p,winter,night,time){
    const w=p.w*16,h=p.h*16,x=p.x*16,y=p.y*16+h;
    const R=(a,b,ww,hh,c)=>{g.fillStyle=c;g.fillRect(x+a,y+b,ww,hh);};
    const wood='#785441',warm='#d6a274',cream='#f8e6bb',snow='#ecf3ef';
    if(p.id==='cafe'){
      R(4,-32,w-8,30,wood);R(6,-30,w-12,28,'#e9bc8d');
      R(8,-49,w-16,8,'#895567');R(4,-41,w-8,6,'#a96871');R(0,-35,w,5,'#754757');
      R(10,-46,w-20,2,winter?snow:'#c58783');
      R(9,-27,18,13,wood);R(11,-25,14,9,night?'#d8a86e':'#a1c8ca');
      R(w-26,-27,16,13,wood);R(w-24,-25,12,9,night?'#d8a86e':'#a1c8ca');
      R(34,-28,12,26,wood);R(36,-26,8,24,'#a87a62');R(41,-14,2,2,'#f6d18a');
      for(let i=8;i<w-8;i+=8)R(i,-29,8,4,i%16===0?'#de867f':cream);
      R(2,-8,14,6,'#8e694e');R(4,-10,10,3,'#60906c');
      R(w-14,-9,10,7,'#96644e');R(w-12,-10,6,2,'#e8ae82');
    }else if(Object.hasOwn(exchanges,p.id)){
      const [shade,bright]=({produce:['#ab5960','#ed9686'],fishStall:['#547e9c','#91bdd0'],flowerStall:['#866d9e','#bba3cf']})[p.id];
      R(3,-15,w-6,13,wood);R(6,-13,w-12,10,warm);
      R(2,-28,3,22,wood);R(w-5,-28,3,22,wood);
      R(0,-31,w,8,shade);
      for(let i=1;i<w-1;i+=8)R(i,-30,5,6,winter?snow:bright);
      R(0,-24,w,2,shade);R(0,-16,w,4,cream);
      for(let i=7;i<w-5;i+=9){
        if(p.id==='produce'){R(i,-20,5,4,'#e69466');R(i+2,-21,2,1,'#79936b');}
        if(p.id==='fishStall'){R(i,-19,6,2,'#7fa3ba');R(i+6,-20,1,4,'#4c7c94');}
        if(p.id==='flowerStall'){R(i,-21,1,5,'#568463');R(i-1,-22,4,2,i%2?'#e58f9a':'#f5d291');}
      }
    }else if(p.id==='stage'){
      R(2,-18,w-4,16,wood);R(4,-19,w-8,8,'#b38261');R(7,-11,w-14,2,warm);
      R(1,-34,5,25,'#7c506e');R(w-6,-34,5,25,'#7c506e');
      R(0,-39,w,6,'#936d99');R(0,-35,w,2,'#c6a4bb');
      for(let i=8;i<w-7;i+=13)R(i,-33,2,2,'#ffe4a4');
      R(11,-16,8,6,'#534954');R(w-19,-16,8,6,'#534954');
      R(36,-10,24,3,'#d0a078');R(38,-7,20,3,'#bf8b6a');R(40,-4,16,2,'#9e6a50');
    }else if(p.id==='lookout'){
      R(0,-38,w,38,'#77888f');R(3,-36,w-6,32,'#b3bebd');
      R(1,-39,w-2,3,winter?snow:'#e2c5a2');
      for(let i=4;i<w-4;i+=8){R(i,-36,1,6,'#78888d');R(i,-30,6,1,'#87999b');}
      R(32,-11,17,5,'#9f9c9e');R(39,-27,3,17,'#7a5b63');R(35,-14,3,5,'#7a5b63');R(43,-14,3,5,'#7a5b63');
      R(29,-29,22,5,'#637998');R(43,-32,10,5,'#829abc');R(50,-32,3,5,cream);R(27,-28,3,3,wood);
      R(30,-4,23,4,'#dad0bd');
    }else if(p.id==='court'||p.id==='hoop'){
      R(7,-21,2,20,'#747983');R(2,-24,12,8,'#484956');R(3,-23,10,6,'#eee9d6');
      R(6,-20,4,3,'#b98470');R(5,-16,6,1,'#bd7169');R(6,-15,4,2,'#f1e6d4');
    }else if(p.id==='fountain'){
      R(3,-10,26,9,'#857b85');R(5,-11,22,8,'#c3b3ac');R(6,-9,20,5,winter?'#b8d2dd':'#87b8c9');
      R(14,-18,4,11,'#a69b9d');R(12,-18,8,2,'#cfc5be');
      if(!winter){const ripple=(Math.floor(time*3)%3);R(13-ripple,-15,1,3,'#d6e6e5');R(18+ripple,-14,1,3,'#d6e6e5');}
    }else if(p.id==='lamp'){
      R(7,-19,2,18,'#705c56');R(4,-25,8,7,'#705c56');R(5,-24,6,5,night?'#f6d68e':'#e6dbc4');R(3,-26,10,2,'#605052');
    }else{
      R(6,-15,3,14,wood);R(0,-21,16,10,wood);R(1,-20,14,8,warm);
      R(4,-17,8,1,'#9a674f');R(9,-19,2,2,'#9a674f');
    }
  }
  return {width,height,gates,places,props,plantings,exchanges,marketOpen,loadVisits,trade,duty,layout,tile,courtLines,paintProp};
})();
