// gallery.js — building and filtering the painting grid

// ── Configuration ──────────────────────────────────────────────

function getPaintingImagePaths(painting) {
  if (painting.images && Array.isArray(painting.images.desktop) && Array.isArray(painting.images.mobile)) {
    const isMobile = window.innerWidth <= 960;
    return isMobile ? painting.images.mobile : painting.images.desktop;
  }

  const folderId = painting.id;
  const count = painting.imageCount || 1;
  const isViewPage = window.location.pathname.includes('/view');
  const base = isViewPage ? `../images/paintings/${folderId}/desktop/` : `/images/paintings/${folderId}/desktop/`;
  const mobileBase = isViewPage ? `../images/paintings/${folderId}/mobile/` : `/images/paintings/${folderId}/mobile/`;
  const isMobile = window.innerWidth <= 960;

  return Array.from({ length: count }, (_, i) => {
    const idx = String(i + 1).padStart(2, "0");
    return isMobile ? `${mobileBase}${idx}.jpg` : `${base}${idx}.jpg`;
  });
}

function getGalleryPriceHtml(painting) {
  const salePrice = painting.framedOnly
    ? getPaintingEffectivePrice(painting, true)
    : getPaintingDiscountedPrice(painting);
  const hasDiscount = hasPaintingDiscount(painting);
  const oldPrice = painting.framedOnly ? painting.framedPrice : painting.originalPrice;

  if (hasDiscount && oldPrice) {
    return `
      <span class="gallery-item-price-current">${salePrice.toLocaleString('sv-SE')} kr</span>
      <span class="gallery-item-price-old">${oldPrice.toLocaleString('sv-SE')} kr</span>
    `;
  }

  if (painting.frameAvailable && !painting.framedOnly) {
    return `${t('price_from')} ${salePrice.toLocaleString('sv-SE')} kr`;
  }

  return `${salePrice.toLocaleString('sv-SE')} kr`;
}

function sortPaintings() {
  const statusOrder = {
    [STATUS.FOR_SALE]: 0,
    [STATUS.SOLD]: 1,
  };
  paintings.sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    const discountA = hasPaintingDiscount(a) ? 1 : 0;
    const discountB = hasPaintingDiscount(b) ? 1 : 0;
    if (discountA !== discountB) return discountB - discountA;

    if (discountA && discountB) {
      return (b.discountPercent || 0) - (a.discountPercent || 0);
    }

    return (a._randomGalleryOrder || 0) - (b._randomGalleryOrder || 0);
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
  else if (painting.status === STATUS.FOR_SALE && hasPaintingDiscount(painting)) addDiscountBadge(item, painting);

  const infoBar = document.createElement("div");
  infoBar.className = "gallery-item-info";

  const sizeLabel = document.createElement("span");
  sizeLabel.className = "gallery-item-size";
  sizeLabel.textContent = formatDimensions(painting);
  infoBar.appendChild(sizeLabel);

  if (painting.status === STATUS.FOR_SALE) {
    const priceLabel = document.createElement("span");
    priceLabel.className = "gallery-item-price";
    priceLabel.innerHTML = getGalleryPriceHtml(painting);
    infoBar.appendChild(priceLabel);
  }

  item.appendChild(infoBar);

  return item;
}

// ── Buy buttons ───────────────────────────────────────────────

function createBuyActions(painting, imageUrl) {
const wrapper = document.createElement('div');
  wrapper.className = 'gallery-item-actions';

  // Original buy button
  if (painting.status === STATUS.FOR_SALE && (painting.originalPrice || painting.framedOnly)) {
    const currentPrice = painting.framedOnly
      ? getPaintingEffectivePrice(painting, true)
      : getPaintingDiscountedPrice(painting);
    const buyBtn = document.createElement('button');
    buyBtn.className = 'btn-add-to-cart';
    buyBtn.textContent = `Köp ${currentPrice.toLocaleString('sv-SE')} kr`;
    buyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const paintingType = painting.type || TYPE.PAINTING;

      // Bookmarks are sold per variant — send the buyer to the picker instead
      // of guessing which one they meant
      if (paintingType === TYPE.BOOKMARK) {
        window.location.href = `view.html?painting=${painting.id}`;
        return;
      }

      const itemType = paintingType === TYPE.PAINTING ? 'original' : paintingType;
      const cartItem = {
        id: painting.framedOnly ? `${painting.id}-framed` : painting.id,
        title: painting.title,
        type: itemType,
        price: currentPrice,
        image: imageUrl,
      };

      if (itemType === 'original') {
        Object.assign(cartItem, {
          paintingBaseId: painting.id,
          paintingTitle: painting.title,
          frameAvailable: painting.frameAvailable || false,
          withFrame: painting.framedOnly || false,
          basePrice: getPaintingDiscountedPrice(painting) || painting.originalPrice || painting.framedPrice,
          framedPrice: painting.framedPrice ? getPaintingFramedSalePrice(painting) : null,
        });
      }

      Cart.add(cartItem);
      showToast('Tillagd i varukorgen!');
    });
    wrapper.appendChild(buyBtn);
  } else if (painting.status === STATUS.SOLD) {
    const sold = document.createElement('span');
    sold.className = 'btn-sold-label';
    sold.textContent = 'Såld';
    wrapper.appendChild(sold);
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

function addDiscountBadge(container, painting) {
  const badge = document.createElement("div");
  badge.textContent = `-${painting.discountPercent}%`;
  badge.classList.add("discount-badge");
  container.appendChild(badge);
}

// ── Filter ────────────────────────────────────────────────────

let activeStatusFilter = "all";
let activeSizeFilter = "size_all";
let activeTypeFilter = "all";

const STATUS_LABEL_KEYS = {
  all:      "filter_status_label",
  for_sale: "filter_for_sale",
  sold:     "filter_sold",
};

const SIZE_LABEL_KEYS = {
  size_all:    "filter_size_label",
  size_small:  "filter_size_small",
  size_medium: "filter_size_medium",
  size_large:  "filter_size_large",
};

const TYPE_LABEL_KEYS = {
  all:       "filter_type_label",
  painting:  "filter_type_painting",
  clay:      "filter_type_clay",
  bookmark:  "filter_type_bookmark",
};

function updateFilterLabels() {
  const statusLabel = document.getElementById("filter-status-label");
  const sizeLabel   = document.getElementById("filter-size-label");
  const typeLabel   = document.getElementById("filter-type-label");
  if (statusLabel) statusLabel.textContent = t(STATUS_LABEL_KEYS[activeStatusFilter]);
  if (sizeLabel)   sizeLabel.textContent   = t(SIZE_LABEL_KEYS[activeSizeFilter]);
  if (typeLabel)   typeLabel.textContent   = t(TYPE_LABEL_KEYS[activeTypeFilter]);
}

function toggleFilterDropdown(id) {
  const dd = document.getElementById(id);
  if (!dd) return;
  const isOpen = dd.classList.contains("open");
  document.querySelectorAll(".filter-dropdown.open").forEach(el => {
    el.classList.remove("open");
    el.querySelector(".filter-dropdown-trigger")?.setAttribute("aria-expanded", "false");
  });
  if (!isOpen) {
    dd.classList.add("open");
    dd.querySelector(".filter-dropdown-trigger")?.setAttribute("aria-expanded", "true");
  }
}

function attachFilterListeners() {
  document.querySelectorAll(".fab-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      if (btn.classList.contains("size-filter")) {
        setActiveSizeFilter(filter);
      } else if (btn.classList.contains("type-filter")) {
        setActiveTypeFilter(filter);
      } else if (btn.classList.contains("status-filter")) {
        setActiveStatusFilter(filter);
      }
      closeFab();
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".filter-dropdown")) {
      document.querySelectorAll(".filter-dropdown.open").forEach(el => {
        el.classList.remove("open");
        el.querySelector(".filter-dropdown-trigger")?.setAttribute("aria-expanded", "false");
      });
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".filter-dropdown.open").forEach(el => {
        el.classList.remove("open");
        el.querySelector(".filter-dropdown-trigger")?.setAttribute("aria-expanded", "false");
      });
    }
  });

  window.addEventListener("languagechange", updateFilterLabels);
  updateFilterLabels();

  setupFab();
  setupFilterBar();
}

function setActiveStatusFilter(filter) {
  activeStatusFilter = filter;
  document.querySelectorAll("#filter-status-dd .filter-option").forEach(b => {
    b.classList.toggle("active", b.dataset.filter === filter);
  });
  document.querySelectorAll(".fab-filter-btn.status-filter").forEach(b => {
    b.classList.toggle("active", b.dataset.filter === filter);
  });
  const dd = document.getElementById("filter-status-dd");
  if (dd) {
    dd.classList.toggle("has-filter", filter !== "all");
    dd.classList.remove("open");
    dd.querySelector(".filter-dropdown-trigger")?.setAttribute("aria-expanded", "false");
  }
  updateFilterLabels();
  filterGallery();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setActiveSizeFilter(filter) {
  activeSizeFilter = filter;
  document.querySelectorAll("#filter-size-dd .filter-option").forEach(b => {
    b.classList.toggle("active", b.dataset.filter === filter);
  });
  document.querySelectorAll(".fab-filter-btn.size-filter").forEach(b => {
    b.classList.toggle("active", b.dataset.filter === filter);
  });
  const dd = document.getElementById("filter-size-dd");
  if (dd) {
    dd.classList.toggle("has-filter", filter !== "size_all");
    dd.classList.remove("open");
    dd.querySelector(".filter-dropdown-trigger")?.setAttribute("aria-expanded", "false");
  }
  updateFilterLabels();
  filterGallery();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setActiveTypeFilter(filter) {
  activeTypeFilter = filter;
  document.querySelectorAll(".fab-filter-btn.type-filter, .filter-type-button").forEach(b => {
    b.classList.toggle("active", b.dataset.filter === filter);
  });
  document.querySelectorAll("#filter-type-dd .filter-option").forEach(b => {
    b.classList.toggle("active", b.dataset.filter === filter);
  });
  const typeDd = document.getElementById("filter-type-dd");
  if (typeDd) {
    typeDd.classList.toggle("has-filter", filter !== "all");
    typeDd.classList.remove("open");
    typeDd.querySelector(".filter-dropdown-trigger")?.setAttribute("aria-expanded", "false");
  }

  const showSizeFilter = filter === "all" || filter === "painting";
  updateSizeFilterVisibility(showSizeFilter);
  if (!showSizeFilter) {
    setActiveSizeFilter("size_all");
  }

  updateFilterLabels();
  filterGallery();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateSizeFilterVisibility(show) {
  const sizeFilterDd = document.getElementById("filter-size-dd");
  const sizeFilterButtons = document.querySelectorAll(".fab-filter-btn.size-filter");
  if (sizeFilterDd) {
    sizeFilterDd.style.display = show ? "" : "none";
  }
  sizeFilterButtons.forEach(btn => {
    btn.style.display = show ? "inline-flex" : "none";
  });
}

function filterGallery() {
  document.querySelectorAll(".gallery-item").forEach((item, idx) => {
    const painting = paintings[idx];
    const status = painting.status;
    const size = getPaintingSize(painting);
    const type = painting.type || TYPE.PAINTING;
    const statusMatch = activeStatusFilter === "all" || status === activeStatusFilter;
    const typeMatch = activeTypeFilter === "all" || type === activeTypeFilter;
    const sizeMatch = activeSizeFilter === "size_all" || size === activeSizeFilter.replace("size_", "");
    item.style.display = (statusMatch && typeMatch && sizeMatch) ? "" : "none";
  });
  // Show clay-empty notice when clay filter selected and no items are visible
  const galleryWrapper = document.getElementById('gallery-wrapper');
  if (!galleryWrapper) return;
  const existingNotice = document.getElementById('clay-empty-notice');
  const itemsVisible = Array.from(document.querySelectorAll('.gallery-item')).some(i => i.style.display !== 'none');
  if (activeTypeFilter === 'clay' && !itemsVisible) {
    if (!existingNotice) {
      const notice = document.createElement('div');
      notice.id = 'clay-empty-notice';
      notice.className = 'gallery-empty-notice';
      notice.textContent = t('clay_empty_notice');
      galleryWrapper.insertBefore(notice, galleryWrapper.firstChild);
    } else {
      existingNotice.style.display = '';
      existingNotice.textContent = t('clay_empty_notice');
    }
  } else if (existingNotice) {
    existingNotice.style.display = 'none';
  }
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