type EventType = "pointer"|"undo"|"redo"|"export"|"ai"|"info"|"warn"|"error";
const styles: Record<EventType,string> = {
  pointer:"color:#4FC3F7", undo:"color:#FFD54F", redo:"color:#AED581",
  export:"color:#BA68C8", ai:"color:#80CBC4", info:"color:#90CAF9",
  warn:"color:#FFB74D", error:"color:#EF5350",
};
export function logEvent(type: EventType, details?: any){
  console.log(`%c[${new Date().toISOString()}] ${type.toUpperCase()}`, styles[type], details??"");
}
export function logError(err: unknown, ctx?: string){
  console.error(`%c[${new Date().toISOString()}] ERROR`, styles.error, ctx??"", err);
}
export function attachGlobalInputLogging(){
  const pd=(e:PointerEvent)=>logEvent("pointer",{type:"down",x:e.clientX,y:e.clientY,btn:e.button});
  const key=(e:KeyboardEvent)=>{ const meta=e.ctrlKey||e.metaKey;
    if(!meta) return; const k=e.key.toLowerCase();
    if(k==="z" && !e.shiftKey) logEvent("undo");
    else if((k==="z"&&e.shiftKey)||k==="y") logEvent("redo");
  };
  window.addEventListener("pointerdown", pd, {passive:true});
  window.addEventListener("keydown", key);
  return ()=>{ window.removeEventListener("pointerdown", pd); window.removeEventListener("keydown", key); };
}
export async function withExportLog<T>(fn:()=>Promise<T>|T, meta?:any){
  logEvent("export",{phase:"start",...(meta??{})}); try{ const r=await fn(); logEvent("export",{phase:"done",...(meta??{})}); return r;
  }catch(e){ logError(e,"export"); throw e; }
}
