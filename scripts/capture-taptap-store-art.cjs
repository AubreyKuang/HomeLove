#!/usr/bin/env node
/* TapTap store art rendered by the game itself (no outside images):

     python3 scripts/build-taptap.py
     node scripts/capture-taptap-store-art.cjs        # needs Python Pillow

   docs/taptap/icon-1024.png         1:1 icon: the player and a resident in the cottage
                                     yard, interface hidden; square corners, opaque
   docs/taptap/banner-1920x1080.jpg  16:9 promo image: the yard on a spring morning
                                     under the game's start card, showing only the store
                                     name 「像素小屋·心动日常」 and the English name
                                     「Pixel Cottage」, in the game's own pixel fonts
   docs/taptap/banner-1440x1440.jpg  1:1 promo image, the same scene

   TapTap's machine review rejects promo images that carry any text besides the
   game's names, so the start card's buttons, language picker and lead are hidden. */
const fs=require("node:fs"),path=require("node:path");
const {execFileSync}=require("node:child_process");
const {root,sleep,gameSession}=require("./lib/taptap-chrome.cjs");
const out=path.join(root,"docs/taptap");
const TITLE="像素小屋·心动日常",ENGLISH="Pixel Cottage";
const CHINESE=`Object.defineProperty(navigator,"languages",{get:()=>["zh-CN"]});`;
const NO_UI=`const style=document.createElement("style");
  style.textContent="#hud,#hudR,#pad,#abtn,#prompt,#toast,#villageGuide,#lanternReaction,#fishCancel{visibility:hidden!important}";document.head.append(style);`;

// A spring morning in the yard: Gu Yan and Lin Xiaoman have dropped by.
async function yard(game){
  await game.evaluate(`await document.fonts.ready;`);
  await game.click(`#langPick [data-lang="zh"]`);
  await game.click("#btnStart");await sleep(800);
  await game.evaluate(`state.firstGreetingDismissed=true;state.time=9.5*60;updateHud();`);
  for(let i=0;i<20;i++){await sleep(1000);if(await game.evaluate(`const n=npcs.find(n=>n.id==="gy");return n.state==="here"&&!n.path?.length&&n.y<200`))break;}
  await game.evaluate(`const n=npcs.find(n=>n.id==="gy");Object.assign(P,{x:n.x+20,y:n.y,dir:"left"});walkRoute=[];snapPets();`);
  await game.evaluate(NO_UI);
}
// The start card again, with nothing on it but the two names.
const TITLE_CARD=`const card=document.querySelector("#start .card");
  card.querySelectorAll(":scope>*").forEach(e=>{if(e.tagName!=="H1")e.style.display="none";});
  const h1=card.querySelector("h1");h1.textContent=${JSON.stringify(TITLE)};
  h1.style.cssText="white-space:nowrap;font-size:clamp(40px,7.4vw,72px)";
  // Names along the top, the yard and its residents below them.
  const start=document.getElementById("start");
  start.style.cssText="align-items:flex-start;justify-content:center;padding-top:clamp(28px,6vh,56px);background:linear-gradient(180deg,#251b2ae0,#291e2a99 30%,transparent 58%)";
  card.style.cssText="width:auto;align-items:center;text-align:center;gap:6px";
  const en=document.createElement("p");en.textContent=${JSON.stringify(ENGLISH)};
  en.style.cssText='display:block!important;margin:0;font-family:"Pixelify Sans",sans-serif;font-weight:600;font-size:clamp(26px,4.2vw,48px);letter-spacing:.06em;color:#ffe9b8;text-shadow:0 3px 14px #251824';
  card.append(en);start.classList.remove("hidden");
  await document.fonts.load('48px "Pixelify Sans"',${JSON.stringify(ENGLISH)});await document.fonts.load('84px "ZCOOL KuaiLe"',${JSON.stringify(TITLE)});`;

async function capture(viewport,file,format,prepare){
  const game=await gameSession(viewport,{preload:CHINESE});
  try{
    await game.open();
    await prepare(game);
    await sleep(600);
    const text=await game.evaluate(`return document.body.innerText.replace(/\\s+/g," ").trim()`);
    const allowed=new RegExp(`^(${TITLE}|${ENGLISH}| )*$`);
    if(file.startsWith("banner")&&!allowed.test(text))throw new Error(file+": text other than the game names is on screen: "+text);
    const {data}=await game.send("Page.captureScreenshot",format==="png"?{format}:{format,quality:92});
    fs.writeFileSync(path.join(out,file),Buffer.from(data,"base64"));
    if(game.errors.length)throw new Error("page errors: "+game.errors.join("\n"));
    if(game.external.length)throw new Error("fetched from outside: "+game.external.join(" "));
  }finally{game.close();}
}

async function main(){
  fs.mkdirSync(out,{recursive:true});
  const banner=async game=>{await yard(game);await game.evaluate(TITLE_CARD);};
  await capture({width:960,height:540,deviceScaleFactor:2,mobile:false},"banner-1920x1080.jpg","jpeg",banner);
  await capture({width:720,height:720,deviceScaleFactor:2,mobile:false},"banner-1440x1440.jpg","jpeg",banner);
  // At 3× the game draws each pixel 10 device pixels wide; the icon is the 1024px square
  // around the two characters at the centre of that frame, no scaling.
  await capture({width:960,height:540,deviceScaleFactor:3,mobile:false},"icon-1024.png","png",async game=>{
    await yard(game);
    await game.evaluate(`document.querySelectorAll(".overlay,#start").forEach(e=>e.classList.add("hidden"));const n=npcs.find(n=>n.id==="gy");Object.assign(P,{x:n.x+18,y:n.y,dir:"left"});`);
    await sleep(400);
  });
  // Icons must be opaque and exactly square: drop the alpha channel and centre-crop.
  execFileSync("python3",["-c",`from PIL import Image
import os
p=${JSON.stringify(path.join(out,"icon-1024.png"))}
im=Image.open(p).convert("RGB")
w,h=im.size;x=(w-1024)//2;y=(h-1024)//2-60
im.crop((x,y,x+1024,y+1024)).save(p,optimize=True)
for f in ("icon-1024.png","banner-1920x1080.jpg","banner-1440x1440.jpg"):
    q=${JSON.stringify(out)}+"/"+f;i=Image.open(q)
    print(f,i.size,i.mode,str(os.path.getsize(q)//1024)+"KB")`],{stdio:"inherit"});
}
main().catch(e=>{console.error(e.message);process.exit(1);});
