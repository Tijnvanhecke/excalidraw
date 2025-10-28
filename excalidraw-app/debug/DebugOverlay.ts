// Minimalistische HUD met F1-toggle
type ExcalidrawAPI = { getAppState: () => any; getSceneElements: () => any[] };

export class DebugOverlay {
  private api: ExcalidrawAPI; private el: HTMLDivElement; private on = false;
  private last = 0; private fps = 0; private ema = 0; private raf = 0; private ui?: number;

  constructor(api: ExcalidrawAPI){ this.api = api; this.el = document.createElement("div");
    this.el.id="debug-overlay"; this.el.style.cssText=[
      "position:fixed;right:8px;top:8px;z-index:99999;padding:8px 10px",
      "border-radius:8px;background:rgba(0,0,0,.6);color:#eee",
      "font:12px/1.35 ui-monospace,Menlo,Consolas,monospace",
      "pointer-events:none;white-space:pre;max-width:260px"
    ].join(";"); this.on = localStorage.getItem("dbg_overlay_enabled")==="1";
    window.addEventListener("keydown", this.key, {passive:true});
    this.loop(); this.tickUI();
  }
  private key = (e: KeyboardEvent)=>{ if(e.key!=="F1") return; e.preventDefault();
    this.on=!this.on; localStorage.setItem("dbg_overlay_enabled", this.on?"1":"0");
    if(this.on && !this.el.isConnected) document.body.appendChild(this.el);
    if(!this.on && this.el.isConnected) this.el.remove();
  };
  private loop = (t=0)=>{ if(this.last){ const dt=(t-this.last)/1000; const f=dt>0?1/dt:0;
      this.fps=f; this.ema=this.ema?0.16*f+0.84*this.ema:f; } this.last=t;
    this.raf=requestAnimationFrame(this.loop);
  };
  private tickUI(){ if(this.ui) clearInterval(this.ui);
    this.ui = window.setInterval(()=>{ if(!this.on) return;
      const els=this.api.getSceneElements?.() ?? []; const app=this.api.getAppState?.() ?? {};
      const user=els.filter(e=>e?.type==="freedraw" && !e?.data?.ai).length;
      const ai=els.filter(e=>e?.data?.ai).length;
      const dpr=window.devicePixelRatio||1; const cvs=document.querySelector("canvas") as HTMLCanvasElement|null;
      const r=cvs?.getBoundingClientRect(); const w=Math.round(r?.width||window.innerWidth);
      const h=Math.round(r?.height||window.innerHeight);
      const mem=(performance as any).memory; const memStr=mem?`${Math.round(mem.usedJSHeapSize/1048576)} / ${Math.round(mem.totalJSHeapSize/1048576)} MB`:"n/a";
      this.el.textContent =
`DEBUG — F1 toggle
fps: ${this.fps.toFixed(0)} (avg ${this.ema.toFixed(0)})
strokes: user ${user} | ai ${ai}
tool: ${app?.activeTool?.type ?? "unknown"}
canvas: ${w}×${h} @ DPR ${dpr}
mem: ${memStr}`;
      if(!this.el.isConnected) document.body.appendChild(this.el);
    }, 200);
  }
  destroy(){ window.removeEventListener("keydown", this.key);
    cancelAnimationFrame(this.raf); if(this.ui) clearInterval(this.ui); this.el.remove();
  }
}
