#!/usr/bin/env node
/* Plays the built TapTap package in headless Chrome and checks where the save goes,
   that it comes back after a reload, and that the three languages and their pixel
   fonts show with nothing fetched from the network:

     python3 scripts/build-taptap.py && node tests/storage-browser.cjs

   1. a plain browser: localStorage
   2. a TapTap-like host: no IndexedDB, a `tap` object with setStorageSync (1MB per key)
   3. nowhere to save: no IndexedDB, no tap, localStorage throws
   Needs Node 22+ and Chrome. */
const assert=require("node:assert/strict");
const {sleep,gameSession}=require("../scripts/lib/taptap-chrome.cjs");
const VIEWPORT={width:844,height:390,deviceScaleFactor:1,mobile:true};

const TAP_HOST=`Object.defineProperty(window,"indexedDB",{value:undefined,configurable:true});
  const backing=window.localStorage;
  window.tap={getSystemInfoSync:()=>({platform:"android"}),onHide(){},
    getStorageSync:key=>backing.getItem("tap:"+key)??"",
    setStorageSync(key,value){if(new Blob([String(value)]).size>1048576)throw new Error("setStorageSync:fail exceed max size");backing.setItem("tap:"+key,String(value));},
    removeStorageSync:key=>backing.removeItem("tap:"+key)};`;
const NOWHERE=`Object.defineProperty(window,"indexedDB",{value:undefined,configurable:true});
  Object.defineProperty(window,"localStorage",{configurable:true,get(){throw new DOMException("denied","SecurityError");}});`;
const DISPLAY={zh:["ZCOOL KuaiLe","像素小屋"],en:["Pixelify Sans","Pixel Cottage"],ja:["DotGothic16","ピクセル小屋"]};

// Start, walk a little, change outfit in the wardrobe, then let the autosave run.
async function play(game){
  await game.click("#btnStart");await sleep(800);
  for(const key of ["ArrowDown","ArrowRight","ArrowDown"])await game.key(key,key,500);
  await game.key("KeyC","c",60);await sleep(400);
  assert.equal(await game.evaluate(`return dressOpen`),true,"the wardrobe opened");
  for(let i=0;i<3;i++){await game.click("#btnRandom");await sleep(150);}
  await game.click("#dClose");await sleep(5600);
}
const state=game=>game.evaluate(`return {kind:CottageStorage.kind,persistent:CottageStorage.persistent,host:TapTapHost.inHost,
  seen:state.seen,outfit:JSON.stringify(state.o),position:state.position&&[Math.round(state.position.x),Math.round(state.position.y)],
  toast:document.getElementById("toast").textContent,lang:LANG}`);
async function languages(game){
  for(const [code,[family,title]] of Object.entries(DISPLAY)){
    await game.click(`#langPick [data-lang="${code}"]`);await sleep(300);
    const shown=await game.evaluate(`await document.fonts.load('34px "${family}"',${JSON.stringify(title)});await document.fonts.ready;
      const h1=document.querySelector("#start h1");
      return {text:h1.textContent,family:getComputedStyle(h1).fontFamily,loaded:document.fonts.check('34px "${family}"',${JSON.stringify(title)}),
        status:[...document.fonts].find(f=>f.family==="${family}")?.status,lang:document.documentElement.lang}`);
    assert.equal(shown.text,title,code+" title");
    assert.equal(shown.family.split(",")[0].replace(/"/g,""),family,code+" heading uses "+family);
    assert.equal(shown.status,"loaded",family+" loaded from the package");
    console.log(`    ${code}: ${shown.text} in ${family} (${shown.status}), html lang=${shown.lang}`);
  }
}

async function scenario(name,preload,check){
  const game=await gameSession(VIEWPORT,{preload});
  try{
    await game.open();
    await check(game);
    assert.deepEqual(game.errors,[],"no uncaught errors");
    assert.deepEqual(game.external,[],"nothing is fetched from outside the package");
    console.log("ok -",name);
  }finally{game.close();}
}

async function main(){
  await scenario("a plain browser keeps the save in localStorage; three languages and fonts show",``,async game=>{
    await languages(game);
    await game.click(`#langPick [data-lang="zh"]`);
    await play(game);
    const before=await state(game);
    assert.equal(before.kind,"local");assert.equal(before.seen,true);assert.equal(before.toast.includes("无法存档"),false);
    await game.open();
    const after=await state(game);
    assert.equal(after.outfit,before.outfit,"the outfit came back");
    assert.deepEqual(after.position,before.position,"the player stands where they were");
    assert.equal(after.lang,"zh","the language choice came back");
    console.log("   ",JSON.stringify({...after,outfit:undefined}));
  });
  await scenario("a TapTap-like host keeps the save in tap storage",TAP_HOST,async game=>{
    await game.click(`#langPick [data-lang="ja"]`);
    await play(game);
    const before=await state(game);
    assert.equal(before.host,true);assert.equal(before.kind,"tap");
    const keys=await game.evaluate(`return Object.keys(localStorage)`);
    assert.ok(keys.length&&keys.every(k=>k.startsWith("tap:")),"everything went through tap.setStorageSync: "+keys);
    assert.ok(keys.includes("tap:homelove-save-v1"),"the save is in tap storage");
    assert.equal(await game.evaluate(`return document.documentElement.classList.contains("taptap-host")`),true);
    await game.key("KeyJ","j",60);await sleep(400);
    assert.equal(await game.evaluate(`return diaryOpen&&![...document.querySelectorAll("#diaryBody button")].some(b=>b.textContent===tr("saveExport"))`),true,"no download button in the host");
    await game.click("#diaryClose");
    await game.open();
    const after=await state(game);
    assert.equal(after.kind,"tap");assert.equal(after.outfit,before.outfit);assert.deepEqual(after.position,before.position);
    assert.equal(after.lang,"ja");
    await game.click("#btnStart");await sleep(400);
    assert.equal(await game.evaluate(`return startOpen`),false,"play continues after the restart");
    console.log("   ",JSON.stringify({...after,outfit:undefined}));
  });
  await scenario("with nowhere to save, the game still plays and says so once",NOWHERE,async game=>{
    await game.click(`#langPick [data-lang="zh"]`);
    await game.click("#btnStart");await sleep(1900);
    const now=await state(game);
    assert.equal(now.kind,"memory");assert.equal(now.persistent,false);
    assert.equal(now.toast,"当前环境无法存档，本次仍可游玩");
    await sleep(3000);
    await game.evaluate(`document.getElementById("cottageMenu").open=true`);await game.click("#btnHelp");await sleep(200);
    await game.click("#btnStart");await sleep(1900);
    assert.notEqual(await game.evaluate(`return document.getElementById("toast").classList.contains("hidden")?"":document.getElementById("toast").textContent`),"当前环境无法存档，本次仍可游玩","the notice is shown only once");
    await sleep(4000);
    await game.open();
    const again=await state(game);
    assert.equal(again.seen,false,"a reload starts over");
    console.log("   ",JSON.stringify({...now,outfit:undefined}));
  });
}
main().catch(e=>{console.error(e);process.exit(1);});
