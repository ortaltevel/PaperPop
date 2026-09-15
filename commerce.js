(function () {
  "use strict";
  document.querySelectorAll(".pp-header__ticker").forEach(function (el) { el.innerHTML = 'משלוח חינם בהזמנה מעל <bdi dir="ltr">₪250</bdi>'; });
  var KEY = "paperpop-cart-v1";
  var CHECKOUT_DRAFT_KEY = "paperpop-checkout-draft-v1";
  var PRODUCT_IMAGES = { octopus: "/assets/products/octopus-blue-tight-400.webp", duck: "/assets/products/duck-tight-400.webp", heart: "/assets/products/heart-tight-400.webp", soccer: "/assets/products/soccer-tight-400.webp" };
  var OCTOPUS_IMAGES = { blue: "/assets/products/octopus-blue-tight-400.webp", pink: "/assets/products/OctepusPink-clean-400.webp", green: "/assets/products/OctepusGreen-clean-400.webp", yellow: "/assets/products/OctepusYellow-clean-400.webp" };
  var cart = read();

  function read() {
    try {
      var value = JSON.parse(localStorage.getItem(KEY) || "{}");
      if (!value || typeof value !== "object") return {};
      Object.keys(value).forEach(function (key) { if (value[key].id === "octopus" && !value[key].color) delete value[key]; });
      return value;
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
    var optionBox = btn.closest(".pp-pdp__info") && btn.closest(".pp-pdp__info").querySelector("[data-product-options]");
    var selected = optionBox && optionBox.querySelector('[name="product-color"]:checked');
    if (optionBox && !selected) {
      var optionError = optionBox.querySelector("[data-option-error]");
      optionError.hidden = false;
      optionBox.setAttribute("aria-invalid", "true");
      optionBox.querySelector('[name="product-color"]').focus();
      announce("יש לבחור צבע לפני הוספה לסל");
      return;
    }
    var color = selected ? selected.value : "", colorLabel = selected ? selected.dataset.optionLabel : "";
    var lineId = id + (color ? "::" + color : "");
    if (!cart[lineId]) cart[lineId] = { id: id, color: color || null, colorLabel: colorLabel || null, name: btn.dataset.productName, price: Number(btn.dataset.productPrice), quantity: 0 };
    cart[lineId].quantity = Math.min(99, cart[lineId].quantity + 1);
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
    document.body.insertAdjacentHTML("beforeend", '<div class="pp-cart-backdrop" data-cart-close hidden></div><aside class="pp-cart" id="cartDrawer" aria-labelledby="cartTitle" aria-modal="true" role="dialog" hidden><div class="pp-cart__head"><h2 id="cartTitle">סל הקניות</h2><button class="pp-iconbtn" type="button" data-cart-close aria-label="סגירת הסל">×</button></div><div data-cart-items></div><div class="pp-cart__foot"><div class="pp-cart__total"><span>סכום ביניים</span><strong data-cart-subtotal></strong></div><div class="pp-shipping-progress"><p data-shipping-progress-text></p><div class="pp-shipping-progress__track" role="progressbar" aria-label="התקדמות למשלוח בדואר רשום חינם" aria-valuemin="0" aria-valuemax="250" data-shipping-progress><span></span></div></div><a class="pp-btn pp-btn--lg" href="/checkout" data-checkout-link>המשך הזמנה</a></div></aside><span class="pp-visually-hidden" id="cartLive" aria-live="polite"></span>');
  }
  function renderCart() {
    var box = document.querySelector("[data-cart-items]");
    if (!box) return;
    var list = items();
    box.innerHTML = list.length ? list.map(function (x) {
      var lineId = x.id + (x.color ? "::" + x.color : "");
      return '<div class="pp-cart-item"><img class="pp-cart-item__image" src="' + productImage(x) + '" alt=""><div class="pp-cart-item__info"><strong>' + esc(x.name) + '</strong>' + (x.colorLabel ? '<small>צבע: ' + esc(x.colorLabel) + '</small>' : '') + '<small>' + money(x.price) + ' ליחידה</small><button class="pp-cart-item__remove" type="button" data-remove="' + esc(lineId) + '">הסרה</button></div><div class="pp-cart-item__quantity" role="group" aria-label="כמות ' + esc(x.name + (x.colorLabel ? " בצבע " + x.colorLabel : "")) + '"><button type="button" data-qty="1" data-id="' + esc(lineId) + '" aria-label="הגדלת כמות">+</button><input type="number" min="1" max="99" inputmode="numeric" value="' + x.quantity + '" data-quantity-input data-id="' + esc(lineId) + '" aria-label="כמות"><button type="button" data-qty="-1" data-id="' + esc(lineId) + '" aria-label="הפחתת כמות">−</button></div><div class="pp-cart-item__line-total"><small>סכום ביניים</small><strong>' + money(x.price * x.quantity) + '</strong></div></div>';
    }).join("") : '<p class="pp-cart__empty">הסל עדיין ריק.</p>';
    document.querySelector("[data-cart-subtotal]").textContent = money(subtotal());
    var sum = subtotal(), remaining = Math.max(0, 250 - sum), progress = document.querySelector("[data-shipping-progress]");
    document.querySelector("[data-shipping-progress-text]").textContent = remaining ? "חסרים " + money(remaining) + " למשלוח בדואר רשום חינם" : "יש! קיבלת משלוח בדואר רשום חינם";
    progress.setAttribute("aria-valuenow", String(Math.min(sum, 250)));
    progress.setAttribute("aria-valuetext", remaining ? "חסרים " + money(remaining) : "הגעת לסכום המזכה");
    progress.querySelector("span").style.width = Math.min(100, sum / 250 * 100) + "%";
    document.querySelector("[data-checkout-link]").setAttribute("aria-disabled", list.length ? "false" : "true");
  }
  function esc(s) { var d = document.createElement("div"); d.textContent = String(s); return d.innerHTML; }
  function productImage(x) { return x.id === "octopus" && x.color ? OCTOPUS_IMAGES[x.color] : PRODUCT_IMAGES[x.id]; }
  var returnFocus;
  function openCart() { ensureDrawer(); returnFocus = document.activeElement; renderCart(); document.getElementById("cartDrawer").hidden = false; document.querySelector(".pp-cart-backdrop").hidden = false; document.body.classList.add("is-cart-open"); document.querySelector("[data-cart-close]").focus(); }
  function closeCart() { var d = document.getElementById("cartDrawer"); if (!d) return; d.hidden = true; document.querySelector(".pp-cart-backdrop").hidden = true; document.body.classList.remove("is-cart-open"); if (returnFocus) returnFocus.focus(); }

  function shippingCost(kind, sum) { if (kind === "pickup") return 0; if (kind === "registered") return sum >= 250 ? 0 : 17; return kind === "courier" ? 69 : 0; }
  function fieldMessage(field) {
    if (!field.value.trim()) return "זהו שדה חובה";
    if (field.type === "email" && !/^\S+@\S+\.\S+$/.test(field.value)) return "יש להזין כתובת אימייל תקינה";
    if (field.name === "phone" && !/^[+\d][\d\s().-]{6,19}$/.test(field.value.trim())) return "יש להזין מספר טלפון תקין";
    return "";
  }
  function setFieldError(field, message) {
    var id = "error-" + field.name, error = document.getElementById(id);
    if (!error) { error = document.createElement("span"); error.id = id; error.className = "pp-field-error"; field.insertAdjacentElement("afterend", error); }
    error.textContent = message;
    error.hidden = !message;
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (message) field.setAttribute("aria-describedby", id); else field.removeAttribute("aria-describedby");
  }
  function validateCheckout(form) {
    var valid = true, first = null;
    form.querySelectorAll("input:not([type=radio]), textarea").forEach(function (field) {
      if (field.closest("[hidden]")) { setFieldError(field, ""); return; }
      var message = field.required || field.value ? fieldMessage(field) : "";
      setFieldError(field, message); if (message && !first) { first = field; valid = false; }
    });
    var shipping = form.querySelector('[name="shipping"]:checked'), group = form.querySelector("fieldset"), error = group.querySelector(".pp-shipping-error");
    if (!error) { error = document.createElement("p"); error.className = "pp-field-error pp-shipping-error"; group.appendChild(error); }
    error.textContent = shipping ? "" : "יש לבחור אופן קבלת ההזמנה"; error.hidden = !!shipping;
    form.querySelectorAll('[name="shipping"]').forEach(function (radio) { radio.setAttribute("aria-invalid", shipping ? "false" : "true"); });
    if (!shipping) { valid = false; if (!first) first = form.querySelector('[name="shipping"]'); }
    if (first) first.focus(); return valid;
  }
  function initCheckout() {
    var form = document.getElementById("checkoutForm");
    if (!form) return;
    var title = document.querySelector(".pp-checkout h1");
    if (title) title.insertAdjacentHTML("beforebegin", '<a class="pp-checkout-back" href="/#gallery"><span aria-hidden="true">→</span><span class="pp-checkout-back__label">המשך קניות</span></a>');
    if (!items().length) { location.replace("/"); return; }
    try {
      var draft = JSON.parse(sessionStorage.getItem(CHECKOUT_DRAFT_KEY) || "null");
      if (draft && typeof draft === "object") Object.keys(draft).forEach(function (name) {
        var field = form.elements[name];
        if (!field || name === "items") return;
        if (field instanceof RadioNodeList) {
          [].slice.call(form.querySelectorAll('[name="' + CSS.escape(name) + '"]')).forEach(function (radio) { radio.checked = radio.value === draft[name]; });
        } else field.value = draft[name];
      });
    } catch (_) { sessionStorage.removeItem(CHECKOUT_DRAFT_KEY); }
    if (new URLSearchParams(location.search).get("payment") === "failed") {
      form.insertAdjacentHTML("afterbegin", '<div class="pp-payment-error" role="alert" tabindex="-1"><strong>התשלום לא הושלם</strong><p>לא התקבל אצלנו אישור תשלום, ולכן ההזמנה עדיין לא הושלמה. אפשר לבדוק את הפרטים ולנסות שוב.</p></div>');
      form.querySelector(".pp-payment-error").focus();
    }
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
      document.querySelector("[data-checkout-items]").innerHTML = items().map(function (x) { return '<li><span>' + esc(x.name) + (x.colorLabel ? ' · ' + esc(x.colorLabel) : '') + ' × ' + x.quantity + '</span><strong>' + money(x.price * x.quantity) + '</strong></li>'; }).join("");
      document.querySelector("[data-checkout-subtotal]").textContent = money(sum);
      document.querySelector("[data-checkout-shipping]").textContent = selected ? (fee ? money(fee) : "חינם") : "טרם נבחר";
      document.querySelector("[data-checkout-total]").textContent = money(sum + fee);
    }
    radios.forEach(function (r) { r.addEventListener("change", function () { shippingTouched = true; update(); }); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.getElementById("checkoutStatus");
      if (!validateCheckout(form)) { status.textContent = "יש לתקן את השדות המסומנים"; return; }
      var data = Object.fromEntries(new FormData(form));
      data.items = items().map(function (x) { return { id: x.id, color: x.color || null, quantity: x.quantity }; });
      sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(data));
      status.textContent = "מכינים את עמוד התשלום…";
      form.querySelector('[type="submit"]').disabled = true;
      fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json", "x-paperpop-request": "checkout" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (b) { if (!r.ok) throw new Error(b.error || "שגיאה"); return b; }); })
        .then(function (b) { sessionStorage.setItem("paperpop-payment-url", b.paymentUrl); location.href = "/payment?order=" + encodeURIComponent(b.orderId); })
        .catch(function () { status.textContent = "לא הצלחנו לפתוח את התשלום. נסו שוב או פנו אלינו."; form.querySelector('[type="submit"]').disabled = false; });
    });
    form.addEventListener("input", function (e) { if (e.target.matches("input:not([type=radio]), textarea") && e.target.getAttribute("aria-invalid") === "true") setFieldError(e.target, e.target.required || e.target.value ? fieldMessage(e.target) : ""); });
    form.addEventListener("change", function (e) { if (e.target.name === "shipping") { var error = form.querySelector(".pp-shipping-error"); if (error) { error.textContent = ""; error.hidden = true; } form.querySelectorAll('[name="shipping"]').forEach(function (radio) { radio.setAttribute("aria-invalid", "false"); }); } });
    update();
  }

  document.addEventListener("click", function (e) {
    var addBtn = e.target.closest("[data-add-cart]"); if (addBtn) { add(addBtn); return; }
    if (e.target.closest("[data-cart-open]")) { openCart(); return; }
    if (e.target.closest("[data-cart-close]")) { closeCart(); return; }
    var q = e.target.closest("[data-qty]"); if (q && cart[q.dataset.id]) { cart[q.dataset.id].quantity = Math.max(1, Math.min(99, cart[q.dataset.id].quantity + Number(q.dataset.qty))); save(); renderCart(); }
    var rm = e.target.closest("[data-remove]"); if (rm) { delete cart[rm.dataset.remove]; save(); renderCart(); }
  });
  document.addEventListener("change", function (e) {
    if (e.target.matches('[name="product-color"]')) {
      var box = e.target.closest("[data-product-options]"); box.removeAttribute("aria-invalid"); box.querySelector("[data-option-error]").hidden = true;
      box.querySelector("[data-selected-color]").textContent = e.target.dataset.optionLabel;
      var colorMediaIndex = { blue: 0, pink: 1, yellow: 2, green: 3 }[e.target.value];
      var colorThumbs = document.querySelectorAll(".pp-pdp__thumb");
      if (colorThumbs[colorMediaIndex]) colorThumbs[colorMediaIndex].click();
    }
    var input = e.target.closest("[data-quantity-input]");
    if (input && cart[input.dataset.id]) { cart[input.dataset.id].quantity = Math.max(1, Math.min(99, Number(input.value) || 1)); save(); renderCart(); announce("הכמות עודכנה"); }
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
  window.PaperPopCart = { clear: function () { cart = {}; sessionStorage.removeItem(CHECKOUT_DRAFT_KEY); save(); } };
})();
