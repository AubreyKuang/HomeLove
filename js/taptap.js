"use strict";

/* TapTap H5 host. TapTap injects a global `tap` object; in a normal browser it is
   absent and this file does nothing. Pixel Cottage is a single-player game with no
   server and no account: it never calls tap.login and sends nothing anywhere.
   Inside the host it marks the page (buttons that download a file are left out,
   see canDownload in core.js) and saves when TapTap goes to the background. */
const TapTapHost=(()=>{
  const host=()=>{
    const tap=globalThis.tap;
    return !!tap&&typeof tap==="object"&&["setStorageSync","getSystemInfoSync","onShow","login"].some(name=>typeof tap[name]==="function");
  };
  let marked=false;
  const hidden=[];
  function mark(){
    if(marked||!host())return;
    marked=true;
    globalThis.document?.documentElement?.classList?.add("taptap-host");
    // The WebView is not always told it was hidden; the host's own event is the safe one.
    if(typeof globalThis.tap.onHide==="function"){
      try{globalThis.tap.onHide(()=>hidden.forEach(fn=>{try{fn();}catch{/* the next autosave retries */}}));}catch{/* optional */}
    }
  }
  mark();
  // The host may inject `tap` after the first scripts run.
  globalThis.addEventListener?.("load",mark);
  return {get inHost(){return host();},onHide(fn){hidden.push(fn);}};
})();
