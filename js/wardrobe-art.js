"use strict";

/* ---------------- wardrobe data ---------------- */
const SKINS=['#ffe3c8','#f7c99e','#e2a676','#b5764b','#7b4b2e'];
const HAIR_COLORS=['#2e2433','#5b3a29','#9c5b2e','#e0a94e','#f3dfa2','#d9534f','#f28cb6','#8a78e0','#4f9fd9','#5fbf86','#eceaf2'];
const CLOTH=['#f6f2ea','#3b3b4f','#e85f5f','#f2a157','#f5d256','#8bc46a','#55a89c','#5b8ee0','#9b7ad9','#f39ac2','#a46f45','#7d8b9a'];
const EYE='#2e2433', BLUSH='#f39a9a', WHITE='#f6f2ea', TIE='#e85f5f';

function capShort(K,c){const {R}=K,hl=shade(c,1.3);
  if(K.down){R(4,2,8,1,c);R(3,3,10,2,c);R(3,5,1,3,c);R(12,5,1,3,c);R(4,5,3,1,c);R(9,5,3,1,c);R(5,3,3,1,hl);}
  else if(K.up){R(4,2,8,1,c);R(3,3,10,6,c);R(4,9,8,1,c);R(5,3,3,1,hl);}
  else{R(4,2,7,1,c);R(3,3,9,3,c);R(3,6,4,3,c);R(4,9,2,1,c);R(6,3,3,1,hl);}
}
const HAIRS=[
  {id:'short',front:capShort},
  {id:'bob',front(K,c){const {R}=K,hl=shade(c,1.3);
    if(K.down){R(4,2,8,1,c);R(3,3,10,3,c);R(3,6,2,5,c);R(11,6,2,5,c);R(5,3,3,1,hl);}
    else if(K.up){R(4,2,8,1,c);R(3,3,10,8,c);R(5,3,3,1,hl);}
    else{R(4,2,7,1,c);R(3,3,9,3,c);R(3,6,5,5,c);R(6,3,3,1,hl);}}},
  {id:'long',
    back(K,c){const d=shade(c,.82);if(K.down)K.R(3,6,10,10,d);else if(K.side)K.R(2,6,5,10,d);},
    front(K,c){const {R}=K,hl=shade(c,1.3),d=shade(c,.82);
    if(K.down){R(4,2,8,1,c);R(3,3,10,2,c);R(4,5,3,1,c);R(9,5,3,1,c);R(3,5,1,9,c);R(12,5,1,9,c);R(5,3,3,1,hl);}
    else if(K.up){R(4,2,8,1,c);R(3,3,10,13,c);R(6,10,1,5,d);R(9,10,1,5,d);R(5,3,3,1,hl);}
    else{R(4,2,7,1,c);R(3,3,9,3,c);R(3,6,4,4,c);R(6,3,3,1,hl);}}},
  {id:'twin',
    back(K,c){if(K.side){K.R(1,6,3,7,c);K.R(2,5,2,1,TIE);}else{K.R(1,6,2,7,c);K.R(13,6,2,7,c);K.R(1,5,2,1,TIE);K.R(13,5,2,1,TIE);}},
    front:capShort},
  {id:'bun',front(K,c){capShort(K,c);const hl=shade(c,1.3);
    if(K.side){K.R(4,0,3,1,c);K.R(3,1,5,1,c);}else{K.R(7,0,2,1,c);K.R(6,1,4,1,c);K.R(7,0,1,1,hl);}}},
  {id:'spiky',front(K,c){const {R}=K,hl=shade(c,1.3);
    if(K.down){R(4,1,1,1,c);R(6,0,1,2,c);R(9,0,1,2,c);R(11,1,1,1,c);R(4,2,8,1,c);R(3,3,10,2,c);R(3,5,1,2,c);R(12,5,1,2,c);R(4,5,1,1,c);R(6,5,1,1,c);R(9,5,1,1,c);R(11,5,1,1,c);R(5,3,3,1,hl);}
    else if(K.up){R(4,1,1,1,c);R(6,0,1,2,c);R(9,0,1,2,c);R(11,1,1,1,c);R(4,2,8,1,c);R(3,3,10,6,c);R(4,9,8,1,c);R(5,3,3,1,hl);}
    else{R(3,1,1,1,c);R(5,0,1,2,c);R(8,0,1,2,c);R(10,1,1,1,c);R(4,2,7,1,c);R(3,3,9,3,c);R(3,6,4,3,c);R(2,4,1,1,c);R(6,3,3,1,hl);}}},
  {id:'pony',
    back(K,c){if(K.side){K.R(1,4,3,8,c);K.R(3,5,1,1,TIE);}},
    front(K,c){capShort(K,c);if(K.up){K.R(7,9,2,6,c);K.R(7,8,2,1,TIE);}}},
];
const CAPSULE_HAIRS=[
  {id:'cloudBob',color:6,front(K,c){
    capShort(K,c);
    const {R}=K,light=shade(c,1.25),dark=shade(c,.75);
    if(K.up){R(3,8,10,3,c);R(4,11,8,1,dark);R(5,9,4,1,light);}
    else if(K.side){R(2,5,3,5,c);R(3,10,4,2,dark);R(4,9,3,2,c);}
    else{R(2,5,3,5,c);R(11,5,3,5,c);R(3,10,3,1,dark);R(10,10,3,1,dark);R(6,5,4,1,light);}
  }},
  {id:'ribbonBraid',color:2,
    back(K,c){if(!K.up){K.R(K.side?2:11,8,3,6,shade(c,.85));}},
    front(K,c){
      capShort(K,c);
      const {R}=K,x=K.up?7:K.side?3:11,light=shade(c,1.23),dark=shade(c,.76);
      R(x,9,3,3,c);R(x+1,12,2,3,c);R(x,11,1,1,light);R(x+2,13,1,1,dark);
      R(x,15,4,1,'#e8a5b9');R(x+1,16,2,2,dark);
    }
  },
  {id:'doubleBuns',color:1,front(K,c){
    capShort(K,c);
    const {R}=K,light=shade(c,1.3),dark=shade(c,.8);
    R(2,0,3,1,c);R(1,1,5,3,c);R(2,1,2,1,light);R(2,4,3,1,dark);
    if(!K.side){R(11,0,3,1,c);R(10,1,5,3,c);R(11,1,2,1,light);R(11,4,3,1,dark);}
    if(K.up)R(6,6,4,1,light);
  }},
  {id:'waterfallWaves',color:3,
    back(K,c){
      const {R}=K,dark=shade(c,.76);
      R(K.side?2:3,6,K.side?5:10,10,dark);
      R(K.side?1:2,15,K.side?5:12,3,dark);
    },
    front(K,c){
      capShort(K,c);
      const {R}=K,light=shade(c,1.23),dark=shade(c,.82);
      if(K.up){R(3,8,10,7,c);R(2,14,12,3,c);R(5,9,1,5,light);R(9,10,1,6,dark);}
      else if(K.side){R(2,6,4,8,c);R(1,13,4,3,c);R(3,8,1,5,light);}
      else{R(2,5,2,9,c);R(12,5,2,9,c);R(3,12,2,4,c);R(11,12,2,4,c);R(3,7,1,4,light);R(12,10,1,3,light);}
    }
  },
  {id:'highPonytail',color:5,
    back(K,c){
      if(K.side){K.R(0,3,4,8,c);K.R(1,10,3,4,shade(c,.82));}
      else if(K.down){K.R(10,4,4,9,shade(c,.85));}
    },
    front(K,c){
      capShort(K,c);
      const {R}=K,light=shade(c,1.28);
      if(K.up){R(7,3,4,3,c);R(8,6,4,7,c);R(9,7,1,5,light);R(7,5,4,1,'#f0c888');}
      else{R(K.side?3:10,1,3,2,c);R(K.side?3:11,3,2,1,'#f0c888');}
    }
  },
  {id:'curlyPixie',color:7,front(K,c){
    capShort(K,c);
    const {R}=K,light=shade(c,1.3),dark=shade(c,.81);
    R(4,1,3,2,c);R(8,0,3,3,c);R(5,2,2,1,light);R(9,1,1,2,light);
    if(K.up){R(3,5,10,2,c);R(4,7,8,1,dark);}
    else if(K.side){R(3,4,3,2,dark);R(8,3,3,2,light);}
    else{R(4,5,3,1,light);R(7,4,3,2,c);R(9,5,2,1,dark);}
  }},
  {id:'sideSweep',color:4,front(K,c){
    capShort(K,c);const {R}=K;
    R(4,1,7,2,c);R(5,2,4,1,shade(c,1.35));
    if(!K.up){R(5,4,6,2,c);R(5,6,3,1,c);R(5,4,4,1,shade(c,1.27));}
    R(K.side?3:11,5,1,4,shade(c,.8));
  }},
  {id:'silkLowBun',color:0,front(K,c){
    capShort(K,c);const {R}=K,x=K.side?2:6;
    if(K.up||K.side){R(x,8,5,4,c);R(x+1,11,3,2,shade(c,.78));R(x+1,9,3,1,'#f6d4ae');}
    else{R(4,5,2,3,c);R(10,5,2,3,c);R(11,6,2,1,'#f6d4ae');}
  }},
  {id:'twinBraids',color:2,front(K,c){
    capShort(K,c);const {R}=K,d=shade(c,.77),l=shade(c,1.27);
    for(const x of K.side?[3]:[2,11]){
      R(x,7,3,8,d);R(x+1,8,2,6,c);R(x,9,2,1,l);R(x+1,12,2,1,l);R(x,15,3,1,'#bd88a6');R(x+1,16,1,2,d);
    }
  }},
  {id:'shaggyWolf',color:5,front(K,c){
    capShort(K,c);const {R}=K,d=shade(c,.76);
    R(3,1,8,2,c);R(4,2,4,1,shade(c,1.35));
    R(2,5,3,4,c);R(3,8,2,4,d);R(2,11,2,1,c);
    if(!K.side){R(11,5,3,4,c);R(11,8,2,4,d);R(12,11,2,1,c);}
    if(K.up)R(5,8,6,4,c);else R(7,4,4,2,c);
  }}
];
HAIRS.push(...CAPSULE_HAIRS);
function torso(K,c,len){len=len||15;const sh=shade(c,.86),h=len-10;
  if(K.side){K.R(6,11,5,h,c);K.R(6,len,5,1,sh);}
  else{K.R(5,11,6,h,c);K.R(5,len,6,1,sh);K.R(K.up?5:10,11,1,h,sh);}
}
function sleeves(K,type,c){if(K.side||type==='none')return;
  if(type==='puff'){const l=shade(c,1.12);K.R(4,11,1,2,l);K.R(11,11,1,2,l);K.R(3,11,1,1,l);K.R(12,11,1,1,l);return;}
  const h=type==='long'?5:2,col=shade(c,.93);K.R(4,11,1,h,col);K.R(11,11,1,h,col);
}
function sideArm(K,type,c){const sw=K.frame===1?1:K.frame===2?-1:0,x=8+sw,col=shade(c,.85);
  K.R(x,11,2,6,K.skin);
  if(type==='long')K.R(x,11,2,5,col);else if(type==='short'||type==='puff')K.R(x,11,2,2,col);
}
const CAPSULE_DRESSES=[
  {id:'roseGown',color:9,sleeve:'puff',hidesBottom:true,draw(K,c){
    const {R}=K,x=K.side?1:0,shadow=shade(c,.74),light=shade(c,1.35);
    torso(K,c,16);
    R(4+x,16,8-x,2,c);R(3+x,18,10-x,2,c);R(2+x,20,12-x,2,shadow);
    R(5+x,17,6-x,1,light);R(4+x,19,8-x,1,light);R(3+x,20,10-x,1,c);
    R(5+x,15,6-x,1,'#f5d6a0');R(7+x,15,2,2,'#ffe9c5');
    R(K.up?6:8,16,1,2,'#f5d6a0');
    if(K.down){R(6,11,4,1,K.skin);R(7,12,2,1,'#e85f5f');}
  }},
  {id:'moonGown',color:8,sleeve:'none',hidesBottom:true,draw(K,c){
    const {R}=K,shadow=shade(c,.66),light=shade(c,1.3),trim='#f9dea0';
    torso(K,c,16);
    R(5,16,6,2,c);R(4,18,8,2,c);R(K.side?1:3,20,K.side?12:10,2,shadow);
    R(K.side?2:4,20,K.side?10:8,1,light);R(6,17,1,3,light);
    R(K.side?6:5,15,K.side?5:6,1,trim);R(K.side?9:7,11,2,1,trim);
    R(6,18,1,1,trim);R(9,17,1,1,'#fff5d5');R(10,20,1,1,trim);
    R(K.side?3:5,21,1,1,'#fff5d5');
  }},
  {id:'lilyGown',color:0,sleeve:'puff',hidesBottom:true,draw(K,c){
    const {R}=K,x=K.side?1:0,shadow=shade(c,.75),light=shade(c,1.2),lace='#fff0d6';
    torso(K,c,16);
    R(4+x,16,8-x,2,c);R(3+x,18,10-x,2,c);R(3,20,10,2,shadow);
    R(5+x,15,6-x,1,'#8ba88c');R(6+x,16,4-x,1,lace);
    R(4+x,18,8-x,1,light);R(4,20,8,1,light);
    for(const px of [3,5,7,9,11])R(px,21,1,1,lace);
    R(K.up?7:5,14,2,2,'#e5a1ae');R(K.up?8:6,14,1,1,'#f7c3cb');
  }},
  {id:'peacockGown',color:6,sleeve:'short',hidesBottom:true,draw(K,c){
    const {R}=K,x=K.side?1:0,shadow=shade(c,.7),light=shade(c,1.34),trim='#f2c77e';
    torso(K,c,16);
    R(4+x,16,8-x,2,c);R(3+x,18,10-x,2,c);R(2+x,20,12-x,2,shadow);
    R(4+x,18,2,3,light);R(7,17,2,4,light);R(10,18,2,3,light);
    R(5+x,15,6-x,1,trim);R(K.up?9:6,11,1,3,trim);
    for(const px of [4,7,10,12]){R(px,20,1,1,trim);R(px,21,1,1,c);}
  }},
  {id:'seaSailorDress',color:7,sleeve:'short',hidesBottom:true,draw(K,c){
    const {R}=K,x=K.side?1:0,shadow=shade(c,.72),light=shade(c,1.28);
    torso(K,c,16);
    R(5+x,16,6-x,1,shadow);R(4+x,17,8-x,2,c);R(3+x,19,10-x,1,shadow);
    R(4+x,18,8-x,1,WHITE);R(5+x,19,2,1,light);
    if(K.up){R(5,11,6,2,WHITE);R(6,13,4,1,WHITE);}
    else{R(5+x,11,2,1,WHITE);R(9,11,2,1,WHITE);R(7+x,12,2,2,'#f2a157');}
  }},
  {id:'dawnButterflyGown',color:4,sleeve:'puff',hidesBottom:true,draw(K,c){
    const {R}=K,x=K.side?1:0,shadow=shade(c,.74),light=shade(c,1.25);
    torso(K,c,16);
    R(5+x,16,6-x,1,'#a97383');R(4+x,17,8-x,2,c);R(2+x,19,12-x,2,c);
    R(2+x,21,12-x,1,shadow);R(3+x,20,10-x,1,light);R(5+x,18,1,2,light);
    const bow=K.up?7:8;
    R(bow-2,14,2,2,'#d582a7');R(bow+1,14,2,2,'#d582a7');R(bow,15,1,1,'#fff1c4');
    R(9,18,1,1,'#d582a7');R(11,19,1,1,'#d582a7');
  }},
  {id:'deepSeaGown',color:6,sleeve:'none',hidesBottom:true,draw(K,c){
    const {R}=K,x=K.side?1:0,shadow=shade(c,.63),light=shade(c,1.45);
    torso(K,c,16);
    R(5+x,16,6-x,2,c);R(6+x,18,4,2,shadow);
    R(4,20,8,1,c);R(2,21,12,1,shadow);
    R(4,21,2,1,light);R(10,21,2,1,light);R(6+x,17,1,2,light);
    R(8,18,1,1,c);R(9,19,1,1,light);
    if(K.down){R(6,11,1,1,WHITE);R(9,11,1,1,WHITE);R(7,12,2,1,WHITE);}
  }},
  {id:'snowCapeDress',color:11,sleeve:'long',hidesBottom:true,draw(K,c){
    const {R}=K,x=K.side?1:0,shadow=shade(c,.68),light=shade(c,1.32);
    torso(K,c,16);
    R(5+x,16,6-x,1,c);R(4+x,17,8-x,3,c);R(3+x,20,10-x,2,shadow);
    R(4+x,20,8-x,1,light);R(4+x,21,8-x,1,'#e3edf3');
    R(4+x,11,8-x,2,'#f6f3ef');R(3+x,13,10-x,1,'#e3edf3');
    if(K.up){R(5,14,6,3,'#e3edf3');R(6,17,4,1,'#f6f3ef');}
    else{R(7+x,13,2,1,'#e7bc76');R(7+x,14,1,2,'#d09972');}
  }},
  {id:'lavenderPinafore',color:8,sleeve:'puff',hidesBottom:true,draw(K,c){
    const {R}=K;torso(K,'#f5e5df',16);R(5,13,6,4,c);
    R(4,17,8,3,c);R(3,20,10,1,shade(c,.7));
    R(5,18,6,1,shade(c,1.25));R(6,16,4,2,'#f4ddd1');R(7,17,2,2,'#f4ddd1');
  }},
  {id:'emberQipao',color:2,sleeve:'short',hidesBottom:true,draw(K,c){
    const {R}=K;torso(K,c,17);R(5,17,6,4,c);R(5,21,6,1,shade(c,.72));
    R(7,10,2,1,'#f5cd8f');R(5,15,1,6,shade(c,.75));
    if(!K.up){R(8,11,2,1,'#f5cd8f');R(9,12,2,1,'#f5cd8f');R(10,19,1,3,'#f0c7aa');}
  }},
  {id:'wisteriaTeaDress',color:5,sleeve:'long',hidesBottom:true,draw(K,c){
    const {R}=K;torso(K,c,16);R(5,16,6,1,'#e4d4a5');R(4,17,8,4,c);
    R(3,20,10,1,shade(c,.74));
    for(const [x,y] of [[5,17],[10,18],[7,19],[11,20]]){R(x,y,1,1,'#edd4ed');R(x,y+1,1,1,'#9aac7e');}
  }},
  {id:'starlightTulle',color:7,sleeve:'none',hidesBottom:true,draw(K,c){
    const {R}=K;torso(K,c,16);R(5,16,6,1,'#dfd5ee');R(4,17,8,2,c);R(2,19,12,2,shade(c,.8));R(3,21,10,1,'#d5c8ed');
    for(const [x,y] of [[5,18],[8,19],[11,18],[4,20],[10,20]])R(x,y,1,1,'#fff0cb');
  }},
  {id:'auroraCourtGown',color:6,sleeve:'none',hidesBottom:true,draw(K,c){
    const {R}=K,gold='#f7d98b',light=shade(c,1.44);
    torso(K,c,16);
    R(5,15,6,1,gold);R(4,16,8,2,c);R(3,18,10,2,light);
    R(1,20,14,2,shade(c,.62));R(2,20,12,1,c);
    R(5,17,1,4,shade(c,.73));R(10,17,1,4,shade(c,.73));
    for(const [x,y] of [[4,19],[6,18],[8,19],[11,18],[3,21],[7,21],[12,21]])R(x,y,1,1,gold);
    if(K.down){R(6,11,4,1,'#f6e3b7');R(7,12,2,1,'#b59bdb');}
  }},
  {id:'rubyVelvetGown',color:2,sleeve:'long',hidesBottom:true,draw(K,c){
    const {R}=K,trim='#f7c380',dark=shade(c,.56);
    torso(K,shade(c,.8),16);R(4,11,8,2,dark);R(6,12,4,1,trim);
    R(5,16,6,2,c);R(4,18,8,2,c);R(2,20,12,2,dark);
    R(K.side?3:6,17,3,4,shade(c,1.25));R(K.side?2:5,21,8,1,trim);
    if(K.up){R(5,12,6,3,dark);R(5,14,6,1,trim);}else R(7,13,2,2,'#ffe1a1');
  }},
  {id:'opalSwanGown',color:0,sleeve:'puff',hidesBottom:true,draw(K,c){
    const {R}=K,blue='#b4c7e4';
    torso(K,c,16);R(4,13,8,2,blue);R(6,14,4,1,'#fdf6e4');
    R(5,16,6,2,c);R(4,18,8,2,shade(c,.94));R(2,20,12,2,blue);
    R(3,20,10,1,'#ede8fa');R(5,21,7,1,'#fdf6e4');
    R(K.side?2:3,18,2,2,'#fcf7eb');R(10,17,3,2,'#fcf7eb');R(12,19,2,1,'#e4d7ef');
    if(!K.up){R(7,12,2,1,'#9c8fbd');R(8,13,1,1,'#eee2fb');}
  }},
  {id:'midnightConstellation',color:1,sleeve:'none',hidesBottom:true,draw(K,c){
    const {R}=K,gold='#ffe49e',x=K.side?2:3;
    torso(K,c,16);R(5,16,6,2,c);R(4,18,8,2,c);R(x,20,14-x,2,shade(c,.75));
    R(5,15,6,1,'#bd9fd9');R(7,11,2,1,gold);
    for(const [a,b] of [[4,20],[6,17],[7,19],[8,18],[9,20],[11,17],[12,21]])R(a,b,1,1,gold);
    R(7,18,1,1,'#bfa8d9');R(8,20,1,1,'#bfa8d9');
    if(K.up)R(6,12,4,1,'#bfa8d9');
  }},
  {id:'camelliaSilkGown',color:9,sleeve:'long',hidesBottom:true,draw(K,c){
    const {R}=K,lace='#f8d6ac';
    torso(K,c,16);R(5,12,6,1,lace);R(5,15,6,2,'#ad647a');
    R(5,17,6,2,shade(c,1.24));R(3,19,10,3,c);R(2,21,12,1,shade(c,.7));
    R(K.up?8:6,13,1,3,lace);R(6,18,1,3,lace);R(9,19,1,2,lace);
    for(const [x,y] of [[4,20],[8,17],[11,20]]){R(x,y,2,1,'#b75772');R(x,y-1,1,1,'#fff1cc');}
  }},
  {id:'goldenMasquerade',color:4,sleeve:'puff',hidesBottom:true,draw(K,c){
    const {R}=K,ink='#5f3f55',l=shade(c,1.4);
    torso(K,c,16);R(5,14,6,1,ink);R(7,12,2,2,ink);
    R(4,16,8,2,c);R(3,18,10,2,l);R(2,20,12,2,c);
    R(4,17,2,2,ink);R(10,17,2,2,ink);R(3,19,10,1,shade(c,.77));R(2,21,12,1,ink);
    for(const x of [3,6,9,12])R(x,21,1,1,l);
    if(K.up)R(6,15,4,2,ink);else R(8,12,1,1,'#fff2c4');
  }}
];
const CAPSULE_TOPS=[
  {id:'apricotCardigan',color:3,sleeve:'long',draw(K,c){
    const {R}=K;torso(K,c,16);if(!K.up)R(7,11,2,5,'#fff1dc');
    R(5,15,6,1,shade(c,.72));R(9,13,1,1,'#f8d79a');R(9,15,1,1,'#f8d79a');
  }},
  {id:'embroideredBlouse',color:0,sleeve:'puff',draw(K,c){
    const {R}=K;torso(K,c);R(6,11,4,1,'#ad747f');R(7,12,2,1,'#f0baae');
    R(5,14,1,1,'#a06f96');R(10,14,1,1,'#a06f96');
  }},
  {id:'denimJacket',color:7,sleeve:'long',draw(K,c){
    const {R}=K;torso(K,c,16);R(5,12,6,1,shade(c,1.25));
    if(!K.up){R(7,13,2,3,'#e9dfd1');R(5,14,1,1,'#e3c994');R(10,14,1,1,'#e3c994');}
  }},
  {id:'cloudSweater',color:8,sleeve:'long',draw(K,c){
    const {R}=K;torso(K,c,16);R(6,12,4,1,'#fff1dd');R(5,13,6,2,'#fff1dd');
    R(5,16,6,1,shade(c,.75));
  }},
  {id:'forestWaistcoat',color:6,sleeve:'short',draw(K,c){
    const {R}=K;torso(K,c,16);R(5,11,6,1,'#f3e3cc');
    if(!K.up){R(7,11,2,4,'#f3e3cc');R(8,14,1,1,'#c49f70');R(8,16,1,1,'#c49f70');}
    R(5,16,6,1,shade(c,.74));
  }},
  {id:'berryRibbonBlouse',color:9,sleeve:'puff',draw(K,c){
    const {R}=K;torso(K,c);
    R(5,11,6,1,'#fff1db');R(5,15,6,1,shade(c,.76));
    if(!K.up){R(5,12,2,1,'#aa5574');R(9,12,2,1,'#aa5574');R(7,13,2,2,'#aa5574');}
  }},
  {id:'cocoaToggleCoat',color:10,sleeve:'long',draw(K,c){
    const {R}=K;torso(K,c,17);R(5,11,6,2,shade(c,.75));R(5,17,6,1,shade(c,.72));
    if(!K.up){R(8,13,1,4,shade(c,.8));R(7,14,3,1,'#f8d3a0');R(7,16,3,1,'#f8d3a0');}
  }},
  {id:'moonCollarCapelet',color:8,sleeve:'puff',draw(K,c){
    const {R}=K;torso(K,c);R(4,11,8,2,shade(c,1.32));R(3,13,10,1,shade(c,1.32));
    R(4,14,8,1,'#ece0ef');if(K.down){R(7,12,2,1,'#fff2a8');R(8,13,1,1,'#fff2a8');}
  }}
];
const TOPS=[
  {id:'tee',sleeve:'short',draw(K,c){torso(K,c);if(K.down)K.R(7,11,2,1,K.skin);}},
  {id:'stripe',sleeve:'long',draw(K,c){torso(K,c);const s=isLight(c)?'#5b8ee0':WHITE,x=K.side?6:5,w=K.side?5:6;
    K.R(x,12,w,1,s);K.R(x,14,w,1,s);if(!K.side){K.R(4,12,1,1,s);K.R(11,12,1,1,s);K.R(4,14,1,1,s);K.R(11,14,1,1,s);}}},
  {id:'hoodie',sleeve:'long',draw(K,c){const d=shade(c,.8);torso(K,c,16);
    if(K.down){K.R(5,11,6,1,d);K.R(6,12,1,2,WHITE);K.R(9,12,1,2,WHITE);K.R(6,14,4,1,d);}
    else if(K.up){K.R(5,10,6,2,d);K.R(6,12,4,1,d);}
    else K.R(4,10,3,2,d);}},
  {id:'sweater',sleeve:'long',draw(K,c){const d=shade(c,.82),l=shade(c,1.22);torso(K,c);
    if(K.side){K.R(6,11,5,1,d);K.R(7,13,1,1,l);K.R(9,14,1,1,l);}
    else{K.R(5,11,6,1,d);K.R(6,13,1,1,l);K.R(9,13,1,1,l);K.R(7,14,2,1,l);}}},
  {id:'tank',sleeve:'none',draw(K,c){torso(K,c);if(K.down)K.R(6,11,4,1,K.skin);else if(K.side)K.R(9,11,2,1,K.skin);}},
  {id:'dress',sleeve:'puff',hidesBottom:true,draw(K,c){const sh=shade(c,.84),rib=isLight(c)?TIE:WHITE;torso(K,c,16);
    if(K.side){K.R(6,16,5,1,c);K.R(5,17,7,2,c);K.R(4,19,8,1,sh);K.R(6,15,5,1,rib);}
    else{K.R(5,16,6,1,c);K.R(4,17,8,2,c);K.R(3,19,10,1,sh);K.R(5,15,6,1,rib);
      if(K.down){K.R(7,11,2,1,K.skin);K.R(5,18,1,1,sh);K.R(8,18,1,1,sh);K.R(10,18,1,1,sh);}
      else K.R(7,15,2,2,rib);}}},
  {id:'jacket',sleeve:'long',draw(K,c){const d=shade(c,.78);torso(K,c,16);
    if(K.down){K.R(7,11,2,5,WHITE);K.R(6,11,1,2,d);K.R(9,11,1,2,d);K.R(5,14,1,1,d);K.R(10,14,1,1,d);}
    else if(K.up)K.R(5,11,6,1,d);
    else{K.R(10,11,1,5,WHITE);K.R(9,11,1,2,d);}}},
  {id:'sailor',sleeve:'short',draw(K,c){const col=isLight(c)?'#3b3b4f':WHITE;torso(K,c);
    if(K.down){K.R(5,11,2,1,col);K.R(9,11,2,1,col);K.R(7,11,2,1,K.skin);K.R(7,12,2,2,TIE);K.R(7,14,1,1,TIE);}
    else if(K.up){K.R(5,11,6,3,col);K.R(5,13,6,1,shade(col,.8));}
    else{K.R(6,11,3,2,col);K.R(10,12,1,2,TIE);}}},
  ...CAPSULE_DRESSES,...CAPSULE_TOPS
];
function hips(K,c){if(K.side)K.R(6,16,5,2,c);else{K.R(5,16,6,2,c);K.R(7,17,2,1,shade(c,.82));}}
const CAPSULE_BOTTOMS=[
  {id:'plaidPleats',color:9,draw(K,c){
    const {R}=K;hips(K,c);R(4,17,8,3,c);R(3,20,10,1,shade(c,.78));
    R(4,18,8,1,shade(c,1.28));for(const x of [5,8,11])R(x,17,1,4,shade(c,.74));
  }},
  {id:'pearlMidi',color:0,draw(K,c){
    const {R}=K;hips(K,c);R(4,17,8,4,c);R(3,21,10,1,shade(c,.82));
    R(5,18,1,3,shade(c,1.2));R(10,18,1,3,shade(c,.86));
    for(const x of [4,7,10])R(x,21,1,1,'#fff8e8');
  }},
  {id:'petalWrap',color:4,draw(K,c){
    const {R}=K;hips(K,c);R(4,17,8,3,c);R(3,19,9,1,shade(c,1.28));
    R(3,20,7,1,c);R(4,21,4,1,shade(c,.73));R(7,17,1,3,shade(c,.73));R(10,16,2,1,'#f4d294');
  }},
  {id:'velvetTierSkirt',color:8,draw(K,c){
    const {R}=K;hips(K,c);R(5,16,6,1,'#e6c08c');
    R(4,17,8,2,c);R(3,19,10,2,shade(c,.72));R(2,21,12,1,c);
    for(const x of [3,6,9,12])R(x,21,1,1,'#e6c08c');
  }},
  {id:'organzaBowSkirt',color:9,draw(K,c){
    const {R}=K;hips(K,c);R(5,16,6,1,shade(c,.77));
    R(4,17,8,2,c);R(3,19,10,2,shade(c,1.27));R(3,21,10,1,shade(c,.84));
    const x=K.up?6:9;
    R(x-1,16,4,1,'#f4e7f5');R(x,17,2,1,'#f4e7f5');R(x+1,18,1,2,'#f4e7f5');
  }}
];
const BOTTOMS=[
  {id:'shorts',draw(K,c){hips(K,c);K.legs.forEach(l=>K.R(l.x,18,2,1,l.back?shade(c,.85):c));}},
  {id:'pants',draw(K,c){hips(K,c);K.legs.forEach(l=>K.R(l.x,18,2,l.bot-17,l.back?shade(c,.85):c));}},
  {id:'wide',draw(K,c){hips(K,c);const sh=shade(c,.85);
    if(K.side){K.R(5,18,7,4,c);K.R(8,18,1,4,sh);}else{K.R(4,18,3,4,c);K.R(9,18,3,4,c);K.R(6,18,1,4,sh);K.R(9,18,1,4,sh);}}},
  {id:'skirt',draw(K,c){const sh=shade(c,.82);
    if(K.side){K.R(6,16,5,1,c);K.R(5,17,7,2,c);K.R(6,18,1,1,sh);K.R(9,18,1,1,sh);}
    else{K.R(5,16,6,1,c);K.R(4,17,8,2,c);K.R(4,18,8,1,sh);K.R(5,18,1,1,c);K.R(8,18,1,1,c);K.R(10,18,1,1,c);}}},
  {id:'longskirt',draw(K,c){const sh=shade(c,.84);
    if(K.side){K.R(6,16,5,1,c);K.R(5,17,7,4,c);K.R(4,21,8,1,sh);}
    else{K.R(5,16,6,1,c);K.R(4,17,8,4,c);K.R(3,21,10,1,sh);K.R(6,18,1,3,sh);K.R(9,18,1,3,sh);}}},
  ...CAPSULE_BOTTOMS
];
function feet(K,fn){K.legs.forEach(l=>fn(l,l.bot+1));}
const SHOES=[
  {id:'sneaker',draw(K,c){const sole=isLight(c)?'#c9c1b6':WHITE;feet(K,(l,y)=>{const w=K.side?3:2,col=l.back?shade(c,.85):c;K.R(l.x,y,w,1,col);K.R(l.x,y+1,w,1,sole);});}},
  {id:'boots',draw(K,c){feet(K,(l,y)=>{const w=K.side?3:2,col=l.back?shade(c,.85):c;K.R(l.x,y-2,2,2,col);K.R(l.x,y,w,2,col);K.R(l.x,y-2,2,1,shade(c,1.2));});}},
  {id:'loafer',draw(K,c){feet(K,(l,y)=>{const w=K.side?3:2,col=l.back?shade(c,.85):c;K.R(l.x,y,w,2,col);K.R(l.x,y,1,1,shade(c,1.35));});}},
  {id:'sandal',draw(K,c){feet(K,(l,y)=>{const w=K.side?3:2;K.R(l.x,y,w,1,K.skin);K.R(l.x+(K.side?1:0),y,1,1,c);K.R(l.x,y+1,w,1,shade(c,.85));});}},
];
const HATS=[
  {id:'none'},
  {id:'straw',draw(K,c){const band=isLight(c)?TIE:shade(c,.6);K.R(5,0,6,2,c);K.R(5,2,6,1,band);K.R(2,3,12,1,shade(c,.9));K.R(6,0,2,1,shade(c,1.2));}},
  {id:'beanie',draw(K,c){const d=shade(c,.82);
    if(K.side){K.R(4,1,7,2,c);K.R(3,3,9,1,d);K.R(6,0,2,1,WHITE);}
    else{K.R(4,1,8,2,c);K.R(3,3,10,1,d);K.R(7,0,2,1,WHITE);K.R(6,1,1,2,d);K.R(9,1,1,2,d);}}},
  {id:'cap',draw(K,c){const d=shade(c,.78);
    if(K.side){K.R(4,1,7,3,c);K.R(10,3,4,1,d);K.R(6,1,2,1,shade(c,1.2));}
    else{K.R(4,1,8,3,c);K.R(7,0,2,1,d);if(K.down)K.R(3,4,10,1,d);else K.R(6,3,4,1,d);}}},
  {id:'bow',draw(K,c){const d=shade(c,.75);
    if(K.side){K.R(4,0,2,3,c);K.R(8,0,2,3,c);K.R(6,1,2,1,d);}
    else if(K.down){K.R(8,0,2,3,c);K.R(12,0,2,3,c);K.R(10,1,2,1,d);}
    else{K.R(2,0,2,3,c);K.R(6,0,2,3,c);K.R(4,1,2,1,d);}}},
  {id:'cat',draw(K,c){const p='#f6a5b8';
    if(K.side){K.R(6,0,1,3,c);K.R(7,1,1,2,c);K.R(8,2,1,1,c);}
    else{K.R(4,0,1,3,c);K.R(5,1,1,2,c);K.R(6,2,1,1,c);K.R(11,0,1,3,c);K.R(10,1,1,2,c);K.R(9,2,1,1,c);if(K.down){K.R(5,2,1,1,p);K.R(10,2,1,1,p);}}}},
  {id:'crown',draw(K,c){
    if(K.side){K.R(5,1,5,2,c);K.R(5,0,1,1,c);K.R(7,0,1,1,c);K.R(9,0,1,1,c);K.R(7,1,1,1,TIE);}
    else{K.R(5,1,6,2,c);K.R(5,0,1,1,c);K.R(7,0,2,1,c);K.R(10,0,1,1,c);K.R(7,1,2,1,TIE);}}},
  {id:'wreath',lock:3,draw(K,c){const g='#5fa54d';
    if(K.side){K.R(3,3,9,1,g);K.R(4,2,2,2,c);K.R(8,2,2,2,'#f5d256');K.R(10,3,1,1,WHITE);}
    else{K.R(3,3,10,1,g);K.R(3,2,2,2,c);K.R(6,2,2,2,WHITE);K.R(8,2,2,2,'#f5d256');K.R(11,2,2,2,c);}}},
];
const ACCS=[
  {id:'none'},
  {id:'glasses',top(K,c){if(K.down){K.R(5,7,3,2,c);K.R(8,7,3,2,c);K.R(6,7,1,2,EYE);K.R(9,7,1,2,EYE);}else if(K.side){K.R(9,7,3,2,c);K.R(10,7,1,2,EYE);K.R(6,7,3,1,c);}}},
  {id:'shades',top(K,c){const l=shade(c,.35),h=shade(c,1.4);if(K.down){K.R(5,7,6,2,l);K.R(5,7,1,1,h);K.R(8,7,1,1,h);}else if(K.side){K.R(9,7,3,2,l);K.R(10,7,1,1,h);K.R(6,7,3,1,l);}}},
  {id:'scarf',front(K,c){const d=shade(c,.82);
    if(K.side){K.R(5,11,6,2,c);K.R(4,12,2,4,d);}
    else{K.R(4,11,8,2,c);K.R(4,12,8,1,d);if(K.down){K.R(9,13,2,3,c);K.R(9,15,2,1,d);}else K.R(5,13,2,3,c);}}},
  {id:'bag',
    back(K,c){if(K.side){K.R(3,11,3,6,c);K.R(3,13,3,1,shade(c,.8));}},
    front(K,c){const d=shade(c,.78);
      if(K.down){K.R(3,12,1,4,d);K.R(12,12,1,4,d);K.R(5,11,1,4,d);K.R(10,11,1,4,d);}
      else if(K.up){K.R(5,11,6,6,c);K.R(5,11,6,2,d);K.R(6,14,4,2,shade(c,1.15));}
      else K.R(6,11,1,3,d);}},
  {id:'necklace',front(K,c){if(K.down){K.R(6,11,1,1,c);K.R(9,11,1,1,c);K.R(7,12,2,1,c);}else if(K.side)K.R(10,11,1,2,c);}},
];
const CAPSULE_POOLS={
  dress:{items:CAPSULE_DRESSES,owned:'capsuleDresses',slot:'top',colorKey:'topColor',tab:'capsule'},
  hair:{items:CAPSULE_HAIRS,owned:'capsuleHairs',slot:'hair',colorKey:'hairColor',tab:'capsuleHair'},
  top:{items:CAPSULE_TOPS,owned:'capsuleTops',slot:'top',colorKey:'topColor',tab:'capsuleTop'},
  bottom:{items:CAPSULE_BOTTOMS,owned:'capsuleBottoms',slot:'bottom',colorKey:'bottomColor',tab:'capsuleBottom'}
};
const CATS=[
  {key:'skin',crop:[2,1,16,14]},
  {key:'hair',items:HAIRS.filter(hair=>!CAPSULE_HAIRS.includes(hair)),colorKey:'hairColor',colors:HAIR_COLORS,crop:[2,0,16,14]},
  {key:'capsuleHair',slot:'hair',items:CAPSULE_HAIRS,colorKey:'hairColor',colors:HAIR_COLORS,crop:[1,0,18,21]},
  {key:'top',items:TOPS.filter(top=>!CAPSULE_DRESSES.includes(top)&&!CAPSULE_TOPS.includes(top)),colorKey:'topColor',colors:CLOTH,crop:[2,8,16,14]},
  {key:'capsule',slot:'top',items:CAPSULE_DRESSES,colorKey:'topColor',colors:CLOTH,crop:[2,8,16,14]},
  {key:'capsuleTop',slot:'top',items:CAPSULE_TOPS,colorKey:'topColor',colors:CLOTH,crop:[2,8,16,14]},
  {key:'capsuleBottom',slot:'bottom',items:CAPSULE_BOTTOMS,colorKey:'bottomColor',colors:CLOTH,crop:[2,11,16,14]},
  {key:'bottom',items:BOTTOMS.filter(item=>!CAPSULE_BOTTOMS.includes(item)),colorKey:'bottomColor',colors:CLOTH,crop:[2,11,16,14]},
  {key:'shoes',items:SHOES,colorKey:'shoesColor',colors:CLOTH,crop:[2,12,16,14]},
  {key:'hat',items:HATS,colorKey:'hatColor',colors:CLOTH,crop:[2,0,16,14]},
  {key:'acc',items:ACCS,colorKey:'accColor',colors:CLOTH,crop:[2,3,16,14]},
];

/* ---------------- character sprite ---------------- */
function face(K){const m=shade(K.skin,.72);
  if(K.down){K.R(6,7,1,2,EYE);K.R(9,7,1,2,EYE);K.R(5,9,1,1,BLUSH);K.R(10,9,1,1,BLUSH);K.R(7,9,2,1,m);}
  else if(K.side){K.R(10,7,1,2,EYE);K.R(9,9,1,1,BLUSH);K.R(11,9,1,1,m);}
}
function makeSprite(o,dir,frame){
  const c=mk(20,26),g=c.getContext('2d');
  const R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x+2,y+1,w,h);};
  const skin=SKINS[o.skin]||SKINS[0];
  const K={R,dir,down:dir==='down',up:dir==='up',side:dir==='side',frame,skin,skinS:shade(skin,.86)};
  if(K.side){const f=frame===1?1:frame===2?-1:0;K.legs=[{x:6-f,bot:21,back:true},{x:8+f,bot:21}];}
  else K.legs=[{x:5,bot:21-(frame===1?1:0)},{x:9,bot:21-(frame===2?1:0)}];
  const H=byId(HAIRS,o.hair),T=byId(TOPS,o.top),B=byId(BOTTOMS,o.bottom),S=byId(SHOES,o.shoes),HT=byId(HATS,o.hat),A=byId(ACCS,o.acc);
  const hc=HAIR_COLORS[o.hairColor]||HAIR_COLORS[0],tc=CLOTH[o.topColor]||CLOTH[0],bc=CLOTH[o.bottomColor]||CLOTH[0],sc=CLOTH[o.shoesColor]||CLOTH[0],hac=CLOTH[o.hatColor]||CLOTH[0],ac=CLOTH[o.accColor]||CLOTH[0];
  if(A.back)A.back(K,ac);
  if(H.back)H.back(K,hc);
  K.legs.forEach(l=>R(l.x,18,2,l.bot-17,l.back?K.skinS:skin));
  if(K.side)R(6,11,5,7,skin);else{R(5,11,6,7,skin);R(4,11,1,6,skin);R(11,11,1,6,skin);}
  R(4,3,8,8,skin);g.clearRect(6,11,1,1);g.clearRect(13,11,1,1);
  if(!K.up)face(K);
  if(!T.hidesBottom)B.draw(K,bc);
  S.draw(K,sc);
  sleeves(K,T.sleeve,tc);
  T.draw(K,tc);
  if(K.side)sideArm(K,T.sleeve,tc);
  if(A.front)A.front(K,ac);
  H.front(K,hc);
  if(HT.draw)HT.draw(K,hac);
  if(!K.up&&A.top)A.top(K,ac);
  return outline(c);
}
const sprCache=new Map();
const outfitKey=o=>[o.skin,o.hair,o.hairColor,o.top,o.topColor,o.bottom,o.bottomColor,o.shoes,o.shoesColor,o.hat,o.hatColor,o.acc,o.accColor].join(',');
function getSprite(o,dir,frame){
  const d=(dir==='left'||dir==='right')?'side':dir,k=outfitKey(o)+'|'+d+'|'+frame;
  let s=sprCache.get(k);
  if(!s){if(sprCache.size>600)sprCache.clear();s=makeSprite(o,d,frame);sprCache.set(k,s);}
  return s;
}
function blitChar(g,o,dir,frame,x,y){
  const s=getSprite(o,dir,frame);
  if(dir==='left'){g.save();g.translate(x+20,y);g.scale(-1,1);g.drawImage(s,0,0);g.restore();}
  else g.drawImage(s,x,y);
}
