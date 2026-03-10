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

// Slides currentEl out and nextEl in, then calls onComplete
function slideTransition(currentEl, nextEl, direction, width, onComplete) {
  currentEl.style.transition = "transform 0.25s ease";
  currentEl.style.transform = `translateX(${direction * -width}px)`;
  nextEl.style.transition = "transform 0.25s ease";
  nextEl.style.transform = "translateX(0)";
  setTimeout(() => {
    onComplete();
    isTransitioning = false;
  }, 280);
}

// Generic swipe listener — calls handler("move"|"end", dx, dy)
// shouldIgnore(event) => true means skip this event
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
  modalSize.textContent = painting.size;
  modalDesc.textContent = painting.description;
  buildModalThumbnails(imgs);
  configureModalArrows(imgs);
  renderModalButtons(painting);
  preloadAdjacentImages();
  setUrlParam("painting", painting.id);
}

function closeModal() {
  if (modalElement) modalElement.style.display = "none";
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

function populateModal(painting) {
  const imgs = getPaintingImagePaths(painting);
  modalImg.src = imgs[0];
  modalImg.alt = painting.title;
  modalTitle.textContent = painting.title;
  modalSize.textContent = painting.size;
  modalDesc.textContent = painting.description;
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
    p.textContent = STATUS_TEXT[STATUS.SOLD];
    p.style.color = "red";
    modalButtons.appendChild(p);
    return;
  }

  if (painting.status === STATUS.PERSONAL) {
    const p = document.createElement("p");
    p.textContent = STATUS_TEXT[STATUS.PERSONAL];
    modalButtons.appendChild(p);
    return;
  }

  if (painting.originalPrice) {
    const price = document.createElement("p");
    price.textContent = `${painting.originalPrice} kr`;
    price.classList.add("modal-price");
    modalButtons.appendChild(price);

    const buyBtn = document.createElement("button");
    buyBtn.textContent = "✉ Skicka köpförfrågan";
    buyBtn.addEventListener("click", () => handleBuyClick(painting));
    modalButtons.appendChild(buyBtn);

    const shippingLink = document.createElement("a");
    shippingLink.textContent = "ℹ️ Frakt & leveransinformation";
    shippingLink.href = "#";
    shippingLink.classList.add("shipping-link");
    shippingLink.addEventListener("click", (e) => {
      e.preventDefault();
      const modal = document.getElementById("shippingModal");
      if (modal) modal.style.display = "flex";
    });
    modalButtons.appendChild(shippingLink);
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
  if (!wrapper) {
    currentModalImageIndex = newIndex;
    modalImg.src = imgs[newIndex];
    resetZoom();
    updateThumbHighlight(newIndex);
    isTransitioning = false;
    return;
  }

  // Position current image absolutely so incoming can sit beside it
  const rect = modalImg.getBoundingClientRect();
  const wrapperRect = wrapper.getBoundingClientRect();
  modalImg.style.cssText += `
    position:absolute;
    top:${rect.top - wrapperRect.top}px; left:${rect.left - wrapperRect.left}px;
    width:${rect.width}px; height:${rect.height}px;
  `;

  const incoming = document.createElement("img");
  incoming.src = imgs[newIndex];
  incoming.style.cssText = `
    position:absolute; top:0; left:0; width:100%; height:100%;
    transform:translateX(${direction * 100}%); transition:none; z-index:2;
  `;
  wrapper.appendChild(incoming);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    slideTransition(modalImg, incoming, direction, wrapper.offsetWidth, () => {
      currentModalImageIndex = newIndex;
      modalImg.style.cssText = "";
      modalImg.src = imgs[newIndex];
      if (incoming.parentNode) incoming.parentNode.removeChild(incoming);
      resetZoom();
      updateThumbHighlight(newIndex);
    });
  }));
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
      <p>${painting.size}</p>
      <p>${painting.description}</p>
    </div>
  `;
  return el;
}

function transitionToPainting(newIndex, direction) {
  if (isTransitioning) return;
  isTransitioning = true;

  const wrapper = document.querySelector(".modalInner");
  const container = document.querySelector(".modal");
  if (!wrapper || !container) {
    currentPaintingIndex = newIndex;
    openModalSilent(newIndex);
    isTransitioning = false;
    return;
  }

  const innerRect = wrapper.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const imgWrapperHeight = document.querySelector(".modalImageWrapper")?.offsetHeight || 300;

  const incoming = buildPaintingPreview(paintings[newIndex], imgWrapperHeight);
  incoming.style.cssText = `
    position:absolute;
    top:${innerRect.top - containerRect.top}px; left:${innerRect.left - containerRect.left}px;
    width:${innerRect.width}px; height:${innerRect.height}px;
    transform:translateX(${direction * innerRect.width}px);
    transition:none; z-index:999;
    background:var(--bg-warm); border-radius:16px; padding:30px;
    display:grid; grid-template-columns:1fr 1fr; gap:30px;
    box-sizing:border-box; overflow:hidden;
  `;
  container.appendChild(incoming);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    slideTransition(wrapper, incoming, direction, innerRect.width, () => {
      if (incoming.parentNode) incoming.parentNode.removeChild(incoming);
      wrapper.style.transition = "none";
      wrapper.style.transform = "";

      currentPaintingIndex = newIndex;
      currentModalImageIndex = 0;
      const p = paintings[newIndex];
      const imgs = getPaintingImagePaths(p);
      modalImg.src = imgs[0];
      modalTitle.textContent = p.title;
      modalSize.textContent = p.size;
      modalDesc.textContent = p.description;
      buildModalThumbnails(imgs);
      configureModalArrows(imgs);
      renderModalButtons(p);
      setUrlParam("painting", p.id);
      preloadAdjacentImages();
    });
  }));
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

  // Inside image wrapper: swipe between images of the same painting
  if (wrapper) {
    let nextImg = null;

    setupSwipe(wrapper, (phase, dx, dy) => {
      const painting = paintings[currentPaintingIndex];
      const imgs = getPaintingImagePaths(painting);
      if (imgs.length <= 1) return;

      const direction = dx < 0 ? 1 : -1;
      const newIndex = (currentModalImageIndex + direction + imgs.length) % imgs.length;

      if (phase === "move") {
        if (!nextImg) {
          const rect = modalImg.getBoundingClientRect();
          const wrapperRect = wrapper.getBoundingClientRect();
          modalImg.style.cssText += `position:absolute;top:${rect.top - wrapperRect.top}px;left:${rect.left - wrapperRect.left}px;width:${rect.width}px;height:${rect.height}px;`;
          nextImg = document.createElement("img");
          nextImg.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;transition:none;z-index:2;pointer-events:none;";
          wrapper.appendChild(nextImg);
        }
        if (nextImg.dataset.index !== String(newIndex)) {
          nextImg.src = imgs[newIndex];
          nextImg.dataset.index = String(newIndex);
        }
        modalImg.style.transition = "none";
        modalImg.style.transform = `translateX(${dx}px)`;
        nextImg.style.transform = `translateX(${dx < 0 ? wrapper.offsetWidth + dx : -wrapper.offsetWidth + dx}px)`;
        return;
      }

      // phase === "end"
      const cleanup = () => {
        if (nextImg?.parentNode) nextImg.parentNode.removeChild(nextImg);
        nextImg = null;
        modalImg.style.cssText = "";
      };

      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) {
        modalImg.style.transition = "transform 0.25s ease";
        modalImg.style.transform = "translateX(0)";
        if (nextImg) {
          nextImg.style.transition = "transform 0.25s ease";
          nextImg.style.transform = `translateX(${dx < 0 ? wrapper.offsetWidth : -wrapper.offsetWidth}px)`;
        }
        setTimeout(cleanup, 250);
        return;
      }

      isTransitioning = true;
      modalImg.style.transition = "transform 0.25s ease";
      modalImg.style.transform = `translateX(${direction * -wrapper.offsetWidth}px)`;
      if (nextImg) {
        nextImg.style.transition = "transform 0.25s ease";
        nextImg.style.transform = "translateX(0)";
      }
      setTimeout(() => {
        currentModalImageIndex = newIndex;
        modalImg.src = imgs[newIndex];
        cleanup();
        updateThumbHighlight(newIndex);
        requestAnimationFrame(() => { isTransitioning = false; });
      }, 250);
    });
  }

  // Outside image wrapper: swipe between paintings
  let nextPaintingEl = null;

  setupSwipe(modal, (phase, dx, dy) => {
    const modalInner = document.querySelector(".modalInner");
    const container = document.querySelector(".modal");
    if (!modalInner || !container) return;

    const direction = dx < 0 ? 1 : -1;
    const newIndex = (currentPaintingIndex + direction + paintings.length) % paintings.length;

    if (phase === "move") {
      if (!nextPaintingEl || nextPaintingEl.dataset.index !== String(newIndex)) {
        if (nextPaintingEl?.parentNode) nextPaintingEl.parentNode.removeChild(nextPaintingEl);

        const innerRect = modalInner.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const imgWrapperHeight = document.querySelector(".modalImageWrapper")?.offsetHeight || 300;

        nextPaintingEl = buildPaintingPreview(paintings[newIndex], imgWrapperHeight);
        nextPaintingEl.dataset.index = String(newIndex);
        nextPaintingEl.style.cssText = `
          position:absolute;
          top:${innerRect.top - containerRect.top}px; left:${innerRect.left - containerRect.left}px;
          width:${innerRect.width}px; height:${innerRect.height}px;
          transition:none; z-index:2;
          background:var(--bg-warm); border-radius:16px; padding:30px;
          display:grid; grid-template-columns:1fr 1fr; gap:30px;
          box-sizing:border-box; overflow:hidden;
          transform:translateX(${direction * innerRect.width}px);
        `;
        container.appendChild(nextPaintingEl);
      }

      const innerW = modalInner.getBoundingClientRect().width;
      modalInner.style.transition = "none";
      modalInner.style.transform = `translateX(${dx}px)`;
      nextPaintingEl.style.transition = "none";
      nextPaintingEl.style.transform = `translateX(${dx < 0 ? innerW + dx : -innerW + dx}px)`;
      return;
    }

    // phase === "end"
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) {
      modalInner.style.transition = "transform 0.25s ease";
      modalInner.style.transform = "translateX(0)";
      if (nextPaintingEl?.parentNode) {
        nextPaintingEl.style.transition = "transform 0.25s ease";
        nextPaintingEl.style.transform = `translateX(${direction * 100}%)`;
        setTimeout(() => { if (nextPaintingEl?.parentNode) nextPaintingEl.parentNode.removeChild(nextPaintingEl); nextPaintingEl = null; }, 250);
      }
      return;
    }

    isTransitioning = true;
    modalInner.style.transition = "transform 0.25s ease";
    modalInner.style.transform = `translateX(${direction * -container.offsetWidth}px)`;
    if (nextPaintingEl) {
      nextPaintingEl.style.transition = "transform 0.25s ease";
      nextPaintingEl.style.transform = "translateX(0)";
    }

    setTimeout(() => {
      currentPaintingIndex = newIndex;
      currentModalImageIndex = 0;
      const p = paintings[newIndex];
      const imgs = getPaintingImagePaths(p);
      modalImg.src = imgs[0];
      modalTitle.textContent = p.title;
      modalSize.textContent = p.size;
      modalDesc.textContent = p.description;
      buildModalThumbnails(imgs);
      configureModalArrows(imgs);
      renderModalButtons(p);
      if (nextPaintingEl?.parentNode) nextPaintingEl.parentNode.removeChild(nextPaintingEl);
      nextPaintingEl = null;
      modalInner.style.transition = "none";
      modalInner.style.transform = "";
      setUrlParam("painting", p.id);
      preloadAdjacentImages();
      isTransitioning = false;
    }, 250);

  }, (e) => !!e.target.closest(".modalImageWrapper")); // ignore events inside image wrapper
}

// ── Listeners ─────────────────────────────────────────────────

function attachModalListeners() {
  if (!resolveModalRefs()) return;

  setupZoomEffect();
  setupSwipeGestures();

  if (modalCloseBtn) modalCloseBtn.onclick = closeModal;
  if (modalNextBtn) modalNextBtn.onclick = showNextPainting;
  if (modalPrevBtn) modalPrevBtn.onclick = showPrevPainting;

  modalElement.onclick = (e) => { if (e.target === modalElement) closeModal(); };
  document.onkeydown = (e) => {
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowRight") showNextPainting();
    if (e.key === "ArrowLeft") showPrevPainting();
  };
}
