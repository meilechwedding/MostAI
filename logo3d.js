/* ============================================================
   MostAI — real 3D WebGL logo (transparent, container-mounted)
   Mounts into every [data-logo3d] element. Uses the global THREE
   (loaded as a UMD <script>) + global THREE.SVGLoader. Falls back
   silently (leaves the element empty) if either is missing.
   ============================================================ */
(function () {
  "use strict";
  if (typeof THREE === "undefined" || !THREE.SVGLoader) return;
  var SVGLoader = THREE.SVGLoader;

const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="236 217 782 782">
  <path fill="#0A84FF" d="M349.34 344.75 L345.96 343.39 L342.47 342.33 L338.91 341.57 L335.29 341.13 L331.65 341.0 L328.01 341.19 L324.4 341.69 L320.85 342.51 L317.38 343.63 L314.02 345.04 L310.8 346.74 L307.73 348.72 L304.85 350.95 L302.18 353.43 L299.73 356.12 L297.52 359.02 L295.57 362.1 L293.89 365.34 L292.51 368.71 L291.42 372.19 L290.63 375.75 L290.16 379.36 L290.0 383.0 L290.0 833.0 L290.16 836.64 L290.63 840.25 L291.42 843.81 L292.51 847.29 L293.89 850.66 L295.57 853.9 L297.52 856.98 L299.73 859.88 L302.18 862.57 L304.85 865.05 L307.73 867.28 L310.8 869.26 L314.02 870.96 L317.38 872.37 L320.85 873.49 L324.4 874.31 L328.01 874.81 L331.65 875.0 L335.29 874.87 L338.91 874.43 L342.47 873.67 L345.96 872.61 L349.34 871.25 L574.34 769.25 L577.61 767.6 L580.72 765.66 L583.65 763.46 L586.38 761.01 L588.88 758.34 L591.14 755.46 L593.15 752.39 L594.87 749.16 L596.31 745.79 L597.45 742.3 L598.28 738.74 L598.8 735.11 L599.0 731.45 L598.88 727.79 L598.44 724.15 L597.68 720.56 L596.62 717.06 L595.25 713.66 L593.6 710.39 L591.66 707.28 L589.46 704.35 L587.01 701.62 L584.34 699.12 L581.46 696.86 L578.39 694.85 L575.16 693.13 L571.79 691.69 L568.3 690.55 L564.74 689.72 L561.11 689.2 L557.45 689.0 L553.79 689.12 L550.15 689.56 L546.56 690.32 L543.06 691.38 L539.66 692.75 L374.0 767.85 L374.0 448.15 L539.66 523.25 L543.06 524.62 L546.56 525.68 L550.15 526.44 L553.79 526.88 L557.45 527.0 L561.11 526.8 L564.74 526.28 L568.3 525.45 L571.79 524.31 L575.16 522.87 L578.39 521.15 L581.46 519.14 L584.34 516.88 L587.01 514.38 L589.46 511.65 L591.66 508.72 L593.6 505.61 L595.25 502.34 L596.62 498.94 L597.68 495.44 L598.44 491.85 L598.88 488.21 L599.0 484.55 L598.8 480.89 L598.28 477.26 L597.45 473.7 L596.31 470.21 L594.87 466.84 L593.15 463.61 L591.14 460.54 L588.88 457.66 L586.38 454.99 L583.65 452.54 L580.72 450.34 L577.61 448.4 L574.34 446.75 L349.34 344.75 Z"/>
  <path fill="#0A84FF" d="M880.0 448.15 L880.0 767.85 L714.34 692.75 L710.94 691.38 L707.44 690.32 L703.85 689.56 L700.21 689.12 L696.55 689.0 L692.89 689.2 L689.26 689.72 L685.7 690.55 L682.21 691.69 L678.84 693.13 L675.61 694.85 L672.54 696.86 L669.66 699.12 L666.99 701.62 L664.54 704.35 L662.34 707.28 L660.4 710.39 L658.75 713.66 L657.38 717.06 L656.32 720.56 L655.56 724.15 L655.12 727.79 L655.0 731.45 L655.2 735.11 L655.72 738.74 L656.55 742.3 L657.69 745.79 L659.13 749.16 L660.85 752.39 L662.86 755.46 L665.12 758.34 L667.62 761.01 L670.35 763.46 L673.28 765.66 L676.39 767.6 L679.66 769.25 L904.66 871.25 L908.04 872.61 L911.53 873.67 L915.09 874.43 L918.71 874.87 L922.35 875.0 L925.99 874.81 L929.6 874.31 L933.15 873.49 L936.62 872.37 L939.98 870.96 L943.2 869.26 L946.27 867.28 L949.15 865.05 L951.82 862.57 L954.27 859.88 L956.48 856.98 L958.43 853.9 L960.11 850.66 L961.49 847.29 L962.58 843.81 L963.37 840.25 L963.84 836.64 L964.0 833.0 L964.0 383.0 L963.84 379.36 L963.37 375.75 L962.58 372.19 L961.49 368.71 L960.11 365.34 L958.43 362.1 L956.48 359.02 L954.27 356.12 L951.82 353.43 L949.15 350.95 L946.27 348.72 L943.2 346.74 L939.98 345.04 L936.62 343.63 L933.15 342.51 L929.6 341.69 L925.99 341.19 L922.35 341.0 L918.71 341.13 L915.09 341.57 L911.53 342.33 L908.04 343.39 L904.66 344.75 L679.66 446.75 L676.39 448.4 L673.28 450.34 L670.35 452.54 L667.62 454.99 L665.12 457.66 L662.86 460.54 L660.85 463.61 L659.13 466.84 L657.69 470.21 L656.55 473.7 L655.72 477.26 L655.2 480.89 L655.0 484.55 L655.12 488.21 L655.56 491.85 L656.32 495.44 L657.38 498.94 L658.75 502.34 L660.4 505.61 L662.34 508.72 L664.54 511.65 L666.99 514.38 L669.66 516.88 L672.54 519.14 L675.61 521.15 L678.84 522.87 L682.21 524.31 L685.7 525.45 L689.26 526.28 L692.89 526.8 L696.55 527.0 L700.21 526.88 L703.85 526.44 L707.44 525.68 L710.94 524.62 L714.34 523.25 L880.0 448.15 Z"/>
  <path fill="#74BEFB" d="M627 557 Q641 606 691 622 Q641 638 627 687 Q613 638 563 622 Q613 606 627 557 Z"/>
</svg>`;

function mount(container) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) { return; }

  const size = () => Math.max(container.clientWidth || 240, 1);

  const scene = new THREE.Scene();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(size(), size());
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  container.appendChild(renderer.domElement);
  // 3D mounted — drop the flat fallback icon so it doesn't show behind
  var fb = container.querySelector('.hero__logo3d-fallback');
  if (fb) fb.style.display = 'none';

  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 5000);
  camera.position.set(0, 0, 1340);
  scene.add(camera);

  scene.add(new THREE.AmbientLight(0xffffff, 1.25));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x16335c, 1.1));

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-380, 450, 760);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xbcdcff, 0.8);
  fill.position.set(520, 90, 400);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xddefff, 0.7);
  rim.position.set(120, 10, -620);
  scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);

  const blueFaceMat = new THREE.MeshPhysicalMaterial({ color: 0x0A84FF, metalness: .02, roughness: .42, clearcoat: .22, clearcoatRoughness: .3, side: THREE.DoubleSide });
  const blueSideMat = new THREE.MeshPhysicalMaterial({ color: 0x0A6BE0, metalness: .02, roughness: .52, clearcoat: .1, clearcoatRoughness: .4, side: THREE.DoubleSide });
  const sparkFaceMat = new THREE.MeshPhysicalMaterial({ color: 0x8FC4FF, emissive: 0x2A7FE0, emissiveIntensity: .12, metalness: .02, roughness: .35, clearcoat: .3, clearcoatRoughness: .2, side: THREE.DoubleSide });
  const sparkSideMat = new THREE.MeshPhysicalMaterial({ color: 0x6FB0F2, metalness: .02, roughness: .42, clearcoat: .15, clearcoatRoughness: .3, side: THREE.DoubleSide });

  const data = new SVGLoader().parse(SVG);
  function addPath(path, mats, isSpark) {
    SVGLoader.createShapes(path).forEach(shape => {
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: isSpark ? 102 : 86, bevelEnabled: true,
        bevelThickness: isSpark ? 7 : 9, bevelSize: isSpark ? 5 : 7,
        bevelSegments: 8, curveSegments: 28, steps: 2
      });
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, mats);
      if (isSpark) mesh.position.z += 10;
      group.add(mesh);
    });
  }
  data.paths.forEach((path, i) => {
    const isSpark = i === 2;
    addPath(path, isSpark ? [sparkFaceMat, sparkSideMat] : [blueFaceMat, blueSideMat], isSpark);
  });

  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.children.forEach(o => { o.position.x -= center.x; o.position.y -= center.y; o.position.z -= center.z; });
  group.scale.set(.92, -.92, .92);

  const starLight = new THREE.PointLight(0x91d0ff, 0.8, 360);
  starLight.position.set(0, 0, 110);
  group.add(starLight);

  const ro = new ResizeObserver(() => {
    const s = size();
    renderer.setSize(s, s);
  });
  ro.observe(container);

  let visible = true;
  const io = new IntersectionObserver((ents) => { visible = ents[0].isIntersecting; }, { threshold: 0 });
  io.observe(container);

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    const t = clock.getElapsedTime();
    group.rotation.y = (t / 20.0) * Math.PI * 2;
    group.rotation.x = THREE.MathUtils.degToRad(8);
    group.rotation.z = 0;
    renderer.render(scene, camera);
  }
  animate();
}

document.querySelectorAll('[data-logo3d]').forEach(mount);
})();
