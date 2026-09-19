// Fills the homepage post club band from data/post-club.json, so the picture
// and the theme follow the current quarter without the homepage being edited.

const SHIP_MONTHS_FALLBACK = [1, 4, 7, 10];
const CHARGE_DAY = 25;

const section = document.getElementById("post-club-promo");
const media = document.getElementById("post-club-promo-media");
const quarterLine = document.getElementById("post-club-promo-quarter");

function lang() {
  return window.currentLang || "sv";
}

function localised(value) {
  if (!value) return "";
  return value[lang()] || value.sv || "";
}

function chargeDate(id) {
  const [year, month] = id.split("-").map(Number);
  return new Date(year, month - 2, CHARGE_DAY);
}

function shipDate(id) {
  const [year, month] = id.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

// Same rule as the post club page: the next letter whose charge day has not passed.
function currentId(data, now = new Date()) {
  const months = [...(data.shipMonths || SHIP_MONTHS_FALLBACK)].sort((a, b) => a - b);
  for (let year = now.getFullYear(); year <= now.getFullYear() + 2; year++) {
    for (const month of months) {
      const id = `${year}-${String(month).padStart(2, "0")}`;
      if (chargeDate(id) > now) return id;
    }
  }
  return null;
}

function render(data) {
  if (!section || !media) return;

  const id = currentId(data);
  const quarter = (data.quarters || []).find(q => q.id === id);
  const image = quarter?.images?.[0];

  if (quarter && !quarter.secret && quarterLine) {
    const month = new Intl.DateTimeFormat(lang() === "en" ? "en-GB" : "sv-SE", { month: "long" })
      .format(shipDate(quarter.id));
    const theme = localised(quarter.theme);
    quarterLine.textContent = typeof t === "function"
      ? t("promo_post_club_quarter").replace("{theme}", theme).replace("{month}", month)
      : `${month}: ${theme}`;
  } else if (quarterLine) {
    quarterLine.textContent = "";
  }

  if (image) {
    const base = data.imageBase?.replace("../", "/") || "/images/post-club/";
    const variant = window.innerWidth <= 960 ? "mobile" : "desktop";
    const img = document.createElement("img");
    img.src = `${base}${quarter.id}/${variant}/${image.file}`;
    img.alt = localised(image.label);
    img.loading = "lazy";
    img.addEventListener("error", () => media.remove());
    media.replaceChildren(img);
  } else {
    media.remove();
  }

  section.hidden = false;
}

fetch("/data/post-club.json")
  .then(response => response.json())
  .then(data => {
    render(data);
    window.addEventListener("languagechange", () => render(data));
  })
  .catch(error => console.error("Could not load post club data", error));
