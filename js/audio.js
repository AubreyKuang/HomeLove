"use strict";

/* ---------------- audio ---------------- */
/* Everything is synthesized with Web Audio: a soft music-box tune over warm pads, plus small sound effects. */
const SND_KEY='homelove-sound';
let sndOn=(()=>{try{return localStorage.getItem(SND_KEY)!=='off';}catch(e){return true;}})();
let AC=null,master=null,musicBus=null,sfxBus=null,musicTimer=0,NB=null;
const mtof=m=>440*Math.pow(2,(m-69)/12);
function audioInit(){
  if(AC)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  try{AC=new C();}catch(e){AC=null;return;}
  master=AC.createGain();master.gain.value=sndOn?1:0;master.connect(AC.destination);
  musicBus=AC.createGain();musicBus.gain.value=0.5;sfxBus=AC.createGain();sfxBus.gain.value=0.8;
  const delay=AC.createDelay(1),fb=AC.createGain(),lp=AC.createBiquadFilter(),wet=AC.createGain();
  delay.delayTime.value=0.36;fb.gain.value=0.3;lp.type='lowpass';lp.frequency.value=2000;wet.gain.value=0.4;
  musicBus.connect(master);musicBus.connect(delay);delay.connect(lp);lp.connect(fb);fb.connect(delay);lp.connect(wet);wet.connect(master);
  sfxBus.connect(master);
  startMusic();
}
function tone(f,t,dur,o){
  o=o||{};const osc=AC.createOscillator(),g=AC.createGain(),vol=o.vol||0.1,a=o.attack||0.008;
  osc.type=o.type||'sine';osc.frequency.setValueAtTime(f,t);if(o.glide)osc.frequency.exponentialRampToValueAtTime(o.glide,t+dur*0.9);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  osc.connect(g);g.connect(o.bus||sfxBus);osc.start(t);osc.stop(t+dur+0.05);
}
function noise(t,dur,o){
  o=o||{};
  if(!NB){NB=AC.createBuffer(1,Math.floor(AC.sampleRate*1.5),AC.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();
  s.buffer=NB;f.type=o.type||'bandpass';f.frequency.value=o.freq||1000;f.Q.value=o.q||1;
  g.gain.setValueAtTime(o.vol||0.1,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  s.connect(f);f.connect(g);g.connect(o.bus||sfxBus);s.start(t,Math.random()*0.5);s.stop(t+dur+0.02);
}
function bell(f,t,vol,bus){vol=vol||0.12;tone(f,t,1.4,{vol,bus});tone(f*2,t,0.5,{vol:vol*0.25,bus});tone(f*3.01,t,0.22,{vol:vol*0.08,bus});}

/* music: IV - iii - ii - I in C, a wandering pentatonic music-box line; slower and lower at night */
const CHORDS=[[53,57,60,64],[52,55,59,62],[50,53,57,60],[48,52,55,59]];
const PENTA=[60,62,64,67,69,72,74,76,79,81,84];
let mNext=0,mStep=0,mPrev=72,mNight=false;
function startMusic(){mNext=AC.currentTime+0.4;mStep=0;clearInterval(musicTimer);musicTimer=setInterval(schedMusic,120);}
function schedMusic(){
  if(!AC||AC.state!=='running'||!sndOn)return;
  if(mNext<AC.currentTime)mNext=AC.currentTime+0.05;
  while(mNext<AC.currentTime+0.6){
    const pos=mStep%8,ch=CHORDS[Math.floor(mStep/8)%4];
    if(pos===0)mNight=darkness()>0.5;
    const e=mNight?0.52:0.42,t=mNext,sh=mNight?-12:0;
    if(pos===0){
      ch.forEach((m,i)=>tone(mtof(m+sh),t+i*0.04,e*8.3,{type:'triangle',vol:mNight?0.028:0.036,bus:musicBus,attack:0.9}));
      tone(mtof(ch[0]-12),t,e*3.6,{vol:0.11,bus:musicBus,attack:0.03});
    }
    if(pos===4)tone(mtof(ch[0]-5),t,e*3.6,{vol:0.07,bus:musicBus,attack:0.03});
    if(Math.random()<(mNight?0.3:0.5)&&!(pos%2&&Math.random()<0.45)){
      let m;
      if(pos===0){const ct=ch.map(x=>x+24).filter(x=>x>=60&&x<=84);m=ct.reduce((a,b)=>Math.abs(b-mPrev)<Math.abs(a-mPrev)?b:a);}
      else{const near=PENTA.filter(x=>x!==mPrev&&Math.abs(x-mPrev)<=5);m=pick(near.length?near:PENTA);}
      mPrev=m;bell(mtof(m+sh),t,mNight?0.06:0.075,musicBus);
    }
    if(mNight&&Math.random()<0.05)tone(mtof(96+pick([0,2,4,7])),t,1.6,{vol:0.02,bus:musicBus});
    mNext+=e;mStep++;
  }
}

const VOICE={gy:520,xm:880,xy:700,jy:440,by:390};
const SFX={
  blip:(t,f)=>tone(f||760,t,0.07,{type:'triangle',vol:0.08}),
  select:t=>{tone(880,t,0.06,{vol:0.1});tone(1320,t+0.04,0.09,{vol:0.08});},
  pop:t=>{const f=mtof(pick([72,74,76,79,81]));tone(f,t,0.14,{type:'triangle',vol:0.12,glide:f*1.5});},
  pickup:t=>[84,88,91].forEach((m,i)=>tone(mtof(m),t+i*0.06,0.28,{vol:0.1})),
  heart:t=>{tone(mtof(79),t,0.25,{vol:0.1});tone(mtof(84),t+0.09,0.4,{vol:0.1});},
  levelup:t=>[72,76,79,84,88].forEach((m,i)=>bell(mtof(m),t+i*0.08,0.09)),
  sad:t=>{tone(mtof(71),t,0.3,{type:'triangle',vol:0.08});tone(mtof(67),t+0.16,0.45,{type:'triangle',vol:0.08});},
  cast:t=>{noise(t,0.22,{vol:0.06,freq:3200,type:'highpass'});noise(t+0.35,0.35,{vol:0.1,freq:700});},
  bite:t=>{tone(1400,t,0.08,{vol:0.1});noise(t,0.15,{vol:0.1,freq:1200});tone(1700,t+0.12,0.09,{vol:0.1});},
  catch:t=>{noise(t,0.35,{vol:0.12,freq:900});SFX.pickup(t+0.12);},
  miss:t=>{noise(t,0.3,{vol:0.08,freq:700});tone(330,t+0.05,0.35,{type:'triangle',vol:0.06,glide:220});},
  sleep:t=>[79,76,72,67].forEach((m,i)=>bell(mtof(m),t+i*0.24,0.08)),
  morning:t=>{SFX.bird(t);SFX.bird(t+0.45);bell(mtof(84),t+0.9,0.06);},
  eat:t=>{for(let i=0;i<3;i++)noise(t+i*0.15,0.07,{vol:0.08,freq:2400});},
  ding:t=>{bell(mtof(88),t,0.1);bell(mtof(84),t+0.12,0.08);},
  rustle:t=>{noise(t,0.35,{vol:0.05,freq:4200,type:'highpass'});noise(t+0.2,0.25,{vol:0.04,freq:3800,type:'highpass'});},
  page:t=>noise(t,0.18,{vol:0.05,freq:3200,type:'highpass'}),
  whoosh:t=>{noise(t,0.3,{vol:0.05,freq:900,q:0.7});noise(t+0.05,0.25,{vol:0.04,freq:2400,q:0.7});},
  click:t=>tone(2200,t,0.03,{type:'square',vol:0.03}),
  weekNote:(t,n)=>bell(mtof([60,64,67][n]),t,.12),
  villageSample:(t,sample)=>{
    if(sample==='water'){
      for(let i=0;i<3;i++)noise(t+i*.14,.27,{freq:520+i*120,q:.7,vol:.035});
    }else if(sample==='letter'){
      noise(t,.16,{freq:2500,vol:.04});tone(175,t+.08,.16,{type:'triangle',vol:.06,glide:95});
    }else{
      [83,88,91].forEach((m,i)=>bell(mtof(m),t+i*.06,.065));
    }
  },
  villageMix:(t,mix)=>{
    [55,62,67,71].forEach((m,i)=>tone(mtof(m),t+i*.08,2.7,{type:'triangle',vol:.021}));
    mix.order.forEach((sample,i)=>{
      const beat=t+.28+i*.66;
      SFX.villageSample(beat,sample);bell(mtof([67,71,74][i]),beat+.2,.07);
    });
    (mix.ending==='open'?[74,79,83]:[74,71,67]).forEach((m,i)=>bell(mtof(m),t+2.4+i*.26,.08));
  },
  villageSong:t=>[60,64,67,72,69,67,64].forEach((n,i)=>bell(mtof(n),t+i*.22,.12)),
  magic:t=>{[0,4,7,11,12,16,19,23,24,28].forEach((s,i)=>bell(mtof(72+s),t+i*0.06,0.07));noise(t,1.2,{vol:0.03,freq:6000,type:'highpass'});},
  start:t=>[72,79,84].forEach((m,i)=>bell(mtof(m),t+i*0.12,0.09)),
  cat:t=>{const o=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();o.type='triangle';f.type='lowpass';f.frequency.value=1800;
    o.frequency.setValueAtTime(620,t);o.frequency.linearRampToValueAtTime(900,t+0.14);o.frequency.linearRampToValueAtTime(520,t+0.45);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.08,t+0.05);g.gain.exponentialRampToValueAtTime(0.0001,t+0.5);
    o.connect(f);f.connect(g);g.connect(sfxBus);o.start(t);o.stop(t+0.55);},
  dog:t=>{tone(280,t,0.12,{type:'square',vol:0.035,glide:170});noise(t,0.1,{vol:0.05,freq:500});tone(300,t+0.2,0.12,{type:'square',vol:0.035,glide:180});noise(t+0.2,0.1,{vol:0.05,freq:500});},
  bird:t=>{tone(2600,t,0.08,{vol:0.05,glide:3400});tone(2800,t+0.11,0.1,{vol:0.05,glide:3700});},
  rabbit:t=>{noise(t,0.06,{vol:0.08,freq:300});tone(1500,t+0.06,0.07,{vol:0.04,glide:1900});},
  step:(t,wood)=>noise(t,0.04,{vol:wood?0.035:0.025,freq:wood?650:1900,q:2}),
};
function sfx(name,o){if(!AC||!sndOn||AC.state!=='running'||!SFX[name])return;try{SFX[name](AC.currentTime+0.01,o);}catch(e){}}
function setSound(on){
  sndOn=on;try{localStorage.setItem(SND_KEY,on?'on':'off');}catch(e){}
  if(on){audioInit();if(AC)AC.resume();}
  if(master)master.gain.setTargetAtTime(on?1:0,AC.currentTime,0.05);
  $('#btnSound').textContent=on?'🔊':'🔇';notify(tr(on?'soundOn':'soundOff'));
}
document.addEventListener('visibilitychange',()=>{if(!AC)return;if(document.hidden)AC.suspend();else if(sndOn)AC.resume();});
