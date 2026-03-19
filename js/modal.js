// modal.js — modal display, navigation, zoom, and swipe logic

// ── DOM refs ──────────────────────────────────────────────────

let modalElement, modalImg, modalTitle, modalSize, modalDesc, modalButtons;
let modalCloseBtn, modalNextBtn, modalPrevBtn;

function resolveModalRefs() {
  modalElement = document.getElementById("modal");
  if (!modalElement) return false;
  modalImg = document.getElementById("modal-img");
  modalTitle = document.getElementById("modal-title");
  modalSize = document.getElementById("modal-size");
  modalDesc = document.getElementById("modal-desc");
  modalButtons = document.getElementById("modal-buttons");
  modalCloseBtn = document.getElementById("modal-close");
  modalNextBtn = document.getElementById("modal-next");
  modalPrevBtn = document.getElementById("modal-prev");
  return true;
}

// ── Shared helpers ────────────────────────────────────────────

// No animation — just runs onComplete immediately
function slideTransition(currentEl, nextEl, direction, width, onComplete) {
  onComplete();
  isTransitioning = false;
}

function setupSwipe(element, handler, shouldIgnore) {
  let startX = 0, startY = 0, dragging = false;

  element.addEventListener("touchstart", (e) => {
    if (shouldIgnore?.(e) || isTransitioning) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    dragging = false;
  }, { passive: true });

  element.addEventListener("touchmove", (e) => {
    if (shouldIgnore?.(e) || isTransitioning) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (Math.abs(dx) < 5) return;
    if (!dragging && Math.abs(dy) > Math.abs(dx)) return;
    dragging = true;
    handler("move", dx, dy);
  }, { passive: false });

  element.addEventListener("touchend", (e) => {
    if (shouldIgnore?.(e)) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (dragging) handler("end", dx, dy);
    dragging = false;
  }, { passive: true });
}

// ── Open / close ──────────────────────────────────────────────

function openModal(index) {
  if (!resolveModalRefs()) return;
  currentPaintingIndex = index;
  currentModalImageIndex = 0;
  populateModal(paintings[index]);
  renderModalButtons(paintings[index]);
  modalElement.style.display = "flex";
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  preloadAdjacentImages();
  setUrlParam("painting", paintings[index].id);
}

function openModalSilent(index) {
  if (!resolveModalRefs()) return;
  currentPaintingIndex = index;
  currentModalImageIndex = 0;
  const painting = paintings[index];
  const imgs = getPaintingImagePaths(painting);
  modalImg.src = imgs[0];
  modalImg.alt = painting.title;
  modalTitle.textContent = painting.title;
  modalSize.textContent = formatDimensions(painting);
  modalDesc.textContent = t(painting.descKey);
  buildModalThumbnails(imgs);
  configureModalArrows(imgs);
  renderModalButtons(painting);
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  preloadAdjacentImages();
  setUrlParam("painting", painting.id);
}

function closeModal() {
  if (modalElement) modalElement.style.display = "none";
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  isTransitioning = false;
  removeUrlParam("painting");
}

function setUrlParam(key, value) {
  const url = new URL(window.location);
  url.searchParams.set(key, value);
  window.history.replaceState({}, "", url);
}

function removeUrlParam(key) {
  const url = new URL(window.location);
  url.searchParams.delete(key);
  window.history.replaceState({}, "", url);
}

// ── Populate helpers ──────────────────────────────────────────

function formatDimensions(painting) {
  if (painting.shape === SHAPE.CIRCLE) {
    return `${painting.diameter} cm diameter`;
  }
  return `${painting.width} x ${painting.height} cm`;
}

function populateModal(painting) {
  const imgs = getPaintingImagePaths(painting);
  modalImg.src = imgs[0];
  modalImg.alt = painting.title;
  modalTitle.textContent = painting.title;
  modalSize.textContent = formatDimensions(painting);
  modalDesc.textContent = t(painting.descKey);
  buildModalThumbnails(imgs);
  configureModalArrows(imgs);
}

function buildModalThumbnails(imgs) {
  const container = document.getElementById("modal-thumbs");
  container.innerHTML = "";
  if (imgs.length <= 1) return;
  imgs.forEach((src, idx) => {
    const thumb = document.createElement("img");
    thumb.src = src;
    thumb.classList.add("modalThumb");
    if (idx === 0) thumb.classList.add("active");
    thumb.addEventListener("click", () =>
      transitionToImage(imgs, idx, idx > currentModalImageIndex ? 1 : -1)
    );
    container.appendChild(thumb);
  });
}

function configureModalArrows(imgs) {
  const imgPrev = document.getElementById("modal-img-prev");
  const imgNext = document.getElementById("modal-img-next");
  const hasMultiple = imgs.length > 1;
  imgPrev.style.display = hasMultiple ? "flex" : "none";
  imgNext.style.display = hasMultiple ? "flex" : "none";
  if (!hasMultiple) return;
  imgPrev.onclick = (e) => {
    e.stopPropagation();
    if (!isTransitioning)
      transitionToImage(imgs, (currentModalImageIndex - 1 + imgs.length) % imgs.length, -1);
  };
  imgNext.onclick = (e) => {
    e.stopPropagation();
    if (!isTransitioning)
      transitionToImage(imgs, (currentModalImageIndex + 1) % imgs.length, 1);
  };
}

function renderModalButtons(painting) {
  modalButtons.innerHTML = "";

  if (painting.status === STATUS.SOLD) {
    const p = document.createElement("p");
    p.textContent = t("status_sold");
    p.style.color = "red";
    modalButtons.appendChild(p);
    return;
  }

  if (painting.status === STATUS.PERSONAL) {
    const p = document.createElement("p");
    p.textContent = t("status_personal");
    modalButtons.appendChild(p);
    return;
  }

  if (painting.originalPrice) {
    if (painting.frameAvailable) {
      const frameContainer = document.createElement("div");
      frameContainer.classList.add("modal-frame-selector");

      const frameLabel = document.createElement("p");
      frameLabel.textContent = t("frame_available");
      frameLabel.classList.add("modal-frame-label");
      frameContainer.appendChild(frameLabel);

      const optionsWrapper = document.createElement("div");
      optionsWrapper.classList.add("modal-frame-options");

      const withoutBtn = document.createElement("button");
      withoutBtn.classList.add("modal-frame-option");
      withoutBtn.classList.add("selected");
      withoutBtn.dataset.frame = "without";
      withoutBtn.innerHTML = `
        <span class="option-title">${t("frame_price_without")}</span>
        <span class="option-price">${painting.originalPrice} kr</span>
      `;

      const withBtn = document.createElement("button");
      withBtn.classList.add("modal-frame-option");
      withBtn.dataset.frame = "with";
      withBtn.innerHTML = `
        <span class="option-title">${t("frame_price_with")}</span>
        <span class="option-price">${painting.framedPrice} kr</span>
      `;

      withoutBtn.addEventListener("click", () => {
        withoutBtn.classList.add("selected");
        withBtn.classList.remove("selected");
      });

      withBtn.addEventListener("click", () => {
        withBtn.classList.add("selected");
        withoutBtn.classList.remove("selected");
      });

      optionsWrapper.appendChild(withoutBtn);
      optionsWrapper.appendChild(withBtn);
      frameContainer.appendChild(optionsWrapper);
      modalButtons.appendChild(frameContainer);
    } else {
      const price = document.createElement("p");
      price.textContent = `${painting.originalPrice} kr`;
      price.classList.add("modal-price");
      modalButtons.appendChild(price);
    }

    const buyBtn = document.createElement("button");
    buyBtn.textContent = t("modal_buy_btn");
    buyBtn.addEventListener("click", () => {
      if (painting.frameAvailable) {
        const selectedBtn = modalButtons.querySelector(".modal-frame-option.selected");
        const frameChoice = selectedBtn.dataset.frame === "with" ? "with" : "without";
        handleBuyClick(painting, frameChoice);
      } else {
        handleBuyClick(painting, null);
      }
    });
    modalButtons.appendChild(buyBtn);
  }

}

// ── Zoom ──────────────────────────────────────────────────────

function resetZoom() {
  zoomLevel = 0;
  modalImg.style.transform = "scale(1)";
  modalImg.style.transformOrigin = "center center";
  document.querySelector(".modalImageWrapper")?.classList.remove("is-zoomed-1", "is-zoomed-2");
}

function updateThumbHighlight(activeIndex) {
  document.querySelectorAll(".modalThumb").forEach((thumb, idx) => {
    thumb.classList.toggle("active", idx === activeIndex);
  });
}

function setupZoomEffect() {
  const wrapper = document.querySelector(".modalImageWrapper");
  if (!wrapper || !modalImg) return;

  wrapper.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) return;
    zoomLevel = (zoomLevel + 1) % 3;
    modalImg.style.transform = ["scale(1)", "scale(2)", "scale(4)"][zoomLevel];
    wrapper.classList.toggle("is-zoomed-1", zoomLevel === 1);
    wrapper.classList.toggle("is-zoomed-2", zoomLevel === 2);
    updateZoomPosition(e, wrapper);
  });

  wrapper.addEventListener("mousemove", (e) => {
    if (window.innerWidth <= 768 || zoomLevel === 0) return;
    updateZoomPosition(e, wrapper);
  });

  wrapper.addEventListener("mouseleave", () => {
    if (window.innerWidth <= 768) return;
    resetZoom();
  });
}

function updateZoomPosition(e, wrapper) {
  const rect = wrapper.getBoundingClientRect();
  modalImg.style.transformOrigin =
    `${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%`;
}

// ── Image transitions (within a painting) ────────────────────

function transitionToImage(imgs, newIndex, direction) {
  if (isTransitioning) return;
  isTransitioning = true;

  const wrapper = document.querySelector(".modalImageWrapper");
  currentModalImageIndex = newIndex;
  modalImg.src = imgs[newIndex];
  resetZoom();
  updateThumbHighlight(newIndex);
  isTransitioning = false;
}

// ── Painting transitions (between paintings) ─────────────────

function buildPaintingPreview(painting, height) {
  const imgs = getPaintingImagePaths(painting);
  const el = document.createElement("div");
  el.classList.add("modalInner");
  el.innerHTML = `
    <div class="modalLeft">
      <div class="modalImageWrapper" style="height:${height}px;overflow:hidden;">
        <img src="${imgs[0]}" style="width:100%;height:100%;object-fit:contain;" />
      </div>
    </div>
    <div class="modalRight">
      <h3>${painting.title}</h3>
      <p>${formatDimensions(painting)}</p>
      <p>${t(painting.descKey)}</p>
    </div>
  `;
  return el;
}

function transitionToPainting(newIndex, direction) {
  if (isTransitioning) return;
  isTransitioning = true;

  currentPaintingIndex = newIndex;
  currentModalImageIndex = 0;
  const p = paintings[newIndex];
  const imgs = getPaintingImagePaths(p);
  modalImg.src = imgs[0];
  modalTitle.textContent = p.title;
  modalSize.textContent = formatDimensions(p);
  modalDesc.textContent = t(p.descKey);
  buildModalThumbnails(imgs);
  configureModalArrows(imgs);
  renderModalButtons(p);
  setUrlParam("painting", p.id);
  preloadAdjacentImages();
  isTransitioning = false;
}

function showNextPainting() {
  transitionToPainting((currentPaintingIndex + 1) % paintings.length, 1);
}

function showPrevPainting() {
  transitionToPainting((currentPaintingIndex - 1 + paintings.length) % paintings.length, -1);
}

function preloadAdjacentImages() {
  getPaintingImagePaths(paintings[currentPaintingIndex]).forEach(src => { new Image().src = src; });
  new Image().src = getPaintingImagePaths(paintings[(currentPaintingIndex + 1) % paintings.length])[0];
  new Image().src = getPaintingImagePaths(paintings[(currentPaintingIndex - 1 + paintings.length) % paintings.length])[0];
}

// ── Swipe gestures ────────────────────────────────────────────

function setupSwipeGestures() {
  const wrapper = document.querySelector(".modalImageWrapper");
  const modal = document.getElementById("modal");
  if (!modal) return;

  // Inside image wrapper: original behavior with incoming image
  if (wrapper) {
    let nextImg = null;

    setupSwipe(wrapper, (phase, dx, dy) => {
      const painting = paintings[currentPaintingIndex];
      const imgs = getPaintingImagePaths(painting);
      if (imgs.length <= 1) return;

      const direction = dx < 0 ? 1 : -1;
      const newIndex = (currentModalImageIndex + direction + imgs.length) % imgs.length;

      if (phase === "move") {
        const wrapperRect = wrapper.getBoundingClientRect();
        modalImg.style.transition = "none";
        modalImg.style.transform = `translateX(${dx}px)`;

        if (!nextImg) {
          const wrapperRect = wrapper.getBoundingClientRect();
          const imgRect = modalImg.getBoundingClientRect();
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
        modalImg.style.transform = "";  // bara reset transform, inte hela cssText
      };

      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) {
        modalImg.style.transition = "transform 0.25s ease";
        modalImg.style.transform = "translateX(0)";
        if (nextImg) {
          nextImg.style.transition = "transform 0.25s ease";
          nextImg.style.transform = `translateX(${dx < 0 ? wrapper.offsetWidth : -wrapper.offsetWidth}px)`;
        }
        setTimeout(cleanup, 150);
        return;
      }

      // Swiped far enough — load immediately
      currentModalImageIndex = newIndex;
      modalImg.src = imgs[newIndex];
      cleanup();
      updateThumbHighlight(newIndex);
    });
  }

  // Outside image wrapper: simplified — no incoming painting shown
  setupSwipe(modal, (phase, dx, dy) => {
    const modalInner = document.querySelector(".modalInner");
    const container = document.querySelector(".modal");
    if (!modalInner || !container) return;

    const direction = dx < 0 ? 1 : -1;
    const newIndex = (currentPaintingIndex + direction + paintings.length) % paintings.length;

    if (phase === "move") {
      modalInner.style.transition = "none";
      modalInner.style.transform = `translateX(${dx}px)`;
      return;
    }

    // Snap back if not swiped far enough
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) {
      modalInner.style.transition = "transform 0.25s ease";
      modalInner.style.transform = "translateX(0)";
      return;
    }

    // Swiped far enough — slide current out, load next immediately in place
    modalInner.style.transition = "transform 0.25s ease";
    modalInner.style.transform = `translateX(${direction * -container.offsetWidth}px)`;

    setTimeout(() => {
      modalInner.style.transition = "none";
      modalInner.style.transform = "";

      currentPaintingIndex = newIndex;
      currentModalImageIndex = 0;
      const p = paintings[newIndex];
      const imgs = getPaintingImagePaths(p);
      modalImg.src = imgs[0];
      modalTitle.textContent = p.title;
      modalSize.textContent = formatDimensions(p);
      modalDesc.textContent = t(p.descKey);
      buildModalThumbnails(imgs);
      configureModalArrows(imgs);
      renderModalButtons(p);
      setUrlParam("painting", p.id);
      preloadAdjacentImages();
    }, 150);

  }, (e) => !!e.target.closest(".modalImageWrapper"));
}

// ── Listeners ─────────────────────────────────────────────────

// ── Fullscreen image viewer ───────────────────────────────────

let fullscreenZoomLevel = 0;

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

  // Store images array globally if available (for page-view navigation)
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

function setupFullscreenZoom() {
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

function setupFullscreenListeners() {
  const overlay = document.getElementById("fullscreenOverlay");
  const closeBtn = document.getElementById("fullscreenClose");
  const modalImg = document.getElementById("modal-img");

  if (!overlay || !closeBtn || !modalImg) return;

  setupFullscreenZoom();

  // Click on image to open fullscreen
  modalImg.addEventListener("click", () => {
    openFullscreen(modalImg.src);
  });

  // Close button
  closeBtn.addEventListener("click", closeFullscreen);
}

function attachModalListeners() {
  if (!resolveModalRefs()) return;

  setupZoomEffect();
  setupSwipeGestures();
  setupFullscreenListeners();

  if (modalCloseBtn) modalCloseBtn.onclick = closeModal;
  if (modalNextBtn) modalNextBtn.onclick = showNextPainting;
  if (modalPrevBtn) modalPrevBtn.onclick = showPrevPainting;

  modalElement.onclick = (e) => { if (e.target === modalElement) closeModal(); };
  document.onkeydown = (e) => {
    const fullscreenOverlay = document.getElementById("fullscreenOverlay");
    const isFullscreenActive = fullscreenOverlay?.classList.contains("active");

    if (e.key === "Escape") {
      if (isFullscreenActive) {
        closeFullscreen();
      } else {
        closeModal();
      }
    }
    if (e.key === "ArrowRight" && !isFullscreenActive) showNextPainting();
    if (e.key === "ArrowLeft" && !isFullscreenActive) showPrevPainting();
  };
}