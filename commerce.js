(function () {
  "use strict";
  document.querySelectorAll(".pp-header__ticker").forEach(function (el) { el.textContent = "משלוח חינם בהזמנה מעל 250₪"; });
  var KEY = "paperpop-cart-v1";
  var PRODUCT_IMAGES = { octopus: "/assets/products/octopus-blue-tight-400.webp", duck: "/assets/products/duck-tight-400.webp", heart: "/assets/products/heart-tight-400.webp", soccer: "/assets/products/soccer-tight-400.webp" };
  var cart = read();

  function read() {
    try {
      var value = JSON.parse(localStorage.getItem(KEY) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch (_) { return {}; }
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(cart)); renderCount(); }
  function money(n) { return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n); }
  function items() { return Object.keys(cart).map(function (id) { return cart[id]; }).filter(function (x) { return x.quantity > 0; }); }
  function subtotal() { return items().reduce(function (sum, x) { return sum + x.price * x.quantity; }, 0); }
  function renderCount() {
    var count = items().reduce(function (sum, x) { return sum + x.quantity; }, 0);
    document.querySelectorAll("[data-cart-count]").forEach(function (el) { el.textContent = count; el.hidden = count === 0; });
  }
  function add(btn) {
    var id = btn.dataset.productId;
    if (!id) return;
    if (!cart[id]) cart[id] = { id: id, name: btn.dataset.productName, price: Number(btn.dataset.productPrice), quantity: 0 };
    cart[id].quantity = Math.min(99, cart[id].quantity + 1);
    var original = btn.textContent;
    btn.textContent = "נוסף לסל ✓";
    window.setTimeout(function () { btn.textContent = original; }, 1600);
    save(); openCart(); announce(btn.dataset.productName + " נוסף לסל");
  }
  function announce(text) {
    var live = document.getElementById("cartLive");
    if (live) live.textContent = text;
  }
  function ensureDrawer() {
    if (document.getElementById("cartDrawer")) return;
    document.body.insertAdjacentHTML("beforeend", '<div class="pp-cart-backdrop" data-cart-close hidden></div><aside class="pp-cart" id="cartDrawer" aria-labelledby="cartTitle" aria-modal="true" role="dialog" hidden><div class="pp-cart__head"><h2 id="cartTitle">סל הקניות</h2><button class="pp-iconbtn" type="button" data-cart-close aria-label="סגירת הסל">×</button></div><div data-cart-items></div><div class="pp-cart__foot"><div class="pp-cart__total"><span>סכום ביניים</span><strong data-cart-subtotal></strong></div><p class="pp-cart__shipping-note">משלוח חינם בהזמנה מעל 250 ₪ 🎁</p><a class="pp-btn pp-btn--lg" href="/checkout" data-checkout-link>להמשך להזמנה</a></div></aside><span class="pp-visually-hidden" id="cartLive" aria-live="polite"></span>');
  }
  function renderCart() {
    var box = document.querySelector("[data-cart-items]");
    if (!box) return;
    var list = items();
    box.innerHTML = list.length ? list.map(function (x) {
      var options = Array.from({ length: 99 }, function (_, i) { var n = i + 1; return '<option value="' + n + '"' + (n === x.quantity ? ' selected' : '') + '>' + n + '</option>'; }).join('');
      return '<div class="pp-cart-item"><img class="pp-cart-item__image" src="' + PRODUCT_IMAGES[x.id] + '" alt=""><div class="pp-cart-item__info"><strong>' + esc(x.name) + '</strong><small>' + money(x.price) + ' ליחידה</small><button class="pp-cart-item__remove" type="button" data-remove="' + esc(x.id) + '">הסרה</button></div><label class="pp-cart-item__quantity">כמות<select data-quantity-select data-id="' + esc(x.id) + '">' + options + '</select></label><div class="pp-cart-item__line-total"><small>סכום ביניים</small><strong>' + money(x.price * x.quantity) + '</strong></div></div>';
    }).join("") : '<p class="pp-cart__empty">הסל עדיין ריק.</p>';
    document.querySelector("[data-cart-subtotal]").textContent = money(subtotal());
    document.querySelector("[data-checkout-link]").setAttribute("aria-disabled", list.length ? "false" : "true");
  }
  function esc(s) { var d = document.createElement("div"); d.textContent = String(s); return d.innerHTML; }
  var returnFocus;
  function openCart() { ensureDrawer(); returnFocus = document.activeElement; renderCart(); document.getElementById("cartDrawer").hidden = false; document.querySelector(".pp-cart-backdrop").hidden = false; document.body.classList.add("is-cart-open"); document.querySelector("[data-cart-close]").focus(); }
  function closeCart() { var d = document.getElementById("cartDrawer"); if (!d) return; d.hidden = true; document.querySelector(".pp-cart-backdrop").hidden = true; document.body.classList.remove("is-cart-open"); if (returnFocus) returnFocus.focus(); }

  function shippingCost(kind, sum) { if (kind === "pickup") return 0; if (kind === "registered") return sum >= 250 ? 0 : 17; return kind === "courier" ? 69 : 0; }
  function initCheckout() {
    var form = document.getElementById("checkoutForm");
    if (!form) return;
    if (!items().length) { location.replace("/"); return; }
    var shippingTouched = false;
    var radios = [].slice.call(form.querySelectorAll('[name="shipping"]'));
    function update() {
      var sum = subtotal();
      var registered = form.querySelector('[value="registered"]');
      form.querySelector("[data-registered-price]").textContent = sum >= 250 ? "חינם" : money(17);
      if (sum >= 250 && !shippingTouched && !form.querySelector('[name="shipping"]:checked')) registered.checked = true;
      var selected = form.querySelector('[name="shipping"]:checked');
      var needsAddress = selected && selected.value !== "pickup";
      document.querySelector("[data-address-fields]").hidden = !needsAddress;
      document.querySelectorAll("[data-address-required]").forEach(function (el) { el.required = !!needsAddress; });
      var fee = selected ? shippingCost(selected.value, sum) : 0;
      document.querySelector("[data-checkout-items]").innerHTML = items().map(function (x) { return '<li><span>' + esc(x.name) + ' × ' + x.quantity + '</span><strong>' + money(x.price * x.quantity) + '</strong></li>'; }).join("");
      document.querySelector("[data-checkout-subtotal]").textContent = money(sum);
      document.querySelector("[data-checkout-shipping]").textContent = selected ? (fee ? money(fee) : "חינם") : "טרם נבחר";
      document.querySelector("[data-checkout-total]").textContent = money(sum + fee);
    }
    radios.forEach(function (r) { r.addEventListener("change", function () { shippingTouched = true; update(); }); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.getElementById("checkoutStatus");
      if (!form.reportValidity()) return;
      var data = Object.fromEntries(new FormData(form));
      data.items = items().map(function (x) { return { id: x.id, quantity: x.quantity }; });
      status.textContent = "מכינים את עמוד התשלום…";
      form.querySelector('[type="submit"]').disabled = true;
      fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json", "x-paperpop-request": "checkout" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (b) { if (!r.ok) throw new Error(b.error || "שגיאה"); return b; }); })
        .then(function (b) { sessionStorage.setItem("paperpop-payment-url", b.paymentUrl); location.href = "/payment?order=" + encodeURIComponent(b.orderId); })
        .catch(function () { status.textContent = "לא הצלחנו לפתוח את התשלום. נסו שוב או פנו אלינו."; form.querySelector('[type="submit"]').disabled = false; });
    });
    update();
  }

  document.addEventListener("click", function (e) {
    var addBtn = e.target.closest("[data-add-cart]"); if (addBtn) { add(addBtn); return; }
    if (e.target.closest("[data-cart-open]")) { openCart(); return; }
    if (e.target.closest("[data-cart-close]")) { closeCart(); return; }
    var q = e.target.closest("[data-qty]"); if (q && cart[q.dataset.id]) { cart[q.dataset.id].quantity = Math.max(0, Math.min(99, cart[q.dataset.id].quantity + Number(q.dataset.qty))); save(); renderCart(); }
    var rm = e.target.closest("[data-remove]"); if (rm) { delete cart[rm.dataset.remove]; save(); renderCart(); }
  });
  document.addEventListener("change", function (e) {
    var select = e.target.closest("[data-quantity-select]");
    if (select && cart[select.dataset.id]) { cart[select.dataset.id].quantity = Number(select.value); save(); renderCart(); announce("הכמות עודכנה"); }
  });
  document.addEventListener("keydown", function (e) {
    var drawer = document.getElementById("cartDrawer");
    if (e.key === "Escape") closeCart();
    if (e.key === "Tab" && drawer && !drawer.hidden) {
      var focusable = [].slice.call(drawer.querySelectorAll('a[href],button:not([disabled])'));
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  renderCount(); initCheckout();
  window.PaperPopCart = { clear: function () { cart = {}; save(); } };
})();
