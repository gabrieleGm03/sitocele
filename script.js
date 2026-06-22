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
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

function renderCart() {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = getCartTotal();

  if (cartCount) {
    cartCount.textContent = totalQty;
  }

  renderCheckout();

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
    document.querySelector("#carrello").scrollIntoView({ behavior: "smooth", block: "start" });
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

cartList?.addEventListener("click", (event) => {
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
});

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

featuredPrevious?.addEventListener("click", () => scrollFeaturedProducts(-1));
featuredNext?.addEventListener("click", () => scrollFeaturedProducts(1));
featuredTrack?.addEventListener("scroll", updateFeaturedControls, { passive: true });
window.addEventListener("resize", updateFeaturedControls);

setupProductReveal();
updateCatalog();
updateShippingFields();
renderCart();
updateFeaturedControls();
