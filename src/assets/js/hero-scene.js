/* Cena Three.js do hero — pizza sobre tábua com anel de brasa, ingredientes
   orbitando com brilho, vapor subindo e luz de contorno.
   Isolada ao hero: pausa fora da viewport, respeita prefers-reduced-motion,
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

    ctx.fillStyle = "#c9a86a"; // massa/borda
    ctx.beginPath(); ctx.arc(r, r, r, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#8a3b23"; // molho
    ctx.beginPath(); ctx.arc(r, r, r * 0.92, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#e8c877"; // queijo
    ctx.beginPath(); ctx.arc(r, r, r * 0.86, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "rgba(233, 196, 120, 0.55)"; // manchas de queijo
    for (var i = 0; i < 22; i++) {
      var a = Math.random() * Math.PI * 2, d = Math.random() * r * 0.75;
      ctx.beginPath();
      ctx.arc(r + Math.cos(a) * d, r + Math.sin(a) * d, 14 + Math.random() * 18, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#a83224"; // pepperoni
    for (var p = 0; p < 12; p++) {
      var ap = Math.random() * Math.PI * 2, dp = Math.random() * r * 0.68;
      ctx.beginPath();
      ctx.arc(r + Math.cos(ap) * dp, r + Math.sin(ap) * dp, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.beginPath();
      ctx.arc(r + Math.cos(ap) * dp - 5, r + Math.sin(ap) * dp - 5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#a83224";
    }

    ctx.fillStyle = "#4f6b2e"; // manjericão
    for (var b = 0; b < 14; b++) {
      var ab = Math.random() * Math.PI * 2, db = Math.random() * r * 0.72;
      ctx.beginPath();
      ctx.ellipse(r + Math.cos(ab) * db, r + Math.sin(ab) * db, 8, 5, ab, 0, Math.PI * 2);
      ctx.fill();
    }

    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  /* ---- textura radial (glow / vapor) ---- */
  function radialSprite(hex, softness) {
    var s = 128;
    var c = document.createElement("canvas");
    c.width = c.height = s;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, hex);
    g.addColorStop(softness || 0.5, hex.replace("rgb", "rgba").replace(")", ",0.35)"));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /* ---- setup ---- */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  var scene = new THREE.Scene();

  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  var camBase = new THREE.Vector3(0, 2.15, 3.7);
  camera.position.copy(camBase);
  camera.lookAt(0, 0.1, 0);

  scene.add(new THREE.AmbientLight(0x3a2a1a, 1.0));

  var amberLight = new THREE.PointLight(0xe8b04b, 26, 14);
  amberLight.position.set(2.4, 3.2, 2.2);
  scene.add(amberLight);

  var lilacLight = new THREE.PointLight(0xefe6f7, 9, 12); // luz de contorno (letreiro)
  lilacLight.position.set(-2.6, 1.6, -2.2);
  scene.add(lilacLight);

  var keyLight = new THREE.DirectionalLight(0xffe6b0, 0.5);
  keyLight.position.set(1, 4, 2);
  scene.add(keyLight);

  /* ---- tábua de madeira + anel de brasa ---- */
  var board = new THREE.Mesh(
    new THREE.CylinderGeometry(1.85, 1.9, 0.14, 64),
    new THREE.MeshStandardMaterial({ color: 0x2a1c10, roughness: 0.85, metalness: 0.05 })
  );
  board.position.y = -0.16;
  scene.add(board);

  var ember = new THREE.Mesh(
    new THREE.TorusGeometry(1.86, 0.02, 12, 80),
    new THREE.MeshBasicMaterial({ color: 0xe8b04b })
  );
  ember.rotation.x = Math.PI / 2;
  ember.position.y = -0.08;
  scene.add(ember);

  // halo aditivo do anel
  var emberGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: radialSprite("rgb(232,176,75)", 0.4), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })
  );
  emberGlow.scale.set(5.2, 5.2, 1);
  emberGlow.position.set(0, -0.05, 0);
  scene.add(emberGlow);

  /* ---- pizza ---- */
  var pizzaGroup = new THREE.Group();
  scene.add(pizzaGroup);

  var pizzaTex = buildPizzaTexture();
  var pizza = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.4, 0.16, 64),
    [
      new THREE.MeshStandardMaterial({ color: 0xc9a86a, roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ map: pizzaTex, roughness: 0.5 }),
      new THREE.MeshStandardMaterial({ color: 0xead9b8, roughness: 0.8 }),
    ]
  );
  pizzaGroup.add(pizza);

  /* ---- ingredientes orbitando (esfera + glow aditivo) ---- */
  var ingredientDefs = [
    { color: 0xc0392b, glow: "rgb(192,57,43)",  radius: 2.05, speed: 0.35,  height: 0.55, size: 0.14 },
    { color: 0xf1c40f, glow: "rgb(241,196,15)", radius: 2.35, speed: -0.28, height: 0.85, size: 0.10 },
    { color: 0x6b8e23, glow: "rgb(107,142,35)", radius: 1.95, speed: 0.22,  height: 1.10, size: 0.11 },
    { color: 0xe8b04b, glow: "rgb(232,176,75)", radius: 2.50, speed: -0.18, height: 0.70, size: 0.15 },
    { color: 0xc0392b, glow: "rgb(192,57,43)",  radius: 2.20, speed: 0.30,  height: 1.30, size: 0.09 },
    { color: 0x6b8e23, glow: "rgb(107,142,35)", radius: 2.60, speed: -0.24, height: 0.95, size: 0.10 },
  ];

  var ingredients = ingredientDefs.map(function (def, i) {
    var group = new THREE.Group();
    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(def.size, 24, 24),
      new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 0.4, roughness: 0.35 })
    );
    group.add(mesh);
    var glow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: radialSprite(def.glow, 0.35), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })
    );
    glow.scale.set(def.size * 7, def.size * 7, 1);
    group.add(glow);
    group.userData = { def: def, mesh: mesh, phase: (i / ingredientDefs.length) * Math.PI * 2 };
    scene.add(group);
    return group;
  });

  /* ---- vapor subindo ---- */
  var steam = null;
  if (!reduceMotion) {
    var STEAM = 46;
    var pos = new Float32Array(STEAM * 3);
    var life = new Float32Array(STEAM);
    for (var s = 0; s < STEAM; s++) {
      pos[s * 3] = (Math.random() - 0.5) * 1.6;
      pos[s * 3 + 1] = Math.random() * 2;
      pos[s * 3 + 2] = (Math.random() - 0.5) * 1.6;
      life[s] = Math.random();
    }
    var sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var sMat = new THREE.PointsMaterial({
      map: radialSprite("rgb(244,237,228)", 0.5),
      size: 0.5, transparent: true, opacity: 0.14,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    steam = new THREE.Points(sGeo, sMat);
    steam.userData = { life: life };
    scene.add(steam);
  }

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
    new IntersectionObserver(function (entries) {
      isVisible = entries[0].isIntersecting;
      if (isVisible && !reduceMotion) start();
    }, { threshold: 0.05 }).observe(heroEl);
  }

  /* ---- loop ---- */
  var rafId = null;
  var clock = new THREE.Clock();

  function tick() {
    if (!isVisible) { rafId = null; return; }
    var t = clock.getElapsedTime();
    var dt = Math.min(clock.getDelta(), 0.05);

    pizzaGroup.rotation.y = t * 0.32;
    pizzaGroup.position.y = Math.sin(t * 0.9) * 0.04; // respiração
    ember.material.color.setHSL(0.09, 0.7, 0.55 + Math.sin(t * 2) * 0.08); // brasa pulsando

    ingredients.forEach(function (g) {
      var d = g.userData.def, phase = g.userData.phase;
      var angle = t * d.speed + phase;
      g.position.set(
        Math.cos(angle) * d.radius,
        d.height + Math.sin(t * 1.4 + phase) * 0.1,
        Math.sin(angle) * d.radius
      );
      g.userData.mesh.material.emissiveIntensity = 0.35 + Math.sin(t * 2.5 + phase) * 0.15;
    });

    if (steam) {
      var arr = steam.geometry.attributes.position.array;
      var lf = steam.userData.life;
      for (var i = 0; i < lf.length; i++) {
        lf[i] += dt * 0.25;
        if (lf[i] > 1) { lf[i] = 0; arr[i * 3] = (Math.random() - 0.5) * 1.4; arr[i * 3 + 2] = (Math.random() - 0.5) * 1.4; }
        arr[i * 3 + 1] = lf[i] * 2.4 + 0.1;
        arr[i * 3] += Math.sin(t + i) * 0.002;
      }
      steam.geometry.attributes.position.needsUpdate = true;
      steam.material.opacity = 0.14;
    }

    // câmera: parallax de mouse + leve flutuação idle
    var fx = Math.sin(t * 0.35) * 0.12;
    var fy = Math.cos(t * 0.28) * 0.08;
    camera.position.x += (camBase.x + mouseX * 0.55 + fx - camera.position.x) * 0.045;
    camera.position.y += (camBase.y - mouseY * 0.32 + fy - camera.position.y) * 0.045;
    camera.lookAt(0, 0.1, 0);

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  }

  function start() { if (rafId === null) { clock.getDelta(); rafId = requestAnimationFrame(tick); } }

  if (reduceMotion) {
    renderer.render(scene, camera); // frame estático
  } else {
    start();
  }
})();
