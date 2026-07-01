/* Interações: intro orquestrada, nav (scrolled/active), cursor glow, botões
   magnéticos, reveals em scroll, parallax dos pontinhos e cardápio (menu.json). */
(function () {
  document.getElementById("ano").textContent = new Date().getFullYear();

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

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
  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- cursor glow (brilho que segue o mouse) ---- */
  var glow = document.querySelector(".cursor-glow");
  if (glow && window.matchMedia("(hover: hover)").matches && !reduceMotion) {
    var gx = window.innerWidth / 2, gy = window.innerHeight / 2, cx = gx, cy = gy;
    document.body.classList.add("cursor-on");
    window.addEventListener("mousemove", function (e) { gx = e.clientX; gy = e.clientY; });
    (function follow() {
      cx += (gx - cx) * 0.12;
      cy += (gy - cy) * 0.12;
      glow.style.transform = "translate3d(" + cx + "px," + cy + "px,0) translate(-50%,-50%)";
      requestAnimationFrame(follow);
    })();
  }

  /* ---- botões magnéticos ---- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2;
        var my = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + mx * 0.25 + "px," + my * 0.35 + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---- intro orquestrada do hero ---- */
  // Rede de segurança: garante o conteúdo visível mesmo se GSAP/rAF não rodar.
  function forceShowIntro() {
    document.querySelectorAll("[data-intro]").forEach(function (el) {
      el.style.opacity = 1;
      el.style.transform = "none";
    });
    document.querySelectorAll(".hero-title .line > span[data-intro]").forEach(function (el) {
      el.style.transform = "translateY(0)";
    });
    var wrapEl = document.querySelector("[data-intro-canvas]");
    if (wrapEl) { wrapEl.style.opacity = 1; wrapEl.style.transform = "none"; }
  }

  function runIntro() {
    if (!hasGSAP || reduceMotion) { forceShowIntro(); return; }

    var tl = gsap.timeline({ defaults: { ease: "power3.out" }, onComplete: forceShowIntro });
    tl.from(".site-nav", { y: -30, opacity: 0, duration: 0.7 })
      .fromTo(".hero-eyebrow[data-intro]", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.2")
      .fromTo(".hero-title .line > span[data-intro]", { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1, stagger: 0.12 }, "-=0.35")
      .fromTo(".hero-lede[data-intro]", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7 }, "-=0.6")
      .fromTo(".hero-cta[data-intro]", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7 }, "-=0.45")
      .fromTo("[data-intro-canvas]", { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.1, ease: "power2.out" }, "-=1.1")
      .fromTo(".scroll-cue[data-intro]", { opacity: 0 }, { opacity: 1, duration: 0.6 }, "-=0.3");

    // se o rAF estiver bloqueado (aba não pintada, etc.), revela mesmo assim
    setTimeout(function () {
      if (!tl.progress()) forceShowIntro();
    }, 4200);
  }
  runIntro();

  /* ---- reveals em scroll ---- */
  function bindReveals(nodes) {
    if (hasGSAP && !reduceMotion) {
      nodes.forEach(function (el, i) {
        gsap.to(el, {
          opacity: 1, y: 0, duration: 0.85, ease: "power2.out",
          delay: (i % 6) * 0.06,
          scrollTrigger: { trigger: el, start: "top 86%" },
        });
      });
    } else {
      nodes.forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
    }
  }
  bindReveals(Array.prototype.slice.call(document.querySelectorAll(".reveal")));

  /* ---- nav active link por seção ---- */
  if (hasGSAP && !reduceMotion) {
    ["cardapio", "ambiente", "localizacao", "contato"].forEach(function (id) {
      var sec = document.getElementById(id);
      var link = document.querySelector('.nav-link[href="#' + id + '"]');
      if (!sec || !link) return;
      ScrollTrigger.create({
        trigger: sec, start: "top 55%", end: "bottom 55%",
        onToggle: function (self) {
          if (self.isActive) {
            document.querySelectorAll(".nav-link").forEach(function (l) { l.classList.remove("active"); });
            link.classList.add("active");
          }
        },
      });
    });
  }

  /* ---- parallax sutil dos pontinhos flutuantes ---- */
  if (!reduceMotion) {
    var floaties = document.querySelectorAll(".floaty");
    window.addEventListener("mousemove", function (e) {
      var cxp = e.clientX / window.innerWidth - 0.5;
      var cyp = e.clientY / window.innerHeight - 0.5;
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

      bindReveals(Array.prototype.slice.call(document.querySelectorAll("#menu-list .reveal")));
      if (hasGSAP) ScrollTrigger.refresh();
    })
    .catch(function (err) { console.error("Falha ao carregar cardápio:", err); });
})();
