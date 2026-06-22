const money = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

const cartKey = "le-api-di-sephora-cart";
const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");

const cartCount = document.querySelector("#cartCount");
const cartEmpty = document.querySelector("#cartEmpty");
const cartList = document.querySelector("#cartList");
const cartTotal = document.querySelector("#cartTotal");
const checkoutLink = document.querySelector("#checkoutLink");
const checkoutForm = document.querySelector("#checkoutForm");
const checkoutStage = document.querySelector("#checkoutStage");
const checkoutItems = document.querySelector("#checkoutItems");
const checkoutSubtotal = document.querySelector("#checkoutSubtotal");
const checkoutContent = document.querySelector("#checkoutContent");
const checkoutEmpty = document.querySelector("#checkoutEmpty");
const checkoutSuccess = document.querySelector("#checkoutSuccess");
const shippingFields = document.querySelector("#shippingFields");
const deliveryInputs = Array.from(document.querySelectorAll('input[name="delivery"]'));
const orderMessage = document.querySelector("#orderMessage");
const copyOrderButton = document.querySelector("#copyOrderButton");
const clearCartButton = document.querySelector("#clearCartButton");
const cartStatus = document.querySelector("#cartStatus");
const productGrid = document.querySelector(".product-grid");
const productCards = Array.from(document.querySelectorAll("[data-product]"));
const productSearch = document.querySelector("#productSearch");
const categoryButtons = Array.from(document.querySelectorAll("[data-filter-category]"));
const sortProducts = document.querySelector("#sortProducts");
const resultCount = document.querySelector("#resultCount");
const filterButton = document.querySelector(".filter-button");
const featuredTrack = document.querySelector("#featuredTrack");
const featuredPrevious = document.querySelector("#featuredPrevious");
const featuredNext = document.querySelector("#featuredNext");
const headerCartAction = document.querySelector(".header-action");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let cartDrawer = null;
let drawerCartEmpty = null;
let drawerCartList = null;
let drawerCartTotal = null;
let drawerCheckout = null;
let drawerClearButton = null;
let cartDrawerCloseButton = null;
let lastCartTrigger = null;
let cartAddedNotice = null;
let cartAddedName = null;
let cartAddedMeta = null;
let cartAddedTimer = 0;
let activeCategory = "all";

const categoryFromUrl = new URLSearchParams(window.location.search).get("categoria");
if (categoryFromUrl && categoryButtons.some((button) => button.dataset.filterCategory === categoryFromUrl)) {
  activeCategory = categoryFromUrl;
  categoryButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filterCategory === activeCategory);
  });
}

function saveCart() {
  localStorage.setItem(cartKey, JSON.stringify(cart));
}

function getLineTotal(item) {
  return item.price * item.qty;
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + getLineTotal(item), 0);
}

function getItemFormat(item) {
  if (item.format) {
    return item.format;
  }

  return item.size ? `${item.size} g` : "Formato da confermare";
}

function openCartDrawer() {
  if (!cartDrawer) {
    return;
  }

  lastCartTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  cartDrawer.hidden = false;
  window.requestAnimationFrame(() => cartDrawer?.classList.add("is-open"));
  document.body.classList.add("cart-drawer-open");
  cartDrawerCloseButton?.focus();
}

function closeCartDrawer() {
  if (!cartDrawer || cartDrawer.hidden) {
    return;
  }

  cartDrawer.classList.remove("is-open");
  document.body.classList.remove("cart-drawer-open");
  window.setTimeout(() => {
    if (!cartDrawer?.classList.contains("is-open")) {
      cartDrawer.hidden = true;
    }
  }, reduceMotion ? 0 : 220);
  lastCartTrigger?.focus();
}

function closeCartAddedNotice() {
  if (!cartAddedNotice || cartAddedNotice.hidden) {
    return;
  }

  window.clearTimeout(cartAddedTimer);
  cartAddedNotice.classList.remove("is-visible");
  window.setTimeout(() => {
    if (!cartAddedNotice?.classList.contains("is-visible")) {
      cartAddedNotice.hidden = true;
    }
  }, reduceMotion ? 0 : 180);
}

function showCartAddedNotice(name, format) {
  if (!cartAddedNotice || !cartAddedName || !cartAddedMeta) {
    return;
  }

  window.clearTimeout(cartAddedTimer);
  cartAddedName.textContent = name;
  cartAddedMeta.textContent = `${format} aggiunto al carrello`;
  cartAddedNotice.hidden = false;
  window.requestAnimationFrame(() => cartAddedNotice?.classList.add("is-visible"));
  cartAddedTimer = window.setTimeout(closeCartAddedNotice, 4800);
}

function setupCartDrawer() {
  if (!headerCartAction || document.querySelector("#cartDrawer")) {
    return;
  }

  document.body.insertAdjacentHTML("beforeend", `
    <div class="cart-drawer" id="cartDrawer" hidden>
      <button class="cart-drawer-backdrop" type="button" aria-label="Chiudi il carrello"></button>
      <aside class="cart-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="cartDrawerTitle" tabindex="-1">
        <header class="cart-drawer-header">
          <div>
            <p class="eyebrow">Il tuo ordine</p>
            <h2 id="cartDrawerTitle">Carrello</h2>
          </div>
          <button class="cart-drawer-close" type="button" aria-label="Chiudi il carrello" title="Chiudi">x</button>
        </header>
        <div class="cart-drawer-body">
          <p class="cart-drawer-empty" id="drawerCartEmpty" aria-live="polite">Il carrello e vuoto.</p>
          <div class="cart-drawer-list" id="drawerCartList" aria-live="polite"></div>
        </div>
        <footer class="cart-drawer-footer">
          <div class="cart-drawer-total"><span>Totale prodotti</span><strong id="drawerCartTotal">EUR 0,00</strong></div>
          <p>Disponibilita e consegna vengono confermate prima dell'ordine.</p>
          <a class="drawer-checkout" id="drawerCheckout" href="checkout.html">Procedi al checkout</a>
          <a class="drawer-continue" href="shop.html">Continua gli acquisti</a>
          <button class="drawer-clear" id="drawerClearButton" type="button">Svuota carrello</button>
        </footer>
      </aside>
    </div>
    <aside class="cart-added-notice" id="cartAddedNotice" aria-live="polite" aria-label="Prodotto aggiunto al carrello" hidden>
      <button class="cart-added-close" type="button" aria-label="Chiudi avviso" title="Chiudi">x</button>
      <p class="eyebrow">Aggiunto al carrello</p>
      <strong id="cartAddedName"></strong>
      <span id="cartAddedMeta"></span>
      <div class="cart-added-actions">
        <button class="cart-added-view" type="button">Vedi carrello</button>
        <button class="cart-added-continue" type="button">Continua</button>
      </div>
    </aside>
  `);

  cartDrawer = document.querySelector("#cartDrawer");
  drawerCartEmpty = document.querySelector("#drawerCartEmpty");
  drawerCartList = document.querySelector("#drawerCartList");
  drawerCartTotal = document.querySelector("#drawerCartTotal");
  drawerCheckout = document.querySelector("#drawerCheckout");
  drawerClearButton = document.querySelector("#drawerClearButton");
  cartDrawerCloseButton = document.querySelector(".cart-drawer-close");
  cartAddedNotice = document.querySelector("#cartAddedNotice");
  cartAddedName = document.querySelector("#cartAddedName");
  cartAddedMeta = document.querySelector("#cartAddedMeta");

  headerCartAction.addEventListener("click", (event) => {
    event.preventDefault();
    closeCartAddedNotice();
    openCartDrawer();
  });
  document.querySelector(".cart-drawer-backdrop")?.addEventListener("click", closeCartDrawer);
  cartDrawerCloseButton?.addEventListener("click", closeCartDrawer);
  document.querySelector(".drawer-continue")?.addEventListener("click", closeCartDrawer);
  drawerCheckout?.addEventListener("click", (event) => {
    if (!cart.length) {
      event.preventDefault();
    }
  });
  drawerClearButton?.addEventListener("click", () => {
    cart.splice(0, cart.length);
    renderCart();
  });
  document.querySelector(".cart-added-close")?.addEventListener("click", closeCartAddedNotice);
  document.querySelector(".cart-added-continue")?.addEventListener("click", closeCartAddedNotice);
  document.querySelector(".cart-added-view")?.addEventListener("click", () => {
    closeCartAddedNotice();
    openCartDrawer();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCartAddedNotice();
      closeCartDrawer();
    }
  });
}

function buildOrderText() {
  if (!cart.length) {
    return "";
  }

  const lines = cart.map((item) => {
    return `- ${item.qty} x ${item.name} ${getItemFormat(item)} (${money.format(item.price)} cad.) = ${money.format(getLineTotal(item))}`;
  });
  const total = getCartTotal();

  return [
    "Ciao, vorrei ordinare:",
    "",
    ...lines,
    "",
    `Totale prodotti: ${money.format(total)}`,
    "",
    "Preferisco: consegna / ritiro",
    "Indirizzo o note:",
  ].join("\n");
}

function renderCheckout() {
  if (!checkoutItems || !checkoutSubtotal || !checkoutContent || !checkoutEmpty) {
    return;
  }

  const hasItems = cart.length > 0;
  checkoutContent.hidden = !hasItems;
  checkoutEmpty.hidden = hasItems;
  checkoutItems.innerHTML = "";
  checkoutSubtotal.textContent = money.format(getCartTotal());

  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "checkout-item";
    row.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <span>${item.qty} x ${getItemFormat(item)}</span>
      </div>
      <strong>${money.format(getLineTotal(item))}</strong>
    `;
    checkoutItems.appendChild(row);
  });
}

function renderCartDrawer() {
  if (!drawerCartList || !drawerCartEmpty || !drawerCartTotal || !drawerCheckout || !drawerClearButton) {
    return;
  }

  drawerCartList.innerHTML = "";
  drawerCartEmpty.hidden = cart.length > 0;
  drawerCartTotal.textContent = money.format(getCartTotal());
  drawerCheckout.classList.toggle("is-disabled", cart.length === 0);
  drawerCheckout.setAttribute("aria-disabled", String(cart.length === 0));
  drawerClearButton.disabled = cart.length === 0;

  cart.forEach((item, index) => {
    const row = document.createElement("article");
    row.className = "drawer-cart-item";
    row.innerHTML = `
      <div class="drawer-cart-item-copy">
        <strong>${item.name}</strong>
        <span>${getItemFormat(item)} - ${money.format(item.price)} cad.</span>
      </div>
      <div class="drawer-cart-item-actions">
        <div>
          <button type="button" data-decrease="${index}" aria-label="Diminuisci quantita">-</button>
          <span>Quantita: ${item.qty}</span>
          <button type="button" data-increase="${index}" aria-label="Aumenta quantita">+</button>
        </div>
        <div>
          <strong>${money.format(getLineTotal(item))}</strong>
          <button class="drawer-remove" type="button" data-remove="${index}" aria-label="Rimuovi ${item.name}">Rimuovi</button>
        </div>
      </div>
    `;
    drawerCartList.appendChild(row);
  });
}

function renderCart() {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = getCartTotal();

  if (cartCount) {
    cartCount.textContent = totalQty;
  }

  renderCheckout();
  renderCartDrawer();

  if (!cartList || !cartEmpty || !cartTotal || !checkoutLink || !copyOrderButton || !clearCartButton) {
    saveCart();
    return;
  }

  cartList.innerHTML = "";
  cartEmpty.hidden = cart.length > 0;
  cartTotal.textContent = money.format(total);
  if (orderMessage) {
    orderMessage.value = buildOrderText();
  }

  checkoutLink.classList.toggle("disabled", cart.length === 0);
  checkoutLink.setAttribute("aria-disabled", String(cart.length === 0));
  copyOrderButton.disabled = cart.length === 0;
  clearCartButton.disabled = cart.length === 0;

  cart.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div class="cart-item-title">
        <span>${item.name}</span>
        <span>${money.format(getLineTotal(item))}</span>
      </div>
      <div class="cart-item-meta">
        <span>${getItemFormat(item)}</span>
        <span>${money.format(item.price)} cad.</span>
      </div>
      <div class="cart-item-actions">
        <span>Quantita: ${item.qty}</span>
        <span>
          <button type="button" data-decrease="${index}" aria-label="Diminuisci quantita">-</button>
          <button type="button" data-increase="${index}" aria-label="Aumenta quantita">+</button>
          <button type="button" data-remove="${index}" aria-label="Rimuovi prodotto">x</button>
        </span>
      </div>
    `;
    cartList.appendChild(row);
  });

  saveCart();
}

function setCartStatus(message) {
  if (!cartStatus) {
    return;
  }

  cartStatus.textContent = message;
  if (!message) {
    return;
  }
  window.setTimeout(() => {
    if (cartStatus.textContent === message) {
      cartStatus.textContent = "";
    }
  }, 2200);
}

function setupProductReveal() {
  const cards = Array.from(document.querySelectorAll(".product-card"));
  if (!cards.length || reduceMotion || !("IntersectionObserver" in window)) {
    cards.forEach((card) => card.classList.add("is-visible"));
    return;
  }

  document.body.classList.add("enhanced-motion");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  cards.forEach((card) => observer.observe(card));
}

function getProductPrice(card) {
  return Number(card.dataset.priceMin || 0);
}

function sortCatalogProducts() {
  if (!productGrid) {
    return;
  }

  const sortValue = sortProducts?.value || "default";
  const sortedCards = [...productCards].sort((a, b) => {
    if (sortValue === "price-asc") {
      return getProductPrice(a) - getProductPrice(b);
    }
    if (sortValue === "price-desc") {
      return getProductPrice(b) - getProductPrice(a);
    }
    if (sortValue === "name-asc") {
      return a.dataset.product.localeCompare(b.dataset.product, "it");
    }
    return Number(a.dataset.originalIndex) - Number(b.dataset.originalIndex);
  });

  sortedCards.forEach((card) => productGrid.appendChild(card));
}

function updateCatalog(revealVisible = false) {
  const query = (productSearch?.value || "").trim().toLowerCase();
  let visibleCount = 0;

  sortCatalogProducts();

  productCards.forEach((card) => {
    const hiveCategories = ["Miele in favo", "Propoli", "Pappa reale", "Polline"];
    const categoryMatches = activeCategory === "all"
      || card.dataset.category === activeCategory
      || (activeCategory === "Alveare" && hiveCategories.includes(card.dataset.category));
    const searchableText = `${card.dataset.product} ${card.dataset.category} ${card.textContent}`.toLowerCase();
    const searchMatches = !query || searchableText.includes(query);
    const isVisible = categoryMatches && searchMatches;

    card.hidden = !isVisible;
    if (isVisible) {
      if (revealVisible) {
        card.classList.add("is-visible");
      }
      visibleCount += 1;
    }
  });

  if (resultCount) {
    resultCount.textContent = `Visualizzazione di ${visibleCount} risultati`;
  }
}

function updatePrice(card) {
  const sizeSelect = card.querySelector("[data-size]");
  const size = sizeSelect.value;
  const format = sizeSelect.selectedOptions[0].textContent.trim();
  const price = Number(card.getAttribute(`data-price-${size}`));
  card.querySelector("[data-price-display]").textContent = money.format(price);
  card.querySelector(".price-row span").textContent = `da ${format}`;
}

productCards.forEach((card, index) => {
  card.dataset.originalIndex = String(index);
  const sizeSelect = card.querySelector("[data-size]");
  const qtyInput = card.querySelector("[data-qty]");

  sizeSelect.addEventListener("change", () => updatePrice(card));

  card.querySelector("[data-add]").addEventListener("click", () => {
    const size = sizeSelect.value;
    const format = sizeSelect.selectedOptions[0].textContent.trim();
    const qty = Math.max(1, Number(qtyInput.value) || 1);
    const price = Number(card.getAttribute(`data-price-${size}`));
    const name = card.dataset.product;
    const existing = cart.find((item) => item.name === name && getItemFormat(item) === format);

    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ name, format, price, qty });
    }

    qtyInput.value = 1;
    renderCart();
    setCartStatus(`${name} aggiunto al carrello.`);
    showCartAddedNotice(name, format);
  });

  updatePrice(card);
});

productSearch?.addEventListener("input", () => updateCatalog(true));
sortProducts?.addEventListener("change", () => updateCatalog(true));
filterButton?.addEventListener("click", () => productSearch?.focus());

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.filterCategory || "all";
    categoryButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    updateCatalog(true);
  });
});

function handleCartItemAction(event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const index = Number(button.dataset.increase ?? button.dataset.decrease ?? button.dataset.remove);
  if (!cart[index]) {
    return;
  }
  if (button.dataset.increase !== undefined) {
    cart[index].qty += 1;
  }
  if (button.dataset.decrease !== undefined) {
    cart[index].qty -= 1;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }
  }
  if (button.dataset.remove !== undefined) {
    cart.splice(index, 1);
  }

  renderCart();
}

cartList?.addEventListener("click", handleCartItemAction);
drawerCartList?.addEventListener("click", handleCartItemAction);

copyOrderButton?.addEventListener("click", async () => {
  const text = buildOrderText();
  if (!text) {
    setCartStatus("Aggiungi prima un prodotto.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    setCartStatus("Ordine copiato.");
  } catch {
    const fallback = document.createElement("textarea");
    fallback.value = text;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.opacity = "0";
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand("copy");
    fallback.remove();
    setCartStatus("Ordine copiato.");
  }
});

clearCartButton?.addEventListener("click", () => {
  cart.splice(0, cart.length);
  renderCart();
  setCartStatus("Carrello svuotato.");
});

function updateShippingFields() {
  if (!shippingFields) {
    return;
  }

  const isShipping = document.querySelector('input[name="delivery"]:checked')?.value === "Spedizione";
  shippingFields.hidden = !isShipping;
  shippingFields.querySelectorAll("input").forEach((input) => {
    input.required = isShipping;
  });
}

function buildCheckoutEmail(formData) {
  const delivery = formData.get("delivery");
  const customer = `${formData.get("firstName")} ${formData.get("lastName")}`.trim();
  const deliveryDetails = delivery === "Spedizione"
    ? [
        formData.get("address"),
        `${formData.get("postalCode")} ${formData.get("city")} (${formData.get("province")})`,
      ].join("\n")
    : "Ritiro da concordare";
  const items = cart.map((item) => {
    return `- ${item.qty} x ${item.name}, ${getItemFormat(item)}: ${money.format(getLineTotal(item))}`;
  });

  return [
    "Nuova richiesta d'ordine - Le Api di Sephora",
    "",
    `Cliente: ${customer}`,
    `Email: ${formData.get("email")}`,
    `Telefono: ${formData.get("phone")}`,
    "",
    `Modalita: ${delivery}`,
    `Dettagli consegna:\n${deliveryDetails}`,
    "",
    "Prodotti:",
    ...items,
    "",
    `Totale prodotti: ${money.format(getCartTotal())}`,
    "Costo consegna da confermare.",
    "",
    `Note: ${formData.get("notes") || "Nessuna"}`,
  ].join("\n");
}

deliveryInputs.forEach((input) => input.addEventListener("change", updateShippingFields));

checkoutForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!cart.length) {
    renderCheckout();
    return;
  }

  const formData = new FormData(checkoutForm);
  const customer = `${formData.get("firstName")} ${formData.get("lastName")}`.trim();
  const subject = `Richiesta d'ordine - ${customer}`;
  const emailBody = buildCheckoutEmail(formData);
  const mailto = `mailto:info@leapidisephora.it?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

  checkoutStage.hidden = true;
  checkoutSuccess.hidden = false;
  window.location.href = mailto;
});

function scrollFeaturedProducts(direction) {
  if (!featuredTrack) {
    return;
  }

  const firstProduct = featuredTrack.querySelector(".featured-product");
  const trackGap = Number.parseFloat(window.getComputedStyle(featuredTrack).columnGap) || 0;
  const scrollAmount = firstProduct
    ? firstProduct.getBoundingClientRect().width + trackGap
    : featuredTrack.clientWidth * 0.78;

  featuredTrack.scrollBy({
    left: scrollAmount * direction,
    behavior: reduceMotion ? "auto" : "smooth",
  });
}

function updateFeaturedControls() {
  if (!featuredTrack) {
    return;
  }

  const maxScroll = featuredTrack.scrollWidth - featuredTrack.clientWidth;
  const scrollPosition = featuredTrack.scrollLeft;
  featuredPrevious?.toggleAttribute("disabled", scrollPosition <= 2);
  featuredNext?.toggleAttribute("disabled", maxScroll <= 2 || scrollPosition >= maxScroll - 2);
}

setupCartDrawer();
drawerCartList?.addEventListener("click", handleCartItemAction);

featuredPrevious?.addEventListener("click", () => scrollFeaturedProducts(-1));
featuredNext?.addEventListener("click", () => scrollFeaturedProducts(1));
featuredTrack?.addEventListener("scroll", updateFeaturedControls, { passive: true });
window.addEventListener("resize", updateFeaturedControls);

setupProductReveal();
updateCatalog();
updateShippingFields();
renderCart();
updateFeaturedControls();
