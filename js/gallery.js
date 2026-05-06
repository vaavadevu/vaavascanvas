// gallery.js — building and filtering the painting grid

// ── Print config ──────────────────────────────────────────────

const PRINT_PAINTINGS = ['minMamma', 'efterIde', 'sommarvila'];

const PRINT_SIZES_SQUARE = [
  { label: '30×30 cm', size: '30x30', price: 450 },
  { label: '40×40 cm', size: '40x40', price: 550 },
  { label: '50×50 cm', size: '50x50', price: 650 },
];

const PRINT_SIZES_STANDARD = [
  { label: 'A4', size: 'A4', price: 450 },
  { label: 'A3', size: 'A3', price: 550 },
  { label: 'A2', size: 'A2', price: 650 },
];

// ── Configuration ──────────────────────────────────────────────

function getPaintingImagePaths(painting) {
  const folderId = painting.id;
  const count = painting.imageCount || 1;
  const isViewPage = window.location.pathname.includes('view.html');
  const base = isViewPage ? `../images/paintings/${folderId}/desktop/` : `/images/paintings/${folderId}/desktop/`;
  const mobileBase = isViewPage ? `../images/paintings/${folderId}/mobile/` : `/images/paintings/${folderId}/mobile/`;
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

  if (painting.shape === SHAPE.CIRCLE) {
    item.classList.add("gallery-item--circle");
  }

  const img = document.createElement("img");
  const paths = getPaintingImagePaths(painting);
  img.loading = "lazy";
  img.src = paths[0];
  img.alt = painting.title;

  if (painting.aspectRatio) {
    img.style.aspectRatio = painting.aspectRatio;
  } else if (painting.shape === SHAPE.CIRCLE) {
    img.style.aspectRatio = "1 / 1";
  }

  img.addEventListener("error", () => { img.src = "/images/devika.jpg"; });
  img.addEventListener("click", () => {
    window.location.href = `view.html?painting=${paintings[index].id}`;
  });

  item.appendChild(img);
  if (painting.status === STATUS.SOLD) addSoldBadge(item);

  // Remove buy actions from masonry view - details shown in view.html instead
  // const actions = createBuyActions(painting, paths[0]);
  // if (actions) item.appendChild(actions);

  return item;
}

// ── Buy buttons ───────────────────────────────────────────────

function createBuyActions(painting, imageUrl) {
  if (painting.status === STATUS.PERSONAL) return null;

  const wrapper = document.createElement('div');
  wrapper.className = 'gallery-item-actions';

  // Original buy button
  if (painting.status === STATUS.FOR_SALE && painting.originalPrice) {
    const buyBtn = document.createElement('button');
    buyBtn.className = 'btn-add-to-cart';
    buyBtn.textContent = `Köp ${painting.originalPrice.toLocaleString('sv-SE')} kr`;
    buyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      Cart.add({
        id: painting.id,
        title: painting.title,
        type: 'original',
        price: painting.originalPrice,
        image: imageUrl,
      });
      showToast('Tillagd i varukorgen!');
    });
    wrapper.appendChild(buyBtn);
  } else if (painting.status === STATUS.SOLD) {
    const sold = document.createElement('span');
    sold.className = 'btn-sold-label';
    sold.textContent = 'Såld';
    wrapper.appendChild(sold);
  }

  // Print buy button (only for selected paintings)
  if (PRINT_PAINTINGS.includes(painting.id)) {
    const printWrap = document.createElement('div');
    printWrap.className = 'print-option';

    const isSquare = painting.shape === SHAPE.SQUARE || painting.shape === 'square';
    const sizes = isSquare ? PRINT_SIZES_SQUARE : PRINT_SIZES_STANDARD;

    const select = document.createElement('select');
    select.className = 'print-size-select';
    select.id = `print-size-${painting.id}`;
    sizes.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.size;
      opt.dataset.price = s.price;
      opt.textContent = `${s.label} – ${s.price} kr`;
      select.appendChild(opt);
    });

    const printBtn = document.createElement('button');
    printBtn.className = 'btn-add-to-cart btn-print';
    printBtn.textContent = `Köp print ${sizes[0].price} kr`;
    printBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const opt = select.options[select.selectedIndex];
      Cart.add({
        id: `${painting.id}-print-${opt.value}`,
        title: `${painting.title} (Print ${opt.value})`,
        type: 'print',
        size: opt.value,
        price: parseInt(opt.dataset.price),
        image: imageUrl,
      });
      showToast('Print tillagd i varukorgen!');
    });

    // Update button text when size changes
    select.addEventListener('change', () => {
      const opt = select.options[select.selectedIndex];
      printBtn.textContent = `Köp print ${opt.dataset.price} kr`;
    });

    printWrap.appendChild(select);
    printWrap.appendChild(printBtn);
    wrapper.appendChild(printWrap);
  }

  return wrapper;
}

function addSoldBadge(container) {
  const badge = document.createElement("div");
  badge.textContent = t("modal_sold");
  badge.dataset.i18n = "modal_sold";
  badge.classList.add("sold-badge");
  container.appendChild(badge);
}

// ── Filter ────────────────────────────────────────────────────

let activeStatusFilter = "all";
let activeSizeFilter = "size_all";

function attachFilterListeners() {
  document.querySelectorAll(".filter-btn, .fab-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      if (filter.startsWith("size_")) {
        setActiveSizeFilter(filter);
      } else {
        setActiveStatusFilter(filter);
      }
      closeFab();
    });
  });

  setupFab();
  setupFilterBar();
}

function setActiveStatusFilter(filter) {
  activeStatusFilter = filter;
  document.querySelectorAll(".filter-btn:not(.size-filter), .fab-filter-btn:not(.size-filter)").forEach(b => {
    b.classList.toggle("active", b.dataset.filter === filter);
  });
  filterGallery();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setActiveSizeFilter(filter) {
  activeSizeFilter = filter;
  document.querySelectorAll(".size-filter").forEach(b => {
    b.classList.toggle("active", b.dataset.filter === filter);
  });
  filterGallery();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function filterGallery() {
  document.querySelectorAll(".gallery-item").forEach((item, idx) => {
    const painting = paintings[idx];
    const status = painting.status;
    const size = getPaintingSize(painting);
    const statusMatch = activeStatusFilter === "all" || status === activeStatusFilter;
    const sizeMatch = activeSizeFilter === "size_all" || size === activeSizeFilter.replace("size_", "");
    item.style.display = (statusMatch && sizeMatch) ? "" : "none";
  });
}

// ── FAB ───────────────────────────────────────────────────────

function setupFab() {
  const fab = document.getElementById("filter-fab");
  const trigger = document.getElementById("fab-trigger");
  const popup = fab?.querySelector(".fab-popup");
  const footer = document.querySelector("footer");

  if (!fab || !trigger || !popup) return;

  popup.style.display = "none";
  let closeTimer = null;

  const openFab = () => {
    clearTimeout(closeTimer);
    popup.style.display = "flex";
    requestAnimationFrame(() => requestAnimationFrame(() => fab.classList.add("open")));
  };

  const closeFabLocal = () => {
    fab.classList.remove("open");
    closeTimer = setTimeout(() => { popup.style.display = "none"; }, 550);
  };

  const toggleFab = () => {
    fab.classList.contains("open") ? closeFabLocal() : openFab();
  };

  const ripple = document.createElement("span");
  ripple.classList.add("fab-ripple");
  trigger.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.classList.remove("fab-ripple--active"));

  const doRipple = (x, y) => {
    const size = trigger.offsetWidth;
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (x - size / 2) + "px";
    ripple.style.top = (y - size / 2) + "px";
    ripple.classList.remove("fab-ripple--active");
    void ripple.offsetWidth;
    ripple.classList.add("fab-ripple--active");
  };

  trigger.addEventListener("touchend", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFab();
    const touch = e.changedTouches[0];
    const rect = trigger.getBoundingClientRect();
    doRipple(touch.clientX - rect.left, touch.clientY - rect.top);
  }, { passive: false });

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFab();
    doRipple(e.offsetX, e.offsetY);
  });

  const updatePosition = () => {
    const galleryWrapper = document.getElementById("gallery-wrapper");
    if (galleryWrapper && galleryWrapper.getBoundingClientRect().bottom <= 0) {
      fab.style.display = "none";
      return;
    }
    if (!footer) { fab.style.display = "flex"; return; }
    const footerRect = footer.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const margin = 24;
    if (footerRect.top < windowHeight) {
      fab.style.bottom = (windowHeight - footerRect.top + margin) + "px";
    } else {
      fab.style.bottom = margin + "px";
    }
    fab.style.display = "flex";
  };

  updatePosition();
  setTimeout(updatePosition, 100);
  setTimeout(updatePosition, 500);
  window.addEventListener("scroll", () => { window.requestAnimationFrame(updatePosition); closeFab(); }, { passive: true });
  document.addEventListener("click", (e) => { if (!fab.contains(e.target)) closeFab(); });
}

function closeFab() {
  const fab = document.getElementById("filter-fab");
  if (!fab) return;
  fab.classList.remove("open");
  const popup = fab.querySelector(".fab-popup");
  if (popup) setTimeout(() => { popup.style.display = "none"; }, 550);
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

  const setBarTransform = (show) => {
    if (window.innerWidth < 769) return;
    bar.style.transform = show ? `translateY(${headerH}px)` : "translateY(-2px)";
  };

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

  const updateVisibility = () => {
    const galleryWrapper = document.getElementById("gallery-wrapper");
    const pastGallery = galleryWrapper && galleryWrapper.getBoundingClientRect().bottom <= 0;
    bar.style.opacity = pastGallery ? "0" : "";
    bar.style.pointerEvents = pastGallery ? "none" : "";
  };
  window.addEventListener("scroll", () => requestAnimationFrame(updateVisibility), { passive: true });
  setTimeout(updateVisibility, 300);
}