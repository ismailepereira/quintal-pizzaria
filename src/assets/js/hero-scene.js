/* Cena Three.js do hero — modelo 3D real de pizza (glb, CC-BY "Pepperoni pizza"
   de Poly by Google) girando 360°, com environment map, luz quente, sombra de
   contato e ingredientes flutuantes.
   Isolada ao hero: pausa fora da viewport, respeita prefers-reduced-motion, cai
   para o fallback CSS (.hero-fallback) sem WebGL e para uma pizza procedural se
   o modelo não carregar. */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

(function () {
  function hasWebGL() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext &&
        (c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { return false; }
  }

  var canvas = document.getElementById("hero-canvas");
  var wrap = canvas ? canvas.closest(".hero-canvas-wrap") : null;
  if (!canvas || !wrap || !hasWebGL()) {
    document.documentElement.classList.add("no-webgl");
    return;
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function radialDark() {
    var s = 256, c = document.createElement("canvas");
    c.width = c.height = s;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(0,0,0,0.55)");
    g.addColorStop(0.6, "rgba(0,0,0,0.25)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  }

  /* ---- setup ---- */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  var scene = new THREE.Scene();
  var pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  var camBase = new THREE.Vector3(0, 1.7, 4.2);
  camera.position.copy(camBase);
  camera.lookAt(0, -0.05, 0);

  scene.add(new THREE.AmbientLight(0x3a2a1a, 0.5));
  var keyLight = new THREE.DirectionalLight(0xfff0d0, 2.4);
  keyLight.position.set(-1.5, 4, 2.5);
  scene.add(keyLight);
  var amberLight = new THREE.PointLight(0xe8b04b, 18, 16);
  amberLight.position.set(2.6, 2.4, 1.8);
  scene.add(amberLight);
  var lilacRim = new THREE.PointLight(0xefe6f7, 8, 12);
  lilacRim.position.set(-2.4, 0.6, -2.4);
  scene.add(lilacRim);

  /* ---- pizza (grupo; recebe o modelo ou o fallback) ---- */
  var pizza = new THREE.Group();
  pizza.rotation.x = -0.22; // inclina o topo em direção à câmera
  scene.add(pizza);

  var shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 4.6),
    new THREE.MeshBasicMaterial({ map: radialDark(), transparent: true, opacity: 0.5, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.6;
  scene.add(shadow);

  function fitToScene(obj, targetDiameter) {
    var box = new THREE.Box3().setFromObject(obj);
    var size = box.getSize(new THREE.Vector3());
    var center = box.getCenter(new THREE.Vector3());
    obj.position.sub(center); // centraliza na origem
    var maxDim = Math.max(size.x, size.z) || size.y || 1;
    var s = targetDiameter / maxDim;
    obj.scale.setScalar(s);
    // reposiciona a sombra sob a base
    var box2 = new THREE.Box3().setFromObject(obj);
    shadow.position.y = box2.min.y - 0.02;
  }

  /* ---- pizza procedural (fallback) ---- */
  function buildProceduralPizza() {
    var g = new THREE.Group();
    var s = 512, c = document.createElement("canvas"); c.width = c.height = s;
    var ctx = c.getContext("2d"), r = s / 2;
    ctx.fillStyle = "#9c3a20"; ctx.beginPath(); ctx.arc(r, r, r, 0, 7); ctx.fill();
    var grd = ctx.createRadialGradient(r, r, r * 0.1, r, r, r);
    grd.addColorStop(0, "#f0d488"); grd.addColorStop(1, "#d9ad52");
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(r, r, r * 0.9, 0, 7); ctx.fill();
    ctx.fillStyle = "#a8362a";
    for (var p = 0; p < 9; p++) { var a = (p / 9) * 6.28; ctx.beginPath(); ctx.arc(r + Math.cos(a) * r * 0.55, r + Math.sin(a) * r * 0.55, 26, 0, 7); ctx.fill(); }
    var tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    var base = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.28, 0.12, 96),
      [new THREE.MeshStandardMaterial({ color: 0xcaa25e, roughness: 0.85 }),
       new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, envMapIntensity: 0.7 }),
       new THREE.MeshStandardMaterial({ color: 0xb98a4a, roughness: 0.9 })]);
    g.add(base);
    var crust = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.19, 20, 80),
      new THREE.MeshStandardMaterial({ color: 0xcf9a54, roughness: 0.8 }));
    crust.rotation.x = Math.PI / 2; crust.position.y = 0.03; g.add(crust);
    return g;
  }

  /* ---- carrega o modelo real ---- */
  var loaded = false;
  function useFallback() {
    if (loaded) return;
    loaded = true;
    var g = buildProceduralPizza();
    pizza.add(g);
    fitToScene(g, 2.9);
  }

  try {
    new GLTFLoader().load(
      "assets/models/pizza.glb",
      function (gltf) {
        if (loaded) return;
        loaded = true;
        var model = gltf.scene;
        model.traverse(function (o) {
          if (o.isMesh && o.material) {
            var mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach(function (m) { if ("envMapIntensity" in m) { m.envMapIntensity = 0.9; m.needsUpdate = true; } });
          }
        });
        pizza.add(model);
        fitToScene(model, 2.9);
      },
      undefined,
      function () { useFallback(); } // erro de carregamento → procedural
    );
  } catch (e) { useFallback(); }
  // se demorar demais (rede lenta), usa o fallback pra não deixar o hero vazio
  setTimeout(useFallback, 9000);

  /* ---- ingredientes orbitando (flutuantes) ---- */
  var orbitDefs = [
    { color: 0xc0392b, radius: 2.25, speed: 0.32,  y: 0.5,  size: 0.16, rough: 0.2, shape: "sphere" },
    { color: 0x5b8a2e, radius: 2.55, speed: -0.24, y: 0.95, size: 0.13, rough: 0.6, shape: "leaf" },
    { color: 0x2f2a17, radius: 2.1,  speed: 0.2,   y: 1.25, size: 0.1,  rough: 0.3, shape: "olive" },
    { color: 0xe8b04b, radius: 2.7,  speed: -0.16, y: 0.72, size: 0.12, rough: 0.25, shape: "sphere", glow: true },
  ];
  var orbits = orbitDefs.map(function (d, i) {
    var g = new THREE.Group();
    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(d.size, 24, 24),
      new THREE.MeshStandardMaterial({ color: d.color, roughness: d.rough, envMapIntensity: 1.0 })
    );
    if (d.shape === "leaf") mesh.scale.set(1, 0.4, 1.5);
    if (d.shape === "olive") mesh.scale.set(1, 1.3, 1);
    g.add(mesh);
    if (d.glow) {
      var spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialDark(), color: 0xe8b04b, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.5, depthWrite: false }));
      spr.scale.set(d.size * 8, d.size * 8, 1); g.add(spr);
    }
    g.userData = { def: d, phase: (i / orbitDefs.length) * Math.PI * 2 };
    scene.add(g);
    return g;
  });

  /* ---- responsivo ---- */
  function resize() {
    var w = wrap.clientWidth, h = wrap.clientHeight || w;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---- parallax do mouse ---- */
  var mouseX = 0, mouseY = 0;
  if (!reduceMotion) {
    window.addEventListener("mousemove", function (e) {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    });
  }

  /* ---- pausa fora da viewport ---- */
  var isVisible = true, heroEl = document.getElementById("topo");
  if ("IntersectionObserver" in window && heroEl) {
    new IntersectionObserver(function (en) {
      isVisible = en[0].isIntersecting;
      if (isVisible && !reduceMotion) start();
    }, { threshold: 0.05 }).observe(heroEl);
  }

  /* ---- loop ---- */
  var rafId = null, clock = new THREE.Clock();
  function tick() {
    if (!isVisible) { rafId = null; return; }
    var t = clock.getElapsedTime();
    pizza.rotation.y = t * 0.3;
    pizza.rotation.x = -0.22 + mouseY * 0.1;
    pizza.position.y = Math.sin(t * 0.8) * 0.05;

    orbits.forEach(function (g) {
      var d = g.userData.def, ph = g.userData.phase, a = t * d.speed + ph;
      g.position.set(Math.cos(a) * d.radius, d.y + Math.sin(t * 1.3 + ph) * 0.12, Math.sin(a) * d.radius);
      g.children[0].rotation.y = t * 0.8;
    });

    camera.position.x += (camBase.x + mouseX * 0.5 - camera.position.x) * 0.045;
    camera.position.y += (camBase.y - mouseY * 0.25 - camera.position.y) * 0.045;
    camera.lookAt(0, -0.05, 0);

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  }
  function start() { if (rafId === null) { clock.getDelta(); rafId = requestAnimationFrame(tick); } }
  if (reduceMotion) {
    // renderiza um frame quando o modelo chegar (sem loop contínuo)
    var once = setInterval(function () { if (loaded) { renderer.render(scene, camera); clearInterval(once); } }, 200);
    setTimeout(function () { clearInterval(once); renderer.render(scene, camera); }, 9500);
  } else {
    start();
  }
})();
