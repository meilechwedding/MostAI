/* ============================================================
   MostAI — Particle starfield background
   ------------------------------------------------------------
   Thousands of tiny particles in brand colors. Cursor-reactive
   (particles push away from mouse). Clean, fast, GPU-rendered.
   Overrides bg-engine.js when Three.js is available.
   ============================================================ */
(function () {
  "use strict";
  if (typeof THREE === "undefined") return;

  var COUNT = 10000;
  var aspect = innerWidth / innerHeight;

  /* ---- Setup ---- */
  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 100);
  camera.position.z = 5;

  var renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x060a14, 1);

  var el = renderer.domElement;
  el.className = "site-bg";
  el.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;";
  var oldBg = document.querySelector("canvas.site-bg");
  if (oldBg) oldBg.remove();
  document.body.insertBefore(el, document.body.firstChild);

  /* ---- Particle data ---- */
  var positions = new Float32Array(COUNT * 3);
  var colors = new Float32Array(COUNT * 3);
  var sizes = new Float32Array(COUNT);
  var randoms = new Float32Array(COUNT);

  var palette = [
    [0.04, 0.52, 1.0],   // #0A84FF azure
    [0.37, 0.85, 0.93],   // #5FD8EE cyan
    [0.49, 0.61, 1.0],    // #7C9BFF violet-blue
    [0.72, 0.84, 1.0],    // light blue
    [0.88, 0.93, 1.0],    // near-white blue
    [1.0, 1.0, 1.0],      // pure white
  ];
  var weights = [0.2, 0.12, 0.1, 0.22, 0.26, 0.1];

  function pickColor() {
    var r = Math.random(), acc = 0;
    for (var i = 0; i < weights.length; i++) {
      acc += weights[i];
      if (r < acc) return palette[i];
    }
    return palette[palette.length - 1];
  }

  for (var i = 0; i < COUNT; i++) {
    var i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 6;
    positions[i3 + 1] = (Math.random() - 0.5) * 4;
    positions[i3 + 2] = -Math.random() * 3;

    var c = pickColor();
    colors[i3] = c[0]; colors[i3 + 1] = c[1]; colors[i3 + 2] = c[2];

    var s = 1.0 + Math.random() * 1.8;
    if (Math.random() > 0.97) s += 2.5 + Math.random() * 3.5;
    sizes[i] = s;
    randoms[i] = Math.random() * 6.28;
  }

  var geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

  /* ---- Shaders ---- */
  var VERT = [
    "attribute float size;",
    "attribute float aRandom;",
    "attribute vec3 color;",
    "varying vec3 vColor;",
    "varying float vAlpha;",
    "uniform vec2 uMouse;",
    "uniform float uTime;",
    "uniform float uScroll;",
    "uniform float uIntensity;",
    "",
    "void main() {",
    "  vColor = color;",
    "  vec3 pos = position;",
    "",
    "  float t = uTime * 0.06;",
    "  pos.x += sin(t * 2.2 + aRandom * 5.0) * 0.018 + sin(t * 0.8 + aRandom * 3.0) * 0.01;",
    "  pos.y += cos(t * 1.8 + aRandom * 4.0) * 0.014 + cos(t * 0.6 + aRandom * 2.0) * 0.008;",
    "",
    "  float depth = 1.0 - position.z * 0.25;",
    "  pos.y -= uScroll * 0.9 * depth;",
    "",
    "  vec2 diff = pos.xy - uMouse;",
    "  float dist = length(diff);",
    "  float push = smoothstep(0.8, 0.0, dist) * 0.22 * uIntensity;",
    "  vec2 dir = dist > 0.001 ? normalize(diff) : vec2(0.0);",
    "  pos.xy += dir * push;",
    "",
    "  float glow = smoothstep(0.7, 0.0, dist);",
    "  vAlpha = (0.45 + glow * 0.55) * uIntensity;",
    "",
    "  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);",
    "  gl_PointSize = max((size + glow * 4.0) * uIntensity, 0.6);",
    "  gl_Position = projectionMatrix * mvPos;",
    "}",
  ].join("\n");

  var FRAG = [
    "varying vec3 vColor;",
    "varying float vAlpha;",
    "void main() {",
    "  float d = length(gl_PointCoord - 0.5);",
    "  if (d > 0.5) discard;",
    "  float alpha = smoothstep(0.5, 0.02, d) * vAlpha;",
    "  gl_FragColor = vec4(vColor, alpha);",
    "}",
  ].join("\n");

  var uniforms = {
    uMouse: { value: new THREE.Vector2(0, 0) },
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uIntensity: { value: 1.0 },
  };

  var mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  scene.add(new THREE.Points(geo, mat));

  /* ---- Input ---- */
  var mouse = { x: 0, y: 0, tx: 0, ty: 0, hasInput: false };
  var drift = { x: 0, y: 0, phase: Math.random() * 6.28 };

  addEventListener("pointermove", function (e) {
    aspect = innerWidth / innerHeight;
    mouse.tx = (e.clientX / innerWidth - 0.5) * 2 * aspect;
    mouse.ty = -(e.clientY / innerHeight - 0.5) * 2;
    mouse.hasInput = true;
  }, { passive: true });

  addEventListener("scroll", function () {
    var max = document.documentElement.scrollHeight - innerHeight;
    uniforms.uScroll.value = max > 0 ? scrollY / max : 0;
  }, { passive: true });

  /* ---- Render loop ---- */
  var t0 = performance.now();
  function loop() {
    requestAnimationFrame(loop);
    var elapsed = (performance.now() - t0) * 0.001;

    /* Autonomous drift — a slow figure-8 wander so the bg is always alive */
    drift.x = Math.sin(elapsed * 0.12 + drift.phase) * 0.6
            + Math.sin(elapsed * 0.07 + 1.8) * 0.3;
    drift.y = Math.cos(elapsed * 0.09 + drift.phase) * 0.45
            + Math.cos(elapsed * 0.14 + 2.5) * 0.2;

    /* Blend: if mouse is active use it, otherwise use autonomous drift */
    var targetX = mouse.hasInput ? mouse.tx : drift.x;
    var targetY = mouse.hasInput ? mouse.ty : drift.y;

    mouse.x += (targetX - mouse.x) * 0.07;
    mouse.y += (targetY - mouse.y) * 0.07;
    uniforms.uTime.value = elapsed;
    uniforms.uMouse.value.set(mouse.x, mouse.y);
    renderer.render(scene, camera);
  }
  loop();

  /* ---- Resize ---- */
  addEventListener("resize", function () {
    aspect = innerWidth / innerHeight;
    camera.left = -aspect; camera.right = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  /* ---- API ---- */
  window.__shaderBg = {
    setAccent: function () {},
    setIntensity: function (v) { uniforms.uIntensity.value = v; },
  };

  window.MostaiBG = {
    mount: function () {
      return {
        set: function (opts) {
          if (opts.intensity != null && window.__shaderBg)
            window.__shaderBg.setIntensity(opts.intensity);
        },
        get: function () { return {}; },
        destroy: function () {},
        pause: function () {},
        resume: function () {},
      };
    },
    ACCENTS: {},
  };
})();
