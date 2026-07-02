/* Cardápio + carrinho + checkout via WhatsApp — Quintal.
   Auto-suficiente (sem dependências). Lê assets/data/menu.json. */
(function () {
  "use strict";

  // TODO: confirmar o WhatsApp real (celular) do Quintal. Landline não funciona no wa.me.
  var WHATSAPP = "556934611766";
  var SIZES = [
    { key: "grande", nome: "Grande", fatias: "12 fatias · até 4 sabores" },
    { key: "media", nome: "Média", fatias: "8 fatias · até 3 sabores" },
    { key: "pequena", nome: "Pequena", fatias: "6 fatias · até 2 sabores" },
  ];

  var $ = function (id) { return document.getElementById(id); };
  function money(n) { return "R$ " + Number(n).toFixed(2).replace(".", ","); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  var DATA = [];
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem("quintal_cart") || "[]"); } catch (e) { cart = []; }
  var drawerView = "cart";

  /* ---------- utilidades gerais de UI ---------- */
  var y = $("ano"); if (y) y.textContent = new Date().getFullYear();

  var navToggle = $("nav-toggle"), navMobile = $("nav-mobile");
  if (navToggle && navMobile) {
    navToggle.addEventListener("click", function () {
      var open = navMobile.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  var glow = document.querySelector(".cursor-glow");
  if (glow && matchMedia("(hover: hover)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var gx = innerWidth / 2, gy = innerHeight / 2, cx = gx, cy = gy;
    document.body.classList.add("cursor-on");
    addEventListener("mousemove", function (e) { gx = e.clientX; gy = e.clientY; });
    (function loop() { cx += (gx - cx) * 0.12; cy += (gy - cy) * 0.12;
      glow.style.transform = "translate3d(" + cx + "px," + cy + "px,0) translate(-50%,-50%)"; requestAnimationFrame(loop); })();
  }

  var toastTimer;
  function toast(msg) {
    var t = $("toast"); if (!t) return;
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* ---------- carrinho: estado ---------- */
  function saveCart() { try { localStorage.setItem("quintal_cart", JSON.stringify(cart)); } catch (e) {} renderFab(); }
  function cartCount() { return cart.reduce(function (s, l) { return s + l.qty; }, 0); }
  function cartTotal() { return cart.reduce(function (s, l) { return s + l.unit * l.qty; }, 0); }

  function addLine(line) {
    var found = null;
    for (var i = 0; i < cart.length; i++) { if (cart[i].key === line.key) { found = cart[i]; break; } }
    if (found) found.qty += line.qty; else cart.push(line);
    saveCart();
  }
  function setQty(key, qty) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].key === key) { cart[i].qty = qty; if (qty <= 0) cart.splice(i, 1); break; }
    }
    saveCart();
    if (drawerView === "cart") renderDrawerCart();
  }

  function renderFab() {
    var fab = $("cart-fab"), c = cartCount();
    if (!fab) return;
    $("cart-count").textContent = c;
    fab.hidden = c === 0;
  }

  /* ---------- render do menu ---------- */
  function pizzasDaCategoria(catNome) {
    var cat = DATA.filter(function (c) { return c.categoria === catNome; })[0];
    return cat ? cat.itens : [];
  }

  function renderMenu() {
    var list = $("menu-list");
    var loading = $("menu-loading"); if (loading) loading.remove();
    list.innerHTML = "";
    DATA.forEach(function (cat) {
      var wrap = document.createElement("div");
      wrap.className = "menu-cat";
      var h = document.createElement("h3");
      h.textContent = cat.categoria;
      wrap.appendChild(h);

      var grid = document.createElement("div");
      grid.className = "menu-grid";

      cat.itens.forEach(function (item, idx) {
        var mi = document.createElement("div");
        mi.className = "mi";
        var priceLabel = cat.tipo === "pizza"
          ? "a partir de " + money(item.precos.pequena)
          : money(item.preco);
        mi.innerHTML =
          '<div class="info">' +
            '<p class="nome">' + esc(item.nome) + "</p>" +
            '<p class="desc">' + esc(item.descricao) + "</p>" +
            '<p class="price">' + priceLabel + "</p>" +
          "</div>" +
          '<div class="add"><button class="btn-add" type="button">+ Adicionar</button></div>';
        mi.querySelector(".btn-add").addEventListener("click", function () {
          if (cat.tipo === "pizza") openPizzaModal(cat, item);
          else {
            addLine({ key: "s|" + item.nome, nome: item.nome, meta: item.descricao, unit: item.preco, qty: 1 });
            toast(item.nome + " adicionado");
          }
        });
        grid.appendChild(mi);
      });
      wrap.appendChild(grid);
      list.appendChild(wrap);
    });
    renderFab();
  }

  /* ---------- modal de configuração da pizza ---------- */
  var modalState = null;
  function openPizzaModal(cat, item) {
    modalState = { cat: cat, item: item, size: "grande", tipo: "inteira", flavor2: "", qty: 1 };
    renderModal();
    var m = $("modal"); m.classList.add("show");
  }
  function closeModal() { $("modal").classList.remove("show"); modalState = null; }

  function modalUnitPrice() {
    var s = modalState, base = s.item.precos[s.size];
    if (s.tipo === "meio" && s.flavor2) {
      var other = pizzasDaCategoria(s.cat.categoria).filter(function (p) { return p.nome === s.flavor2; })[0];
      if (other) base = Math.max(base, other.precos[s.size]);
    }
    return base;
  }

  function renderModal() {
    var s = modalState;
    var others = pizzasDaCategoria(s.cat.categoria);
    var sizeOpts = SIZES.map(function (sz) {
      return '<button type="button" class="opt ' + (s.size === sz.key ? "sel" : "") + '" data-size="' + sz.key + '">' +
        sz.nome + "<small>" + money(s.item.precos[sz.key]) + "</small></button>";
    }).join("");
    var tipoOpts =
      '<button type="button" class="opt ' + (s.tipo === "inteira" ? "sel" : "") + '" data-tipo="inteira">Inteira<small>1 sabor</small></button>' +
      '<button type="button" class="opt ' + (s.tipo === "meio" ? "sel" : "") + '" data-tipo="meio">Meio a meio<small>2 sabores</small></button>';
    var flavorSel = "";
    if (s.tipo === "meio") {
      var opts = others.map(function (p) {
        return '<option value="' + esc(p.nome) + '"' + (s.flavor2 === p.nome ? " selected" : "") + ">" + esc(p.nome) + "</option>";
      }).join("");
      flavorSel =
        '<span class="field-label">2º sabor</span>' +
        '<select id="m-flavor2"><option value="">Escolha o segundo sabor…</option>' + opts + "</select>" +
        '<p class="hint">No meio a meio vale o preço do sabor mais caro.</p>';
    }
    var unit = modalUnitPrice();
    $("modal-card").innerHTML =
      '<button class="drawer-close" id="m-close" aria-label="Fechar" style="position:absolute;top:1rem;right:1rem;">✕</button>' +
      "<h3>" + esc(s.item.nome) + "</h3>" +
      '<p class="m-desc">' + esc(s.item.descricao) + "</p>" +
      '<span class="field-label">Tamanho</span><div class="opts">' + sizeOpts + "</div>" +
      '<span class="field-label">Sabores</span><div class="opts two">' + tipoOpts + "</div>" +
      flavorSel +
      '<span class="field-label">Quantidade</span>' +
      '<div class="qty" style="margin-top:0"><button type="button" id="m-minus">−</button><span id="m-qty">' + s.qty + '</span><button type="button" id="m-plus">+</button></div>' +
      '<div class="modal-price"><span class="lbl" style="color:var(--ink-dim)">Total</span><span class="mp-val" id="m-total">' + money(unit * s.qty) + "</span></div>" +
      '<div class="modal-actions"><button class="btn btn-primary btn-block" id="m-add">Adicionar ao pedido</button></div>';

    $("m-close").addEventListener("click", closeModal);
    $("modal").onclick = function (e) { if (e.target === $("modal")) closeModal(); };
    Array.prototype.forEach.call($("modal-card").querySelectorAll("[data-size]"), function (b) {
      b.addEventListener("click", function () { s.size = b.getAttribute("data-size"); renderModal(); });
    });
    Array.prototype.forEach.call($("modal-card").querySelectorAll("[data-tipo]"), function (b) {
      b.addEventListener("click", function () { s.tipo = b.getAttribute("data-tipo"); if (s.tipo === "inteira") s.flavor2 = ""; renderModal(); });
    });
    var fsel = $("m-flavor2");
    if (fsel) fsel.addEventListener("change", function () { s.flavor2 = fsel.value; $("m-total").textContent = money(modalUnitPrice() * s.qty); });
    $("m-minus").addEventListener("click", function () { s.qty = Math.max(1, s.qty - 1); $("m-qty").textContent = s.qty; $("m-total").textContent = money(modalUnitPrice() * s.qty); });
    $("m-plus").addEventListener("click", function () { s.qty += 1; $("m-qty").textContent = s.qty; $("m-total").textContent = money(modalUnitPrice() * s.qty); });
    $("m-add").addEventListener("click", function () {
      if (s.tipo === "meio" && !s.flavor2) { toast("Escolha o segundo sabor"); return; }
      var szNome = SIZES.filter(function (x) { return x.key === s.size; })[0].nome;
      var nome = s.tipo === "meio" ? (s.item.nome + " / " + s.flavor2) : s.item.nome;
      var meta = szNome + " · " + (s.tipo === "meio" ? "meio a meio" : "inteira");
      var key = "p|" + s.item.nome + "|" + s.size + "|" + s.tipo + "|" + s.flavor2;
      addLine({ key: key, nome: nome, meta: meta, unit: modalUnitPrice(), qty: s.qty });
      closeModal();
      toast("Adicionado ao pedido");
    });
  }

  /* ---------- gaveta / carrinho ---------- */
  function openDrawer() { drawerView = "cart"; renderDrawerCart(); $("drawer").classList.add("open"); $("backdrop").classList.add("show"); }
  function closeDrawer() { $("drawer").classList.remove("open"); $("backdrop").classList.remove("show"); }

  function renderDrawerCart() {
    drawerView = "cart";
    $("drawer-title").textContent = "Seu pedido";
    var body = $("drawer-body"), foot = $("drawer-foot");
    if (!cart.length) {
      body.innerHTML = '<div class="drawer-empty">Seu carrinho está vazio.<br>Adicione itens do cardápio.</div>';
      foot.innerHTML = "";
      return;
    }
    body.innerHTML = cart.map(function (l) {
      return '<div class="cart-line" data-key="' + esc(l.key) + '">' +
        '<div class="cl-main">' +
          '<div class="cl-nome">' + esc(l.nome) + "</div>" +
          (l.meta ? '<div class="cl-meta">' + esc(l.meta) + "</div>" : "") +
          '<div class="qty"><button type="button" class="q-minus">−</button><span>' + l.qty + '</span><button type="button" class="q-plus">+</button></div>' +
        "</div>" +
        '<div style="text-align:right"><div class="cl-price">' + money(l.unit * l.qty) + "</div>" +
          '<button class="cl-remove" type="button">remover</button></div>' +
      "</div>";
    }).join("");
    Array.prototype.forEach.call(body.querySelectorAll(".cart-line"), function (row) {
      var key = row.getAttribute("data-key");
      var line = cart.filter(function (l) { return l.key === key; })[0];
      row.querySelector(".q-minus").addEventListener("click", function () { setQty(key, line.qty - 1); });
      row.querySelector(".q-plus").addEventListener("click", function () { setQty(key, line.qty + 1); });
      row.querySelector(".cl-remove").addEventListener("click", function () { setQty(key, 0); });
    });
    foot.innerHTML =
      '<div class="summary-row"><span class="lbl">Subtotal</span><span class="val">' + money(cartTotal()) + "</span></div>" +
      '<button class="btn btn-primary btn-block" id="go-checkout">Finalizar pedido</button>' +
      '<p class="hint" style="text-align:center">Taxa de entrega combinada no WhatsApp.</p>';
    $("go-checkout").addEventListener("click", renderCheckout);
  }

  function renderCheckout() {
    drawerView = "checkout";
    $("drawer-title").textContent = "Finalizar pedido";
    var body = $("drawer-body"), foot = $("drawer-foot");
    body.innerHTML =
      '<div class="field"><label>Seu nome *</label><input id="ck-nome" type="text" placeholder="Como te chamamos" autocomplete="name" /></div>' +
      '<span class="field-label">Entrega ou retirada</span>' +
      '<div class="opts two"><button type="button" class="opt sel" data-modo="entrega">Entrega</button><button type="button" class="opt" data-modo="retirada">Retirada no local</button></div>' +
      '<div class="field" id="ck-endereco-wrap"><label>Endereço de entrega *</label><textarea id="ck-endereco" placeholder="Rua, número, bairro e ponto de referência"></textarea></div>' +
      '<span class="field-label">Pagamento</span>' +
      '<div class="opts"><button type="button" class="opt sel" data-pag="Dinheiro">Dinheiro</button><button type="button" class="opt" data-pag="Cartão">Cartão</button><button type="button" class="opt" data-pag="Pix">Pix</button></div>' +
      '<div class="field" id="ck-troco-wrap"><label>Troco para quanto? (opcional)</label><input id="ck-troco" type="text" inputmode="numeric" placeholder="Ex.: 100" /></div>' +
      '<div class="field"><label>Observações (opcional)</label><textarea id="ck-obs" placeholder="Ex.: sem cebola, capricha na borda…"></textarea></div>';

    var modo = "entrega", pag = "Dinheiro";
    Array.prototype.forEach.call(body.querySelectorAll("[data-modo]"), function (b) {
      b.addEventListener("click", function () {
        modo = b.getAttribute("data-modo");
        body.querySelectorAll("[data-modo]").forEach(function (x) { x.classList.toggle("sel", x === b); });
        $("ck-endereco-wrap").style.display = modo === "entrega" ? "" : "none";
      });
    });
    Array.prototype.forEach.call(body.querySelectorAll("[data-pag]"), function (b) {
      b.addEventListener("click", function () {
        pag = b.getAttribute("data-pag");
        body.querySelectorAll("[data-pag]").forEach(function (x) { x.classList.toggle("sel", x === b); });
        $("ck-troco-wrap").style.display = pag === "Dinheiro" ? "" : "none";
      });
    });

    foot.innerHTML =
      '<div class="summary-row"><span class="lbl">Total</span><span class="val">' + money(cartTotal()) + "</span></div>" +
      '<button class="btn btn-primary btn-block" id="send-wa">Enviar pelo WhatsApp</button>' +
      '<button class="btn btn-ghost btn-block" id="back-cart" style="margin-top:0.6rem">Voltar ao carrinho</button>';
    $("back-cart").addEventListener("click", renderDrawerCart);
    $("send-wa").addEventListener("click", function () {
      var nome = ($("ck-nome").value || "").trim();
      var endereco = ($("ck-endereco").value || "").trim();
      var troco = ($("ck-troco").value || "").trim();
      var obs = ($("ck-obs").value || "").trim();
      if (!nome) { toast("Informe seu nome"); $("ck-nome").focus(); return; }
      if (modo === "entrega" && !endereco) { toast("Informe o endereço de entrega"); $("ck-endereco").focus(); return; }
      openWhatsApp({ nome: nome, modo: modo, endereco: endereco, pag: pag, troco: troco, obs: obs });
    });
  }

  function openWhatsApp(info) {
    var linhas = ["*Pedido — Quintal Restaurante e Pizzaria*", ""];
    cart.forEach(function (l) {
      linhas.push("• " + l.qty + "x " + l.nome + (l.meta ? " (" + l.meta + ")" : "") + " — " + money(l.unit * l.qty));
    });
    linhas.push("");
    linhas.push("*Subtotal:* " + money(cartTotal()));
    linhas.push("*Tipo:* " + (info.modo === "entrega" ? "Entrega" : "Retirada no local"));
    if (info.modo === "entrega") linhas.push("*Endereço:* " + info.endereco);
    var pagTxt = info.pag;
    if (info.pag === "Dinheiro" && info.troco) pagTxt += " (troco para " + info.troco + ")";
    linhas.push("*Pagamento:* " + pagTxt);
    if (info.obs) linhas.push("*Obs:* " + info.obs);
    linhas.push("*Nome:* " + info.nome);
    var url = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(linhas.join("\n"));
    window.open(url, "_blank");
  }

  /* ---------- ligações de UI ---------- */
  $("cart-fab").addEventListener("click", openDrawer);
  var navCart = $("nav-cart"); if (navCart) navCart.addEventListener("click", openDrawer);
  $("drawer-close").addEventListener("click", closeDrawer);
  $("backdrop").addEventListener("click", closeDrawer);
  addEventListener("keydown", function (e) {
    if (e.key === "Escape") { if ($("modal").classList.contains("show")) closeModal(); else closeDrawer(); }
  });

  /* ---------- carrega o cardápio (cache-bust: edições aparecem na hora) ---------- */
  fetch("assets/data/menu.json?v=" + Date.now())
    .then(function (r) { return r.json(); })
    .then(function (data) { DATA = data; renderMenu(); })
    .catch(function (err) {
      console.error("Falha ao carregar cardápio:", err);
      var l = $("menu-loading"); if (l) l.textContent = "Não foi possível carregar o cardápio. Tente recarregar a página.";
    });

  renderFab();
})();
