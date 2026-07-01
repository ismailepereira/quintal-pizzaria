/* GSAP/ScrollTrigger: reveals, parallax dos pontinhos flutuantes, menu mobile
   e carregamento do cardápio a partir de assets/data/menu.json. */
(function () {
  document.getElementById("ano").textContent = new Date().getFullYear();

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  /* ---- reveals em scroll ---- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll(".reveal").forEach(function (el, i) {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: reduceMotion ? 0 : (i % 6) * 0.06,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.style.opacity = 1;
      el.style.transform = "none";
    });
  }

  /* ---- parallax sutil dos pontinhos flutuantes ---- */
  if (!reduceMotion) {
    var floaties = document.querySelectorAll(".floaty");
    window.addEventListener("mousemove", function (e) {
      var cx = e.clientX / window.innerWidth - 0.5;
      var cy = e.clientY / window.innerHeight - 0.5;
      floaties.forEach(function (el) {
        var depth = parseFloat(el.dataset.depth || "0.02") * 100;
        el.style.transform = "translate(" + cx * depth + "px, " + cy * depth + "px)";
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
        title.className = "font-display text-glow text-2xl mb-6 reveal";
        title.textContent = cat.categoria;
        section.appendChild(title);

        var grid = document.createElement("div");
        grid.className = "grid sm:grid-cols-2 gap-4";

        cat.itens.forEach(function (item) {
          var card = document.createElement("div");
          card.className = "menu-card reveal flex items-start justify-between gap-4";
          card.innerHTML =
            '<div>' +
              '<p class="font-display text-lg text-cream">' + item.nome + '</p>' +
              '<p class="text-white/60 text-sm mt-1">' + item.descricao + '</p>' +
            '</div>' +
            '<span class="preco">R$ ' + item.preco + '</span>';
          grid.appendChild(card);
        });

        section.appendChild(grid);
        container.appendChild(section);
      });

      // reativa GSAP nos itens recém-inseridos
      if (window.gsap && window.ScrollTrigger) {
        document.querySelectorAll("#menu-list .reveal").forEach(function (el, i) {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            delay: reduceMotion ? 0 : (i % 6) * 0.05,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 90%" },
          });
        });
      } else {
        document.querySelectorAll("#menu-list .reveal").forEach(function (el) {
          el.style.opacity = 1;
          el.style.transform = "none";
        });
      }
    })
    .catch(function (err) {
      console.error("Falha ao carregar cardápio:", err);
    });
})();
