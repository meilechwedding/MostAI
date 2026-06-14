/* ============================================================
   MostAI — Background engine (v2, premium)
   ------------------------------------------------------------
   A self-contained, brand-coloured living background that sits
   behind the whole site (fixed <canvas>, z-index 0).

   Vanilla canvas 2D — robust everywhere (preview / PDF / export).

   FIVE curated "looks" (each is a complete, tuned aesthetic):
     · mesh   — Liquid Mesh : slow soft gradient blobs (the premium default)
     · aurora — Aurora      : flowing ribbons of light
     · stars  — Deep Space  : drifting starfield over a faint nebula
     · grid   — Blueprint    : the brand grid with a travelling azure glow
     · silk   — Silk         : ultra-minimal two-tone drift, very calm

   Each look reacts to scroll (hue migrates) + cursor (a soft light-well).

   API:  const bg = MostaiBG.mount(opts)
         bg.set({ look, accent, intensity, motion })
         bg.destroy()
   ============================================================ */
(function () {
  "use strict";

  /* Accent families — ordered stops the colour walks through.
     bg = the near-black base the look paints onto. */
  const ACCENTS = {
    azure: { bg: [7, 11, 18],  stops: [[10,132,255],[64,142,255],[95,176,255],[124,155,255]] },
    indigo:{ bg: [9, 10, 22],  stops: [[61,90,254],[91,123,255],[124,155,255],[148,120,255]] },
    cyan:  { bg: [5, 13, 19],  stops: [[34,211,238],[20,170,220],[10,132,255],[95,176,255]] },
    violet:{ bg: [12, 9, 22],  stops: [[148,120,255],[124,120,255],[120,90,240],[95,176,255]] },
  };

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rgba = (c, a) => "rgba(" + (c[0]|0) + "," + (c[1]|0) + "," + (c[2]|0) + "," + a + ")";
  const mix = (a, b, t) => [lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t)];
  function ramp(stops, p) {
    const n = stops.length, x = clamp(p, 0, 0.9999) * (n - 1), i = Math.floor(x);
    return mix(stops[i], stops[Math.min(i+1, n-1)], x - i);
  }

  function mount(opts) {
    opts = opts || {};
    const state = {
      look: opts.look || "mesh",
      accent: opts.accent || "azure",
      intensity: opts.intensity != null ? opts.intensity : 1,
      motion: opts.motion != null ? opts.motion : 1,
      paused: false,
    };

    const canvas = document.createElement("canvas");
    canvas.className = "site-bg";
    Object.assign(canvas.style, {
      position: "fixed", inset: "0", width: "100%", height: "100%",
      zIndex: "0", pointerEvents: "none", display: "block",
    });
    document.body.insertBefore(canvas, document.body.firstChild);
    const ctx = canvas.getContext("2d");

    let W = 0, H = 0, DPR = 1;
    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 1.5);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(W * DPR));
      canvas.height = Math.max(1, Math.round(H * DPR));
      buildStars();
    }

    const target = { scroll: 0, mx: 0.5, my: 0.35, hasInput: false };
    const cur = { scroll: 0, mx: 0.5, my: 0.35 };
    function onScroll() {
      const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      target.scroll = clamp(window.scrollY / max, 0, 1);
    }
    function onMove(e) {
      const t = e.touches ? e.touches[0] : e;
      target.mx = t.clientX / window.innerWidth;
      target.my = t.clientY / window.innerHeight;
      target.hasInput = true;
    }

    /* ---- Mesh blobs (also reused for the stars nebula tint) ---- */
    const blobs = [];
    for (let i = 0; i < 6; i++) {
      blobs.push({
        bx: 0.15 + Math.random() * 0.7, by: 0.1 + Math.random() * 0.8,
        ax: 0.14 + Math.random() * 0.16, ay: 0.12 + Math.random() * 0.16,
        sx: 0.018 + Math.random() * 0.045, sy: 0.016 + Math.random() * 0.04,
        px: Math.random() * 6.28, py: Math.random() * 6.28,
        rad: 0.42 + Math.random() * 0.26, cz: Math.random(),
        par: 0.4 + Math.random() * 0.9,
      });
    }

    /* ---- Stars ---- */
    let stars = [];
    function buildStars() {
      if (state.look !== "stars") { stars = []; return; }
      const area = (W * H) / 8200;
      const count = Math.round(clamp(area, 140, 1200));
      stars = new Array(count);
      for (let i = 0; i < count; i++) {
        const depth = Math.random();
        stars[i] = {
          x: Math.random(), y: Math.random(), z: depth,
          r: lerp(0.4, 1.9, depth * depth) * DPR,
          tw: Math.random() * 6.28, tws: lerp(0.4, 2.0, Math.random()),
          cz: Math.random(),
        };
      }
    }

    let t0 = performance.now(), raf = null;
    function frame(now) { raf = requestAnimationFrame(frame); if (!state.paused) draw(now); }

    function draw(now) {
      t0 = now;
      const tm = now / 1000 * (0.55 * state.motion);
      const elapsed = now / 1000;
      cur.scroll += (target.scroll - cur.scroll) * 0.05;

      /* Autonomous drift when no mouse input */
      const driftX = 0.5 + Math.sin(elapsed * 0.12) * 0.22 + Math.sin(elapsed * 0.07 + 1.8) * 0.12;
      const driftY = 0.35 + Math.cos(elapsed * 0.09) * 0.18 + Math.cos(elapsed * 0.14 + 2.5) * 0.08;
      const mx = target.hasInput ? target.mx : driftX;
      const my = target.hasInput ? target.my : driftY;
      cur.mx += (mx - cur.mx) * 0.05;
      cur.my += (my - cur.my) * 0.05;

      const pal = ACCENTS[state.accent] || ACCENTS.azure;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      // base wash — a faint vertical lift keeps it from feeling flat
      const baseGrad = ctx.createLinearGradient(0, 0, 0, H);
      const b = pal.bg;
      baseGrad.addColorStop(0, rgba([b[0]+6, b[1]+8, b[2]+12], 1));
      baseGrad.addColorStop(1, rgba(b, 1));
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, W, H);

      if (state.look === "stars") renderStars(tm, pal);
      else if (state.look === "aurora") renderAurora(tm, pal);
      else if (state.look === "grid") renderGrid(tm, pal);
      else if (state.look === "silk") renderSilk(tm, pal);
      else renderMesh(tm, pal);

      // cursor light-well (shared, gentle)
      const cc = ramp(pal.stops, (cur.scroll + 0.2) % 1);
      const gx = cur.mx * W, gy = cur.my * H, rad = Math.max(W, H) * 0.42;
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad);
      g.addColorStop(0, rgba(cc, 0.10 * state.intensity));
      g.addColorStop(1, rgba(cc, 0));
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // soft vignette for depth (lighter than v1 so colour stays vivid)
      ctx.globalCompositeOperation = "source-over";
      const vg = ctx.createRadialGradient(W/2, H*0.4, H*0.25, W/2, H*0.55, Math.max(W,H)*0.82);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    }

    function renderMesh(tm, pal) {
      ctx.globalCompositeOperation = "screen";
      const I = state.intensity;
      for (let i = 0; i < blobs.length; i++) {
        const bl = blobs[i];
        const x = (bl.bx + Math.sin(tm * bl.sx * 6 + bl.px) * bl.ax) * W
          + (cur.mx - 0.5) * 70 * bl.par;
        const y = (bl.by + Math.cos(tm * bl.sy * 6 + bl.py) * bl.ay) * H
          + (cur.my - 0.5) * 70 * bl.par - cur.scroll * H * 0.22 * bl.par;
        const cpos = (bl.cz + cur.scroll * 0.7 + tm * 0.006) % 1;
        const col = ramp(pal.stops, cpos);
        const r = bl.rad * Math.max(W, H) * (0.85 + Math.sin(tm * 0.18 + i) * 0.1);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rgba(col, 0.5 * I));
        g.addColorStop(0.45, rgba(col, 0.16 * I));
        g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      grain(0.022 * I);
    }

    function renderSilk(tm, pal) {
      ctx.globalCompositeOperation = "screen";
      const I = state.intensity;
      // two big, slow, overlapping washes — very calm
      const pts = [
        { cz: 0.05, ph: 0, sp: 0.5 },
        { cz: 0.55, ph: 3.1, sp: 0.36 },
      ];
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const x = (0.5 + Math.sin(tm * p.sp * 0.5 + p.ph) * 0.28) * W + (cur.mx - 0.5) * 50;
        const y = (0.42 + Math.cos(tm * p.sp * 0.4 + p.ph) * 0.22) * H - cur.scroll * H * 0.18;
        const col = ramp(pal.stops, (p.cz + cur.scroll * 0.5) % 1);
        const r = Math.max(W, H) * 0.95;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rgba(col, 0.4 * I));
        g.addColorStop(0.5, rgba(col, 0.12 * I));
        g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      grain(0.02 * I);
    }

    function renderAurora(tm, pal) {
      ctx.globalCompositeOperation = "screen";
      const I = state.intensity, ribbons = 5;
      for (let r = 0; r < ribbons; r++) {
        const cpos = (r / ribbons + cur.scroll * 0.6 + tm * 0.01) % 1;
        const col = ramp(pal.stops, cpos);
        const baseX = (r + 0.5) / ribbons;
        const steps = 28, pts = [];
        for (let s = 0; s <= steps; s++) {
          const v = s / steps;
          const sway = Math.sin(tm * 0.6 + v * 5 + r * 2.1) * 0.075
            + Math.sin(tm * 0.28 + v * 9 + r) * 0.035
            + (cur.mx - 0.5) * 0.1;
          pts.push([(baseX + sway) * W, v * H]);
        }
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, rgba(col, 0));
        grad.addColorStop(0.35, rgba(col, 0.55 * I));
        grad.addColorStop(0.62, rgba(col, 0.34 * I));
        grad.addColorStop(1, rgba(col, 0));
        ctx.strokeStyle = grad;
        ctx.lineWidth = (W / ribbons) * (0.55 + Math.sin(tm * 0.32 + r) * 0.18);
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.filter = "blur(" + Math.round(Math.max(W, H) * 0.014) + "px)";
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let s = 1; s < pts.length; s++) ctx.lineTo(pts[s][0], pts[s][1]);
        ctx.stroke(); ctx.filter = "none";
      }
      grain(0.022 * I);
    }

    function renderStars(tm, pal) {
      ctx.globalCompositeOperation = "screen";
      const I = state.intensity;
      const tint = ramp(pal.stops, cur.scroll % 1);
      const tg = ctx.createRadialGradient(
        W * (0.5 + (cur.mx - 0.5) * 0.3), H * (0.32 - cur.scroll * 0.1), 0,
        W * 0.5, H * 0.5, Math.max(W, H) * 0.85);
      tg.addColorStop(0, rgba(tint, 0.2 * I));
      tg.addColorStop(1, rgba(tint, 0));
      ctx.fillStyle = tg; ctx.fillRect(0, 0, W, H);

      const drift = tm * 0.006;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const par = 0.4 + s.z * 1.6;
        const x = (s.x + (cur.mx - 0.5) * 0.04 * par) * W;
        const y = ((s.y + drift * par - cur.scroll * 0.22 * par) % 1 + 1) % 1 * H;
        const tw = 0.55 + 0.45 * Math.sin(tm * s.tws + s.tw);
        const a = clamp((0.3 + s.z * 0.7) * tw * I, 0, 1);
        const col = mix([232, 240, 255], ramp(pal.stops, s.cz), 0.5);
        ctx.fillStyle = rgba(col, a);
        ctx.fillRect(x, y, s.r, s.r);
        if (s.z > 0.84) {
          const g = ctx.createRadialGradient(x, y, 0, x, y, s.r * 6);
          g.addColorStop(0, rgba(col, a * 0.5)); g.addColorStop(1, rgba(col, 0));
          ctx.fillStyle = g; ctx.fillRect(x - s.r*6, y - s.r*6, s.r*12, s.r*12);
        }
      }
    }

    function renderGrid(tm, pal) {
      const I = state.intensity;
      // travelling azure glow first (under the grid)
      ctx.globalCompositeOperation = "screen";
      const gx = (0.5 + Math.sin(tm * 0.3) * 0.32) * W + (cur.mx - 0.5) * 60;
      const gy = (0.4 + Math.cos(tm * 0.24) * 0.24) * H - cur.scroll * H * 0.15;
      const col = ramp(pal.stops, (cur.scroll * 0.7 + 0.1) % 1);
      const r = Math.max(W, H) * 0.7;
      const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
      gg.addColorStop(0, rgba(col, 0.34 * I));
      gg.addColorStop(0.5, rgba(col, 0.1 * I));
      gg.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
      // a second, smaller, lagging glow
      const gx2 = (0.5 + Math.sin(tm * 0.3 + 2.4) * 0.3) * W;
      const gy2 = (0.5 + Math.cos(tm * 0.2 + 1.2) * 0.26) * H;
      const col2 = ramp(pal.stops, (cur.scroll * 0.7 + 0.5) % 1);
      const gg2 = ctx.createRadialGradient(gx2, gy2, 0, gx2, gy2, r * 0.7);
      gg2.addColorStop(0, rgba(col2, 0.22 * I));
      gg2.addColorStop(1, rgba(col2, 0));
      ctx.fillStyle = gg2; ctx.fillRect(0, 0, W, H);

      // blueprint grid lines (subtle, on top)
      ctx.globalCompositeOperation = "screen";
      const cell = 64;
      const ox = (- (tm * 6) % cell + cell) % cell;
      const oy = (- (cur.scroll * H * 0.3) % cell + cell) % cell;
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(ramp(pal.stops, 0.2), 0.05 + 0.03 * I);
      ctx.beginPath();
      for (let x = ox; x < W; x += cell) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let y = oy; y < H; y += cell) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
      grain(0.018 * I);
    }

    /* cheap film grain to break banding */
    let grainCanvas = null;
    function grain(amount) {
      if (amount <= 0) return;
      if (!grainCanvas) {
        grainCanvas = document.createElement("canvas");
        grainCanvas.width = grainCanvas.height = 90;
        const g = grainCanvas.getContext("2d");
        const id = g.createImageData(90, 90);
        for (let i = 0; i < id.data.length; i += 4) {
          const v = Math.random() * 255;
          id.data[i] = id.data[i+1] = id.data[i+2] = v; id.data[i+3] = 255;
        }
        g.putImageData(id, 0, 0);
      }
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = amount;
      ctx.fillStyle = ctx.createPattern(grainCanvas, "repeat");
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    resize(); onScroll();
    draw(performance.now());                 // guaranteed first paint
    raf = requestAnimationFrame(frame);

    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { cancelAnimationFrame(raf); state.paused = true; draw(performance.now()); }

    const api = {
      set(patch) {
        const prevLook = state.look;
        Object.assign(state, patch);
        if (state.look !== prevLook) buildStars();
        draw(performance.now());
        return api;
      },
      get: () => Object.assign({}, state),
      pause() { state.paused = true; },
      resume() { if (!reduce) { state.paused = false; t0 = performance.now(); } },
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("touchmove", onMove);
        canvas.remove();
      },
      canvas,
    };
    return api;
  }

  window.MostaiBG = { mount, ACCENTS };
})();
