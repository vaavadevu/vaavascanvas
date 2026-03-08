document.addEventListener("contextmenu", e => e.preventDefault());


// DOM references ---------------------------------------------
const galleryElement = document.getElementById("gallery");
const modalElement = document.getElementById("modal");

let modalImg, modalTitle, modalSize, modalDesc, modalButtons;
let modalCloseBtn, modalNextBtn, modalPrevBtn;

if (modalElement) {
  modalImg = document.getElementById("modal-img");
  modalTitle = document.getElementById("modal-title");
  modalSize = document.getElementById("modal-size");
  modalDesc = document.getElementById("modal-desc");
  modalButtons = document.getElementById("modal-buttons");
  modalCloseBtn = document.getElementById("modal-close");
  modalNextBtn = document.getElementById("modal-next");
  modalPrevBtn = document.getElementById("modal-prev");
}

// state ------------------------------------------------------
let currentPaintingIndex = 0;
let currentModalImageIndex = 0;

function getPaintingImagePaths(painting) {
  const folderId = painting.id;
  const count = painting.imageCount || 1;
  const base = `images/paintings/${folderId}/`;

  return Array.from({ length: count }, (_, i) => {
    const idx = String(i + 1).padStart(2, "0");
    return `${base}${idx}.jpg`;
  });
}

/* Gallery construction */
function buildGallery() {
  if (!galleryElement) return;
  galleryElement.innerHTML = ""; // Clear existing
  paintings.forEach((painting, idx) => {
    const item = createGalleryItem(painting, idx);
    galleryElement.appendChild(item);
  });
}

function createGalleryItem(painting, index) {
  const item = document.createElement("div");
  item.classList.add("gallery-item");

  const img = document.createElement("img");
  const paths = getPaintingImagePaths(painting);
  img.src = paths[0]; 
  img.alt = painting.title;

  img.addEventListener("error", () => { img.src = "images/devika.jpg"; });
  img.addEventListener("click", () => openModal(index));
  
  item.appendChild(img);
  if (painting.status === STATUS.SOLD) addSoldBadge(item);

  return item;
}

function addSoldBadge(container) {
  const badge = document.createElement("div");
  badge.textContent = "Såld";
  badge.classList.add("sold-badge");
  container.appendChild(badge);
}

function openModal(index) {
  const painting = paintings[index];
  console.log("Opening painting:", painting.id, "Images found:", painting.imageCount);
  if (!modalElement) return;
  currentPaintingIndex = index;
  currentModalImageIndex = 0;

  populateModal(painting);
  renderModalButtons(painting);

  modalElement.style.display = "flex";
}

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
  const thumbsContainer = document.getElementById("modal-thumbs");
  thumbsContainer.innerHTML = "";

  if (imgs.length <= 1) return;

  imgs.forEach((src, idx) => {
    const thumb = document.createElement("img");
    thumb.src = src;
    thumb.classList.add("modalThumb");
    if (idx === 0) thumb.classList.add("active");
    thumb.addEventListener("click", () => switchModalImage(imgs, idx));
    thumbsContainer.appendChild(thumb);
  });
}

function attachFilterListeners() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filterGallery(btn.dataset.filter);
    });
  });
}

function filterGallery(filter) {
  document.querySelectorAll(".gallery-item").forEach((item, idx) => {
    const status = paintings[idx].status;
    const show = filter === "all" || status === filter;
    item.style.display = show ? "" : "none";
  });
}

function sortPaintings() {
  const statusOrder = { 
    [STATUS.FOR_SALE]: 0, 
    [STATUS.PERSONAL]: 1, 
    [STATUS.SOLD]: 2 
  };

  paintings.sort((a, b) => {
    // Först sortera på status
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    // Sen inom samma status, högt pris först
    return (b.originalPrice || 0) - (a.originalPrice || 0);
  });
}
function configureModalArrows(imgs) {
  const imgPrev = document.getElementById("modal-img-prev");
  const imgNext = document.getElementById("modal-img-next");

  if (imgs.length > 1) {
    imgPrev.style.display = "flex";
    imgNext.style.display = "flex";

    imgPrev.onclick = (e) => {
      e.stopPropagation(); // <--- STOPPAR ZOOMEN
      switchModalImage(imgs, (currentModalImageIndex - 1 + imgs.length) % imgs.length);
    };

    imgNext.onclick = (e) => {
      e.stopPropagation(); // <--- STOPPAR ZOOMEN
      switchModalImage(imgs, (currentModalImageIndex + 1) % imgs.length);
    };
  } else {
    imgPrev.style.display = "none";
    imgNext.style.display = "none";
  }
}

function renderModalButtons(painting) {
  modalButtons.innerHTML = "";
  if (painting.status === STATUS.SOLD) {
    const soldText = document.createElement("p");
    soldText.textContent = STATUS_TEXT[STATUS.SOLD];
    soldText.style.color = "red";
    modalButtons.appendChild(soldText);
    return;
  }
  if (painting.status === STATUS.PERSONAL) {
    const personalText = document.createElement("p");
    personalText.textContent = STATUS_TEXT[STATUS.PERSONAL];
    modalButtons.appendChild(personalText);
    return;
  }
  if (painting.originalPrice) {
    const priceEl = document.createElement("p");
    priceEl.textContent = `${painting.originalPrice} kr`;
    priceEl.classList.add("modal-price"); // Use CSS for styling
    modalButtons.appendChild(priceEl);

    const buyBtn = document.createElement("button");
    buyBtn.textContent = "✉ Skicka köpförfrågan";
    buyBtn.addEventListener("click", () => handleBuyClick(painting));
    modalButtons.appendChild(buyBtn);
  }
}

function handleBuyClick(painting) {
  const typeSelect = document.getElementById("f-type");
  const artworkInput = document.getElementById("f-artwork");
  const messageInput = document.getElementById("f-message");
  const subjectInput = document.getElementById("f-subject");

  if (typeSelect) typeSelect.value = "Originals";
  if (subjectInput) subjectInput.value = "New Inquiry - Originals";
  
  const printField = document.getElementById("f-printField");
  if (printField) printField.style.display = "none";

  if (artworkInput) artworkInput.value = painting.title;
  if (messageInput) {
    messageInput.value = `Hej! Jag är intresserad av originalmålningen "${painting.title}" (${painting.size}) för ${painting.originalPrice} kr.`;
  }

  closeModal();
  document.getElementById("footer").scrollIntoView({ behavior: "smooth" });
}

function switchModalImage(imgs, index) {
  currentModalImageIndex = index;
  modalImg.src = imgs[index];
  
  // 1. Nollställ zoom-nivån till 0 (utzoomad)
  zoomLevel = 0; 
  
  // 2. Återställ bildens storlek och centrera zoomen
  modalImg.style.transform = "scale(1)";
  modalImg.style.transformOrigin = "center center";

  // 3. Ta bort alla zoom-klasser från wrappern så muspekaren blir rätt
  const wrapper = document.querySelector('.modalImageWrapper');
  if (wrapper) {
    wrapper.classList.remove('is-zoomed-1', 'is-zoomed-2');
  }

  // 4. Uppdatera tumnaglarna så rätt bild ser vald ut
  document.querySelectorAll(".modalThumb").forEach((thumb, idx) => {
    thumb.classList.toggle("active", idx === index);
  });
}

function closeModal() {
  if (modalElement) modalElement.style.display = "none";
}

function showNextPainting() {
  currentPaintingIndex = (currentPaintingIndex + 1) % paintings.length;
  openModal(currentPaintingIndex);
}

function showPrevPainting() {
  currentPaintingIndex = (currentPaintingIndex - 1 + paintings.length) % paintings.length;
  openModal(currentPaintingIndex);
}

function attachModalListeners() {
  if (!modalElement) return;

  setupZoomEffect();

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

function setupScrollWatcher() {
  window.addEventListener("scroll", () => {
    const footer = document.getElementById("footer");
    if (!footer) return;
    const footerInView = footer.getBoundingClientRect().top <= window.innerHeight / 2;
    let currentQuery = footerInView ? "#footer" : (window.location.href.includes("pictures.html") ? "pictures.html#main" : "index.html#top");
    activateNavQuery(currentQuery);
  });
}

function activateNavQuery(queryName) {
  document.querySelectorAll("nav a").forEach((a) => a.classList.remove("active"));
  const link = document.querySelector(`a[href="${queryName}"]`);
  if (link) link.classList.add("active");
}

function setupContactForm() {
  const form = document.getElementById("footerForm");
  const typeSelect = document.getElementById("f-type");
  const subjectInput = document.getElementById("f-subject");
  const printField = document.getElementById("f-printField");
  const successMsg = document.getElementById("formSuccess");

  if (!form) return;

  // Uppdatera ämne och visa/dölj fält vid ändring
  typeSelect.addEventListener("change", () => {
    const val = typeSelect.value;
    printField.style.display = val === "Prints" ? "block" : "none";
    
    // Sätter ämnet till t.ex. "New Inquiry - Commissions"
    subjectInput.value = val ? `New Inquiry - ${val}` : "New Inquiry";
  });

  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    const formData = new FormData(form);

    const response = await fetch(form.action, {
      method: "POST",
      body: formData,
      headers: { "Accept": "application/json" }
    });

    if (response.ok) {
      form.reset();
      subjectInput.value = "New Inquiry";
      printField.style.display = "none";
      successMsg.style.display = "block";
      setTimeout(() => { successMsg.style.display = "none"; }, 5000);
    } else {
      alert("Något gick fel. Maila direkt till vaavascanvas@gmail.com");
    }
  });
}
let isZoomed = false; // Håller koll på om vi har zoomat in

let zoomLevel = 0; // 0 = normal, 1 = nära, 2 = supernära

function setupZoomEffect() {
  const wrapper = document.querySelector('.modalImageWrapper');
  if (!wrapper || !modalImg) return;

  wrapper.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) return;

    zoomLevel = (zoomLevel + 1) % 3;

    if (zoomLevel === 0) {
      modalImg.style.transform = "scale(1)";
      modalImg.style.transformOrigin = "center center";
      wrapper.classList.remove('is-zoomed-1', 'is-zoomed-2');
    } else if (zoomLevel === 1) {
      modalImg.style.transform = "scale(2)";
      wrapper.classList.add('is-zoomed-1');
      wrapper.classList.remove('is-zoomed-2');
    } else {
      modalImg.style.transform = "scale(4)";
      wrapper.classList.add('is-zoomed-2');
      wrapper.classList.remove('is-zoomed-1');
    }
    updateZoomPosition(e, wrapper);
  });

  wrapper.addEventListener('mousemove', (e) => {
    if (window.innerWidth <= 768 || zoomLevel === 0) return;
    updateZoomPosition(e, wrapper);
  });

  wrapper.addEventListener('mouseleave', () => {
    if (window.innerWidth <= 768) return;
    zoomLevel = 0;
    modalImg.style.transform = "scale(1)";
    modalImg.style.transformOrigin = "center center";
    wrapper.classList.remove('is-zoomed-1', 'is-zoomed-2');
  });
}

// Hjälpfunktion för att räkna ut positionen
function updateZoomPosition(e, wrapper) {
  const rect = wrapper.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  modalImg.style.transformOrigin = `${x}% ${y}%`;
}
async function init() {
  if (!galleryElement) return; // ← lägg till denna rad

  try {
    const response = await fetch('images/paintings/counts.json'); 
    if (!response.ok) throw new Error("File not found");
    const counts = await response.json();
    paintings.forEach(p => {
      p.imageCount = counts[p.id] || 1;
    });
  } catch (err) {
    console.warn("Could not load counts.json, defaulting to 1 image per painting.", err);
  }

sortPaintings();  // ← först
buildGallery();   // ← sen
attachModalListeners();
attachFilterListeners();
setupScrollWatcher();
setupContactForm();
}


init();