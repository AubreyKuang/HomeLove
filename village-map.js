const VillageMap = (() => {
  const width=48,height=34;
  const gates=[[6,19],[27,15]];
  const places={
    home:{tile:[6,11],anchor:[6,11],color:'#df9a89'},
    market:{tile:[15,25],anchor:[15,25],color:'#f5c674'},
    cafe:{id:'cafe',tile:[14,21],anchor:[14,24],spot:[14,22],color:'#df9a89',resident:'gy',hours:[12*60+30,17*60]},
    court:{id:'court',tile:[31,21],anchor:[31,24],spot:[32,24],color:'#92bd9a',resident:'xy',hours:[8*60,10*60]},
    stage:{id:'stage',tile:[23,31],anchor:[23,29],spot:[22,30],color:'#bda1d1',resident:'jy',hours:[11*60,14*60]},
    lookout:{id:'lookout',tile:[44,12],anchor:[44,15],spot:[45,14],color:'#9abdda',resident:'by',hours:[16*60+30,19*60]}
  };
  const props=[
    {id:'guide',x:7,y:21,w:1,h:1},
    {id:'weekendBoard',x:8,y:24,w:1,h:1},
    {id:'weekendStall',x:12,y:27,w:3,h:1},
    {id:'cafeHouse',x:11,y:20,w:7,h:2},
    {id:'cafe',x:14,y:23,w:1,h:1},
    {id:'bistro',x:12,y:23,w:1,h:1},{id:'bistro',x:16,y:23,w:1,h:1},
    {id:'produce',x:10,y:26,w:3,h:1},
    {id:'fishStall',x:15,y:26,w:3,h:1},
    {id:'flowerStall',x:20,y:26,w:3,h:1},
    {id:'fountain',x:20,y:23,w:2,h:1},
    {id:'bandstand',x:20,y:32,w:7,h:1},
    {id:'stage',x:23,y:30,w:1,h:1},
    {id:'bench',x:20,y:28,w:2,h:1},{id:'bench',x:25,y:28,w:2,h:1},
    {id:'clubhouse',x:29,y:19,w:6,h:2},
    {id:'hoop',x:28,y:24,w:1,h:1},
    {id:'court',x:35,y:24,w:1,h:1},
    {id:'studio',x:42,y:11,w:5,h:3},
    {id:'lookout',x:44,y:14,w:1,h:1},
    {id:'planter',x:42,y:14,w:1,h:1},{id:'planter',x:46,y:14,w:1,h:1},
    {id:'lamp',x:9,y:23,w:1,h:1},{id:'lamp',x:24,y:27,w:1,h:1},
    {id:'lamp',x:37,y:14,w:1,h:1},{id:'lamp',x:42,y:16,w:1,h:1}
  ];
  const plantings=[[3,22],[2,27],[5,30],[8,31],[9,20],[11,30],[17,31],[19,32],[27,32],[30,31],[35,30],[37,29],[37,22],[37,8],[34,4],[30,4],[32,8],[30,12],[35,11],[43,5],[45,8],[43,20],[46,23],[43,30],[46,31]];
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
    fill(11,22,7,3,DECK);
    fill(22,27,2,4,PATH);fill(20,29,7,4,DECK);
    fill(27,15,11,2,PATH);fill(30,16,2,5,PATH);fill(28,21,8,7,COURT);
    fill(34,27,12,1,PATH);fill(42,15,4,12,PATH);fill(42,10,5,6,STONE);fill(42,14,5,2,DECK);
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
    const wood='#785441',warm='#d6a274',cream='#f8e6bb',snow='#ecf3ef',edge='#5b403b';
    if(p.id==='cafeHouse'||p.id==='clubhouse'||p.id==='studio'){
      const [roof,light,wall,glass]={
        cafeHouse:['#94596a','#bd7a80','#eac6a0','#92bbb7'],
        clubhouse:['#507569','#779583','#d4c394','#8fb8b3'],
        studio:['#5b627e','#8687a5','#d9c9ad','#9fbccb']
      }[p.id];
      const c=w/2;
      R(1,-4,w-2,4,edge);R(3,-4,w-6,2,'#9f7a62');R(4,-33,w-8,29,edge);R(6,-32,w-12,26,wall);
      R(12,-49,w-24,7,edge);R(7,-43,w-14,5,edge);R(2,-38,w-4,5,edge);R(0,-33,w,4,edge);
      R(14,-47,w-28,5,roof);R(9,-42,w-18,5,roof);R(4,-37,w-8,5,roof);
      R(14,-48,w-28,2,winter?snow:light);R(9,-42,w-18,1,light);R(2,-32,w-4,1,wood);
      for(let a=12;a<w-12;a+=10){R(a,-40,1,3,light);R(a+4,-35,1,2,light);}
      R(7,-9,w-14,1,'#bb9579');R(7,-7,w-14,1,'#a57d66');
      for(const [left,ww] of [[10,20],[w-30,20]]){
        R(left,-25,ww,18,edge);R(left+2,-23,ww-4,13,night?'#d5a36e':glass);
        R(left+ww/2-1,-23,2,13,wood);R(left+2,-18,ww-4,1,wood);
        R(left+3,-22,3,2,'#e7e4c7');R(left-2,-7,ww+4,2,wood);
      }
      if(p.id==='cafeHouse'){
        R(c-12,-29,24,10,edge);R(c-11,-28,22,8,cream);
        R(c-4,-26,7,4,roof);R(c+3,-26,2,2,roof);R(c-5,-22,10,1,roof);
        R(c-23,-19,46,7,edge);R(c-22,-18,44,5,roof);
        for(let i=-21;i<22;i+=6)R(c+i,-17,4,4,cream);
        R(c-15,-12,30,7,glass);R(c-16,-6,32,2,wood);
        R(c-12,-10,5,2,cream);R(c+7,-11,5,3,wood);
        for(const a of [7,w-17]){
          R(a,-5,10,4,wood);R(a+1,-8,8,3,winter?snow:'#6d9972');
          R(a+3,-9,2,2,'#e89f9e');R(a+7,-9,1,2,'#f0c592');
        }
      }else if(p.id==='clubhouse'){
        R(c-10,-20,20,16,'#6c7259');R(c-8,-18,16,13,'#9d9a6f');
        R(c-6,-15,4,4,'#ce885b');R(c+3,-10,3,3,'#ce885b');
        R(c-11,-27,22,4,'#e7ce98');R(c-8,-26,16,1,'#8b7959');
      }else{
        R(c-10,-23,20,19,wood);R(c-8,-21,16,15,night?'#d5a36e':'#b6c3cc');
        R(c-1,-21,2,15,wood);R(c-8,-15,16,1,wood);
        R(c-14,-28,28,3,'#a48598');R(c-3,-44,6,3,cream);
      }
    }else if(p.id==='cafe'||p.id==='bistro'){
      R(1,-3,14,3,'rgba(67,47,48,.22)');
      if(p.id==='cafe'){
        R(1,-11,14,9,edge);R(2,-10,12,7,'#c59372');R(0,-13,16,5,edge);R(1,-12,14,3,cream);
        R(3,-16,4,4,'#f2ddc2');R(7,-15,2,2,'#f2ddc2');
        R(10,-16,4,4,'#8d6271');R(11,-15,2,1,cream);
        const steam=Math.floor(time*2)%3;
        R(4,-18-steam,1,2,night?'#ffe4ac':'#fff1d7');
      }else{
        R(0,-4,3,3,edge);R(13,-4,3,3,edge);
        R(7,-9,2,7,edge);R(2,-12,12,5,edge);R(3,-11,10,3,'#f1d0a0');R(5,-13,4,2,'#a86a75');
      }
    }else if(p.id==='bench'||p.id==='planter'){
      R(2,-4,w-4,4,wood);R(2,-7,w-4,3,'#a47860');
      if(p.id==='bench')R(3,-9,w-6,2,'#c69b78');
      else{R(4,-10,w-8,4,winter?snow:'#769775');R(5,-11,2,2,'#d6a6bd');R(10,-12,2,3,'#e3c59f');}
    }else if(p.id==='weekendBoard'){
      R(2,-14,2,13,edge);R(12,-14,2,13,edge);
      R(0,-24,16,15,edge);R(1,-23,14,13,warm);
      R(3,-21,10,9,cream);R(7,-22,2,2,'#b86f75');
      R(5,-18,6,1,wood);R(5,-15,4,1,wood);
    }else if(Object.hasOwn(exchanges,p.id)||p.id==='weekendStall'){
      const [shade,bright]=({produce:['#ab5960','#ed9686'],fishStall:['#547e9c','#91bdd0'],flowerStall:['#866d9e','#bba3cf'],weekendStall:['#a65c61','#efb389']})[p.id];
      R(3,-15,w-6,13,wood);R(6,-13,w-12,10,warm);
      R(2,-28,3,22,wood);R(w-5,-28,3,22,wood);
      R(0,-32,w,10,edge);R(1,-31,w-2,7,shade);
      for(let i=2;i<w-4;i+=8)R(i,-30,4,6,winter?snow:bright);
      R(0,-17,w,5,edge);R(1,-16,w-2,3,cream);
      if(p.id==='weekendStall'){
        R(4,-13,w-8,11,'#9e6873');R(6,-12,w-12,7,'#bc8281');
        for(let i=8;i<w-4;i+=7)R(i,-6,2,3,'#f0c4a4');
      }
      for(let i=7;i<w-5;i+=9){
        if(p.id==='produce'){R(i,-20,5,4,'#e69466');R(i+2,-21,2,1,'#79936b');}
        if(p.id==='fishStall'){R(i,-19,6,2,'#7fa3ba');R(i+6,-20,1,4,'#4c7c94');}
        if(p.id==='flowerStall'){R(i,-21,1,5,'#568463');R(i-1,-22,4,2,i%2?'#e58f9a':'#f5d291');}
      }
    }else if(p.id==='bandstand'){
      R(1,-6,w-2,6,wood);R(3,-31,4,26,'#855978');R(w-7,-31,4,26,'#855978');
      R(0,-37,w,7,edge);R(2,-36,w-4,4,'#91668e');R(3,-36,w-6,1,winter?snow:'#c8a5b9');
      R(7,-24,13,18,'#a8799a');R(w-20,-24,13,18,'#a8799a');
      R(9,-23,2,13,'#c196b5');R(w-11,-23,2,13,'#c196b5');
      for(let i=12;i<w-9;i+=11)R(i,-29+(i%3),2,2,night?'#ffe4a4':'#dbb79a');
      for(const a of [15,w-25]){
        R(a,-14,10,9,'#574558');R(a+2,-12,6,5,'#867386');R(a+4,-11,2,2,'#5d4e62');
      }
    }else if(p.id==='stage'){
      R(1,-5,14,4,'#614a53');R(2,-6,12,2,'#b388aa');
      R(4,-14,4,9,'#c18965');R(7,-16,2,7,'#b78160');R(7,-13,1,6,cream);
      R(11,-13,1,9,wood);R(10,-14,3,2,'#dbb3cf');
    }else if(p.id==='lookout'){
      R(1,-4,14,3,'#a37f68');R(4,-14,2,13,wood);R(11,-14,2,13,wood);
      R(7,-16,2,8,wood);R(3,-14,11,9,cream);
      R(4,-13,9,4,'#acc5cf');R(4,-9,9,3,'#7899ab');R(8,-10,4,1,'#e1a898');
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
