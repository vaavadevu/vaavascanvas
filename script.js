
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

/* Gallery construction */
function buildGallery() {
  if (!galleryElement) return;
  paintings.forEach((painting, idx) => {
    const item = createGalleryItem(painting, idx);
    galleryElement.appendChild(item);
  });
}

function createGalleryItem(painting, index) {
  const item = document.createElement("div");
  item.classList.add("gallery-item");

  const img = document.createElement("img");
  img.src = painting.image;
  img.alt = painting.title;

  img.addEventListener("error", () => {
    console.error("Image failed to load:", painting.image);
    img.src = "images/devika.jpg";
  });

  img.addEventListener("load", () => {
    console.log("Loaded image:", painting.image);
  });

  img.addEventListener("click", () => openModal(index));
  item.appendChild(img);

  if (painting.status === STATUS.SOLD) {
    addSoldBadge(item);
  }

  return item;
}

function addSoldBadge(container) {
  const badge = document.createElement("div");
  badge.textContent = "Såld";
  badge.classList.add("sold-badge");
  container.appendChild(badge);
}

/* Modal control */
function openModal(index) {
  if (!modalElement) return;
  currentPaintingIndex = index;
  currentModalImageIndex = 0;

  const painting = paintings[index];
  populateModal(painting);
  renderModalButtons(painting);

  modalElement.style.display = "flex";
}

function populateModal(painting) {
  const imgs = painting.images || [painting.image];

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
    thumb.alt = `Bild ${idx + 1}`;
    thumb.classList.add("modalThumb");
    if (idx === 0) thumb.classList.add("active");
    thumb.addEventListener("click", () => switchModalImage(imgs, idx));
    thumbsContainer.appendChild(thumb);
  });
}

function configureModalArrows(imgs) {
  const imgPrev = document.getElementById("modal-img-prev");
  const imgNext = document.getElementById("modal-img-next");

  if (imgs.length > 1) {
    imgPrev.style.display = "flex";
    imgNext.style.display = "flex";
    imgPrev.onclick = () =>
      switchModalImage(imgs, (currentModalImageIndex - 1 + imgs.length) % imgs.length);
    imgNext.onclick = () =>
      switchModalImage(imgs, (currentModalImageIndex + 1) % imgs.length);
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
    personalText.style.opacity = "0.8";
    modalButtons.appendChild(personalText);
    return;
  }

  if (painting.originalPrice) {
    const priceEl = document.createElement("p");
    priceEl.textContent = `${painting.originalPrice} kr`;
    priceEl.style.fontSize = "22px";
    priceEl.style.fontWeight = "bold";
    priceEl.style.margin = "10px 0";
    modalButtons.appendChild(priceEl);

    const buyBtn = document.createElement("button");
    buyBtn.textContent = "✉ Skicka köpförfrågan";
    buyBtn.addEventListener("click", () => handleBuyClick(painting));
    modalButtons.appendChild(buyBtn);
  }
}

function handleBuyClick(painting) {
  document.getElementById("f-typ").value = "Köpa original";
  visaFooterPrintFalt();
  document.getElementById("f-verk").value = painting.title;
  document.getElementById("f-meddelande").value =
    `Hej! Jag är intresserad av originalmålningen "${painting.title}" (${painting.size}) för ${painting.originalPrice} kr.`;

  closeModal();
  document.getElementById("footer").scrollIntoView({ behavior: "smooth" });
}

function switchModalImage(imgs, index) {
  currentModalImageIndex = index;
  modalImg.src = imgs[index];
  document.querySelectorAll(".modalThumb").forEach((thumb, idx) => {
    thumb.classList.toggle("active", idx === index);
  });
}

function closeModal() {
  if (!modalElement) return;
  modalElement.style.display = "none";
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

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
  if (modalNextBtn) modalNextBtn.addEventListener("click", showNextPainting);
  if (modalPrevBtn) modalPrevBtn.addEventListener("click", showPrevPainting);

  modalElement.addEventListener("click", (e) => {
    if (e.target === modalElement) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowRight") showNextPainting();
    if (e.key === "ArrowLeft") showPrevPainting();
  });
}

function setupScrollWatcher() {
  window.addEventListener("scroll", () => {
    const footer = document.getElementById("footer");
    const footerTop = footer.getBoundingClientRect().top;
    const footerInView = footerTop <= window.innerHeight / 2;
    let currentQuery = "#footer";

    const currentUrl = window.location.href;
    if (!footerInView) {
      if (currentUrl.includes("pictures.html")) {
        currentQuery = "pictures.html#main";
      } else {
        currentQuery = "index.html#top";
      }
    }

    activateNavQuery(currentQuery);
  });
}

function activateNavQuery(queryName) {
  document.querySelectorAll("nav a").forEach((a) => a.classList.remove("active"));
  const link = document.querySelector(`a[href="${queryName}"]`);
  if (link) link.classList.add("active");
}

// initialization
buildGallery();
attachModalListeners();
setupScrollWatcher();