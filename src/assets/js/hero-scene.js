/* Cena Three.js do hero — pizza modelada (borda + recheio 3D) com materiais
   realistas (environment map), luz quente e sombra de contato.
   Isolada ao hero: pausa fora da viewport, respeita prefers-reduced-motion,
   e cai para o fallback em CSS (.hero-fallback) se WebGL não estiver disponível. */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

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

  /* ---- textura de topo (molho + queijo assado) ---- */
  function buildCheeseTexture() {
    var s = 1024, c = document.createElement("canvas");
    c.width = c.height = s;
    var ctx = c.getContext("2d"), r = s / 2;

    // molho (aparece na beirada, sob o queijo)
    ctx.fillStyle = "#9c3a20";
    ctx.beginPath(); ctx.arc(r, r, r, 0, Math.PI * 2); ctx.fill();

    // queijo derretido
    var g = ctx.createRadialGradient(r, r, r * 0.1, r, r, r * 0.98);
    g.addColorStop(0, "#f0d488");
    g.addColorStop(0.7, "#e7c46f");
    g.addColorStop(1, "#d9ad52");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(r, r, r * 0.9, 0, Math.PI * 2); ctx.fill();

    // mosqueado do queijo (bolhas claras e douradas)
    for (var i = 0; i < 260; i++) {
      var a = Math.random() * Math.PI * 2, d = Math.random() * r * 0.87;
      var x = r + Math.cos(a) * d, y = r + Math.sin(a) * d;
      var rad = 4 + Math.random() * 16;
      ctx.beginPath();
      ctx.fillStyle = Math.random() < 0.72
        ? "rgba(245, 224, 155, " + (0.15 + Math.random() * 0.25) + ")"
        : "rgba(190, 130, 60, " + (0.12 + Math.random() * 0.22) + ")";
      ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    }

    // manchas douradas de forno
    for (var b = 0; b < 26; b++) {
      var ab = Math.random() * Math.PI * 2, db = Math.random() * r * 0.8;
      ctx.beginPath();
      ctx.fillStyle = "rgba(150, 92, 38, 0.5)";
      ctx.arc(r + Math.cos(ab) * db, r + Math.sin(ab) * db, 6 + Math.random() * 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // vinheta escurecendo a borda (junto à massa)
    var vg = ctx.createRadialGradient(r, r, r * 0.72, r, r, r);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(70, 30, 12, 0.55)");
    ctx.fillStyle = vg;
    ctx.beginPath(); ctx.arc(r, r, r, 0, Math.PI * 2); ctx.fill();

    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }

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

  // environment map para reflexos realistas (queijo aparece apetitoso)
  var pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  var camBase = new THREE.Vector3(0, 1.75, 4.0);
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

  /* ---- pizza ---- */
  var pizza = new THREE.Group();
  pizza.rotation.x = -0.28; // inclina o topo em direção à câmera
  scene.add(pizza);

  var cheeseTex = buildCheeseTexture();

  // recheio (disco)
  var base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.32, 1.3, 0.12, 96),
    [
      new THREE.MeshStandardMaterial({ color: 0xcaa25e, roughness: 0.85 }), // lateral
      new THREE.MeshStandardMaterial({ map: cheeseTex, roughness: 0.5, metalness: 0.0, envMapIntensity: 0.7 }), // topo
      new THREE.MeshStandardMaterial({ color: 0xb98a4a, roughness: 0.9 }), // fundo (assado)
    ]
  );
  pizza.add(base);

  // borda (crosta) modelada
  var crust = new THREE.Mesh(
    new THREE.TorusGeometry(1.32, 0.19, 24, 96),
    new THREE.MeshStandardMaterial({ color: 0xcf9a54, roughness: 0.8, envMapIntensity: 0.5 })
  );
  crust.rotation.x = Math.PI / 2;
  crust.position.y = 0.03;
  pizza.add(crust);

  // pepperoni 3D
  var pepMat = new THREE.MeshStandardMaterial({ color: 0xa8362a, roughness: 0.45, envMapIntensity: 0.8 });
  var pepGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.03, 24);
  function addTopping(mesh, radius, angle, y) {
    mesh.position.set(Math.cos(angle) * radius, 0.075 + (y || 0), Math.sin(angle) * radius);
    pizza.add(mesh);
  }
  for (var p = 0; p < 7; p++) {
    addTopping(new THREE.Mesh(pepGeo, pepMat), 0.78, (p / 7) * Math.PI * 2, 0);
  }
  addTopping(new THREE.Mesh(pepGeo, pepMat), 0.32, 0.8, 0);
  addTopping(new THREE.Mesh(pepGeo, pepMat), 0.34, 3.6, 0);

  // manjericão 3D
  var basilMat = new THREE.MeshStandardMaterial({ color: 0x4f7a2e, roughness: 0.6, envMapIntensity: 0.6 });
  var basilGeo = new THREE.SphereGeometry(0.1, 14, 14);
  for (var bl = 0; bl < 6; bl++) {
    var leaf = new THREE.Mesh(basilGeo, basilMat);
    leaf.scale.set(1, 0.32, 1.5);
    leaf.rotation.y = Math.random() * Math.PI;
    addTopping(leaf, 0.55, (bl / 6) * Math.PI * 2 + 0.4, 0.01);
  }

  /* ---- sombra de contato ---- */
  var shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 4.2),
    new THREE.MeshBasicMaterial({ map: radialDark(), transparent: true, opacity: 0.5, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.55;
  scene.add(shadow);

  /* ---- ingredientes orbitando (flutuantes) ---- */
  var orbitDefs = [
    { type: "tomato", color: 0xc0392b, radius: 2.15, speed: 0.32,  y: 0.5,  size: 0.16, rough: 0.2 },
    { type: "basil",  color: 0x5b8a2e, radius: 2.45, speed: -0.24, y: 0.95, size: 0.13, rough: 0.6 },
    { type: "olive",  color: 0x2f2a17, radius: 2.0,  speed: 0.2,   y: 1.25, size: 0.1,  rough: 0.3 },
    { type: "amber",  color: 0xe8b04b, radius: 2.6,  speed: -0.16, y: 0.72, size: 0.12, rough: 0.25, glow: true },
  ];
  var orbits = orbitDefs.map(function (d, i) {
    var g = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: d.color, roughness: d.rough, metalness: 0.0, envMapIntensity: 1.0 });
    var geo = new THREE.SphereGeometry(d.size, 24, 24);
    var mesh = new THREE.Mesh(geo, mat);
    if (d.type === "basil") mesh.scale.set(1, 0.4, 1.5);
    if (d.type === "olive") mesh.scale.set(1, 1.3, 1);
    g.add(mesh);
    if (d.glow) {
      var spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialDark(), color: 0xe8b04b, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.5, depthWrite: false }));
      spr.scale.set(d.size * 8, d.size * 8, 1);
      g.add(spr);
    }
    g.userData = { def: d, phase: (i / orbitDefs.length) * Math.PI * 2 };
    scene.add(g);
    return g;
  });

  /* ---- vapor sutil ---- */
  var steam = null;
  if (!reduceMotion) {
    var N = 34, pos = new Float32Array(N * 3), life = new Float32Array(N);
    for (var s2 = 0; s2 < N; s2++) {
      pos[s2 * 3] = (Math.random() - 0.5) * 1.4;
      pos[s2 * 3 + 1] = Math.random() * 2;
      pos[s2 * 3 + 2] = (Math.random() - 0.5) * 1.4;
      life[s2] = Math.random();
    }
    var sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    steam = new THREE.Points(sGeo, new THREE.PointsMaterial({
      map: radialDark(), color: 0xf4ede4, size: 0.55, transparent: true, opacity: 0.1,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    steam.userData = { life: life };
    scene.add(steam);
  }

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
    var t = clock.getElapsedTime(), dt = Math.min(clock.getDelta(), 0.05);

    pizza.rotation.y = t * 0.28;
    pizza.rotation.x = -0.28 + mouseY * 0.12;
    pizza.position.y = Math.sin(t * 0.8) * 0.05;

    orbits.forEach(function (g) {
      var d = g.userData.def, ph = g.userData.phase, a = t * d.speed + ph;
      g.position.set(Math.cos(a) * d.radius, d.y + Math.sin(t * 1.3 + ph) * 0.12, Math.sin(a) * d.radius);
      g.children[0].rotation.y = t * 0.8;
    });

    if (steam) {
      var arr = steam.geometry.attributes.position.array, lf = steam.userData.life;
      for (var i = 0; i < lf.length; i++) {
        lf[i] += dt * 0.22;
        if (lf[i] > 1) { lf[i] = 0; arr[i * 3] = (Math.random() - 0.5) * 1.2; arr[i * 3 + 2] = (Math.random() - 0.5) * 1.2; }
        arr[i * 3 + 1] = lf[i] * 2.2 + 0.2;
      }
      steam.geometry.attributes.position.needsUpdate = true;
    }

    camera.position.x += (camBase.x + mouseX * 0.5 - camera.position.x) * 0.045;
    camera.position.y += (camBase.y - mouseY * 0.25 - camera.position.y) * 0.045;
    camera.lookAt(0, -0.05, 0);

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  }
  function start() { if (rafId === null) { clock.getDelta(); rafId = requestAnimationFrame(tick); } }

  if (reduceMotion) { renderer.render(scene, camera); } else { start(); }
})();
