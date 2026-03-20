// utilities.js — shared utility functions for painting display and interactions

// ── Price formatting ──────────────────────────────────────────

const SEK_TO_EUR = 0.088;

function formatPrice(sek) {
  if ((window.currentLang || "sv") === "en") {
    return `€${Math.round(sek * SEK_TO_EUR)}`;
  }
  return `${sek} kr`;
}

// ── Shared utilities ──────────────────────────────────────────

function setupSwipe(element, handler, shouldIgnore) {
  let startX = 0, startY = 0, dragging = false;

  element.addEventListener("touchstart", (e) => {
    if (shouldIgnore?.(e) || State.isTransitioning) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    dragging = false;
  }, { passive: true });

  element.addEventListener("touchmove", (e) => {
    if (shouldIgnore?.(e) || State.isTransitioning) return;
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

function formatDimensions(painting) {
  if (painting.shape === SHAPE.CIRCLE) {
    return `${painting.diameter} cm diameter`;
  }
  return `${painting.width} x ${painting.height} cm`;
}

function preloadAdjacentImages() {
  getPaintingImagePaths(paintings[State.currentPaintingIndex]).forEach(src => { new Image().src = src; });
  new Image().src = getPaintingImagePaths(paintings[(State.currentPaintingIndex + 1) % paintings.length])[0];
  new Image().src = getPaintingImagePaths(paintings[(State.currentPaintingIndex - 1 + paintings.length) % paintings.length])[0];
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
