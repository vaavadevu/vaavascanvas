// script.js — entry point & init only

document.addEventListener("contextmenu", e => e.preventDefault());

function calculateSizeScales() {
  // Calculate a subtle scale factor based on painting area
  // Handles both rectangular (width x height) and circular (diameter) paintings
  const parsedSizes = paintings.map(p => {
    if (p.shape === SHAPE.RECTANGULAR && p.width && p.height) {
      return p.width * p.height; // area for rectangular
    } else if (p.shape === SHAPE.CIRCLE && p.diameter) {
      const radius = p.diameter / 2;
      return Math.PI * radius * radius; // area for circle
    }
    return null;
  }).filter(a => a !== null);

  if (parsedSizes.length === 0) {
    paintings.forEach(p => { p.sizeScale = 1; });
    return;
  }

  const minArea = Math.min(...parsedSizes);
  const maxArea = Math.max(...parsedSizes);
  const areaRange = maxArea - minArea;

  paintings.forEach(p => {
    let area = null;

    if (p.shape === SHAPE.RECTANGULAR && p.width && p.height) {
      area = p.width * p.height;
    } else if (p.shape === SHAPE.CIRCLE && p.diameter) {
      const radius = p.diameter / 2;
      area = Math.PI * radius * radius;
    }

    if (area === null) {
      p.sizeScale = 1;
      return;
    }

    // Normalize to 0-1 range, then scale to 0.80-1.20 range (20% variation)
    const normalized = areaRange > 0 ? (area - minArea) / areaRange : 0.5;
    p.sizeScale = 1 + (normalized - 0.5) * 0.4; // 0.80 to 1.20
  });
}

function showGalleryLoadError() {
  const gallery = document.getElementById("gallery");
  if (!gallery) return;
  const lang = localStorage.getItem("lang") || "sv";
  const banner = document.createElement("p");
  banner.textContent = lang === "en"
    ? "Some images may not display correctly – check your connection."
    : "Bilder kanske inte visas korrekt – kontrollera din anslutning.";
  banner.style.cssText = "text-align:center;padding:2rem;opacity:0.6;font-size:0.9rem;";
  gallery.parentNode.insertBefore(banner, gallery);
}

async function init() {
  if (!document.getElementById("gallery")) return;

  try {
    const [countsRes, metaRes] = await Promise.all([
      fetch("/images/paintings/counts.json"),
      fetch("/images/paintings/metadata.json")
    ]);

    if (countsRes.ok) {
      const counts = await countsRes.json();
      paintings.forEach(p => { p.imageCount = counts[p.id] || 1; });
    }

    if (metaRes.ok) {
      const metadata = await metaRes.json();
      paintings.forEach(p => { p.aspectRatio = metadata[p.id]; });
    }
  } catch (err) {
    showGalleryLoadError();
  }

  // Calculate size scale factors based on physical dimensions
  calculateSizeScales();

  for (let i = paintings.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [paintings[i], paintings[j]] = [paintings[j], paintings[i]];
  }

  paintings.forEach((painting, index) => {
    painting._randomGalleryOrder = index;
  });

  sortPaintings();
  buildGallery();

  // Legacy: redirect old ?painting= URLs to view.html
  const params     = new URLSearchParams(window.location.search);
  const paintingId = params.get("painting");
  if (paintingId) {
    window.location.href = `view.html?painting=${paintingId}`;
  }
}

async function setup() {
  await buildComponents();  // header + modals in DOM
  setupModals();
  await buildContactForm(); // form in DOM
  initLanguage();           // now everything exists, apply saved language
  Cart.updateBadge();       // badge is now in DOM, update with stored cart count
  setupAutoShowSubscribeModal(); // show subscribe modal on first visit
}

// Skip setup and init on blog pages - they handle it themselves
const isBlogPage = window.location.pathname.includes("blog");

if (!isBlogPage) {
  setupScrollWatcher();
  setup();
  init();
}

// Only initialize page view on view.html
if (window.location.pathname.includes("view")) {
  initPageView();
}
