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

  // Prickar och hover-preview om fler än 1 bild
  if (paths.length > 1) {
    const dots = document.createElement("div");
    dots.classList.add("gallery-dots");

    paths.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.classList.add("gallery-dot");
      if (i === 0) dot.classList.add("active");
      dots.appendChild(dot);
    });

    item.appendChild(dots);

    // Hovra vänster = första bilden, höger = sista bilden
    item.addEventListener("mousemove", (e) => {
      const rect = item.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;

      const newIndex = Math.min(
        Math.floor(x * paths.length),
        paths.length - 1
      );

      if (!img.src.endsWith(paths[newIndex].split("/").pop())) {
        img.src = paths[newIndex];
        dots.querySelectorAll(".gallery-dot").forEach((dot, i) => {
          dot.classList.toggle("active", i === newIndex);
        });
      }
    });

    item.addEventListener("mouseleave", () => {
      img.src = paths[0];
      dots.querySelectorAll(".gallery-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === 0);
      });
    });
  }

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
  const subjectInput = document.getElementById("f-subject");
  const messageInput = document.getElementById("f-message");
  const originalSelect = document.getElementById("f-artwork-original");

  if (typeSelect) {
    typeSelect.value = "Originals";
    typeSelect.dispatchEvent(new Event("change")); // ← triggar dropdown-logiken
  }

  if (subjectInput) subjectInput.value = "New Inquiry - Originals";

  // Välj rätt målning i original-dropdown
  if (originalSelect) {
    originalSelect.value = painting.id;
    originalSelect.dispatchEvent(new Event("change")); // ← triggar preview
  }

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

  const url = new URL(window.location);
  url.searchParams.delete("painting");
  window.history.replaceState({}, "", url);
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

async function buildContactForm() {
  const container = document.getElementById("formContainer");
  if (!container) return;

  const response = await fetch("form.html");
  const html = await response.text();
  container.innerHTML = html;

  setupContactForm();
  populateArtworkDropdowns();
}

function setupContactForm() {
  const form = document.getElementById("footerForm");
  const typeSelect = document.getElementById("f-type");
  const subjectInput = document.getElementById("f-subject");
  const printField = document.getElementById("f-printField");
  const commissionInfo = document.getElementById("f-commissionInfo");
  const originalField = document.getElementById("f-originalField");
  const originalInfo = document.getElementById("f-originalInfo");
  const printInfo = document.getElementById("f-printInfo");

  if (!form) return;

  typeSelect.addEventListener("change", () => {
    const val = typeSelect.value;
    printField.style.display = val === "Prints" ? "block" : "none";
    commissionInfo.style.display = val === "Commissions" ? "block" : "none";

    const originalField = document.getElementById("f-originalField");
    const originalInfo = document.getElementById("f-originalInfo");
    const printInfo = document.getElementById("f-printInfo");

    if (originalField) originalField.style.display = val === "Originals" ? "block" : "none";
    if (originalInfo) originalInfo.style.display = val === "Originals" ? "block" : "none";
    if (printInfo) printInfo.style.display = val === "Prints" ? "block" : "none";

    subjectInput.value = val ? `New Inquiry - ${val}` : "New Inquiry";
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(form);
    const response = await fetch(form.action, {
      method: "POST",
      body: formData,
      headers: { "Accept": "application/json" }
    });

    if (response.ok) {
      const subscribeCheckbox = document.getElementById("f-subscribe");
      const nameInput = document.getElementById("f-name");
      const emailInput = document.getElementById("f-email");

      if (subscribeCheckbox?.checked && emailInput?.value && nameInput?.value) {
        subscribeToMailchimp(emailInput.value);
      }

      form.reset();
      if (originalField) originalField.style.display = "none";
      if (originalInfo) originalInfo.style.display = "none";
      if (printInfo) printInfo.style.display = "none";
      subjectInput.value = "New Inquiry";
      printField.style.display = "none";
      commissionInfo.style.display = "none";
      showSuccessPopup();
    } else {
      alert("Något gick fel. Maila direkt till info@vaavascanvas.se");
    }
  });
}

function showSuccessPopup() {
  const popup = document.getElementById("successPopup");
  if (!popup) return;
  popup.style.display = "flex";
  document.getElementById("successPopupClose").addEventListener("click", () => {
    popup.style.display = "none";
  });
  popup.addEventListener("click", (e) => {
    if (e.target === popup) popup.style.display = "none";
  });
}

function setupSubscribeModal() {
  // Använd event delegation för allt
  document.addEventListener("click", (e) => {
    if (e.target.closest("#subscribeBtn")) {
      const modal = document.getElementById("subscribeModal");
      if (modal) modal.style.display = "flex";
    }
    if (e.target.closest("#subscribeClose")) {
      const modal = document.getElementById("subscribeModal");
      if (modal) modal.style.display = "none";
    }
    if (e.target.id === "subscribeModal") {
      e.target.style.display = "none";
    }
  });
}

function subscribeToMailchimp(email) {
  const iframe = document.querySelector(".subscribe-iframe");
  if (!iframe) return;

  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  const mcEmail = iframeDoc.getElementById("mce-EMAIL");
  const mcForm = iframeDoc.getElementById("mc-embedded-subscribe-form");

  if (mcEmail && mcForm) {
    mcEmail.value = email;
    mcForm.submit();
  }
}

function populateArtworkDropdowns() {
  const printSelect = document.getElementById("f-artwork");
  const originalSelect = document.getElementById("f-artwork-original");

  if (!printSelect || !originalSelect) return;

  paintings.forEach(p => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = p.title;
    option.dataset.title = p.title;
    printSelect.appendChild(option);
  });

  paintings
  .filter(p => p.status === STATUS.FOR_SALE)
  .forEach(p => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = `${p.title} – ${p.size} – ${p.originalPrice} kr`;
    option.dataset.title = p.title;
    originalSelect.appendChild(option);
  });

  // Preview för print
  printSelect.addEventListener("change", () => {
    updateArtworkPreview(printSelect, "f-artwork-preview");
  });

  // Preview för original
  originalSelect.addEventListener("change", () => {
    updateArtworkPreview(originalSelect, "f-artwork-original-preview");
  });
}

function updateArtworkPreview(select, previewId) {
  const preview = document.getElementById(previewId);
  if (!preview) return;

  const paintingId = select.value;
  if (!paintingId) {
    preview.style.display = "none";
    return;
  }

  preview.src = `images/paintings/${paintingId}/01.jpg`;
  preview.alt = select.options[select.selectedIndex].dataset.title;
  preview.style.display = "block";
}

async function buildComponents() {
  // Header
  const headerContainer = document.getElementById("header-container");
  if (headerContainer) {
    const res = await fetch("components/header.html");
    headerContainer.innerHTML = await res.text();
    
    // Sätt active-klass baserat på vilken sida vi är på
    const isIndex = window.location.pathname.includes("index") || window.location.pathname === "/";
    const isPictures = window.location.pathname.includes("pictures");
    if (isIndex) document.querySelector('a[href="index.html#top"]')?.classList.add("active");
    if (isPictures) document.querySelector('a[href="pictures.html"]')?.classList.add("active");

    // Mobil-meny listeners
    setupMobileMenu();
  }

  // Modals
  const modalsContainer = document.getElementById("modals-container");
  if (modalsContainer) {
    const [subscribeRes, successRes] = await Promise.all([
      fetch("components/subscribe-modal.html"),
      fetch("components/success-popup.html")
    ]);
    modalsContainer.innerHTML = await subscribeRes.text() + await successRes.text();
  }
}

function setupMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu');
  const navMenu = document.getElementById('nav-menu');
  if (!menuBtn || !navMenu) return;

  menuBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    menuBtn.classList.toggle('open');
  });

  document.querySelectorAll('.link-list a').forEach(link => {
    link.addEventListener('click', () => navMenu.classList.remove('active'));
  });
}

let isZoomed = false;

let zoomLevel = 0;

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

function updateZoomPosition(e, wrapper) {
  const rect = wrapper.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  modalImg.style.transformOrigin = `${x}% ${y}%`;
}

function openModal(index) {
  const painting = paintings[index];
  if (!modalElement) return;
  currentPaintingIndex = index;
  currentModalImageIndex = 0;

  populateModal(painting);
  renderModalButtons(painting);

  modalElement.style.display = "flex";

  // Uppdatera URL utan att ladda om sidan
  const url = new URL(window.location);
  url.searchParams.set("painting", painting.id);
  window.history.replaceState({}, "", url);
}

async function init() {
  if (!galleryElement) return;

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

  sortPaintings();
  buildGallery();
  attachModalListeners();
  attachFilterListeners();
  // Öppna modal om URL har ?painting=id
  const params = new URLSearchParams(window.location.search);
  const paintingId = params.get("painting");
  if (paintingId) {
    const index = paintings.findIndex(p => p.id === paintingId);
    if (index !== -1) openModal(index);
  }
}


setupScrollWatcher();
buildComponents().then(() => {
  buildContactForm();
  setupSubscribeModal();
});
init();