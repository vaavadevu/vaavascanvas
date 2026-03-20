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
  populatePageView(paintings[index]);
  renderPageViewFrameInfo(paintings[index]);
  renderPageViewButtons(paintings[index]);
  preloadAdjacentImages();
  setUrlParam("painting", paintings[index].id);
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
  configurePageViewArrows(imgs);
}

function buildPageViewThumbnails(imgs) {
  const container = document.getElementById("pageview-thumbs");
  container.innerHTML = "";
  if (imgs.length <= 1) return;
  imgs.forEach((src, idx) => {
    const thumb = document.createElement("img");
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

function renderPageViewButtons(painting) {
  pageViewButtons.innerHTML = "";

  if (painting.status === STATUS.FOR_SALE && painting.originalPrice) {
    if (painting.frameAvailable) {
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
        <span class="option-price">${formatPrice(painting.originalPrice)}</span>
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
        <span class="option-price">${formatPrice(painting.framedPrice)}</span>
      `;
      withLabel.appendChild(withLabelText);
      optionsWrapper.appendChild(withLabel);

      frameContainer.appendChild(optionsWrapper);
      pageViewButtons.appendChild(frameContainer);
    }

    const buyBtn = document.createElement("button");
    buyBtn.textContent = t("modal_buy_btn");
    buyBtn.addEventListener("click", () => {
      if (painting.frameAvailable && window.innerWidth <= 768) {
        // On mobile with frame available: show modal
        showFrameSelectorModal(painting);
      } else if (painting.frameAvailable) {
        // On desktop with frame available: proceed with buy
        const selectedRadio = pageViewButtons.querySelector('input[type="radio"]:checked');
        const frameChoice = selectedRadio.value;
        handleBuyClick(painting, frameChoice);
      } else {
        // No frame available: proceed directly
        handleBuyClick(painting, null);
      }
    });
    pageViewButtons.appendChild(buyBtn);
  }
}

function showFrameSelectorModal(painting) {
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

    // Without frame button
    const withoutBtn = document.createElement("button");
    withoutBtn.type = "button";
    withoutBtn.classList.add("frame-action-btn", "frame-action-without");
    withoutBtn.innerHTML = `
      <span class="btn-title">${t("frame_price_without")}</span>
      <span class="btn-price">${formatPrice(painting.originalPrice)}</span>
    `;
    withoutBtn.addEventListener("click", () => {
      hideFrameSelectorModal(() => {
        handleBuyClick(painting, "without");
      });
    }, { once: true });
    btnContainer.appendChild(withoutBtn);

    // With frame button
    const withBtn = document.createElement("button");
    withBtn.type = "button";
    withBtn.classList.add("frame-action-btn", "frame-action-with");
    withBtn.innerHTML = `
      <span class="btn-title">${t("frame_price_with")}</span>
      <span class="btn-price">${formatPrice(painting.framedPrice)}</span>
    `;
    withBtn.addEventListener("click", () => {
      hideFrameSelectorModal(() => {
        handleBuyClick(painting, "with");
      });
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
  if (window.innerWidth <= 768) {
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
    frameInfo.textContent = t("frame_available");
    frameInfo.classList.add("pageview-frame-info");
    pageViewMedium.parentNode.insertBefore(frameInfo, pageViewMedium.nextSibling);
  }
}

function renderPageViewPrice(painting) {
  pageViewPriceSection.innerHTML = "";

  if (painting.status === STATUS.SOLD) {
    const p = document.createElement("p");
    p.textContent = t("status_sold");
    p.style.color = "red";
    pageViewPriceSection.appendChild(p);
    return;
  }

  if (painting.status === STATUS.PERSONAL) {
    const p = document.createElement("p");
    p.textContent = t("status_personal");
    pageViewPriceSection.appendChild(p);
    return;
  }

  if (painting.originalPrice) {
    const price = document.createElement("p");
    price.textContent = formatPrice(painting.originalPrice);
    price.classList.add("pageview-price");
    pageViewPriceSection.appendChild(price);
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
  buildPageViewThumbnails(imgs);
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
    if (window.innerWidth <= 768) return;

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
    if (window.innerWidth <= 768) return;

    fullscreenZoomLevel = (fullscreenZoomLevel + 1) % 3;
    img.style.transform = ["scale(1)", "scale(2)", "scale(4)"][fullscreenZoomLevel];
    overlay.classList.toggle("is-zoomed-1", fullscreenZoomLevel === 1);
    overlay.classList.toggle("is-zoomed-2", fullscreenZoomLevel === 2);
    updateFullscreenZoomPosition(e, overlay);
  });

  overlay.addEventListener("mousemove", (e) => {
    if (window.innerWidth <= 768 || fullscreenZoomLevel === 0) return;
    updateFullscreenZoomPosition(e, overlay);
  });

  overlay.addEventListener("mouseleave", () => {
    if (window.innerWidth <= 768) return;
    resetFullscreenZoom();
  });
}

// ── Buy button sticky positioning ───────────────────────────

function setupBuyButtonPositioning() {
  // Only apply sticky button positioning on mobile (max-width: 768px)
  if (window.innerWidth > 768) return;

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
  window.addEventListener("languagechange", () => {
    if (State.currentPaintingIndex !== undefined && paintings[State.currentPaintingIndex]) {
      const painting = paintings[State.currentPaintingIndex];
      updatePageViewDescription(painting);
      renderPageViewMedium(painting);
      renderPageViewFrameInfo(painting);
      renderPageViewPrice(painting);
      renderPageViewButtons(painting);
    }
  });
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
      fetch("../images/paintings/counts.json"),
      fetch("../images/paintings/metadata.json")
    ]);

    if (countsRes.ok) {
      const counts = await countsRes.json();
      paintings.forEach(p => { p.imageCount = counts[p.id] || 1; });
    } else {
      console.warn("Could not load counts.json, defaulting to 1 image per painting.");
    }

    if (metaRes.ok) {
      const metadata = await metaRes.json();
      paintings.forEach(p => { p.aspectRatio = metadata[p.id]; });
    } else {
      console.warn("Could not load metadata.json, using default aspect ratio.");
    }
  } catch (err) {
    console.warn("Error loading painting data:", err);
  }

  // Calculate size scales
  const parsedSizes = paintings.map(p => {
    if (p.shape === SHAPE.RECTANGULAR && p.width && p.height) {
      return p.width * p.height;
    } else if (p.shape === SHAPE.CIRCLE && p.diameter) {
      const radius = p.diameter / 2;
      return Math.PI * radius * radius;
    }
    return null;
  }).filter(a => a !== null);

  if (parsedSizes.length > 0) {
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

      const normalized = areaRange > 0 ? (area - minArea) / areaRange : 0.5;
      p.sizeScale = 1 + (normalized - 0.5) * 0.4;
    });
  }

  sortPaintings();

  const params = new URLSearchParams(window.location.search);
  const paintingId = params.get("painting");

  if (paintingId) {
    const index = paintings.findIndex(p => p.id === paintingId);
    if (index !== -1) {
      openPageView(index);
      attachPageViewListeners();
    }
  }
}
