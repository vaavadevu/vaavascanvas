const CHARGE_DAY = 25;
const PRICE_FALLBACK = 109;

const form = document.getElementById("post-club-form");
const status = document.getElementById("post-club-status");
const submitButton = form?.querySelector("button[type='submit']");

function setStatus(message, type) {
  if (!status) return;
  status.textContent = message;
  status.className = `post-club-status ${type}`;
}

function translated(key, fallback, values = {}) {
  const raw = typeof t === "function" ? t(key) : key;
  const text = raw === key ? fallback : raw;
  return text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
}

function lang() {
  return window.currentLang || "sv";
}

// Read before rendering: the success line names the month the letter goes out,
// which is only known once the quarter data has loaded.
const checkoutResult = new URLSearchParams(window.location.search).get("postClub");
if (checkoutResult === "success") {
  setStatus(translated("post_club_status_success", "Tack! Betalningen är klar."), "success");
} else if (checkoutResult === "cancelled") {
  setStatus(translated("post_club_status_cancelled", "Betalningen avbröts. Du kan försöka igen när du vill."), "error");
}

function localised(value) {
  if (!value) return "";
  return value[lang()] || value.sv || "";
}

/* ── Schedule ──────────────────────────────────────────────────
   A letter posted in month M is paid for on the 25th of M-1. Joining
   charges you right away for the next letter whose charge day has not
   already passed, so a sign-up on the 26th lands in the following quarter. */

function shipDate(id) {
  const [year, month] = id.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function chargeDate(id) {
  const [year, month] = id.split("-").map(Number);
  return new Date(year, month - 2, CHARGE_DAY);
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
}

function formatter(options) {
  return new Intl.DateTimeFormat(lang() === "en" ? "en-GB" : "sv-SE", options);
}

function monthName(date) {
  return formatter({ month: "long" }).format(date);
}

function monthYear(date) {
  return formatter({ month: "long", year: "numeric" }).format(date);
}

function fullDate(date) {
  return formatter({ day: "numeric", month: "long", year: "numeric" }).format(date);
}

// The schedule comes from the calendar, not from the data file, so the page
// still names the right month when the next quarter has not been written yet.
function nextShipId(now = new Date()) {
  const months = [...(data?.shipMonths || [1, 4, 7, 10])].sort((a, b) => a - b);
  for (let year = now.getFullYear(); year <= now.getFullYear() + 2; year++) {
    for (const month of months) {
      const id = `${year}-${String(month).padStart(2, "0")}`;
      if (chargeDate(id) > now) return id;
    }
  }
  return null;
}

function currentQuarter(quarters) {
  const id = nextShipId();
  return quarters.find(q => q.id === id) || { id, secret: true, images: [] };
}

/* ── Lightbox ────────────────────────────────────────────────── */

const lightbox = document.getElementById("post-club-lightbox");
const lightboxImg = document.getElementById("post-club-lightbox-img");
const lightboxCaption = document.getElementById("post-club-lightbox-caption");
let gallery = [];
let galleryIndex = 0;
let lastFocused = null;

function showImage(index) {
  if (!gallery.length) return;
  galleryIndex = (index + gallery.length) % gallery.length;
  const image = gallery[galleryIndex];
  lightboxImg.src = image.src;
  lightboxImg.alt = image.label;
  lightboxCaption.textContent = image.label;
}

function openLightbox(images, index) {
  if (!lightbox || !images.length) return;
  gallery = images;
  lastFocused = document.activeElement;
  showImage(index);
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("post-club-lightbox-close")?.focus();
}

function closeLightbox() {
  if (!lightbox || lightbox.hidden) return;
  lightbox.hidden = true;
  lightboxImg.src = "";
  document.body.style.overflow = "";
  lastFocused?.focus();
}

lightbox?.addEventListener("click", event => {
  if (event.target === lightbox) closeLightbox();
});
document.getElementById("post-club-lightbox-close")?.addEventListener("click", closeLightbox);
document.getElementById("post-club-lightbox-prev")?.addEventListener("click", () => showImage(galleryIndex - 1));
document.getElementById("post-club-lightbox-next")?.addEventListener("click", () => showImage(galleryIndex + 1));

document.addEventListener("keydown", event => {
  if (lightbox?.hidden !== false) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") showImage(galleryIndex - 1);
  if (event.key === "ArrowRight") showImage(galleryIndex + 1);
});

/* ── Rendering ───────────────────────────────────────────────── */

let data = null;

// sync_paintings_images.bat builds a desktop/ and a mobile/ copy of every
// original, and the page picks between them at the same width the gallery does.
function imagesOf(quarter) {
  const base = data?.imageBase || "../images/post-club/";
  const variant = window.innerWidth <= 960 ? "mobile" : "desktop";
  return (quarter.images || []).map(image => ({
    src: `${base}${quarter.id}/${variant}/${image.file}`,
    label: localised(image.label),
  }));
}

function markPending(button, img) {
  img.remove();
  button.disabled = true;
  const pending = document.createElement("span");
  pending.className = "post-club-thumb-pending";
  pending.textContent = translated("post_club_image_pending", "Bild kommer snart");
  button.prepend(pending);
}

function imageButton(image, className, onOpen) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.addEventListener("click", onOpen);

  const img = document.createElement("img");
  img.src = image.src;
  img.alt = image.label;
  img.addEventListener("error", () => markPending(button, img));

  button.append(img);
  return button;
}

function thumbTile(image, onOpen) {
  const item = document.createElement("li");
  item.className = "post-club-thumb";

  const button = imageButton(image, "post-club-thumb-button", onOpen);
  button.querySelector("img")?.setAttribute("loading", "lazy");

  const label = document.createElement("span");
  label.className = "post-club-thumb-label";
  label.textContent = image.label;

  button.append(label);
  item.append(button);
  return item;
}

function themeOf(quarter) {
  return quarter.secret
    ? translated("post_club_timeline_secret", "Temat avslöjas snart")
    : localised(quarter.theme);
}

function renderQuarter(quarter) {
  const section = document.getElementById("post-club-quarter");
  const feature = document.getElementById("post-club-feature");
  const thumbs = document.getElementById("post-club-thumbs");
  if (!section || !feature || !thumbs || !quarter) return;

  const ship = monthName(shipDate(quarter.id));
  document.getElementById("post-club-quarter-title").textContent = themeOf(quarter);
  document.getElementById("post-club-quarter-ship").textContent =
    translated("post_club_quarter_ship", "Skickas första veckan i {month}", { month: ship });
  document.getElementById("post-club-quarter-blurb").textContent = localised(quarter.blurb);

  // The first image leads the page; the rest sit beside it as small tiles.
  const images = imagesOf(quarter);
  feature.hidden = images.length === 0;
  feature.replaceChildren(...(images.length
    ? [imageButton(images[0], "post-club-feature-button", () => openLightbox(images, 0))]
    : []));

  thumbs.replaceChildren(...images.slice(1).map((image, index) =>
    thumbTile(image, () => openLightbox(images, index + 1))
  ));
  section.hidden = false;
}

function timelineCard(quarter, current) {
  const card = document.createElement("li");
  card.className = "post-club-timeline-card";

  let statusKey = "post_club_timeline_upcoming";
  let statusFallback = "Kommande";
  if (quarter.id === current.id) {
    card.classList.add("is-current");
    statusKey = "post_club_timeline_current";
    statusFallback = "Det här kvartalet";
  } else if (shipDate(quarter.id) < shipDate(current.id)) {
    card.classList.add("is-past");
    statusKey = "post_club_timeline_sent";
    statusFallback = "Skickat";
  }

  const badge = document.createElement("span");
  badge.className = "post-club-timeline-badge";
  badge.textContent = translated(statusKey, statusFallback);

  const month = document.createElement("p");
  month.className = "post-club-timeline-month";
  month.textContent = monthYear(shipDate(quarter.id));

  const theme = document.createElement("h3");
  theme.textContent = themeOf(quarter);

  const media = document.createElement("div");
  media.className = "post-club-timeline-media";
  const images = imagesOf(quarter);
  if (images.length) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "post-club-timeline-button";
    button.addEventListener("click", () => openLightbox(images, 0));
    const img = document.createElement("img");
    img.src = images[0].src;
    img.alt = images[0].label;
    img.loading = "lazy";
    img.addEventListener("error", () => markPending(button, img));
    button.append(img);
    media.append(button);
  } else {
    media.classList.add("is-empty");
  }

  card.append(badge, month, theme, media);
  return card;
}

function renderTimeline(quarters, current) {
  const list = document.getElementById("post-club-timeline");
  if (!list || !current) return;

  list.replaceChildren(...quarters.map(quarter => timelineCard(quarter, current)));
  const currentCard = list.querySelector(".is-current");
  if (currentCard) list.scrollLeft = currentCard.offsetLeft - list.offsetLeft;

  // Nothing to scroll back to until a letter has actually been sent.
  const hint = document.getElementById("post-club-timeline-hint");
  if (hint) hint.hidden = !list.querySelector(".is-past");
}

function renderTerms(quarter) {
  const list = document.getElementById("post-club-terms");
  if (!list || !quarter) return;

  const values = {
    price: data?.price || PRICE_FALLBACK,
    month: monthName(shipDate(quarter.id)),
    nextCharge: fullDate(addMonths(chargeDate(quarter.id), 3)),
  };

  const lines = [
    translated("post_club_terms_now", "Du betalar {price} kr direkt när du går med och brevet skickas första veckan i {month}.", values),
    translated("post_club_terms_next", "Nästa dragning {nextCharge}, sedan var tredje månad.", values),
    translated("post_club_terms_return", "Du har 14 dagars ångerrätt.", values),
    translated("post_club_terms_fine", "Endast inom Sverige.", values),
  ];

  list.replaceChildren(...lines.map(line => {
    const item = document.createElement("li");
    item.textContent = line;
    return item;
  }));
}

function renderStatus(quarter) {
  if (checkoutResult !== "success" || !quarter) return;
  const month = monthName(shipDate(quarter.id));
  const thanks = translated("post_club_status_success", "Tack! Betalningen är klar.");
  const shipping = translated("post_club_status_shipping", "Ditt brev skickas första veckan i {month}.", { month });
  setStatus(`${thanks} ${shipping}`, "success");
}

function applyAriaLabels() {
  document.querySelectorAll("[data-i18n-aria]").forEach(el => {
    const label = translated(el.dataset.i18nAria, el.getAttribute("aria-label"));
    if (label) el.setAttribute("aria-label", label);
  });
}

function render() {
  if (!data) return;
  const quarters = [...data.quarters];
  const current = currentQuarter(quarters);
  if (!quarters.some(q => q.id === current.id)) quarters.push(current);
  quarters.sort((a, b) => shipDate(a.id) - shipDate(b.id));

  renderQuarter(current);
  renderTimeline(quarters, current);
  renderTerms(current);
  renderStatus(current);
  applyAriaLabels();
}

// script.js applies the saved language from its own init, but that init throws
// on this page — it expects helpers this page deliberately does not load.
if (typeof initLanguage === "function" && !window.currentLang) initLanguage();

// ui.js fetches the header after that, so its links are still untranslated —
// apply the language once more when they arrive.
const headerContainer = document.getElementById("header-container");
if (headerContainer && typeof setLanguage === "function") {
  const headerWatch = new MutationObserver(() => {
    if (!headerContainer.querySelector("[data-i18n]")) return;
    headerWatch.disconnect();
    setLanguage(window.currentLang || "sv");
  });
  headerWatch.observe(headerContainer, { childList: true, subtree: true });
}

fetch("../data/post-club.json")
  .then(response => response.json())
  .then(json => {
    data = json;
    render();
  })
  .catch(error => console.error("Could not load post club data", error));

window.addEventListener("languagechange", render);

/* ── Genväg till köpkortet ───────────────────────────────────── */

// A shortcut, not a second checkout button: it carries you to the card so the
// terms are read before anything is charged.
function setupJumpButton() {
  const jump = document.getElementById("post-club-jump");
  const button = document.getElementById("post-club-jump-button");
  const buyCard = document.querySelector(".post-club-buy");
  const top = document.querySelector(".post-club-top");
  if (!jump || !button || !buyCard || !top || !("IntersectionObserver" in window)) return;

  let pastTop = false;
  let cardVisible = true;

  const update = () => jump.classList.toggle("is-visible", pastTop && !cardVisible);

  new IntersectionObserver(([entry]) => {
    pastTop = !entry.isIntersecting;
    update();
  }).observe(top);

  new IntersectionObserver(([entry]) => {
    cardVisible = entry.isIntersecting;
    update();
  }, { rootMargin: "-80px 0px" }).observe(buyCard);

  button.addEventListener("click", () => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    buyCard.scrollIntoView({ behavior: motion ? "auto" : "smooth", block: "center" });
    submitButton?.focus({ preventScroll: true });
  });
}

setupJumpButton();

/* ── Checkout ────────────────────────────────────────────────── */

form?.addEventListener("submit", async event => {
  event.preventDefault();

  submitButton.disabled = true;
  setStatus(translated("post_club_status_sending", "Öppnar betalningen..."), "pending");

  try {
    const response = await fetch("/api/create-post-club-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const result = await response.json();

    if (!response.ok || !result.url) {
      throw new Error(result.error || "Could not create checkout session");
    }

    window.location.href = result.url;
  } catch (error) {
    console.error("Could not create post club checkout", error);
    setStatus(translated("post_club_status_error", "Något gick fel. Försök igen eller kontakta info@vaavascanvas.se."), "error");
  } finally {
    submitButton.disabled = false;
  }
});
