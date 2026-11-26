#!/usr/bin/env node
/* Landscape gameplay video for the TapTap store page, recorded from the built package
   with the Chinese interface.

     python3 scripts/build-taptap.py
     node scripts/record-taptap-video.cjs     # docs/taptap/gameplay-1920x1080.mp4

   TapTap asks for at least 15 s, core play within the first 5 s, and no voice-over,
   subtitles or picture-in-picture. The clip opens in the cottage with the player
   already walking, walks out to the yard, talks
   to Gu Yan and picks a reply, changes outfit in the wardrobe and looks at the diary.
   Every input is a real tap or key press; the text on screen is the game's own.
   Needs ffmpeg with libx264 and Chrome. The video has no audio track. */
const fs=require("node:fs"),path=require("node:path"),os=require("node:os");
const {execFileSync}=require("node:child_process");
const {root,sleep,gameSession}=require("./lib/taptap-chrome.cjs");

// 960×540 CSS px at 2× → 1920×1080.
const VIEWPORT={width:960,height:540,deviceScaleFactor:2,mobile:true};
const output=path.join(root,"docs/taptap/gameplay-1920x1080.mp4");
const CHINESE=`Object.defineProperty(navigator,"languages",{get:()=>["zh-CN"]});`;

async function main(){
  const frames=fs.mkdtempSync(path.join(os.tmpdir(),"homelove-video-"));
  const game=await gameSession(VIEWPORT,{preload:CHINESE}),{send,on}=game;
  const recorded=[];let recording=false;
  on("Page.screencastFrame",({data,metadata,sessionId})=>{
    send("Page.screencastFrameAck",{sessionId}).catch(()=>{});
    if(!recording)return;
    const file=path.join(frames,`f${String(recorded.length).padStart(5,"0")}.jpg`);
    fs.writeFileSync(file,Buffer.from(data,"base64"));recorded.push({file,t:metadata.timestamp});
  });
  // Hold an arrow key, as a player would, until the player reaches a world coordinate.
  const walk=async(axis,target)=>{
    for(let i=0;i<40;i++){
      const at=await game.evaluate(`return P.${axis}`);
      if(Math.abs(at-target)<2)return;
      const code=axis==="x"?(at<target?"ArrowRight":"ArrowLeft"):(at<target?"ArrowDown":"ArrowUp");
      await game.key(code,code,Math.min(400,Math.max(30,Math.abs(at-target)*15)));
    }
  };
  // A tap on the ground beside Gu Yan, the way a player walks on a phone: the game finds the way.
  const tapBesideGuYan=async()=>{
    const at=await game.evaluate(`const n=npcs.find(n=>n.id==="gy"),[cx,cy]=cameraOrigin(),dpr=cv.width/innerWidth;
      const tx=Math.floor(n.x/16),ty=Math.floor(n.y/16);
      const [gx,gy]=[[1,0],[-1,0],[0,1],[1,1],[-1,1]].map(([dx,dy])=>[tx+dx,ty+dy]).find(([x,y])=>npcPassable(x,y,true));
      return {x:(gx*16+8-cx)*scale/dpr,y:(gy*16+10-cy)*scale/dpr}`);
    for(const type of ["mousePressed","mouseReleased"])await send("Input.dispatchMouseEvent",{type,x:at.x,y:at.y,button:"left",clickCount:1});
    for(let i=0;i<40;i++){await sleep(200);if(await game.evaluate(`return !walkRoute.length`))break;}
  };
  const nearGuYan=()=>game.evaluate(`return /顾言/.test(document.getElementById("prompt").textContent)`);
  try{
    await game.open();
    await game.evaluate(`await document.fonts.ready;`);
    await game.click(`#langPick [data-lang="zh"]`);
    // Mid-morning: start the day and wait, unrecorded, until Gu Yan has walked into the yard.
    await game.click("#btnStart");
    await game.evaluate(`state.firstGreetingDismissed=true;state.time=9.5*60;updateHud();`);
    for(let i=0;i<20;i++){await sleep(1000);if(await game.evaluate(`const n=npcs.find(n=>n.id==="gy");return n.state==="here"&&!n.path?.length&&n.y<200`))break;}
    await game.evaluate(`document.getElementById("toast").classList.add("hidden");`);
    await send("Page.startScreencast",{format:"jpeg",quality:92,maxWidth:1920,maxHeight:1080,everyNthFrame:1});
    recording=true;await sleep(300);

    // Across the cottage, out of the door and up to Gu Yan in the yard.
    // Below the table and out through the door on tile (6, 9) with the arrow keys…
    await walk("y",132);await walk("x",104);await walk("y",200);
    // …then a tap beside Gu Yan, again if he has wandered off meanwhile.
    for(let i=0;i<4&&!await nearGuYan();i++)await tapBesideGuYan();
    if(!await nearGuYan())throw new Error("did not reach Gu Yan");
    // Turn to face him.
    const face=await game.evaluate(`const n=npcs.find(n=>n.id==="gy");const dx=n.x-P.x,dy=n.y-P.y;
      return Math.abs(dx)>Math.abs(dy)?(dx<0?"ArrowLeft":"ArrowRight"):(dy<0?"ArrowUp":"ArrowDown")`);
    await game.key(face,face,40);
    await sleep(300);
    await game.key("KeyE","e",60);await sleep(1600);
    if(await game.evaluate(`return document.getElementById("dialog").classList.contains("hidden")`))throw new Error("the talk did not open");
    await game.key("Digit1","1",60);await sleep(1800);
    for(let i=0;i<4&&await game.evaluate(`return !document.getElementById("dialog").classList.contains("hidden")`);i++){
      if(await game.evaluate(`return !!document.querySelector("#dialog .choices button")`)){await game.key("Digit1","1",60);}
      else await game.key("KeyE","e",60);
      await sleep(1700);
    }
    // Pick a new look in the wardrobe.
    await game.key("KeyC","c",60);await sleep(900);
    for(let i=0;i<4;i++){await game.click("#btnRandom");await sleep(700);}
    await game.click("#btnWalk");await sleep(1500);
    await game.click("#dClose");await sleep(1000);
    // A stroll past the garden in the new outfit.
    await game.key("ArrowRight","ArrowRight",1000);
    await game.key("ArrowDown","ArrowDown",700);
    await game.key("ArrowLeft","ArrowLeft",900);
    // The diary: who likes what.
    await game.key("KeyJ","j",60);await sleep(2600);
    await game.click("#diaryClose");await sleep(1200);
    recording=false;await send("Page.stopScreencast");
    if(game.errors.length)throw new Error("page errors: "+game.errors.join("\n"));
    if(game.external.length)throw new Error("fetched from outside: "+game.external.join(" "));
  }finally{game.close();}

  if(recorded.length<100)throw new Error("too few frames recorded: "+recorded.length);
  const list=recorded.map((f,i)=>{
    const next=recorded[i+1]?.t??f.t+1/30;
    return `file '${f.file}'\nduration ${Math.max(next-f.t,1/60).toFixed(4)}`;
  }).join("\n")+`\nfile '${recorded.at(-1).file}'\n`;
  fs.writeFileSync(path.join(frames,"list.txt"),list);
  execFileSync("ffmpeg",["-y","-hide_banner","-loglevel","error","-f","concat","-safe","0","-i",path.join(frames,"list.txt"),
    "-vf","fps=30,scale=1920:1080:flags=neighbor,format=yuv420p","-c:v","libx264","-profile:v","high","-crf","20","-preset","slow",
    "-an","-movflags","+faststart",output],{stdio:"inherit"});
  fs.rmSync(frames,{recursive:true,force:true});
  const seconds=recorded.at(-1).t-recorded[0].t;
  console.log(`${path.relative(root,output)}  ${seconds.toFixed(1)}s  ${(fs.statSync(output).size/1048576).toFixed(1)}MB  ${recorded.length} frames (${(recorded.length/seconds).toFixed(0)} fps captured)`);
}
// Gu Yan wanders the yard on his own; when he slips away before the talk, record again.
(async()=>{
  for(let attempt=1;;attempt++){
    try{await main();return;}
    catch(e){if(attempt>=5||!/did not reach|did not open/.test(e.message)){console.error(e.message);process.exit(1);}console.error(e.message+", recording again");}
  }
})();
