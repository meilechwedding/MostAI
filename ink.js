/* ============================================================
   MostAI — Living suminagashi ink background (site-wide)
   ------------------------------------------------------------
   A single fixed full-viewport WebGL feedback simulation that sits
   behind the whole site (z-index 0). Ink trails follow the cursor,
   bloom and swirl on a curl-noise field, and slowly dissipate.
   The faster / longer a stroke, the further its colour walks through
   the palette  blue -> azure -> light blue -> violet  — so big lines
   bleed several colours. Idle => gentle ambient drift.

   Replaces the old particle / mesh background. Exposes:
     window.MostaiInk.set({ intensity, turbulence, tint })
     window.MostaiBG.mount() -> compat shim for site.js
   Falls back to the CSS dark-blue body wash if WebGL is unavailable
   or reduced-motion is requested.
   ============================================================ */
(function () {
  "use strict";

  /* ---- tunable state (overridable via tweaks / localStorage) ---- */
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem("mostai.tweaks") || "{}"); } catch (e) {}

  /* dark-blue bases — index by `tint` */
  var TINTS = {
    navy:   [0.043, 0.071, 0.149],   // #0B1326  (default — dark blue)
    midnight:[0.027, 0.043, 0.094],  // #070B18  (deepest)
    slate:  [0.063, 0.094, 0.176],   // #10182D  (a touch lighter)
    indigo: [0.067, 0.063, 0.165],   // #11102A  (blue-violet)
  };

  var state = {
    intensity: saved.inkIntensity != null ? saved.inkIntensity : 1.8,
    turbulence: saved.inkTurbulence != null ? saved.inkTurbulence : 0.75,
    tint: saved.inkTint || "slate",
    paused: false,
  };

  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* fixed full-viewport canvas behind everything */
  var canvas = document.createElement("canvas");
  canvas.className = "site-bg ink-bg";
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block;";
  function mountCanvas() {
    var old = document.querySelector("canvas.site-bg");
    if (old && old !== canvas) old.remove();
    document.body.insertBefore(canvas, document.body.firstChild);
  }
  if (document.body) mountCanvas();
  else document.addEventListener("DOMContentLoaded", mountCanvas);

  /* expose API early (no-op until/if WebGL fails) */
  function publish(api) {
    window.MostaiInk = api;
    window.MostaiBG = {
      mount: function () {
        return {
          set: function (o) { api.set(o); },
          get: function () { return api.get(); },
          pause: api.pause, resume: api.resume, destroy: function () {},
        };
      },
      ACCENTS: {},
    };
  }

  var noop = {
    set: function (o) { Object.assign(state, normalize(o)); },
    get: function () { return Object.assign({}, state); },
    pause: function () {}, resume: function () {},
  };

  function normalize(o) {
    var out = {};
    if (o == null) return out;
    if (o.intensity != null) out.intensity = +o.intensity;
    if (o.inkIntensity != null) out.intensity = +o.inkIntensity;
    if (o.turbulence != null) out.turbulence = +o.turbulence;
    if (o.inkTurbulence != null) out.turbulence = +o.inkTurbulence;
    if (o.tint) out.tint = o.tint;
    if (o.inkTint) out.tint = o.inkTint;
    return out;
  }

  if (reduce) { publish(noop); return; }

  var gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false })
        || canvas.getContext("experimental-webgl");
  if (!gl) { publish(noop); return; }

  var isMobile = matchMedia("(max-width: 720px)").matches;

  /* ---- shaders ---- */
  var VERT =
    "attribute vec2 p; varying vec2 vUv;" +
    "void main(){ vUv = p*0.5+0.5; gl_Position = vec4(p,0.0,1.0); }";

  var UPDATE =
    "precision highp float; varying vec2 vUv;" +
    "uniform sampler2D uPrev; uniform float uTime; uniform float uDecay;" +
    "uniform vec2 uPointer; uniform float uSplat; uniform vec3 uColor; uniform float uAspect;" +
    "uniform float uTurb; uniform float uInt; uniform float uRectN; uniform vec4 uRects[8];" +
    "vec2 hash2(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return -1.0+2.0*fract(sin(p)*43758.5453); }" +
    "float noise(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.0-2.0*f);" +
    "return mix(mix(dot(hash2(i+vec2(0.0,0.0)),f-vec2(0.0,0.0)),dot(hash2(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x)," +
    "mix(dot(hash2(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(hash2(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y); }" +
    /* richer potential field — three octaves for more visible turbulence */
    "float pot(vec2 p){ return noise(p*3.0+vec2(0.0,uTime*0.05))" +
    " + 0.5*noise(p*6.0-vec2(uTime*0.04,0.0))" +
    " + 0.25*noise(p*12.0+vec2(uTime*0.03,uTime*0.02)); }" +
    "vec2 curl(vec2 p){ float e=0.0022; return vec2(pot(p+vec2(0.0,e))-pot(p-vec2(0.0,e)), -(pot(p+vec2(e,0.0))-pot(p-vec2(e,0.0))))/(2.0*e); }" +
    "void main(){ vec2 uv=vUv;" +
    /* ---- text-avoidance: ink fades fast + injects little inside text rects, and slides away ---- */
    "float avoid=0.0; vec2 away=vec2(0.0);" +
    "for(int i=0;i<8;i++){ if(float(i)>=uRectN) break; vec4 r=uRects[i]; vec2 dd=uv-r.xy; vec2 q=abs(dd)-r.zw;" +
    "float sd=length(max(q,0.0))+min(max(q.x,q.y),0.0); float m=1.0-smoothstep(0.0,0.06,sd);" +
    "if(m>avoid) avoid=m; away+=normalize(dd+vec2(0.0001))*m; }" +
    "vec2 v=curl(uv)*(0.00085*uTurb);" +
    "v+=normalize(away+vec2(0.00001))*avoid*(0.0020*uTurb);" +              /* gentle slide off the text */
    "vec3 prev=texture2D(uPrev, uv - v).rgb; prev*=mix(uDecay, uDecay*0.86, avoid);" + /* fade faster over text */
    "vec2 d=(uv-uPointer); d.x*=uAspect; float blob=exp(-dot(d,d)/0.0021)*uSplat*(1.0-0.96*avoid);" + /* inject little on text */
    "vec3 col=prev + uColor*blob*uInt;" +
    "gl_FragColor=vec4(min(col,vec3(1.5)),1.0); }";

  var SHOW =
    "precision highp float; varying vec2 vUv;" +
    "uniform sampler2D uDye; uniform vec3 uBg;" +
    "void main(){ vec3 dye=texture2D(uDye,vUv).rgb; vec3 col=uBg+dye;" +
    "vec2 q=vUv-0.5; float vig=smoothstep(1.05,0.2,length(q)); col*=mix(0.82,1.0,vig);" +
    "gl_FragColor=vec4(col,1.0); }";

  function compile(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn("ink shader:", gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  function program(vsrc, fsrc) {
    var p = gl.createProgram();
    var vs = compile(gl.VERTEX_SHADER, vsrc), fs = compile(gl.FRAGMENT_SHADER, fsrc);
    if (!vs || !fs) return null;
    gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn("ink link:", gl.getProgramInfoLog(p)); return null; }
    return p;
  }

  var updateP = program(VERT, UPDATE);
  var showP = program(VERT, SHOW);
  if (!updateP || !showP) { publish(noop); return; }

  /* fullscreen triangle */
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  function bindAttrib(p) {
    var loc = gl.getAttribLocation(p, "p");
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }

  /* ping-pong dye targets */
  var SIM = isMobile ? 300 : 460;       // sim height; width scaled by aspect
  var simW = SIM, simH = SIM;
  function makeFBO(w, h) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex: tex, fbo: fbo, w: w, h: h };
  }
  var a, b;
  function allocSim() { a = makeFBO(simW, simH); b = makeFBO(simW, simH); }

  function vw() { return window.innerWidth; }
  function vh() { return window.innerHeight; }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    canvas.width = Math.max(2, Math.floor(vw() * dpr));
    canvas.height = Math.max(2, Math.floor(vh() * dpr));
    var aspect = vw() / Math.max(1, vh());
    simW = Math.round(SIM * Math.max(aspect, 0.4)); simH = SIM;
    allocSim();
  }

  /* ---- brand ink palette : walk by stroke energy (blue -> violet) ---- */
  var PALETTE = [
    [0.10, 0.28, 0.90],   // deep blue   #1A47E6
    [0.18, 0.50, 1.00],   // azure       #2E80FF
    [0.45, 0.74, 1.00],   // light blue  #73BCFF
    [0.58, 0.45, 0.99],   // violet      #9473FD
    [0.20, 0.40, 0.98],   // back toward blue (loop)
  ];
  function rampCol(p) {
    p = p - Math.floor(p);                 // wrap 0..1
    var n = PALETTE.length, x = p * (n - 1), i = Math.floor(x), f = x - i;
    var c0 = PALETTE[i], c1 = PALETTE[Math.min(i + 1, n - 1)];
    return [c0[0] + (c1[0] - c0[0]) * f, c0[1] + (c1[1] - c0[1]) * f, c0[2] + (c1[2] - c0[2]) * f];
  }

  var aspectU = vw() / Math.max(1, vh());
  var pointer = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, color: PALETTE[0], strength: 0 };
  var lastMove = -9999;
  var colorPhase = 0;     // advanced by stroke speed → long fast lines sweep colours

  function setPointerFromEvent(clientX, clientY) {
    var nx = clientX / Math.max(1, vw());
    var ny = 1.0 - clientY / Math.max(1, vh());
    pointer.px = pointer.x; pointer.py = pointer.y;
    pointer.x = nx; pointer.y = ny;
    var dx = pointer.x - pointer.px, dy = pointer.y - pointer.py;
    var speed = Math.sqrt(dx * dx + dy * dy);
    /* faster + longer strokes push colour further along the palette */
    colorPhase += speed * 3.2 + 0.0025;
    pointer.color = rampCol(colorPhase);
    pointer.strength = Math.min(0.5, 0.08 + speed * 9.0);
    lastMove = performance.now();
  }
  window.addEventListener("pointermove", function (e) { setPointerFromEvent(e.clientX, e.clientY); }, { passive: true });
  window.addEventListener("touchmove", function (e) {
    var t = e.touches && e.touches[0]; if (t) setPointerFromEvent(t.clientX, t.clientY);
  }, { passive: true });
  window.addEventListener("pointerdown", function (e) {
    colorPhase += 0.18; setPointerFromEvent(e.clientX, e.clientY); pointer.strength = 0.5;
  }, { passive: true });

  /* idle ambient virtual pointer — slow wander, colour drifts gently */
  var t0 = performance.now();
  function ambient(now) {
    var s = (now - t0) / 1000;
    pointer.px = pointer.x; pointer.py = pointer.y;
    pointer.x = 0.5 + 0.34 * Math.sin(s * 0.24) + 0.13 * Math.sin(s * 0.57);
    pointer.y = 0.5 + 0.27 * Math.cos(s * 0.19) + 0.10 * Math.cos(s * 0.49);
    pointer.strength = 0.085;
    pointer.color = rampCol(s * 0.03);
  }

  resize();
  window.addEventListener("resize", resize);

  /* ---- text-avoidance: feed the live on-screen text rectangles into the sim ---- */
  var AVOID_SEL = ".hero .eyebrow, .hero h1, .hero .hero__sub, .hero .hero__meta, .phead .eyebrow, .phead h1, .phead p, .ink h2, .ink p, .tools__label";
  var rectBuf = new Float32Array(32);   // up to 8 rects × vec4(cx, cy, halfW, halfH) in 0..1, y bottom-up
  var rectCount = 0;
  function updateAvoid() {
    var els = document.querySelectorAll(AVOID_SEL);
    var W = vw(), H = vh(), n = 0;
    for (var i = 0; i < els.length && n < 8; i++) {
      var r = els[i].getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (r.bottom < -40 || r.top > H + 40) continue;   // skip offscreen text
      rectBuf[n*4]   = (r.left + r.width * 0.5) / W;
      rectBuf[n*4+1] = 1.0 - (r.top + r.height * 0.5) / H;
      rectBuf[n*4+2] = (r.width * 0.5) / W + 0.016;      // small padding so ink stays clear of edges
      rectBuf[n*4+3] = (r.height * 0.5) / H + 0.028;
      n++;
    }
    for (var j = n*4; j < 32; j++) rectBuf[j] = 0;
    rectCount = n;
  }

  /* uniforms */
  var u = {
    prev: gl.getUniformLocation(updateP, "uPrev"),
    time: gl.getUniformLocation(updateP, "uTime"),
    decay: gl.getUniformLocation(updateP, "uDecay"),
    pointer: gl.getUniformLocation(updateP, "uPointer"),
    splat: gl.getUniformLocation(updateP, "uSplat"),
    color: gl.getUniformLocation(updateP, "uColor"),
    aspect: gl.getUniformLocation(updateP, "uAspect"),
    turb: gl.getUniformLocation(updateP, "uTurb"),
    intensity: gl.getUniformLocation(updateP, "uInt"),
    rectN: gl.getUniformLocation(updateP, "uRectN"),
    rects: gl.getUniformLocation(updateP, "uRects[0]"),
    dye: gl.getUniformLocation(showP, "uDye"),
    bg: gl.getUniformLocation(showP, "uBg"),
  };

  document.addEventListener("visibilitychange", function () {
    state.paused = document.hidden;
  });

  function bgColor() { return TINTS[state.tint] || TINTS.navy; }

  function frame(now) {
    requestAnimationFrame(frame);
    if (state.paused) { pointer.px = pointer.x; pointer.py = pointer.y; return; }

    var idle = (now - lastMove) > 1500;
    if (idle) ambient(now);
    else { pointer.px = pointer.x; pointer.py = pointer.y; }

    /* update pass -> b */
    gl.useProgram(updateP);
    bindAttrib(updateP);
    gl.bindFramebuffer(gl.FRAMEBUFFER, b.fbo);
    gl.viewport(0, 0, b.w, b.h);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, a.tex);
    gl.uniform1i(u.prev, 0);
    gl.uniform1f(u.time, now / 1000);
    gl.uniform1f(u.decay, 0.987);
    gl.uniform2f(u.pointer, pointer.x, pointer.y);
    gl.uniform1f(u.splat, pointer.strength);
    var ic = pointer.color || PALETTE[0];
    gl.uniform3f(u.color, ic[0], ic[1], ic[2]);
    gl.uniform1f(u.aspect, aspectU);
    gl.uniform1f(u.turb, state.turbulence);
    gl.uniform1f(u.intensity, state.intensity);
    updateAvoid();
    gl.uniform1f(u.rectN, rectCount);
    gl.uniform4fv(u.rects, rectBuf);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    pointer.strength *= 0.86;

    /* show pass -> screen */
    gl.useProgram(showP);
    bindAttrib(showP);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, b.tex);
    gl.uniform1i(u.dye, 0);
    var bg = bgColor();
    gl.uniform3f(u.bg, bg[0], bg[1], bg[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    var tmp = a; a = b; b = tmp; // swap
    aspectU = vw() / Math.max(1, vh());
  }
  requestAnimationFrame(frame);

  publish({
    set: function (o) { Object.assign(state, normalize(o)); },
    get: function () { return Object.assign({}, state); },
    pause: function () { state.paused = true; },
    resume: function () { state.paused = false; },
  });
})();
