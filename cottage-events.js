const CottageEvents = (() => {
  const landing = {x:23*16+8,y:7*16+12,start:21*60+30,end:25*60+30};
  const outcomes = {
    ufo:['flower','fish','sit'],
    bottle:['deliver','reply'],
    seed:['keep','return']
  };
  const rules = {
    ufo:{chance:.14,limit:5},
    bottle:{chance:.12,limit:7},
    seed:{chance:.20,limit:4}
  };

  function load(saved, today=1){
    const date = value => Number.isInteger(value)&&value>=1&&value<=today?value:0;
    const counter = (value,kind) => Number.isInteger(value)?Math.max(0,Math.min(value,rules[kind].limit)):0;
    const event = kind => {
      const data=saved?.[kind];
      const choice=outcomes[kind].includes(data?.choice)?data.choice:null;
      return {tries:counter(data?.tries,kind),checked:date(data?.checked),
        found:date(data?.found),done:choice?date(data?.done):0,choice};
    };
    const ufo=event('ufo'),bottle=event('bottle'),seed=event('seed');
    const minute=saved?.ufo?.minute;
    ufo.minute=Number.isFinite(minute)&&minute>=landing.start&&minute<landing.end?minute:landing.start;
    ufo.told=ufo.done?date(saved?.ufo?.told):0;
    seed.accepted=seed.found?date(saved?.seed?.accepted):0;
    return {ufo,bottle,seed};
  }

  function discover(events,kind,day,roll){
    const entry=events[kind],rule=rules[kind];
    if(day<2||entry.done)return false;
    if(entry.found&&(kind!=='ufo'||entry.found===day))return false;
    if(kind!=='bottle'&&entry.checked===day)return false;
    entry.checked=day;
    entry.tries++;
    if(roll>=rule.chance&&entry.tries<rule.limit)return false;
    entry.tries=0;
    entry.found=day;
    return true;
  }

  function finish(events,kind,day,choice){
    const entry=events[kind];
    if(!entry.found||entry.done||day<entry.found||!outcomes[kind].includes(choice)||
        (kind==='ufo'&&entry.found!==day)||(kind==='seed'&&!entry.accepted))return false;
    entry.done=day;
    entry.choice=choice;
    return true;
  }

  function landed(events,day,minute){
    const ufo=events?.ufo;
    return !!ufo&&ufo.found===day&&!ufo.done&&minute>=ufo.minute&&minute<landing.end;
  }

  function postcard(events,day){
    const told=events?.ufo.told;
    return told&&day>=told+3?{key:'world:ufoPostcard',kind:'postcard',resident:'by',day:told+3,event:'ufoPostcard'}:null;
  }

  function cards(events,day){
    const cards=[];
    for(const [kind,resident] of [['ufo',null],['bottle','xm'],['seed','xm']]){
      const entry=events[kind];
      if(entry.done)cards.push({key:'world:'+kind,kind:'world_'+kind,resident,day:entry.done,event:kind,choice:entry.choice});
    }
    const mail=postcard(events,day);
    if(mail)cards.push(mail);
    return cards;
  }

  function ship(g,x,y,open){
    const r=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(x+a,y+b,w,h);};
    r(-13,-3,26,5,'#343251');r(-10,-6,20,3,'#574d75');r(-7,-11,14,6,'#574d75');
    r(-5,-10,10,5,'#8cced3');r(-4,-9,4,2,'#e2f5d4');r(2,-7,4,2,'#64a3ba');
    r(-15,-3,30,3,'#8979aa');r(-12,-3,24,1,'#c2aad1');r(-11,2,22,2,'#574d75');
    for(const a of [-10,-1,8])r(a,0,3,1,'#ffe2a2');
    if(open){r(-4,-2,8,4,'#343251');r(-3,2,6,3,'#f4d7a1');r(-4,5,8,1,'#baa387');}
  }
  function alien(g,x,y,choice){
    const r=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(x+a,y+b,w,h);};
    r(-2,-15,1,3,'#83bda4');r(2,-15,1,3,'#83bda4');r(-3,-16,2,1,'#f5d898');r(2,-16,2,1,'#f5d898');
    r(-5,-12,10,7,'#3b5161');r(-4,-13,8,7,'#a9d7ae');r(-4,-7,8,2,'#7eb79f');
    r(-3,-10,2,2,'#3b5161');r(1,-10,2,2,'#3b5161');r(-1,-7,2,1,'#f2d1ae');
    r(-4,-5,8,4,'#8f6caa');r(-3,-4,6,1,'#b398c6');r(-3,-1,2,1,'#3b5161');r(1,-1,2,1,'#3b5161');
    if(choice==='flower')bloom(g,x+4,y-9);
    if(choice==='fish'){r(3,-5,6,3,'#81b9d1');r(8,-6,2,5,'#81b9d1');r(4,-4,1,1,'#384e6d');}
  }
  function bloom(g,x,y){
    g.fillStyle='#5a925d';g.fillRect(x,y+3,1,8);g.fillRect(x-2,y+7,4,2);
    g.fillStyle='#c694cd';g.fillRect(x-3,y+1,7,4);g.fillRect(x-1,y-1,3,7);
    g.fillStyle='#fff0bc';g.fillRect(x-1,y+1,3,3);
  }
  function bottle(g,x,y){
    g.fillStyle='#4d8b89';g.fillRect(x-7,y-5,13,8);g.fillRect(x+6,y-3,3,4);
    g.fillStyle='#a9d5b4';g.fillRect(x-6,y-4,11,6);
    g.fillStyle='#f5dfae';g.fillRect(x-4,y-3,7,4);
    g.fillStyle='#ae775e';g.fillRect(x+8,y-3,2,4);
  }
  return {load,discover,finish,landed,landing,postcard,cards,ship,alien,bloom,bottle};
})();

const XiaomanStory = (() => {
  function load(saved,day=1){
    const date=value=>Number.isInteger(value)&&value>=1&&value<=day?value:0;
    const ribbon=date(saved?.ribbon);
    const flowers=ribbon&&date(saved?.flowers)>=ribbon?date(saved.flowers):0;
    const answer=flowers&&date(saved?.answered)>=flowers&&['friends','space'].includes(saved?.answer)?saved.answer:null;
    return {ribbon,flowers,answer,answered:answer?date(saved.answered):0,offered:date(saved?.offered)};
  }

  function next(story,day,hearts){
    if(story.answer||story.offered===day)return null;
    if(!story.ribbon)return day>=2&&hearts>=3?'ribbon':null;
    if(!story.flowers)return day>=story.ribbon+1&&hearts>=5?'flowers':null;
    return day>=story.flowers+2&&hearts>=7?'confession':null;
  }

  function visits(story,day){
    if(story.answer==='space')return false;
    if(story.answer!=='friends')return true;
    const elapsed=day-story.answered;
    return elapsed>=7&&(elapsed-7)%5===0;
  }

  function postcard(story,day){
    return story?.answer==='friends'&&day>=story.answered+7
      ?{key:'world:xmPostcard',kind:'postcard',resident:'xm',day:story.answered+7,event:'xmPostcard'}:null;
  }

  function cards(story,day){
    const cards=[];
    for(const [event,when] of [['xmRibbon',story.ribbon],['xmFlowers',story.flowers],['xmConfession',story.answered]]){
      if(when)cards.push({key:'world:'+event,kind:'world_'+event,resident:'xm',day:when,event,
        ...(event==='xmConfession'?{choice:story.answer}:{})});
    }
    const mail=postcard(story,day);
    if(mail)cards.push(mail);
    return cards;
  }
  return {load,next,visits,postcard,cards};
})();

const SnowFishing = (() => {
  const opens=7*60, closes=11*60, supperTime=18*60, raceLimit=18;
  const outcomes=['won','lost','tie'];
  function load(saved,day=1){
    const date=value=>Number.isInteger(value)&&value>0&&value<=day?value:0;
    const time=value=>Number.isFinite(value)&&value>0&&value<=raceLimit?value:null;
    const stats=saved?.stats;
    const count=value=>Number.isSafeInteger(value)&&value>=0?value:0;
    const last=stats?.last;
    const lastDay=date(last?.day), rival=time(last?.rival);
    const dinner=date(saved?.dinner);
    return {checked:date(saved?.checked),invited:date(saved?.invited),misses:Math.min(2,count(saved?.misses)),
      ready:date(saved?.ready),dinner,stats:{
        won:count(stats?.won),lost:count(stats?.lost),tie:count(stats?.tie),
        best:time(stats?.best),rivalBest:time(stats?.rivalBest),
        last:lastDay&&rival!==null&&outcomes.includes(last?.outcome)?
          {day:lastDay,player:time(last.player),rival,outcome:last.outcome}:null
      }};
  }
  function morning(event,day,season,minute,roll){
    if(event.invited||event.checked===day||season!=='winter'||minute<opens||minute>=closes)return false;
    event.checked=day;
    if(roll>=.4&&event.misses<2){event.misses++;return false;}
    event.invited=day;
    event.misses=0;
    return true;
  }
  const start=(mode,roll)=>({mode,elapsed:0,player:null,rival:5.5+roll*4.5,kind:null});
  const time=value=>Math.round(value*10)/10;
  function raceReady(round){
    return round.elapsed>=round.rival&&(round.player!==null||round.elapsed>=raceLimit);
  }
  function record(event,day,round){
    const player=round.player===null?null:time(round.player),rival=time(round.rival);
    const outcome=player===null||player>rival?'lost':player<rival?'won':'tie';
    const stats=event.stats;
    stats[outcome]++;
    if(player!==null)stats.best=Math.min(stats.best??player,player);
    stats.rivalBest=Math.min(stats.rivalBest??rival,rival);
    return stats.last={day,player,rival,outcome};
  }
  function cards(event){
    const cards=[];
    if(event.stats.last)cards.push({key:'world:snowRace',kind:'world_snowRace',event:'snowRace',resident:'xy',day:event.stats.last.day});
    if(event.dinner)cards.push({key:'world:snowDinner',kind:'world_snowDinner',event:'snowDinner',resident:'xy',day:event.dinner});
    return cards;
  }
  return {load,morning,start,raceReady,record,cards,opens,closes,supperTime,raceLimit};
})();
