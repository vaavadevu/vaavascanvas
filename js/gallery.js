// gallery.js — building and filtering the painting grid

// ── Configuration ──────────────────────────────────────────────
// Set to true to use page view, false to use modal
const USE_PAGE_VIEW = true;

function getPaintingImagePaths(painting) {
  const folderId = painting.id;
  const count = painting.imageCount || 1;
  const base = `/images/paintings/${folderId}/desktop/`;
  const mobileBase = `/images/paintings/${folderId}/mobile/`;
  const isMobile = window.innerWidth <= 768;

  return Array.from({ length: count }, (_, i) => {
    const idx = String(i + 1).padStart(2, "0");
    return isMobile ? `${mobileBase}${idx}.jpg` : `${base}${idx}.jpg`;
  });
}

function sortPaintings() {
  const statusOrder = {
    [STATUS.FOR_SALE]: 0,
    [STATUS.PERSONAL]: 1,
    [STATUS.SOLD]: 2
  };
  paintings.sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return (b.originalPrice || 0) - (a.originalPrice || 0);
  });
}

function buildGallery() {
  const galleryElement = document.getElementById("gallery");
  if (!galleryElement) return;
  galleryElement.innerHTML = "";
  paintings.forEach((painting, idx) => {
    const item = createGalleryItem(painting, idx);
    galleryElement.appendChild(item);
  });
}

function createGalleryItem(painting, index) {
  const item = document.createElement("div");
  item.classList.add("gallery-item");

  // Apply circular shape if specified
  if (painting.shape === SHAPE.CIRCLE) {
    item.classList.add("gallery-item--circle");
  }

  const img = document.createElement("img");
  const paths = getPaintingImagePaths(painting);
  img.src = paths[0];
  img.alt = painting.title;

  // Apply aspect ratio if available, otherwise use 1:1 for circles
  if (painting.aspectRatio) {
    img.style.aspectRatio = painting.aspectRatio;
  } else if (painting.shape === SHAPE.CIRCLE) {
    img.style.aspectRatio = "1 / 1";
  }

  img.addEventListener("error", () => { img.src = "/images/devika.jpg"; });
  img.addEventListener("click", () => {
    if (USE_PAGE_VIEW) {
      window.location.href = `view.html?painting=${paintings[index].id}`;
    } else {
      openModal(index);
    }
  });

  item.appendChild(img);
  if (painting.status === STATUS.SOLD) addSoldBadge(item);

  return item;
}

function addSoldBadge(container) {
  const badge = document.createElement("div");
  badge.textContent = t("modal_sold");
  badge.dataset.i18n = "modal_sold";
  badge.classList.add("sold-badge");
  container.appendChild(badge);
}

// ── Filter ────────────────────────────────────────────────────

let activeFilter = "all";

function attachFilterListeners() {
  document.querySelectorAll(".filter-btn, .fab-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      setActiveFilter(btn.dataset.filter);
      closeFab();
    });
  });

  setupFab();
  setupFilterBar();
}

function setActiveFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll(".filter-btn, .fab-filter-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.filter === filter);
  });
  filterGallery(filter);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function filterGallery(filter) {
  document.querySelectorAll(".gallery-item").forEach((item, idx) => {
    const status = paintings[idx].status;
    const show = filter === "all" || status === filter;
    item.style.display = show ? "" : "none";
  });
}

// ── FAB ───────────────────────────────────────────────────────

function setupFab() {
  const fab = document.getElementById("filter-fab");
  const trigger = document.getElementById("fab-trigger");
  const footer = document.querySelector("footer");
  
  if (!fab || !trigger) {
    console.log("FAB hittades inte i DOM:en än!");
    return;
  }

  // Klick-logik med ripple
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    fab.classList.toggle("open");

    const ripple = document.createElement("span");
    ripple.classList.add("fab-ripple");
    const size = trigger.offsetWidth;
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.offsetX - size / 2) + "px";
    ripple.style.top = (e.offsetY - size / 2) + "px";
    trigger.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });

  // Funktion för att sätta positionen
  const updatePosition = () => {
    // Dölj FAB om vi scrollat förbi galleriet
    const galleryWrapper = document.getElementById("gallery-wrapper");
    if (galleryWrapper && galleryWrapper.getBoundingClientRect().bottom <= 0) {
      fab.style.display = "none";
      return;
    }

    if (!footer) {
      fab.style.display = "flex";
      return;
    }
    const footerRect = footer.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const margin = 24;

    if (footerRect.top < windowHeight) {
      const stopPosition = windowHeight - footerRect.top + margin;
      fab.style.bottom = stopPosition + "px";
    } else {
      fab.style.bottom = margin + "px";
    }
    // Gör knappen synlig ifall CSS råkar dölja den
    fab.style.display = "flex";
  };

  // KÖR DIREKT
  updatePosition();

  // KÖR IGEN efter en kort stund (ifall galleriet precis har ritats ut)
  setTimeout(updatePosition, 100);
  setTimeout(updatePosition, 500); // En extra säkerhet när bilderna laddas

  // Lyssna på scroll
  window.addEventListener("scroll", () => {
    window.requestAnimationFrame(updatePosition);
    closeFab();
  }, { passive: true });

  // Stäng vid klick utanför
  document.addEventListener("click", (e) => {
    if (!fab.contains(e.target)) closeFab();
  });
}

function closeFab() {
  document.getElementById("filter-fab")?.classList.remove("open");
}

// ── Sticky filter bar (desktop) ───────────────────────────────

function setupFilterBar() {
  const bar = document.getElementById("gallery-filter-bar");
  if (!bar) return;

  const headerContainer = document.getElementById("header-container");
  let headerH = 0;

  const updateMainPadding = () => {
    const mainEl = document.querySelector("main");
    if (!mainEl) return;
    mainEl.style.paddingTop = window.innerWidth >= 769
      ? headerH + bar.offsetHeight + 16 + "px"
      : "";
  };

  // Baren är ett separat fixed element – translateY matchar exakt headerns rörelse
  // → header_bottom = bar_top = headerH * ease(t) vid varje frame → noll gap
  const setBarTransform = (show) => {
    if (window.innerWidth < 769) return;
    // -2px när headern är gömd: täck exakt toppen utan sub-pixel sliver
    bar.style.transform = show ? `translateY(${headerH}px)` : "translateY(-2px)";
  };

  // Exponera för ui.js: kallas i samma JS-tick som header-klassändringen
  window._syncFilterBar = setBarTransform;

  const init = () => {
    if (!headerContainer || headerContainer.offsetHeight === 0) return;
    headerH = headerContainer.getBoundingClientRect().height;
    const isVisible = headerContainer.classList.contains("visible");
    bar.style.transition = "none";
    setBarTransform(isVisible);
    requestAnimationFrame(() => { bar.style.transition = ""; });
    updateMainPadding();
  };

  if (headerContainer) {
    new MutationObserver(init).observe(headerContainer, { childList: true });
  }
  setTimeout(init, 300);
  setTimeout(init, 700);
  window.addEventListener("resize", init);

  // Dölj filterbaren om vi scrollat förbi galleriet
  const updateVisibility = () => {
    const galleryWrapper = document.getElementById("gallery-wrapper");
    const pastGallery = galleryWrapper && galleryWrapper.getBoundingClientRect().bottom <= 0;
    bar.style.opacity = pastGallery ? "0" : "";
    bar.style.pointerEvents = pastGallery ? "none" : "";
  };
  window.addEventListener("scroll", () => requestAnimationFrame(updateVisibility), { passive: true });
  setTimeout(updateVisibility, 300);
}