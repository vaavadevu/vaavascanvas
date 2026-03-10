// gallery.js — building and filtering the painting grid

function getPaintingImagePaths(painting) {
  const folderId = painting.id;
  const count = painting.imageCount || 1;
  const base = `images/paintings/${folderId}/`;
  return Array.from({ length: count }, (_, i) => {
    const idx = String(i + 1).padStart(2, "0");
    return `${base}${idx}.jpg`;
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

function buildGallery() {
  const galleryElement = document.getElementById("gallery");
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
      if (!paths.length) return;
      const rect = item.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;

      // Math.max(0, ...) ser till att indexet aldrig blir lägre än 0
      const newIndex = Math.max(0, Math.min(Math.floor(x * paths.length), paths.length - 1));

      // Kontrollera att paths[newIndex] faktiskt existerar innan split()
      if (paths[newIndex] && !img.src.endsWith(paths[newIndex].split("/").pop())) {
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
  badge.textContent = t("modal_sold");
  badge.dataset.i18n = "modal_sold";
  badge.classList.add("sold-badge");
  container.appendChild(badge);
}

// ── Filter ────────────────────────────────────────────────────

let activeFilter = "all";

function attachFilterListeners() {
  document.querySelectorAll(".filter-btn, .fab-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      setActiveFilter(btn.dataset.filter);
      closeFab();
    });
  });

  setupFab();
}

function setActiveFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll(".filter-btn, .fab-filter-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.filter === filter);
  });
  filterGallery(filter);
}

function filterGallery(filter) {
  document.querySelectorAll(".gallery-item").forEach((item, idx) => {
    const status = paintings[idx].status;
    const show = filter === "all" || status === filter;
    item.style.display = show ? "" : "none";
  });
}

// ── FAB ───────────────────────────────────────────────────────

function setupFab() {
  const fab = document.getElementById("filter-fab");
  const trigger = document.getElementById("fab-trigger");
  const footer = document.querySelector("footer");
  
  if (!fab || !trigger) {
    console.log("FAB hittades inte i DOM:en än!");
    return;
  }

  // Klick-logik
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    fab.classList.toggle("open");
  });

  // Funktion för att sätta positionen
  const updatePosition = () => {
    if (!footer) return;
    const footerRect = footer.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const margin = 24; 

    if (footerRect.top < windowHeight) {
      const stopPosition = windowHeight - footerRect.top + margin;
      fab.style.bottom = stopPosition + "px";
    } else {
      fab.style.bottom = margin + "px";
    }
    // Gör knappen synlig ifall CSS råkar dölja den
    fab.style.display = "flex"; 
  };

  // KÖR DIREKT
  updatePosition();

  // KÖR IGEN efter en kort stund (ifall galleriet precis har ritats ut)
  setTimeout(updatePosition, 100);
  setTimeout(updatePosition, 500); // En extra säkerhet när bilderna laddas

  // Lyssna på scroll
  window.addEventListener("scroll", () => {
    window.requestAnimationFrame(updatePosition);
  }, { passive: true });

  // Stäng vid klick utanför
  document.addEventListener("click", (e) => {
    if (!fab.contains(e.target)) closeFab();
  });
}

function closeFab() {
  document.getElementById("filter-fab")?.classList.remove("open");
}