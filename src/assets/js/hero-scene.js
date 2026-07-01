/* Cena Three.js do hero — pizza girando + ingredientes flutuando.
   Escopo isolado ao hero: pausa fora da viewport, respeita prefers-reduced-motion,
   e cai para o fallback em CSS (.hero-fallback) se WebGL não estiver disponível. */
import * as THREE from "three";

(function () {
  function hasWebGL() {
    try {
      var canvas = document.createElement("canvas");
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
    } catch (e) {
      return false;
    }
  }

  var canvas = document.getElementById("hero-canvas");
  var wrap = canvas ? canvas.closest(".hero-canvas-wrap") : null;

  if (!canvas || !wrap || !hasWebGL()) {
    document.documentElement.classList.add("no-webgl");
    return;
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- textura procedural da pizza (canvas 2D -> CanvasTexture) ---- */
  function buildPizzaTexture() {
    var size = 512;
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var ctx = c.getContext("2d");
    var r = size / 2;

    // massa/borda
    ctx.fillStyle = "#c9a86a";
    ctx.beginPath();
    ctx.arc(r, r, r, 0, Math.PI * 2);
    ctx.fill();

    // molho
    ctx.fillStyle = "#8a3b23";
    ctx.beginPath();
    ctx.arc(r, r, r * 0.92, 0, Math.PI * 2);
    ctx.fill();

    // queijo
    ctx.fillStyle = "#e8c877";
    ctx.beginPath();
    ctx.arc(r, r, r * 0.86, 0, Math.PI * 2);
    ctx.fill();

    // manchas de queijo derretido
    ctx.fillStyle = "rgba(233, 196, 120, 0.55)";
    for (var i = 0; i < 22; i++) {
      var a = Math.random() * Math.PI * 2;
      var d = Math.random() * r * 0.75;
      ctx.beginPath();
      ctx.arc(r + Math.cos(a) * d, r + Math.sin(a) * d, 14 + Math.random() * 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // pepperoni
    ctx.fillStyle = "#a83224";
    for (var p = 0; p < 12; p++) {
      var ap = Math.random() * Math.PI * 2;
      var dp = Math.random() * r * 0.68;
      ctx.beginPath();
      ctx.arc(r + Math.cos(ap) * dp, r + Math.sin(ap) * dp, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // manjericão
    ctx.fillStyle = "#4f6b2e";
    for (var b = 0; b < 14; b++) {
      var ab = Math.random() * Math.PI * 2;
      var db = Math.random() * r * 0.72;
      ctx.beginPath();
      ctx.ellipse(r + Math.cos(ab) * db, r + Math.sin(ab) * db, 8, 5, ab, 0, Math.PI * 2);
      ctx.fill();
    }

    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /* ---- setup ---- */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  var scene = new THREE.Scene();

  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  var camBase = new THREE.Vector3(0, 2.1, 3.6);
  camera.position.copy(camBase);
  camera.lookAt(0, 0.15, 0);

  scene.add(new THREE.AmbientLight(0x3a2a1a, 1.1));

  var amberLight = new THREE.PointLight(0xe8b04b, 22, 12);
  amberLight.position.set(2, 3, 2);
  scene.add(amberLight);

  var glowLight = new THREE.PointLight(0xefe6f7, 6, 10);
  glowLight.position.set(-2, 1.5, -1.5);
  scene.add(glowLight);

  var pizzaGroup = new THREE.Group();
  scene.add(pizzaGroup);

  var pizzaTex = buildPizzaTexture();
  var pizza = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.4, 0.16, 64),
    [
      new THREE.MeshStandardMaterial({ color: 0xc9a86a, roughness: 0.7 }), // lateral (massa)
      new THREE.MeshStandardMaterial({ map: pizzaTex, roughness: 0.5 }),   // topo
      new THREE.MeshStandardMaterial({ color: 0xead9b8, roughness: 0.8 }), // fundo
    ]
  );
  pizzaGroup.add(pizza);

  var ingredientDefs = [
    { color: 0xc0392b, radius: 2.05, speed: 0.35, height: 0.55, size: 0.13 },
    { color: 0xf1c40f, radius: 2.35, speed: -0.28, height: 0.85, size: 0.1 },
    { color: 0x6b8e23, radius: 1.95, speed: 0.22, height: 1.1, size: 0.11 },
    { color: 0xe8b04b, radius: 2.5, speed: -0.18, height: 0.7, size: 0.14 },
    { color: 0xc0392b, radius: 2.2, speed: 0.3, height: 1.3, size: 0.09 },
    { color: 0x6b8e23, radius: 2.6, speed: -0.24, height: 0.95, size: 0.1 },
  ];

  var ingredients = ingredientDefs.map(function (def, i) {
    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(def.size, 20, 20),
      new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.color,
        emissiveIntensity: 0.35,
        roughness: 0.4,
      })
    );
    mesh.userData = { def: def, phase: (i / ingredientDefs.length) * Math.PI * 2 };
    scene.add(mesh);
    return mesh;
  });

  /* ---- tamanho responsivo ---- */
  function resize() {
    var w = wrap.clientWidth;
    var h = wrap.clientHeight || w;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
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
  var isVisible = true;
  var heroEl = document.getElementById("topo");
  if ("IntersectionObserver" in window && heroEl) {
    new IntersectionObserver(
      function (entries) {
        isVisible = entries[0].isIntersecting;
        if (isVisible && !reduceMotion) start();
      },
      { threshold: 0.05 }
    ).observe(heroEl);
  }

  /* ---- loop ---- */
  var rafId = null;
  var clock = new THREE.Clock();

  function tick() {
    if (!isVisible) {
      rafId = null;
      return;
    }
    var t = clock.getElapsedTime();

    pizzaGroup.rotation.y = t * 0.35;

    ingredients.forEach(function (mesh) {
      var d = mesh.userData.def;
      var phase = mesh.userData.phase;
      var angle = t * d.speed + phase;
      mesh.position.set(
        Math.cos(angle) * d.radius,
        d.height + Math.sin(t * 1.4 + phase) * 0.08,
        Math.sin(angle) * d.radius
      );
    });

    camera.position.x += (camBase.x + mouseX * 0.5 - camera.position.x) * 0.04;
    camera.position.y += (camBase.y - mouseY * 0.3 - camera.position.y) * 0.04;
    camera.lookAt(0, 0.15, 0);

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (rafId === null) rafId = requestAnimationFrame(tick);
  }

  if (reduceMotion) {
    // frame único e estático, sem loop contínuo
    renderer.render(scene, camera);
  } else {
    start();
  }
})();
