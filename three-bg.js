/* ============================================================
   MostAI — Three.js floating wireframe layer
   Transparent overlay of slowly rotating geometric shapes + particles.
   Mouse + scroll reactive. Works alongside bg-engine.js.
   API: window.__threeBg.setColor(hex), .setIntensity(v)
   ============================================================ */
(function () {
  "use strict";
  if (typeof THREE === "undefined") return;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 500);
  camera.position.z = 40;

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 0);
  var el = renderer.domElement;
  el.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;";

  var bgCanvas = document.querySelector(".site-bg");
  if (bgCanvas && bgCanvas.parentNode) bgCanvas.parentNode.insertBefore(el, bgCanvas.nextSibling);
  else document.body.insertBefore(el, document.body.firstChild);

  var accentColor = new THREE.Color(0x5fb0ff);
  var intensity = 1;

  /* ---- Wireframe shapes ---- */
  var shapes = [];
  var geos = [
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.OctahedronGeometry(1, 0),
    new THREE.TetrahedronGeometry(1, 0),
    new THREE.DodecahedronGeometry(0.8, 0),
    new THREE.TorusGeometry(0.7, 0.25, 8, 16),
  ];

  for (var i = 0; i < 18; i++) {
    var geo = geos[i % geos.length];
    var edges = new THREE.EdgesGeometry(geo);
    var mat = new THREE.LineBasicMaterial({
      color: accentColor.clone(),
      transparent: true,
      opacity: 0.06 + Math.random() * 0.07,
    });
    var line = new THREE.LineSegments(edges, mat);

    var s = 0.6 + Math.random() * 2.8;
    line.scale.set(s, s, s);
    line.position.set(
      (Math.random() - 0.5) * 80,
      (Math.random() - 0.5) * 55,
      (Math.random() - 0.5) * 30 - 15
    );
    line.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, 0);

    line.userData = {
      rx: (Math.random() - 0.5) * 0.0018,
      ry: (Math.random() - 0.5) * 0.0018,
      floatAmp: 0.3 + Math.random() * 0.6,
      floatFreq: 0.25 + Math.random() * 0.35,
      floatPhase: Math.random() * Math.PI * 2,
      parallax: 0.3 + Math.random() * 0.7,
      baseY: line.position.y,
      baseOpacity: mat.opacity,
    };
    shapes.push(line);
    scene.add(line);
  }

  /* ---- Particles ---- */
  var pCount = 120;
  var pGeo = new THREE.BufferGeometry();
  var pPos = new Float32Array(pCount * 3);
  for (var j = 0; j < pCount; j++) {
    pPos[j * 3] = (Math.random() - 0.5) * 100;
    pPos[j * 3 + 1] = (Math.random() - 0.5) * 70;
    pPos[j * 3 + 2] = (Math.random() - 0.5) * 50 - 10;
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  var pMat = new THREE.PointsMaterial({
    color: accentColor.clone(),
    size: 0.1,
    transparent: true,
    opacity: 0.25,
  });
  var particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* ---- Input tracking ---- */
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  var scrollP = 0;
  addEventListener("pointermove", function (e) {
    mouse.tx = (e.clientX / innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });
  addEventListener("scroll", function () {
    var max = document.documentElement.scrollHeight - innerHeight;
    scrollP = max > 0 ? scrollY / max : 0;
  }, { passive: true });

  /* ---- Render loop ---- */
  function loop() {
    requestAnimationFrame(loop);
    var t = performance.now() * 0.001;

    mouse.x += (mouse.tx - mouse.x) * 0.035;
    mouse.y += (mouse.ty - mouse.y) * 0.035;

    camera.position.x += (mouse.x * 4 - camera.position.x) * 0.012;
    camera.position.y += (-mouse.y * 3 - camera.position.y) * 0.012;
    camera.lookAt(scene.position);

    for (var k = 0; k < shapes.length; k++) {
      var sh = shapes[k], u = sh.userData;
      sh.rotation.x += u.rx;
      sh.rotation.y += u.ry;
      sh.position.y = u.baseY + Math.sin(t * u.floatFreq + u.floatPhase) * u.floatAmp;
      sh.position.y -= scrollP * 22 * u.parallax;
      sh.material.opacity = u.baseOpacity * intensity;
    }
    particles.rotation.y = t * 0.006;
    particles.position.y = -scrollP * 14;
    pMat.opacity = 0.25 * intensity;

    renderer.render(scene, camera);
  }
  loop();

  addEventListener("resize", function () {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  /* ---- Public API ---- */
  window.__threeBg = {
    setColor: function (hex) {
      accentColor.set(hex);
      shapes.forEach(function (sh) { sh.material.color.copy(accentColor); });
      pMat.color.copy(accentColor);
    },
    setIntensity: function (v) { intensity = v; },
  };
})();
