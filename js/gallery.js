// gallery.js — building and filtering the painting grid

// ── Configuration ──────────────────────────────────────────────

function getPaintingImagePaths(painting) {
  if (painting.images && Array.isArray(painting.images.desktop) && Array.isArray(painting.images.mobile)) {
    const isMobile = window.innerWidth <= 960;
    return isMobile ? painting.images.mobile : painting.images.desktop;
  }

  const folderId = painting.id;
  const count = painting.imageCount || 1;
  // Absolute, so the same path works from the root, from /pages/ and from a
  // work's own page under /pictures/
  const base = `/images/paintings/${folderId}/desktop/`;
  const mobileBase = `/images/paintings/${folderId}/mobile/`;
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

// Puts `paintings` in the order the buyer asked for. The chosen orders live in
// paintings.js; without one, the curated arrangement above applies.
function applyGallerySort() {
  const comparator = comparePaintingsBy(activeSortOrder);
  if (comparator) paintings.sort(comparator);
  else sortPaintings();
}

// ── Masonry layout ────────────────────────────────────────────
//
// The grid was CSS multi-column, which fills one column top to bottom before
// starting the next. With a sort order picked that read wrong: on two columns
// the left one held the first half of the order and the right one the second,
// so the tile next to the cheapest painting was the middle of the run rather
// than the second cheapest. Tiles are placed by hand instead — each goes to
// the column that is shortest so far, so reading left to right, top to bottom
// follows the sort order while the columns stay ragged and roughly level.

// Painting id → its tile. Laying out again moves the existing elements between
// columns rather than rebuilding them, so the images are never re-fetched.
let galleryTiles = new Map();

// The default when a piece has neither metadata nor measurements: slightly
// taller than wide, the shape most of the catalog is
const DEFAULT_TILE_RATIO = 0.8;

// Tiles are placed before their images load, so the height is estimated from
// the recorded aspect ratio, falling back on the piece's own measurements.
// The unit is one column width — only how the columns compare matters.
function estimateTileHeight(painting) {
  const isPainting = (painting.type || TYPE.PAINTING) === TYPE.PAINTING;
  const ratio = painting.aspectRatio
    || (painting.shape === SHAPE.CIRCLE ? 1 : 0)
    // A painting's photo is the painting, so its measurements are the shape of
    // the tile too. A product shot — the bookmark cover, showing a row of
    // them — is not, so that falls through to the default instead.
    || (isPainting && painting.width && painting.height ? painting.width / painting.height : 0)
    || DEFAULT_TILE_RATIO;
  return 1 / ratio;
}

// How many columns the stylesheet asks for at this width — the breakpoints
// stay in CSS, this only reads the result
function galleryColumnCount() {
  const galleryElement = document.getElementById("gallery");
  if (!galleryElement) return 1;
  const declared = parseInt(getComputedStyle(galleryElement).getPropertyValue("--gallery-columns"), 10);
  return declared > 0 ? declared : 1;
}

// Heights of the tiles as currently rendered, in column widths. Measured
// before anything moves, since a tile taken out of the page measures zero.
// The ratio holds when the column count changes, so these stay usable across
// a resize — and they beat the estimate for a piece whose photo is a
// different shape from the piece itself, such as the bookmark cover.
function measureTileHeights() {
  const measured = new Map();
  const column = document.querySelector(".gallery-column");
  const columnWidth = column ? column.getBoundingClientRect().width : 0;
  if (columnWidth <= 0) return measured;

  galleryTiles.forEach((tile, id) => {
    const height = tile.getBoundingClientRect().height;
    if (height > 0) measured.set(id, height / columnWidth);
  });
  return measured;
}

let laidOutColumnCount = 0;

function layoutGallery(visiblePaintings) {
  const galleryElement = document.getElementById("gallery");
  if (!galleryElement) return;

  const measured = measureTileHeights();
  const columns = Array.from({ length: galleryColumnCount() }, () => {
    const el = document.createElement("div");
    el.className = "gallery-column";
    return { el, height: 0 };
  });

  visiblePaintings.forEach(painting => {
    const tile = galleryTiles.get(painting.id);
    if (!tile) return;
    // A tie keeps the leftmost column, so the top row fills left to right
    // before anything starts a second row
    const target = columns.reduce((shortest, column) =>
      column.height < shortest.height ? column : shortest);
    target.el.appendChild(tile);
    target.height += measured.get(painting.id) ?? estimateTileHeight(painting);
  });

  galleryElement.replaceChildren(...columns.map(column => column.el));
  laidOutColumnCount = columns.length;
}

// Builds a tile per painting and lays the matching ones out
function buildGallery() {
  const galleryElement = document.getElementById("gallery");
  if (!galleryElement) return;
  galleryTiles = new Map(paintings.map(painting => [painting.id, createGalleryItem(painting)]));
  filterGallery();
}

function createGalleryItem(painting) {
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
    window.location.href = paintingPageUrl(painting);
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
        window.location.href = paintingPageUrl(painting);
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
let activeSortOrder = GALLERY_SORT.DEFAULT;

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

const SORT_LABEL_KEYS = {
  [GALLERY_SORT.DEFAULT]:    "filter_sort_label",
  [GALLERY_SORT.PRICE_ASC]:  "filter_sort_price_asc",
  [GALLERY_SORT.PRICE_DESC]: "filter_sort_price_desc",
  [GALLERY_SORT.SIZE_ASC]:   "filter_sort_size_asc",
  [GALLERY_SORT.SIZE_DESC]:  "filter_sort_size_desc",
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
  const sortLabel   = document.getElementById("filter-sort-label");
  if (statusLabel) statusLabel.textContent = t(STATUS_LABEL_KEYS[activeStatusFilter]);
  if (sizeLabel)   sizeLabel.textContent   = t(SIZE_LABEL_KEYS[activeSizeFilter]);
  if (typeLabel)   typeLabel.textContent   = t(TYPE_LABEL_KEYS[activeTypeFilter]);
  if (sortLabel)   sortLabel.textContent   = t(SORT_LABEL_KEYS[activeSortOrder]);
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
      } else if (btn.classList.contains("sort-filter")) {
        setActiveSortOrder(filter);
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

  window.addEventListener("languagechange", () => {
    updateFilterLabels();
    // Tile prices and badges are built with t() at render time, so they keep
    // the old language until the grid is rebuilt
    buildGallery();
  });

  // The stylesheet asks for fewer columns as the window narrows, and the tiles
  // have to be dealt out again when it does
  window.addEventListener("resize", () => requestAnimationFrame(() => {
    if (galleryColumnCount() !== laidOutColumnCount) filterGallery();
  }));
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
  document.querySelectorAll(".fab-filter-btn.type-filter").forEach(b => {
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

function setActiveSortOrder(order) {
  activeSortOrder = order;
  document.querySelectorAll("#filter-sort-dd .filter-option").forEach(b => {
    b.classList.toggle("active", b.dataset.filter === order);
  });
  document.querySelectorAll(".fab-filter-btn.sort-filter").forEach(b => {
    b.classList.toggle("active", b.dataset.filter === order);
  });
  const dd = document.getElementById("filter-sort-dd");
  if (dd) {
    dd.classList.toggle("has-filter", order !== GALLERY_SORT.DEFAULT);
    dd.classList.remove("open");
    dd.querySelector(".filter-dropdown-trigger")?.setAttribute("aria-expanded", "false");
  }
  updateFilterLabels();
  applyGallerySort();
  filterGallery();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateSizeFilterVisibility(show) {
  const sizeFilterDd = document.getElementById("filter-size-dd");
  // The whole group goes, heading included — a lone "Storlek" label above an
  // empty row would be worse than no group at all
  const sizeFilterGroup = document.getElementById("fab-group-size");
  if (sizeFilterDd) {
    sizeFilterDd.style.display = show ? "" : "none";
  }
  if (sizeFilterGroup) {
    sizeFilterGroup.style.display = show ? "" : "none";
  }
}

function paintingMatchesFilters(painting) {
  const type = painting.type || TYPE.PAINTING;
  const size = getPaintingSize(painting);
  const statusMatch = activeStatusFilter === "all" || painting.status === activeStatusFilter;
  const typeMatch = activeTypeFilter === "all" || type === activeTypeFilter;
  const sizeMatch = activeSizeFilter === "size_all" || size === activeSizeFilter.replace("size_", "");
  return statusMatch && typeMatch && sizeMatch;
}

function filterGallery() {
  const visiblePaintings = paintings.filter(paintingMatchesFilters);
  layoutGallery(visiblePaintings);

  // Show clay-empty notice when clay filter selected and no items are visible
  const galleryWrapper = document.getElementById('gallery-wrapper');
  if (!galleryWrapper) return;
  const existingNotice = document.getElementById('clay-empty-notice');
  if (activeTypeFilter === 'clay' && visiblePaintings.length === 0) {
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

  const toggleFab = () => {
    fab.classList.contains("open") ? closeFab() : openFab();
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

  // The header floats over the page, so anything the button or the sheet does
  // near the top of the screen has to stay clear of it. Its height is the same
  // whether or not it is showing; where it currently sits is not, since it
  // slides in and out on its own.
  const header = document.getElementById("header-container");
  const headerHeight = () => (header ? header.offsetHeight : 0);
  const headerBottom = () => (header ? Math.max(0, header.getBoundingClientRect().bottom) : 0);

  // Where the sheet opens is fixed: the button returns to its resting corner
  // first, so the menu is always the same full size in the same place, however
  // far up the footer had pushed the button beforehand.
  const layoutPopup = () => {
    fab.classList.add("fab--sliding");
    void fab.offsetWidth; // so the slide home animates rather than jumping
    fab.style.bottom = FAB_HOME_MARGIN + "px";

    const gap = 12;   // the sheet's own margin against the button
    const edge = 16;  // never let the sheet touch the top of the screen
    const buttonTop = window.innerHeight - FAB_HOME_MARGIN - (trigger.offsetHeight || 52);
    const room = buttonTop - gap - headerBottom() - edge;
    // Otherwise as tall as the stylesheet ever lets it be
    popup.style.maxHeight = Math.min(window.innerHeight * 0.72, 560, room) + "px";
  };

  const updatePosition = () => {
    const galleryWrapper = document.getElementById("gallery-wrapper");
    if (galleryWrapper && galleryWrapper.getBoundingClientRect().bottom <= 0) {
      fab.style.display = "none";
      return;
    }
    fab.style.display = "flex";
    if (!footer) { fab.style.bottom = FAB_HOME_MARGIN + "px"; return; }
    const footerRect = footer.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const lift = footerRect.top < windowHeight
      ? windowHeight - footerRect.top + FAB_HOME_MARGIN
      : FAB_HOME_MARGIN;
    // A tall footer on a short page could otherwise push the button clean off
    // the top of the screen, or up behind the header — where it cannot be
    // tapped, and with an empty grid it is the only way back to the filters.
    // The reserved band is the header's height, not where it happens to be:
    // it can slide into view long after this last ran.
    const maxLift = windowHeight - headerHeight() - 8 - (trigger.offsetHeight || 52);
    fab.style.bottom = Math.max(FAB_HOME_MARGIN, Math.min(lift, maxLift)) + "px";
  };

  fabLayoutPopup = layoutPopup;
  // Closing hands the button back to the footer, sliding rather than jumping
  fabRestorePosition = () => {
    updatePosition();
    setTimeout(() => fab.classList.remove("fab--sliding"), 300);
  };

  updatePosition();
  setTimeout(updatePosition, 100);
  setTimeout(updatePosition, 500);
  window.addEventListener("scroll", () => {
    // Tracking the footer frame by frame, so no transition to lag behind
    fab.classList.remove("fab--sliding");
    window.requestAnimationFrame(updatePosition);
    closeFab();
  }, { passive: true });
  window.addEventListener("resize", () => {
    window.requestAnimationFrame(() => {
      if (fab.classList.contains("open")) layoutPopup(); else updatePosition();
    });
  }, { passive: true });
  document.addEventListener("click", (e) => { if (!fab.contains(e.target)) closeFab(); });
}

// The sheet is taken out of the flow once it has faded, so it cannot catch
// taps meant for the page underneath. Opening and closing share one timer:
// with a timer each, a close left over from the last scroll would hide a sheet
// that had already been reopened.
const FAB_FADE_MS = 250;
const FAB_HOME_MARGIN = 24;
let fabCloseTimer = null;
let fabLayoutPopup = null;
let fabRestorePosition = null;

function openFab() {
  const fab = document.getElementById("filter-fab");
  const popup = fab?.querySelector(".fab-popup");
  if (!popup) return;
  clearTimeout(fabCloseTimer);
  if (fabLayoutPopup) fabLayoutPopup();
  popup.style.display = "flex";
  // Two frames, so the sheet is laid out before the opening transition starts
  requestAnimationFrame(() => requestAnimationFrame(() => fab.classList.add("open")));
}

function closeFab() {
  const fab = document.getElementById("filter-fab");
  const popup = fab?.querySelector(".fab-popup");
  if (!popup) return;
  const wasOpen = fab.classList.contains("open");
  fab.classList.remove("open");
  clearTimeout(fabCloseTimer);
  fabCloseTimer = setTimeout(() => { popup.style.display = "none"; }, FAB_FADE_MS);
  if (wasOpen && fabRestorePosition) fabRestorePosition();
}

// ── Sticky filter bar (desktop) ───────────────────────────────

function setupFilterBar() {
  const bar = document.getElementById("gallery-filter-bar");
  if (!bar) return;

  const headerContainer = document.getElementById("header-container");
  let headerH = 0;

  // The bar only exists from 961px up (below that the floating button carries
  // the filters), so both of these leave the page alone on smaller screens and
  // main keeps the plain header offset it gets from base.css
  const isDesktopBar = () => window.innerWidth >= 961;

  const updateMainPadding = () => {
    const mainEl = document.querySelector("main");
    if (!mainEl) return;
    mainEl.style.paddingTop = isDesktopBar()
      ? headerH + bar.offsetHeight + 16 + "px"
      : "";
  };

  const setBarTransform = (show) => {
    if (!isDesktopBar()) return;
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