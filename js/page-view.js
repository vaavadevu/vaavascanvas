// page-view.js — page view display, navigation, zoom, and swipe logic


// ── DOM refs ──────────────────────────────────────────────────

let pageViewImg, pageViewTitle, pageViewSize, pageViewDesc, pageViewButtons, pageViewPriceSection, pageViewMedium;
let pageViewPrevBtn, pageViewNextBtn;

// Fullscreen navigation
let fullscreenImageIndex = 0;
let fullscreenImages = [];
let fullscreenZoomLevel = 0;

// ── Fullscreen image viewer ───────────────────────────────────

function resetFullscreenZoom() {
  const img = document.getElementById("fullscreenImg");
  if (!img) return;
  fullscreenZoomLevel = 0;
  img.style.transform = "scale(1)";
  img.style.transformOrigin = "center center";
  document.getElementById("fullscreenOverlay")?.classList.remove("is-zoomed-1", "is-zoomed-2");
}

function updateFullscreenZoomPosition(e, overlay) {
  const img = document.getElementById("fullscreenImg");
  if (!img) return;
  const rect = overlay.getBoundingClientRect();
  img.style.transformOrigin =
    `${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%`;
}

function openFullscreen(imageSrc, imageIndex = 0, images = [imageSrc]) {
  const overlay = document.getElementById("fullscreenOverlay");
  const img = document.getElementById("fullscreenImg");
  if (!overlay || !img) return;

  if (typeof fullscreenImageIndex !== 'undefined') {
    fullscreenImageIndex = imageIndex;
    fullscreenImages = images;
  }

  img.src = imageSrc;
  overlay.classList.add("active");
  resetFullscreenZoom();
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
}

function closeFullscreen() {
  const overlay = document.getElementById("fullscreenOverlay");
  if (!overlay) return;

  overlay.classList.remove("active");
  resetFullscreenZoom();
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
}

function resolvePageViewRefs() {
  pageViewImg = document.getElementById("pageview-img");
  pageViewTitle = document.getElementById("pageview-title");
  pageViewSize = document.getElementById("pageview-size");
  pageViewDesc = document.getElementById("pageview-desc");
  pageViewMedium = document.getElementById("pageview-medium");
  pageViewButtons = document.getElementById("pageview-buttons");
  pageViewPriceSection = document.getElementById("pageview-price-section");
  pageViewNextBtn = document.getElementById("pageview-next");
  pageViewPrevBtn = document.getElementById("pageview-prev");
  return pageViewImg && pageViewTitle;
}

// ── Open / close ──────────────────────────────────────────────

function openPageView(index) {
  if (!resolvePageViewRefs()) return;
  State.currentPaintingIndex = index;
  State.currentImageIndex = 0;
  const painting = paintings[index];
  populatePageView(painting);
  renderPageViewFrameInfo(painting);
  renderPageViewButtons(painting);
  preloadAdjacentImages();
  updatePageViewUrl(painting);
  const price = getPaintingEffectivePrice(painting, painting.framedOnly);
  const paintingType = painting.type || TYPE.PAINTING;
  const category = paintingType === TYPE.PAINTING ? 'original' : paintingType;
  trackEvent('view_item', { currency: 'SEK', value: price, items: [{ item_id: painting.id, item_name: painting.title, item_category: category, price }] });
}

// Browsing on from a work lands on another work, so the address bar, the tab
// title and the canonical link all have to follow. Without this a visitor who
// clicked through and then shared the link would be handing out a URL whose
// preview showed whichever work they happened to start from.
function updatePageViewUrl(painting) {
  if (isLegacyViewPage()) {
    setUrlParam("painting", painting.id);
    return;
  }

  document.body.dataset.paintingId = painting.id;
  window.history.replaceState({}, "", paintingPageUrl(painting));
  document.title = paintingPageTitle(painting, t(painting.medium));

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = new URL(paintingPageUrl(painting), window.location.origin).href;
}

// ── Populate helpers ──────────────────────────────────────────

function populatePageView(painting) {
  const imgs = getPaintingImagePaths(painting);
  pageViewImg.src = imgs[0];
  pageViewImg.alt = painting.title;
  pageViewTitle.textContent = painting.title;
  pageViewSize.textContent = formatDimensions(painting);
  updatePageViewDescription(painting);
  renderPageViewMedium(painting);
  renderPageViewPrice(painting);
  buildPageViewThumbnails(imgs);
  updatePageViewSoldFlag(painting);
  configurePageViewArrows(imgs);
}

// The badge in the corner of the big image, the same one the gallery tile
// carries
function updatePageViewSoldFlag(painting) {
  const flag = document.getElementById("pageview-sold-flag");
  if (!flag) return;
  flag.hidden = painting.status !== STATUS.SOLD;
}

function buildPageViewThumbnails(imgs) {
  const container = document.getElementById("pageview-thumbs");
  container.innerHTML = "";
  if (imgs.length <= 1) return;
  imgs.forEach((src, idx) => {
    const thumb = document.createElement("img");
    thumb.loading = "lazy";
    thumb.src = src;
    thumb.classList.add("pageViewThumb");
    if (idx === 0) thumb.classList.add("active");
    thumb.addEventListener("click", () =>
      transitionToPageViewImage(imgs, idx, idx > State.currentImageIndex ? 1 : -1)
    );
    container.appendChild(thumb);
  });
}

function configurePageViewArrows(imgs) {
  // Arrows are hidden in page view - no configuration needed
}

function addPaintingToCart(painting, withFrame) {
  const price = getPaintingEffectivePrice(painting, withFrame);
  const title = painting.title;
  const paintingType = painting.type || TYPE.PAINTING;
  const itemType = paintingType === TYPE.PAINTING ? 'original' : paintingType;
  const cartItem = {
    id: withFrame ? `${painting.id}-framed` : painting.id,
    title,
    type: itemType,
    price,
    image: (typeof State.currentImageIndex === 'number') ? getPaintingImagePaths(painting)[State.currentImageIndex] : getPaintingImagePaths(painting)[0],
  };

  if (itemType === 'original') {
    Object.assign(cartItem, {
      paintingBaseId: painting.id,
      paintingTitle: painting.title,
      frameAvailable: painting.frameAvailable || false,
      framedOnly: painting.framedOnly || false,
      withFrame: withFrame || false,
      basePrice: getPaintingDiscountedPrice(painting) || painting.originalPrice || painting.framedPrice,
      framedPrice: painting.framedPrice ? getPaintingFramedSalePrice(painting) : null,
      originalBasePrice: painting.originalPrice,
      originalFramedPrice: painting.framedPrice,
    });
  }

  if (itemType === TYPE.BOOKMARK) {
    Object.assign(cartItem, bookmarkCartTerms(painting));

    // Bookmarks are cheaper by the piece once you buy more than one, and the
    // buyer has no way of knowing that from the one page they are on. Adding
    // one is the moment to say so and show what else there is — with the
    // drawer held back, so the offer is not made behind it.
    if (bookmarksLeftToBuy(painting).length > 0) {
      Cart.add(cartItem, { openDrawer: false });
      showMoreBookmarksModal(painting);
      return;
    }
  }

  Cart.add(cartItem);
}

// ── "Would you like another?" ─────────────────────────────────
//
// Every bookmark still for sale that is not already in the cart. `justAdded`
// is left out too, because it has only just gone in and the cart may not have
// been asked about it yet.
function bookmarksLeftToBuy(justAdded) {
  if (typeof paintings === "undefined" || typeof Cart === "undefined") return [];

  return paintings.filter(p =>
    p.type === TYPE.BOOKMARK &&
    p.status === STATUS.FOR_SALE &&
    p.id !== justAdded?.id &&
    !Cart.has(p.id));
}

function bookmarksInCart() {
  if (typeof paintings === "undefined" || typeof Cart === "undefined") return 0;
  return paintings.filter(p => p.type === TYPE.BOOKMARK && Cart.has(p.id)).length;
}

// The cart item for a bookmark picked out of the offer rather than from its
// own page, so both routes put the same thing in the cart
function bookmarkCartItem(painting) {
  return {
    id: painting.id,
    title: painting.title,
    type: TYPE.BOOKMARK,
    price: getPaintingEffectivePrice(painting, false),
    image: getPaintingImagePaths(painting)[0],
    ...bookmarkCartTerms(painting),
  };
}

function hideMoreBookmarksModal() {
  const modal = document.getElementById("more-bookmarks-modal");
  if (!modal) return;
  modal.remove();
  document.body.style.overflow = "";
  document.removeEventListener("keydown", moreBookmarksEscape);
}

function moreBookmarksEscape(e) {
  if (e.key === "Escape") hideMoreBookmarksModal();
}

// Rebuilt from scratch on every open and after every pick, so the list, the
// prices and the language are never left over from the last time
function showMoreBookmarksModal(justAdded) {
  hideMoreBookmarksModal();

  const remaining = bookmarksLeftToBuy(justAdded);
  if (remaining.length === 0) {
    Cart.openCart();
    return;
  }

  const terms = bookmarkCartTerms(justAdded);
  const enough = bookmarksInCart() >= terms.multiBuyMinQuantity;
  const offer = enough
    ? t("bookmark_more_discount_active").replace("{multi}", terms.multiBuyPrice.toLocaleString("sv-SE"))
    : t("bookmark_more_offer")
        .replace("{multi}", terms.multiBuyPrice.toLocaleString("sv-SE"))
        .replace("{single}", terms.basePrice.toLocaleString("sv-SE"));

  const modal = document.createElement("div");
  modal.id = "more-bookmarks-modal";
  modal.className = "more-bookmarks-modal";
  modal.innerHTML = `
    <div class="more-bookmarks-inner" role="dialog" aria-modal="true" aria-labelledby="more-bookmarks-title">
      <button type="button" class="more-bookmarks-close" aria-label="${t("bookmark_more_close_label")}">&times;</button>
      <h3 class="more-bookmarks-title" id="more-bookmarks-title">${t("bookmark_more_title")}</h3>
      <p class="more-bookmarks-added">${t("bookmark_more_added").replace("{title}", justAdded.title)}</p>
      <p class="more-bookmarks-offer${enough ? " is-active" : ""}">${offer}</p>
      <div class="more-bookmarks-grid"></div>
      <div class="more-bookmarks-actions">
        <button type="button" class="btn btn-secondary" id="more-bookmarks-done">${t("bookmark_more_done_btn")}</button>
        <button type="button" class="btn btn-primary" id="more-bookmarks-cart">${t("bookmark_more_cart_btn")}</button>
      </div>
    </div>
  `;

  const grid = modal.querySelector(".more-bookmarks-grid");
  const alreadyIn = bookmarksInCart();

  remaining.forEach(bookmark => {
    // What this one would actually cost if it were picked — taking it may be
    // what tips the whole cart onto the cheaper per-piece price, and a tile
    // still reading 120 kr under "you have the reduced price" would be a lie
    const pick = bookmarkCartTerms(bookmark);
    const discounted = alreadyIn + 1 >= pick.multiBuyMinQuantity;
    const price = discounted ? pick.multiBuyPrice : pick.basePrice;

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "more-bookmarks-pick";
    cell.innerHTML = `
      <img src="${getPaintingImagePaths(bookmark)[0]}" loading="lazy" alt="${bookmark.title}" />
      <span class="more-bookmarks-pick-title">${bookmark.title}</span>
      <span class="more-bookmarks-pick-price">
        ${formatPrice(price)}
        ${price < pick.basePrice ? `<span class="more-bookmarks-pick-price-old">${formatPrice(pick.basePrice)}</span>` : ""}
      </span>
    `;
    // Picking one adds it and asks the same question again, so a buyer can
    // take several without the offer disappearing after the first
    cell.addEventListener("click", () => {
      Cart.add(bookmarkCartItem(bookmark), { openDrawer: false });
      showMoreBookmarksModal(bookmark);
    });
    grid.appendChild(cell);
  });

  modal.querySelector("#more-bookmarks-done").addEventListener("click", hideMoreBookmarksModal);
  modal.querySelector(".more-bookmarks-close").addEventListener("click", hideMoreBookmarksModal);
  modal.querySelector("#more-bookmarks-cart").addEventListener("click", () => {
    hideMoreBookmarksModal();
    Cart.openCart();
  });
  // Clicking the dimmed page behind the panel closes it, as it does elsewhere
  modal.addEventListener("click", e => {
    if (e.target === modal) hideMoreBookmarksModal();
  });

  (document.getElementById("modals-container") || document.body).appendChild(modal);
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", moreBookmarksEscape);
  requestAnimationFrame(() => modal.classList.add("active"));
}

// Where a sold work sends the buyer instead of stopping at "Såld". The
// commission link carries the work along, so the form opens already knowing
// which motif started the conversation.
function commissionUrlFor(painting) {
  return `/pages/commissions.html?type=Commissions&ref=${encodeURIComponent(painting.id)}#footer`;
}

function renderPageViewButtons(painting) {
  pageViewButtons.innerHTML = "";

  // A sold work is the best proof the art sells, so its page offers a way on
  // rather than ending in a red "Såld"
  if (painting.status === STATUS.SOLD) {
    const commission = document.createElement("a");
    commission.className = "btn btn-primary pageview-sold-btn";
    commission.href = commissionUrlFor(painting);
    commission.dataset.i18n = "pageview_sold_commission_btn";
    commission.textContent = t("pageview_sold_commission_btn");
    pageViewButtons.appendChild(commission);

    const notify = document.createElement("button");
    // Opens the same modal as the footer's bell — see setupModals() in ui.js
    notify.className = "btn btn-secondary pageview-sold-btn subscribe-open";
    notify.type = "button";
    notify.dataset.i18n = "pageview_sold_notify_btn";
    notify.textContent = t("pageview_sold_notify_btn");
    pageViewButtons.appendChild(notify);
    return;
  }

  if (painting.status === STATUS.FOR_SALE && (painting.originalPrice || painting.framedOnly)) {
    if (painting.framedOnly) {
      // framedOnly: no selector needed, frame info shown in renderPageViewFrameInfo
    } else if (painting.frameAvailable) {
      const saleBasePrice = getPaintingDiscountedPrice(painting) || painting.originalPrice;
      const saleFramedPrice = getPaintingFramedSalePrice(painting) || painting.framedPrice;

      // Frame selector (for desktop only, contains radio buttons)
      const frameContainer = document.createElement("div");
      frameContainer.classList.add("frame-selector");

      const optionsWrapper = document.createElement("div");
      optionsWrapper.classList.add("frame-options");

      const withoutId = `frame-without-${Date.now()}`;
      const withId = `frame-with-${Date.now()}`;
      const groupName = `frame-${Date.now()}`;

      // Without frame radio option
      const withoutLabel = document.createElement("label");
      withoutLabel.classList.add("frame-radio-label");
      const withoutInput = document.createElement("input");
      withoutInput.type = "radio";
      withoutInput.id = withoutId;
      withoutInput.name = groupName;
      withoutInput.value = "without";
      withoutInput.checked = true;
      withoutLabel.appendChild(withoutInput);
      const withoutLabelText = document.createElement("span");
      withoutLabelText.classList.add("radio-label-text");
      withoutLabelText.innerHTML = `
        <span class="option-title">${t("frame_price_without")}</span>
        <span class="option-price">${formatPrice(saleBasePrice)}</span>
        ${hasPaintingDiscount(painting) ? `<span class="option-price-old">${formatPrice(painting.originalPrice)}</span>` : ''}
      `;
      withoutLabel.appendChild(withoutLabelText);
      optionsWrapper.appendChild(withoutLabel);

      // With frame radio option
      const withLabel = document.createElement("label");
      withLabel.classList.add("frame-radio-label");
      const withInput = document.createElement("input");
      withInput.type = "radio";
      withInput.id = withId;
      withInput.name = groupName;
      withInput.value = "with";
      withLabel.appendChild(withInput);
      const withLabelText = document.createElement("span");
      withLabelText.classList.add("radio-label-text");
      withLabelText.innerHTML = `
        <span class="option-title">${t("frame_price_with")}</span>
        <span class="option-price">${formatPrice(saleFramedPrice)}</span>
        ${hasPaintingDiscount(painting) ? `<span class="option-price-old">${formatPrice(painting.framedPrice)}</span>` : ''}
      `;
      withLabel.appendChild(withLabelText);
      optionsWrapper.appendChild(withLabel);

      frameContainer.appendChild(optionsWrapper);
      pageViewButtons.appendChild(frameContainer);
    }

    const buyBtn = document.createElement("button");
    buyBtn.classList.add("pageview-buy-btn");
    const inCart = Cart.hasOriginal(painting.id);

    function updateBuyButtonLabel() {
      buyBtn.textContent = t("modal_buy_btn");
    }

    if (inCart) {
      buyBtn.textContent = t("modal_in_cart_btn");
      buyBtn.addEventListener("click", () => Cart.openCart());
    } else {
      updateBuyButtonLabel();
      const frameRadios = pageViewButtons.querySelectorAll('input[type="radio"]');
      frameRadios.forEach(radio => radio.addEventListener('change', updateBuyButtonLabel));

      buyBtn.addEventListener("click", () => {
        if (painting.framedOnly) {
          addPaintingToCart(painting, true);
        } else if (painting.frameAvailable && window.innerWidth <= 960) {
          showFrameSelectorModal(painting);
        } else if (painting.frameAvailable) {
          const selectedRadio = pageViewButtons.querySelector('input[type="radio"]:checked');
          const withFrame = selectedRadio?.value === "with";
          addPaintingToCart(painting, withFrame);
        } else {
          addPaintingToCart(painting, false);
        }
      });
    }
    pageViewButtons.appendChild(buyBtn);
  }

}

// Bookmarks cost less per piece once you buy more than one, so the price
// section says so. Built from the catalogue, so repricing them never leaves a
// stale number on screen.
function getMultiBuyPriceNote(painting) {
  const single = painting.originalPrice || painting.framedPrice || 0;
  const multi = painting.multiBuyPrice;
  if (!multi || multi >= single) return '';

  return t('pageview_multibuy_note').replace('{multi}', multi.toLocaleString('sv-SE'));
}

function showFrameSelectorModal(painting) {
  const saleBasePrice = getPaintingDiscountedPrice(painting) || painting.originalPrice;
  const saleFramedPrice = getPaintingFramedSalePrice(painting) || painting.framedPrice;

  // Check if we already have a cloned modal in the body
  let frameSelector = document.querySelector("body > .frame-selector");

  // If not, create one by cloning from pageViewButtons
  if (!frameSelector) {
    const original = pageViewButtons.querySelector(".frame-selector");
    if (original) {
      frameSelector = original.cloneNode(true);
      document.body.appendChild(frameSelector);
    }
  }

  const overlay = document.querySelector(".frame-selector-overlay");

  if (frameSelector) {
    // Remove any existing action buttons
    const existingBtns = frameSelector.querySelectorAll(".frame-action-btn");
    existingBtns.forEach(btn => btn.remove());

    // Create button container
    const btnContainer = document.createElement("div");
    btnContainer.classList.add("frame-action-buttons");

    // Without frame button (only if painting is not frame-only)
    if (!painting.framedOnly) {
      const withoutBtn = document.createElement("button");
      withoutBtn.type = "button";
      withoutBtn.classList.add("frame-action-btn", "frame-action-without");
      withoutBtn.innerHTML = `
        <span class="btn-title">${t("frame_price_without")}</span>
        <span class="btn-price">${formatPrice(saleBasePrice)}</span>
        ${hasPaintingDiscount(painting) ? `<span class="btn-price-old">${formatPrice(painting.originalPrice)}</span>` : ''}
      `;
      withoutBtn.addEventListener("click", () => {
        hideFrameSelectorModal(() => addPaintingToCart(painting, false));
      }, { once: true });
      btnContainer.appendChild(withoutBtn);
    }

    // With frame button
    const withBtn = document.createElement("button");
    withBtn.type = "button";
    withBtn.classList.add("frame-action-btn", "frame-action-with");
    withBtn.innerHTML = `
      <span class="btn-title">${t("frame_price_with")}</span>
      <span class="btn-price">${formatPrice(saleFramedPrice)}</span>
      ${hasPaintingDiscount(painting) ? `<span class="btn-price-old">${formatPrice(painting.framedPrice)}</span>` : ''}
    `;
    withBtn.addEventListener("click", () => {
      hideFrameSelectorModal(() => addPaintingToCart(painting, true));
    }, { once: true });
    btnContainer.appendChild(withBtn);

    frameSelector.appendChild(btnContainer);
    frameSelector.classList.add("mobile-visible");
    // Prevent scroll when modal is open
    document.body.style.overflow = "hidden";
  }
  if (overlay) {
    overlay.classList.add("mobile-visible");
  }
}

function hideFrameSelectorModal(callback) {
  const frameSelector = document.querySelector(".frame-selector.mobile-visible");
  const overlay = document.querySelector(".frame-selector-overlay.mobile-visible");

  if (frameSelector) {
    frameSelector.classList.add("closing");
    setTimeout(() => {
      frameSelector.classList.remove("mobile-visible", "closing");
      document.body.style.overflow = "";
      if (callback) callback();
    }, 300);
  }
  if (overlay) {
    overlay.classList.remove("mobile-visible");
  }
}

function setupFrameSelectorModal() {
  // Create overlay element if we're on mobile
  if (window.innerWidth <= 960) {
    let overlay = document.querySelector(".frame-selector-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.classList.add("frame-selector-overlay");
      document.body.appendChild(overlay);

      overlay.addEventListener("click", () => hideFrameSelectorModal());

      // Add swipe gesture to close modal
      setupFrameSelectorSwipe(overlay);
    }
  }
}

function setupFrameSelectorSwipe(overlay) {
  let touchStartY = 0;
  let touchEndY = 0;

  overlay.addEventListener("touchstart", (e) => {
    touchStartY = e.changedTouches[0].clientY;
  }, false);

  overlay.addEventListener("touchend", (e) => {
    touchEndY = e.changedTouches[0].clientY;
    handleFrameSelectorSwipe(touchStartY, touchEndY);
  }, false);
}

function handleFrameSelectorSwipe(startY, endY) {
  const swipeThreshold = 50; // Minimum swipe distance in pixels
  const swipeDistance = endY - startY;

  // Swipe down to close
  if (swipeDistance > swipeThreshold) {
    hideFrameSelectorModal();
  }
  // Swipe up to close (upward swipe on overlay)
  else if (swipeDistance < -swipeThreshold) {
    hideFrameSelectorModal();
  }
}


function updatePageViewDescription(painting) {
  pageViewDesc.textContent = t(painting.descKey);
}

function renderPageViewMedium(painting) {
  if (painting.medium) {
    pageViewMedium.textContent = `${t(painting.medium)}`;
  } else {
    pageViewMedium.textContent = "";
  }
}

function renderPageViewFrameInfo(painting) {
  // Remove any existing frame info paragraph
  const existing = document.getElementById("pageview-frame-info");
  if (existing) existing.remove();

  if (painting.frameAvailable) {
    const frameInfo = document.createElement("p");
    frameInfo.id = "pageview-frame-info";
    frameInfo.textContent = painting.framedOnly ? t("frame_included") : t("frame_available");
    frameInfo.classList.add("pageview-frame-info");
    pageViewMedium.parentNode.insertBefore(frameInfo, pageViewMedium.nextSibling);
  }
}

function renderPageViewPrice(painting) {
  pageViewPriceSection.innerHTML = "";

  const addLine = (text, className, color) => {
    const p = document.createElement("p");
    p.textContent = text;
    if (className) p.classList.add(className);
    if (color) p.style.color = color;
    pageViewPriceSection.appendChild(p);
    return p;
  };

  // getPriceModel() decides what belongs here; this function only draws it
  const model = getPriceModel(painting);

  if (model.status === 'sold') {
    addLine(t("status_sold"), null, "red");
    return;
  }

  if (model.status === 'personal') {
    addLine(t("status_personal"));
    return;
  }

  if (model.status === 'priced') {
    addLine(formatPrice(model.price), "pageview-price");

    if (model.oldPrice !== null) {
      addLine(formatPrice(model.oldPrice), "pageview-old-price");
      addLine(`-${model.discountPercent}% ${t('pageview_discount_text')}`, "pageview-discount-note");
    }
  }

  // Products sold in multiples (bookmarks) state the cheaper per-piece price
  // here too, so it is visible while browsing and not only inside the picker
  const multiBuyNote = getMultiBuyPriceNote(painting);
  if (multiBuyNote) {
    addLine(multiBuyNote, "pageview-multibuy-note");
  }
}

// ── Zoom ──────────────────────────────────────────────────────

let pageViewZoomLevel = 0;

function resetPageViewZoom() {
  pageViewZoomLevel = 0;
  pageViewImg.style.transform = "scale(1)";
  pageViewImg.style.transformOrigin = "center center";
  document.querySelector(".pageViewImageWrapper")?.classList.remove("is-zoomed-1", "is-zoomed-2");
}

function updatePageViewThumbHighlight(activeIndex) {
  document.querySelectorAll(".pageViewThumb").forEach((thumb, idx) => {
    thumb.classList.toggle("active", idx === activeIndex);
  });
}

function setupPageViewZoomEffect() {
  const wrapper = document.querySelector(".pageViewImageWrapper");
  if (!wrapper || !pageViewImg) return;

  // Zoom is disabled in page view - click opens fullscreen instead
  // Zoom only available in fullscreen mode (see setupPageViewFullscreenZoom)
}

function updatePageViewZoomPosition(e, wrapper) {
  const rect = wrapper.getBoundingClientRect();
  pageViewImg.style.transformOrigin =
    `${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%`;
}

// ── Image transitions (within a painting) ────────────────────

function transitionToPageViewImage(imgs, newIndex, direction) {
  if (State.isTransitioning) return;
  State.isTransitioning = true;

  State.currentImageIndex = newIndex;
  pageViewImg.src = imgs[newIndex];
  resetPageViewZoom();
  updatePageViewThumbHighlight(newIndex);
  updatePageViewSoldFlag(paintings[State.currentPaintingIndex], imgs[newIndex]);
  State.isTransitioning = false;
}

// ── Painting transitions (between paintings) ─────────────────

function transitionToPageViewPainting(newIndex, direction) {
  if (State.isTransitioning) return;
  State.isTransitioning = true;

  State.currentPaintingIndex = newIndex;
  State.currentImageIndex = 0;
  const p = paintings[newIndex];
  const imgs = getPaintingImagePaths(p);
  pageViewImg.src = imgs[0];
  pageViewTitle.textContent = p.title;
  pageViewSize.textContent = formatDimensions(p);
  updatePageViewDescription(p);
  renderPageViewMedium(p);
  renderPageViewFrameInfo(p);
  renderPageViewPrice(p);
  buildPageViewThumbnails(imgs, p);
  updatePageViewSoldFlag(p, imgs[0]);
  configurePageViewArrows(imgs);
  renderPageViewButtons(p);
  setUrlParam("painting", p.id);
  preloadAdjacentImages();
  State.isTransitioning = false;
}

function showNextPageViewPainting() {
  transitionToPageViewPainting((State.currentPaintingIndex + 1) % paintings.length, 1);
}

function showPrevPageViewPainting() {
  transitionToPageViewPainting((State.currentPaintingIndex - 1 + paintings.length) % paintings.length, -1);
}

// ── Swipe gestures ────────────────────────────────────────────

function setupPageViewSwipeGestures() {
  const wrapper = document.querySelector(".pageViewImageWrapper");
  const container = document.querySelector(".page-view-container");
  if (!container) return;

  // Inside image wrapper: navigate within painting images
  if (wrapper) {
    let nextImg = null;

    setupSwipe(wrapper, (phase, dx, dy) => {
      const painting = paintings[State.currentPaintingIndex];
      const imgs = getPaintingImagePaths(painting);
      if (imgs.length <= 1) return;

      const direction = dx < 0 ? 1 : -1;
      const newIndex = (State.currentImageIndex + direction + imgs.length) % imgs.length;

      if (phase === "move") {
        const wrapperRect = wrapper.getBoundingClientRect();
        pageViewImg.style.transition = "none";
        pageViewImg.style.transform = `translateX(${dx}px)`;

        if (!nextImg) {
          const wrapperRect = wrapper.getBoundingClientRect();
          const imgRect = pageViewImg.getBoundingClientRect();
          const top = imgRect.top - wrapperRect.top;
          const height = imgRect.height;

          nextImg = document.createElement("img");
          nextImg.style.cssText = `
            position:absolute;
            top:${top}px; left:0;
            width:100%; height:${height}px;
            object-fit:contain; object-position:center;
            transition:none; z-index:2; pointer-events:none;
          `;
          wrapper.appendChild(nextImg);
        }
        if (nextImg.dataset.index !== String(newIndex)) {
          nextImg.src = imgs[newIndex];
          nextImg.dataset.index = String(newIndex);
        }
        nextImg.style.transform = `translateX(${dx < 0 ? wrapperRect.width + dx : -wrapperRect.width + dx}px)`;
        return;
      }

      const cleanup = () => {
        if (nextImg?.parentNode) nextImg.parentNode.removeChild(nextImg);
        nextImg = null;
        pageViewImg.style.transform = "";
      };

      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) {
        pageViewImg.style.transition = "transform 0.25s ease";
        pageViewImg.style.transform = "translateX(0)";
        if (nextImg) {
          nextImg.style.transition = "transform 0.25s ease";
          nextImg.style.transform = `translateX(${dx < 0 ? wrapper.offsetWidth : -wrapper.offsetWidth}px)`;
        }
        setTimeout(cleanup, 150);
        return;
      }

      // Swiped far enough — load immediately
      State.currentImageIndex = newIndex;
      pageViewImg.src = imgs[newIndex];
      cleanup();
      updatePageViewThumbHighlight(newIndex);
    });
  }

  // Swipe between paintings disabled - only swipe between images within a painting
}

// ── Fullscreen image viewer ───────────────────────────────────

function setupFullscreenNavigation() {
  const prevBtn = document.getElementById("fullscreenPrev");
  const nextBtn = document.getElementById("fullscreenNext");

  if (!prevBtn || !nextBtn) return;

  const navigateFullscreen = (direction) => {
    if (fullscreenImages.length <= 1) return;

    fullscreenImageIndex = (fullscreenImageIndex + direction + fullscreenImages.length) % fullscreenImages.length;
    const img = document.getElementById("fullscreenImg");
    if (img) {
      img.src = fullscreenImages[fullscreenImageIndex];
    }
  };

  prevBtn.addEventListener("click", () => navigateFullscreen(-1));
  nextBtn.addEventListener("click", () => navigateFullscreen(1));

  // Keyboard navigation on desktop
  window.addEventListener("keydown", (e) => {
    const overlay = document.getElementById("fullscreenOverlay");
    if (!overlay?.classList.contains("active")) return;
    if (window.innerWidth <= 960) return;

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      navigateFullscreen(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      navigateFullscreen(1);
    }
  });
}

function setupPageViewFullscreenListeners() {
  const overlay = document.getElementById("fullscreenOverlay");
  const closeBtn = document.getElementById("fullscreenClose");

  if (!overlay || !closeBtn || !pageViewImg) return;

  setupPageViewFullscreenZoom();

  // Click on image to open fullscreen
  pageViewImg.addEventListener("click", () => {
    const painting = paintings[State.currentPaintingIndex];
    const imgs = getPaintingImagePaths(painting);
    openFullscreen(pageViewImg.src, State.currentImageIndex, imgs);
  });

  // Close button
  closeBtn.addEventListener("click", closeFullscreen);
}

function setupPageViewFullscreenZoom() {
  const overlay = document.getElementById("fullscreenOverlay");
  const img = document.getElementById("fullscreenImg");
  if (!overlay || !img) return;

  overlay.addEventListener("click", (e) => {
    // Only zoom if clicking on the image, not the background
    if (e.target !== img) {
      closeFullscreen();
      return;
    }

    // Zoom only on desktop
    if (window.innerWidth <= 960) return;

    fullscreenZoomLevel = (fullscreenZoomLevel + 1) % 3;
    img.style.transform = ["scale(1)", "scale(2)", "scale(4)"][fullscreenZoomLevel];
    overlay.classList.toggle("is-zoomed-1", fullscreenZoomLevel === 1);
    overlay.classList.toggle("is-zoomed-2", fullscreenZoomLevel === 2);
    updateFullscreenZoomPosition(e, overlay);
  });

  overlay.addEventListener("mousemove", (e) => {
    if (window.innerWidth <= 960 || fullscreenZoomLevel === 0) return;
    updateFullscreenZoomPosition(e, overlay);
  });

  overlay.addEventListener("mouseleave", () => {
    if (window.innerWidth <= 960) return;
    resetFullscreenZoom();
  });
}

// ── Buy button sticky positioning ───────────────────────────

function setupBuyButtonPositioning() {
  // Only apply sticky button positioning on mobile (max-width: 768px)
  if (window.innerWidth > 960) return;

  const button = document.querySelector("#pageview-buttons button");
  if (!button) return;

  const updateButtonPosition = () => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    const footerRect = footer.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const btnGap = 20; // normal bottom margin when footer not visible
    const footerGap = 20; // gap between button and footer

    // Calculate max bottom position to not overlap footer
    if (footerRect.top > 0 && footerRect.top < viewportHeight) {
      // Footer is visible in viewport
      const buttonHeight = button.offsetHeight;
      // Position button so there's a gap between its top edge and footer's top edge
      const maxBottom = viewportHeight - footerRect.top + footerGap + buttonHeight;
      button.style.bottom = maxBottom + "px";
    } else {
      // Footer not visible, use normal gap
      button.style.bottom = btnGap + "px";
    }
  };

  window.addEventListener("scroll", updateButtonPosition, { passive: true });
  window.addEventListener("resize", updateButtonPosition);
  updateButtonPosition();
}

// ── Back button positioning ───────────────────────────────────

function setupBackButtonPositioning() {
  const backBtn = document.querySelector(".pageview-back-btn-side");
  if (!backBtn) return;

  const updateBackBtnPosition = () => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    const footerRect = footer.getBoundingClientRect();
    const btnHeight = backBtn.offsetHeight;
    const initialTop = 140;
    const gap = 20;

    if (footerRect.top > 0) {
      if (footerRect.top < initialTop + btnHeight) {
        const newTop = footerRect.top - btnHeight - gap;
        backBtn.style.top = newTop + "px";
      } else {
        backBtn.style.top = initialTop + "px";
      }
    }
  };

  window.addEventListener("scroll", updateBackBtnPosition, { passive: true });
  window.addEventListener("resize", updateBackBtnPosition);
  updateBackBtnPosition();
}

// ── Language change handler ──────────────────────────────────

function setupLanguageChangeListener() {
  const rerender = () => {
    if (State.currentPaintingIndex !== undefined && paintings[State.currentPaintingIndex]) {
      const painting = paintings[State.currentPaintingIndex];
      updatePageViewDescription(painting);
      renderPageViewMedium(painting);
      renderPageViewFrameInfo(painting);
      renderPageViewPrice(painting);
      renderPageViewButtons(painting);
    }
  };
  window.addEventListener("languagechange", rerender);
  document.addEventListener("cartupdate", rerender);
}

// ── Listeners ─────────────────────────────────────────────────

function attachPageViewListeners() {
  if (!resolvePageViewRefs()) return;

  setupPageViewZoomEffect();
  setupPageViewSwipeGestures();
  setupPageViewFullscreenListeners();
  setupFullscreenNavigation();
  setupBackButtonPositioning();
  setupLanguageChangeListener();
  setupFrameSelectorModal();

  // Arrows are disabled in page view
  // Only thumbnail navigation and swipe gestures are available

  document.onkeydown = (e) => {
    const fullscreenOverlay = document.getElementById("fullscreenOverlay");
    const isFullscreenActive = fullscreenOverlay?.classList.contains("active");

    if (e.key === "Escape") {
      if (isFullscreenActive) {
        closeFullscreen();
      } else {
        hideFrameSelectorModal(() => { });
      }
    }
  };
}

// Initialize page view if on the view.html page
async function initPageView() {
  if (!document.querySelector(".page-view-container")) return;

  // Load painting data if not already loaded
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
    const lang = localStorage.getItem("lang") || "sv";
    const container = document.querySelector(".page-view-container");
    if (container) {
      const banner = document.createElement("p");
      banner.textContent = lang === "en"
        ? "Image data could not be loaded – check your connection."
        : "Bilddata kunde inte laddas – kontrollera din anslutning.";
      banner.style.cssText = "text-align:center;padding:1rem;opacity:0.6;font-size:0.9rem;";
      container.prepend(banner);
    }
  }

  assignSizeScales(paintings);
  sortPaintings();

  const paintingId = resolvePaintingId();
  if (!paintingId) return;

  const index = paintings.findIndex(p => p.id === paintingId);
  if (index === -1) return;

  // /pages/view.html?painting=<id> was the only address a work ever had. It
  // still works, but it now sends the visitor on to the work's own page so
  // there is a single URL to share, link to and index.
  if (isLegacyViewPage()) {
    window.location.replace(paintingPageUrl(paintings[index]));
    return;
  }

  openPageView(index);
  attachPageViewListeners();
}

// A generated page under /pictures/ names its work in the markup; the legacy
// view.html carries it in the query string
function resolvePaintingId() {
  return document.body.dataset.paintingId
    || new URLSearchParams(window.location.search).get("painting");
}

function isLegacyViewPage() {
  return !document.body.dataset.paintingId;
}
