// script.js — entry point & init only

document.addEventListener("contextmenu", e => e.preventDefault());

async function init() {
  if (!document.getElementById("gallery")) return;

  try {
    const response = await fetch("/images/paintings/counts.json");
    if (!response.ok) throw new Error("File not found");
    const counts = await response.json();
    paintings.forEach(p => { p.imageCount = counts[p.id] || 1; });
  } catch (err) {
    console.warn("Could not load counts.json, defaulting to 1 image per painting.", err);
  }

  sortPaintings();
  buildGallery();
  attachModalListeners();

  const params     = new URLSearchParams(window.location.search);
  const paintingId = params.get("painting");
  if (paintingId) {
    const index = paintings.findIndex(p => p.id === paintingId);
    if (index !== -1) openModal(index);
  }
}

async function setup() {
  await buildComponents();  // header + modals in DOM
  setupModals();
  await buildContactForm(); // form in DOM
  initLanguage();           // now everything exists, apply saved language
}

setupScrollWatcher();
setup();
init();
