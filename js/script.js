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
let isTransitioning = false;

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
  galleryElement.innerHTML = "";
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

    item.addEventListener("mousemove", (e) => {
      const rect = item.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const newIndex = Math.min(Math.floor(x * paths.length), paths.length - 1);
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
  if (!modalElement) return;
  currentPaintingIndex = index;
  currentModalImageIndex = 0;

  populateModal(painting);
  renderModalButtons(painting);

  modalElement.style.display = "flex";
  preloadAdjacentImages();

  const url = new URL(window.location);
  url.searchParams.set("painting", painting.id);
  window.history.replaceState({}, "", url);
}

function openModalSilent(index) {
  const painting = paintings[index];
  if (!modalElement) return;
  currentPaintingIndex = index;
  currentModalImageIndex = 0;

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

  const url = new URL(window.location);
  url.searchParams.set("painting", painting.id);
  window.history.replaceState({}, "", url);
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
    thumb.addEventListener("click", () => transitionToImage(imgs, idx, idx > currentModalImageIndex ? 1 : -1));
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
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
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
      e.stopPropagation();
      if (!isTransitioning) transitionToImage(imgs, (currentModalImageIndex - 1 + imgs.length) % imgs.length, -1);
    };
    imgNext.onclick = (e) => {
      e.stopPropagation();
      if (!isTransitioning) transitionToImage(imgs, (currentModalImageIndex + 1) % imgs.length, 1);
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
    priceEl.classList.add("modal-price");
    modalButtons.appendChild(priceEl);

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

function handleBuyClick(painting) {
  const typeSelect = document.getElementById("f-type");
  const subjectInput = document.getElementById("f-subject");
  const messageInput = document.getElementById("f-message");
  const originalSelect = document.getElementById("f-artwork-original");

  if (typeSelect) {
    typeSelect.value = "Originals";
    typeSelect.dispatchEvent(new Event("change"));
  }
  if (subjectInput) subjectInput.value = "New Inquiry - Originals";
  if (originalSelect) {
    originalSelect.value = painting.id;
    originalSelect.dispatchEvent(new Event("change"));
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
  zoomLevel = 0;
  modalImg.style.transform = "scale(1)";
  modalImg.style.transformOrigin = "center center";
  const wrapper = document.querySelector('.modalImageWrapper');
  if (wrapper) wrapper.classList.remove('is-zoomed-1', 'is-zoomed-2');
  document.querySelectorAll(".modalThumb").forEach((thumb, idx) => {
    thumb.classList.toggle("active", idx === index);
  });
}

// ── Transition: byter bild inuti tavlan med slide-animation ──
function transitionToImage(imgs, newIndex, direction) {
  if (isTransitioning) return;
  isTransitioning = true;

  const wrapper = document.querySelector('.modalImageWrapper');
  if (!wrapper) {
    switchModalImage(imgs, newIndex);
    isTransitioning = false;
    return;
  }

  // Skapa incoming bild
  const incoming = document.createElement('img');
  incoming.src = imgs[newIndex];
  incoming.style.cssText = `
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  transform: translateX(${direction * 100}%);
  transition: none;
  z-index: 2;
`;
  wrapper.appendChild(incoming);

  // Sätt modalImg till absolute så båda alignas lika
  modalImg.style.position = 'absolute';
  modalImg.style.top = '0';
  modalImg.style.left = '0';
  modalImg.style.width = '100%';
  modalImg.style.height = '100%';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modalImg.style.transition = 'transform 0.25s ease';
      modalImg.style.transform = `translateX(${direction * -100}%)`;
      incoming.style.transition = 'transform 0.25s ease';
      incoming.style.transform = 'translateX(0)';

      setTimeout(() => {
        currentModalImageIndex = newIndex;
        modalImg.style.opacity = '0';
        modalImg.style.transition = 'none';
        modalImg.style.transform = '';
        modalImg.style.position = '';
        modalImg.style.top = '';
        modalImg.style.left = '';
        modalImg.style.width = '';
        modalImg.style.height = '';
        modalImg.src = imgs[newIndex];

        if (incoming.parentNode) incoming.parentNode.removeChild(incoming);

        document.querySelectorAll(".modalThumb").forEach((thumb, idx) => {
          thumb.classList.toggle("active", idx === newIndex);
        });

        zoomLevel = 0;
        wrapper.classList.remove('is-zoomed-1', 'is-zoomed-2');

        requestAnimationFrame(() => {
          modalImg.style.opacity = '1';
          isTransitioning = false;
        });
      }, 280);
    });
  });
}

// ── Transition: byter tavla med slide-animation ──
function transitionToPainting(newIndex, direction) {
  if (isTransitioning) return;
  isTransitioning = true;

  const wrapper = document.querySelector('.modalInner');
  if (!wrapper) {
    currentPaintingIndex = newIndex;
    openModalSilent(newIndex);
    isTransitioning = false;
    return;
  }

  const container = document.querySelector('.modal');
  const painting = paintings[newIndex];
  const imgs = getPaintingImagePaths(painting);

  const incoming = document.createElement('div');
  incoming.classList.add('modalInner');
  const modalInnerEl = document.querySelector('.modalInner');
  const innerRect = modalInnerEl ? modalInnerEl.getBoundingClientRect() : null;

  incoming.style.cssText = `
  position: absolute;
  top: ${innerRect ? innerRect.top - container.getBoundingClientRect().top : 0}px;
  left: ${innerRect ? innerRect.left - container.getBoundingClientRect().left : 0}px;
  width: ${innerRect ? innerRect.width : '75vw'}px;
  height: ${innerRect ? innerRect.height : '75vh'}px;
  transform: translateX(${direction * (innerRect ? innerRect.width : window.innerWidth)}px);
  transition: none;
  z-index: 999;
  background: var(--bg-warm);
  border-radius: 16px;
  padding: 30px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  box-sizing: border-box;
  overflow: hidden;
`;
  const imgWrapperHeight = document.querySelector('.modalImageWrapper')?.offsetHeight || 300;
  incoming.innerHTML = `
    <div class="modalLeft">
      <div class="modalImageWrapper" style="height:${imgWrapperHeight}px; overflow:hidden;">
        <img src="${imgs[0]}" style="width:100%;height:100%;object-fit:contain;" />
      </div>
    </div>
    <div class="modalRight">
      <h3>${painting.title}</h3>
      <p>${painting.size}</p>
      <p>${painting.description}</p>
    </div>
  `;
  container.appendChild(incoming);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      wrapper.style.transition = 'transform 0.25s ease';
      wrapper.style.transform = `translateX(${direction * -innerRect.width}px)`;
      incoming.style.transition = 'transform 0.25s ease';
      incoming.style.transform = `translateX(0)`;

      setTimeout(() => {
        if (incoming.parentNode) incoming.parentNode.removeChild(incoming);
        wrapper.style.transition = 'none';
        wrapper.style.transform = '';

        const painting = paintings[newIndex];
        const imgs = getPaintingImagePaths(painting);
        currentPaintingIndex = newIndex;
        currentModalImageIndex = 0;
        modalImg.src = imgs[0];
        modalTitle.textContent = painting.title;
        modalSize.textContent = painting.size;
        modalDesc.textContent = painting.description;
        buildModalThumbnails(imgs);
        configureModalArrows(imgs);
        renderModalButtons(painting);

        const url = new URL(window.location);
        url.searchParams.set("painting", painting.id);
        window.history.replaceState({}, "", url);

        preloadAdjacentImages();
        isTransitioning = false;
      }, 280);
    });
  });
}

function closeModal() {
  if (modalElement) modalElement.style.display = "none";
  isTransitioning = false;
  const url = new URL(window.location);
  url.searchParams.delete("painting");
  window.history.replaceState({}, "", url);
}

function showNextPainting() {
  if (!isTransitioning) transitionToPainting((currentPaintingIndex + 1) % paintings.length, 1);
}

function showPrevPainting() {
  if (!isTransitioning) transitionToPainting((currentPaintingIndex - 1 + paintings.length) % paintings.length, -1);
}

function attachModalListeners() {
  if (!modalElement) return;

  setupZoomEffect();
  setupSwipeGestures();

  if (modalCloseBtn) modalCloseBtn.onclick = closeModal;
  if (modalNextBtn) modalNextBtn.onclick = () => showNextPainting();
  if (modalPrevBtn) modalPrevBtn.onclick = () => showPrevPainting();

  modalElement.onclick = (e) => { if (e.target === modalElement) closeModal(); };
  document.onkeydown = (e) => {
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowRight") showNextPainting();
    if (e.key === "ArrowLeft") showPrevPainting();
  };
}

function setupScrollWatcher() {
  let lastScrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;
    const header = document.getElementById("header-container");

    if (currentScrollY < lastScrollY) {
      header?.classList.add("visible");
    } else {
      header?.classList.remove("visible");
    }
    if (currentScrollY < 100) {
      header?.classList.add("visible");
    }
    lastScrollY = currentScrollY;

    const footer = document.getElementById("footer");
    if (!footer) return;
    const footerInView = footer.getBoundingClientRect().top <= window.innerHeight / 2;
    const isPictures = window.location.href.includes("pictures.html");
    let currentQuery = footerInView ? "#footer" : isPictures ? "pictures.html" : "index.html#top";
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
      const emailInput = document.getElementById("f-email");
      const nameInput = document.getElementById("f-name");

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
}

function setupModals() {
  document.addEventListener("click", (e) => {
    // Subscribe
    if (e.target.closest("#subscribeBtn")) {
      document.getElementById("subscribeModal").style.display = "flex";
    }
    if (e.target.closest("#subscribeClose")) {
      document.getElementById("subscribeModal").style.display = "none";
    }
    if (e.target.id === "subscribeModal") {
      e.target.style.display = "none";
    }

    // Shipping
    if (e.target.closest("#shippingBtn")) {
      e.preventDefault();
      document.getElementById("shippingModal").style.display = "flex";
    }
    if (e.target.closest("#shippingClose")) {
      document.getElementById("shippingModal").style.display = "none";
    }
    if (e.target.id === "shippingModal") {
      e.target.style.display = "none";
    }

    // Success popup
    if (e.target.closest("#successPopupClose")) {
      document.getElementById("successPopup").style.display = "none";
    }
    if (e.target.id === "successPopup") {
      e.target.style.display = "none";
    }

    // Success → Shipping
    if (e.target.closest("#successShippingLink")) {
      e.preventDefault();
      document.getElementById("successPopup").style.display = "none";
      document.getElementById("shippingModal").style.display = "flex";
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

function setupSwipeGestures() {
  let touchStartX = 0;
  let touchStartY = 0;
  let isDragging = false;

  const wrapper = document.querySelector('.modalImageWrapper');
  const modal = document.getElementById('modal');
  if (!modal) return;

  // ── Inuti bilden: byter bild av samma tavla ──
  if (wrapper) {
    let nextImg = null;

    wrapper.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      if (isTransitioning) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isDragging = false;

      const painting = paintings[currentPaintingIndex];
      const imgs = getPaintingImagePaths(painting);
      if (imgs.length <= 1) return;

      const rect = modalImg.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const offsetTop = rect.top - wrapperRect.top;
      const offsetLeft = rect.left - wrapperRect.left;

      modalImg.style.position = 'absolute';
      modalImg.style.top = `${offsetTop}px`;
      modalImg.style.left = `${offsetLeft}px`;
      modalImg.style.width = `${rect.width}px`;
      modalImg.style.height = `${rect.height}px`;

      nextImg = document.createElement('img');
      nextImg.style.cssText = `
        position: absolute;
        top: ${offsetTop}px;
        left: ${offsetLeft}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        object-fit: contain;
        object-position: center center;
        transition: none;
        z-index: 2;
        pointer-events: none;
      `;
      wrapper.appendChild(nextImg);
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
      e.stopPropagation();
      if (isTransitioning) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      if (Math.abs(dx) < 5) return;
      if (!isDragging && Math.abs(dy) > Math.abs(dx)) return;
      isDragging = true;

      const painting = paintings[currentPaintingIndex];
      const imgs = getPaintingImagePaths(painting);
      if (imgs.length <= 1) return;

      const direction = dx < 0 ? 1 : -1;
      const newIndex = (currentModalImageIndex + direction + imgs.length) % imgs.length;

      if (nextImg && nextImg.dataset.index !== String(newIndex)) {
        nextImg.src = imgs[newIndex];
        nextImg.dataset.index = String(newIndex);
      }

      modalImg.style.transition = 'none';
      modalImg.style.transform = `translateX(${dx}px)`;
      if (nextImg) {
        const offset = dx < 0 ? wrapper.offsetWidth + dx : -wrapper.offsetWidth + dx;
        nextImg.style.transform = `translateX(${offset}px)`;
      }
    }, { passive: false });

    wrapper.addEventListener('touchend', (e) => {
      e.stopPropagation();
      if (isTransitioning) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;

      const painting = paintings[currentPaintingIndex];
      const imgs = getPaintingImagePaths(painting);

      const cleanup = () => {
        if (nextImg && nextImg.parentNode) nextImg.parentNode.removeChild(nextImg);
        nextImg = null;
        modalImg.style.transition = '';
        modalImg.style.transform = '';
        modalImg.style.position = '';
        modalImg.style.top = '';
        modalImg.style.left = '';
        modalImg.style.width = '';
        modalImg.style.height = '';
      };

      if (!isDragging || Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) || imgs.length <= 1) {
        modalImg.style.transition = 'transform 0.25s ease';
        modalImg.style.transform = 'translateX(0)';
        if (nextImg) {
          nextImg.style.transition = 'transform 0.25s ease';
          nextImg.style.transform = `translateX(${dx < 0 ? wrapper.offsetWidth : -wrapper.offsetWidth}px)`;
        }
        setTimeout(cleanup, 250);
        return;
      }

      const direction = dx < 0 ? 1 : -1;
      const newIndex = (currentModalImageIndex + direction + imgs.length) % imgs.length;
      isTransitioning = true;

      modalImg.style.transition = 'transform 0.25s ease';
      modalImg.style.transform = `translateX(${direction * -wrapper.offsetWidth}px)`;
      if (nextImg) {
        nextImg.style.transition = 'transform 0.25s ease';
        nextImg.style.transform = 'translateX(0)';
      }

      setTimeout(() => {
        currentModalImageIndex = newIndex;
        modalImg.style.opacity = '0';
        modalImg.src = imgs[newIndex];
        cleanup();

        document.querySelectorAll(".modalThumb").forEach((thumb, idx) => {
          thumb.classList.toggle("active", idx === newIndex);
        });

        requestAnimationFrame(() => {
          modalImg.style.opacity = '1';
          isTransitioning = false;
        });
      }, 250);

      isDragging = false;
    }, { passive: true });
  }

  // ── Utanför bilden: byter tavla ──
  let nextPaintingEl = null;

  modal.addEventListener('touchstart', (e) => {
    if (e.target.closest('.modalImageWrapper')) return;
    if (isTransitioning) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isDragging = false;
    nextPaintingEl = null;
  }, { passive: true });

  modal.addEventListener('touchmove', (e) => {
    if (e.target.closest('.modalImageWrapper')) return;
    if (isTransitioning) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (Math.abs(dx) < 5) return;
    if (!isDragging && Math.abs(dy) > Math.abs(dx)) return;
    isDragging = true;

    const modalInner = document.querySelector('.modalInner');
    const container = document.querySelector('.modal');
    if (!modalInner || !container) return;

    const direction = dx < 0 ? 1 : -1;
    const newIndex = (currentPaintingIndex + direction + paintings.length) % paintings.length;

    // Skapa incoming första gången
    if (!nextPaintingEl || nextPaintingEl.dataset.index !== String(newIndex)) {
      if (nextPaintingEl && nextPaintingEl.parentNode) nextPaintingEl.parentNode.removeChild(nextPaintingEl);

      const painting = paintings[newIndex];
      const imgs = getPaintingImagePaths(painting);

      const innerRect = modalInner.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const imgWrapperHeight = document.querySelector('.modalImageWrapper')?.offsetHeight || 300;

      nextPaintingEl = document.createElement('div');
      nextPaintingEl.classList.add('modalInner');
      nextPaintingEl.dataset.index = String(newIndex);
      nextPaintingEl.style.cssText = `
        position: absolute;
        top: ${innerRect.top - containerRect.top}px;
        left: ${innerRect.left - containerRect.left}px;
        width: ${innerRect.width}px;
        height: ${innerRect.height}px;
        transition: none;
        z-index: 2;
        background: var(--bg-warm);
        border-radius: 16px;
        padding: 30px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        box-sizing: border-box;
        overflow: hidden;
        transform: translateX(${direction * innerRect.width}px);
      `;
      nextPaintingEl.innerHTML = `
        <div class="modalLeft">
          <div class="modalImageWrapper" style="height:${imgWrapperHeight}px; overflow:hidden;">
            <img src="${imgs[0]}" style="width:100%;height:100%;object-fit:contain;" />
          </div>
        </div>
        <div class="modalRight">
          <h3>${painting.title}</h3>
          <p>${painting.size}</p>
          <p>${painting.description}</p>
        </div>
      `;
      container.appendChild(nextPaintingEl);
    }

    // Flytta i realtid
    const innerW = modalInner.getBoundingClientRect().width;
    modalInner.style.transition = 'none';
    modalInner.style.transform = `translateX(${dx}px)`;
    nextPaintingEl.style.transition = 'none';
    const offset = dx < 0 ? innerW + dx : -innerW + dx;
    nextPaintingEl.style.transform = `translateX(${offset}px)`;
  }, { passive: true });

  modal.addEventListener('touchend', (e) => {
    if (e.target.closest('.modalImageWrapper')) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const modalInner = document.querySelector('.modalInner');
    const container = document.querySelector('.modal');

    if (!isDragging || Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) {
      if (modalInner) {
        modalInner.style.transition = 'transform 0.25s ease';
        modalInner.style.transform = 'translateX(0)';
      }
      if (nextPaintingEl && nextPaintingEl.parentNode) {
        const direction = dx < 0 ? 1 : -1;
        nextPaintingEl.style.transition = 'transform 0.25s ease';
        nextPaintingEl.style.transform = `translateX(${direction * 100}%)`;
        setTimeout(() => {
          if (nextPaintingEl && nextPaintingEl.parentNode) nextPaintingEl.parentNode.removeChild(nextPaintingEl);
          nextPaintingEl = null;
        }, 250);
      }
      return;
    }

    const direction = dx < 0 ? 1 : -1;
    const newIndex = (currentPaintingIndex + direction + paintings.length) % paintings.length;
    isTransitioning = true;

    if (modalInner) {
      modalInner.style.transition = 'transform 0.25s ease';
      modalInner.style.transform = `translateX(${direction * -container.offsetWidth}px)`;
    }
    if (nextPaintingEl) {
      nextPaintingEl.style.transition = 'transform 0.25s ease';
      nextPaintingEl.style.transform = 'translateX(0)';
    }

    setTimeout(() => {
      currentPaintingIndex = newIndex;
      currentModalImageIndex = 0;

      const painting = paintings[newIndex];
      const imgs = getPaintingImagePaths(painting);
      modalImg.src = imgs[0];
      modalTitle.textContent = painting.title;
      modalSize.textContent = painting.size;
      modalDesc.textContent = painting.description;
      buildModalThumbnails(imgs);
      configureModalArrows(imgs);
      renderModalButtons(painting);

      if (nextPaintingEl && nextPaintingEl.parentNode) nextPaintingEl.parentNode.removeChild(nextPaintingEl);
      nextPaintingEl = null;
      if (modalInner) {
        modalInner.style.transition = 'none';
        modalInner.style.transform = '';
      }

      const url = new URL(window.location);
      url.searchParams.set("painting", painting.id);
      window.history.replaceState({}, "", url);

      preloadAdjacentImages();
      isTransitioning = false;
    }, 250);

    isDragging = false;
  }, { passive: true });
}

function preloadAdjacentImages() {
  const painting = paintings[currentPaintingIndex];
  const imgs = getPaintingImagePaths(painting);
  imgs.forEach(src => { new Image().src = src; });
  const nextPainting = paintings[(currentPaintingIndex + 1) % paintings.length];
  const prevPainting = paintings[(currentPaintingIndex - 1 + paintings.length) % paintings.length];
  new Image().src = getPaintingImagePaths(nextPainting)[0];
  new Image().src = getPaintingImagePaths(prevPainting)[0];
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

  paintings.filter(p => p.status === STATUS.FOR_SALE).forEach(p => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = `${p.title} – ${p.size} – ${p.originalPrice} kr`;
    option.dataset.title = p.title;
    originalSelect.appendChild(option);
  });

  printSelect.addEventListener("change", () => updateArtworkPreview(printSelect, "f-artwork-preview"));
  originalSelect.addEventListener("change", () => updateArtworkPreview(originalSelect, "f-artwork-original-preview"));
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

async function buildComponents() {
  const headerContainer = document.getElementById("header-container");
  if (headerContainer) {
    const res = await fetch("components/header.html");
    headerContainer.innerHTML = await res.text();
    headerContainer.classList.add("visible");

    const isIndex = window.location.pathname.includes("index") || window.location.pathname === "/";
    const isPictures = window.location.pathname.includes("pictures");
    if (isIndex) document.querySelector('a[href="index.html#top"]')?.classList.add("active");
    if (isPictures) document.querySelector('a[href="pictures.html"]')?.classList.add("active");

    setupMobileMenu();

    requestAnimationFrame(() => {
      document.body.style.paddingTop = "0";
      window.scrollTo(0, 0);
    });
  }

  const modalsContainer = document.getElementById("modals-container");
  if (modalsContainer) {
    const [subscribeRes, successRes, shippingRes] = await Promise.all([
      fetch("components/subscribe-modal.html"),
      fetch("components/success-popup.html"),
      fetch("components/shipping-modal.html")
    ]);
    modalsContainer.innerHTML = await subscribeRes.text() + await successRes.text() + await shippingRes.text();
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

async function init() {
  if (!galleryElement) return;

  try {
    const response = await fetch('images/paintings/counts.json');
    if (!response.ok) throw new Error("File not found");
    const counts = await response.json();
    paintings.forEach(p => { p.imageCount = counts[p.id] || 1; });
  } catch (err) {
    console.warn("Could not load counts.json, defaulting to 1 image per painting.", err);
  }

  sortPaintings();
  buildGallery();
  attachModalListeners();
  attachFilterListeners();

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
  setupModals();
});
init();
