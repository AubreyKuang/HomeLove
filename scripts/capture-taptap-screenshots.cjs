#!/usr/bin/env node
/* Landscape store screenshots of the built TapTap package, played in headless
   Chrome with phone touch input and the Chinese interface (DevTools protocol; Node 22+).

     python3 scripts/build-taptap.py
     node scripts/capture-taptap-screenshots.cjs      # docs/taptap/screenshots/*.jpg

   Each shot starts a fresh game, presses 「进入小屋」 and reaches its scene with the
   same shortcuts the test page (dev.html) offers: its panel script is loaded into
   the page and then removed, so only the game's own screen is captured. Toasts the
   shortcuts raise are cleared before the shot; nothing is drawn over the game. */
const fs=require("node:fs"),path=require("node:path");
const {root,sleep,gameSession}=require("./lib/taptap-chrome.cjs");

const out=path.join(root,"docs/taptap/screenshots");
// 960×540 CSS px at 2× → 1920×1080.
const VIEWPORT={width:960,height:540,deviceScaleFactor:2,mobile:true};
const panel=fs.readFileSync(path.join(root,"dev/panel.js"),"utf8");
const CHINESE=`Object.defineProperty(navigator,"languages",{get:()=>["zh-CN"]});Object.defineProperty(navigator,"language",{get:()=>"zh-CN"});`;

// Moves the player onto the given tile, facing a direction.
const stand=(x,y,dir)=>`Object.assign(P,{x:${x}*16+8,y:${y}*16+12,dir:${JSON.stringify(dir)}});walkRoute=[];snapPets();`;
const SHOTS=[
  // [file, what it shows, steps run in the page after the game has started]
  ["01-yard-chat","上午的院子，咖啡师顾言来串门",async game=>{
    await game.evaluate(`state.firstGreetingDismissed=true;Object.assign(rel(npcs.find(n=>n.id==="gy")),{met:true,pts:45});__dev.time(9.5);`);
    // Wait until Gu Yan has walked into the yard, then step up to him.
    for(let i=0;i<20;i++){await sleep(1000);if(await game.evaluate(`const n=npcs.find(n=>n.id==="gy");return n.state==="here"&&!n.path?.length&&n.y<200`))break;}
    await game.evaluate(`const n=npcs.find(n=>n.id==="gy");Object.assign(P,{x:n.x+20,y:n.y,dir:"left"});walkRoute=[];snapPets();`);
    await sleep(1500);
  }],
  ["02-wardrobe","衣柜换装",async game=>{
    await game.evaluate(`__dev.maxAll();state.flowersTotal=40;`);
    await game.key("KeyC","c",60);await sleep(500);
    for(let i=0;i<4;i++){await game.click("#btnRandom");await sleep(120);}
    await sleep(400);
  }],
  ["03-story","居民剧情与对话选项",async game=>{
    await game.evaluate(`__dev.previewStory("jy");`);await sleep(2500);
    for(let i=0;i<8;i++){
      if(await game.evaluate(`return !!document.querySelector("#dialog .choices button")`))break;
      await game.key("KeyE","e",60);await sleep(700);
    }
  }],
  ["04-diary","日记里的关系与攻略笔记",async game=>{
    await game.evaluate(`__dev.maxAll();`);
    await game.key("KeyJ","j",60);await sleep(800);
  }],
  ["05-cafe","和顾言一起经营咖啡店的傍晚",async game=>{
    await game.evaluate(`__dev.previewProject("cafe");`);await sleep(2500);
  }],
  ["06-snow-fishing","第一场雪的冰钓",async game=>{
    await game.evaluate(`__dev.previewSnowFishing();`);await sleep(3000);
  }],
  ["07-lantern-night","停电夜的提灯",async game=>{
    await game.evaluate(`__dev.previewBlackout();`);await sleep(6000);
  }],
  ["08-market","周六集市",async game=>{
    await game.evaluate(`__dev.previewWeekend();`);await sleep(6000);
  }],
];

async function shoot(name,label,prepare){
  const game=await gameSession(VIEWPORT,{preload:CHINESE});
  try{
    await game.open();
    await game.evaluate(`await document.fonts.ready;`);
    await game.click(`#langPick [data-lang="zh"]`);
    await game.click("#btnStart");await sleep(1200);
    await game.evaluate(panel+`;document.querySelectorAll("body>div").forEach(d=>{if(d.textContent.includes("测试面板"))d.remove();});`);
    await prepare(game);
    await game.evaluate(`document.getElementById("toast").classList.add("hidden");document.title=document.title.replace("[DEV] ","");`);
    await sleep(300);
    const check=await game.evaluate(`return {text:document.body.innerText,lang:LANG}`);
    if(check.lang!=="zh"||/测试|🛠|无法存档/.test(check.text))throw new Error(name+": test text or a save warning is on screen");
    const {data}=await game.send("Page.captureScreenshot",{format:"jpeg",quality:92});
    fs.writeFileSync(path.join(out,name+".jpg"),Buffer.from(data,"base64"));
    if(game.errors.length)throw new Error(name+": page errors: "+game.errors.join("\n"));
    if(game.external.length)throw new Error(name+": fetched from outside: "+game.external.join(" "));
    console.log("captured",name,label);
  }finally{game.close();}
}

async function main(){
  fs.mkdirSync(out,{recursive:true});
  const only=process.argv.slice(2);
  for(const [name,label,prepare] of SHOTS)if(!only.length||only.includes(name))await shoot(name,label,prepare);
}
main().catch(e=>{console.error(e.message);process.exit(1);});
