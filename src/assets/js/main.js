/* Interações com Motion (motion.dev — lib vanilla da equipe do Framer Motion):
   intro orquestrada com spring, reveals em scroll (inView), nav (scrolled/active),
   cursor glow, botões magnéticos e cardápio (menu.json). */
import { animate, inView, stagger } from "motion";

window.__motionOK = true; // sinaliza pra rede de segurança inline que o Motion carregou

(function () {
  document.getElementById("ano").textContent = new Date().getFullYear();
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EASE = [0.22, 1, 0.36, 1];

  /* ---- menu mobile ---- */
  var navToggle = document.getElementById("nav-toggle");
  var navMobile = document.getElementById("nav-mobile");
  if (navToggle && navMobile) {
    navToggle.addEventListener("click", function () {
      var isOpen = navMobile.classList.toggle("flex");
      navMobile.classList.toggle("hidden");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    navMobile.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        navMobile.classList.add("hidden");
        navMobile.classList.remove("flex");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---- nav: estado "scrolled" ---- */
  var nav = document.querySelector(".site-nav");
  function onScroll() { if (nav) nav.classList.toggle("scrolled", window.scrollY > 10); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- cursor glow ---- */
  var glow = document.querySelector(".cursor-glow");
  if (glow && window.matchMedia("(hover: hover)").matches && !reduceMotion) {
    var gx = innerWidth / 2, gy = innerHeight / 2, cx = gx, cy = gy;
    document.body.classList.add("cursor-on");
    addEventListener("mousemove", function (e) { gx = e.clientX; gy = e.clientY; });
    (function loop() {
      cx += (gx - cx) * 0.12; cy += (gy - cy) * 0.12;
      glow.style.transform = "translate3d(" + cx + "px," + cy + "px,0) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
  }

  /* ---- botões magnéticos ---- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + mx * 0.25 + "px," + my * 0.35 + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---- rede de segurança: garante conteúdo visível ---- */
  function forceShow(sel) {
    document.querySelectorAll(sel).forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
    document.querySelectorAll(".hero-title .line > span[data-intro]").forEach(function (el) { el.style.transform = "translateY(0)"; });
    var w = document.querySelector("[data-intro-canvas]");
    if (w) { w.style.opacity = 1; w.style.transform = "none"; }
  }

  /* ---- intro orquestrada (Motion + spring) ---- */
  function runIntro() {
    if (reduceMotion) { forceShow("[data-intro]"); return; }
    try {
      animate(".hero-eyebrow[data-intro]", { opacity: [0, 1], y: [12, 0] }, { duration: 0.6, delay: 0.15, easing: EASE });
      animate(".hero-title .line > span[data-intro]", { y: ["110%", "0%"] },
        { duration: 0.9, delay: stagger(0.12, { start: 0.35 }), easing: EASE });
      animate(".hero-lede[data-intro]", { opacity: [0, 1], y: [18, 0] }, { duration: 0.7, delay: 0.7, easing: EASE });
      animate(".hero-cta[data-intro]", { opacity: [0, 1], y: [18, 0] }, { duration: 0.7, delay: 0.9, easing: EASE });
      animate("[data-intro-canvas]", { opacity: [0, 1], scale: [0.9, 1] },
        { type: "spring", stiffness: 60, damping: 14, delay: 0.35 });
      animate(".scroll-cue[data-intro]", { opacity: [0, 1] }, { duration: 0.6, delay: 1.5 });
      setTimeout(function () { forceShow("[data-intro]"); }, 3200); // garante estado final
    } catch (e) { forceShow("[data-intro]"); }
  }
  runIntro();

  /* ---- reveals em scroll (inView) ---- */
  function reveal(el) {
    if (reduceMotion) { el.style.opacity = 1; el.style.transform = "none"; return; }
    inView(el, function () {
      animate(el, { opacity: [0, 1], y: [30, 0] }, { duration: 0.85, easing: EASE });
    }, { amount: 0.15 });
  }
  document.querySelectorAll(".reveal").forEach(reveal);

  /* ---- nav active link por seção ---- */
  ["cardapio", "ambiente", "localizacao", "contato"].forEach(function (id) {
    var sec = document.getElementById(id);
    var link = document.querySelector('.nav-link[href="#' + id + '"]');
    if (!sec || !link) return;
    inView(sec, function () {
      document.querySelectorAll(".nav-link").forEach(function (l) { l.classList.remove("active"); });
      link.classList.add("active");
      return function () {};
    }, { amount: 0.5 });
  });

  /* ---- parallax dos pontinhos flutuantes ---- */
  if (!reduceMotion) {
    var floaties = document.querySelectorAll(".floaty");
    addEventListener("mousemove", function (e) {
      var cxp = e.clientX / innerWidth - 0.5, cyp = e.clientY / innerHeight - 0.5;
      floaties.forEach(function (el) {
        var depth = parseFloat(el.dataset.depth || "0.02") * 100;
        el.style.transform = "translate(" + cxp * depth + "px," + cyp * depth + "px)";
      });
    });
  }

  /* ---- cardápio a partir de menu.json ---- */
  fetch("assets/data/menu.json")
    .then(function (r) { return r.json(); })
    .then(function (categorias) {
      var container = document.getElementById("menu-list");
      if (!container) return;
      categorias.forEach(function (cat) {
        var section = document.createElement("div");
        var title = document.createElement("h3");
        title.className = "font-display text-glow text-3xl mb-6 reveal";
        title.textContent = cat.categoria;
        section.appendChild(title);

        var grid = document.createElement("div");
        grid.className = "grid sm:grid-cols-2 gap-4";
        cat.itens.forEach(function (item) {
          var card = document.createElement("div");
          card.className = "menu-card reveal";
          card.innerHTML =
            '<div class="row">' +
              '<span class="nome">' + item.nome + '</span>' +
              '<span class="leader"></span>' +
              '<span class="preco">R$ ' + item.preco + '</span>' +
            '</div>' +
            '<p class="desc">' + item.descricao + '</p>';
          grid.appendChild(card);
        });
        section.appendChild(grid);
        container.appendChild(section);
      });
      document.querySelectorAll("#menu-list .reveal").forEach(reveal);
    })
    .catch(function (err) { console.error("Falha ao carregar cardápio:", err); });
})();
