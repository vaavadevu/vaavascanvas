// ui.js — header, mobile menu, scroll watcher, misc modals

async function buildComponents() {
  const headerContainer = document.getElementById("header-container");
  if (headerContainer) {
    try {
      const res = await fetch("/components/header.html");
      if (!res.ok) throw new Error(`Failed to load header: ${res.status}`);
      headerContainer.innerHTML = await res.text();
      headerContainer.classList.add("visible");

      const isIndex = window.location.pathname.includes("index") || window.location.pathname === "/";
      const isPictures = window.location.pathname.includes("pictures");
      const isCommissions = window.location.pathname.includes("commissions"); // ← ny rad
      if (isIndex) document.querySelector('a[href="/#top"]')?.classList.add("active");
      if (isPictures) document.querySelector('a[href="/pages/pictures.html"]')?.classList.add("active");
      if (isCommissions) document.querySelector('a[href="/pages/commissions.html"]')?.classList.add("active");


      setupMobileMenu();

      requestAnimationFrame(() => {
        document.body.style.paddingTop = "0";
        document.documentElement.style.paddingTop = "0";
        window.scrollTo(0, 0);
      });
    } catch (err) {
      console.warn("Could not load header component:", err);
    }
  }

  const modalsContainer = document.getElementById("modals-container");
  if (modalsContainer) {
    try {
      const [subscribeRes, successRes, shippingRes] = await Promise.all([
        fetch("/components/subscribe-modal.html"),
        fetch("/components/success-popup.html"),
        fetch("/components/shipping-modal.html")
      ]);
      const html = await Promise.all([
        subscribeRes.ok ? subscribeRes.text() : Promise.resolve(""),
        successRes.ok   ? successRes.text()   : Promise.resolve(""),
        shippingRes.ok  ? shippingRes.text()  : Promise.resolve(""),
      ]);
      if (!subscribeRes.ok) console.warn(`Could not load subscribe-modal.html: ${subscribeRes.status}`);
      if (!successRes.ok)   console.warn(`Could not load success-popup.html: ${successRes.status}`);
      if (!shippingRes.ok)  console.warn(`Could not load shipping-modal.html: ${shippingRes.status}`);
      modalsContainer.innerHTML = html.join("");
    } catch (err) {
      console.warn("Could not load modal components:", err);
    }
  }
}

function setupMobileMenu() {
  const menuBtn = document.getElementById("mobile-menu");
  const navMenu = document.getElementById("nav-menu");
  if (!menuBtn || !navMenu) return;

  const setMenuOpen = (open) => {
    navMenu.classList.toggle("active", open);
    menuBtn.classList.toggle("open", open);
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (!open) navMenu.style.transform = "";
  };

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    setMenuOpen(!navMenu.classList.contains("active"));
  });

  // Stäng vid klick utanför
  document.addEventListener("click", (e) => {
    if (navMenu.classList.contains("active") && !navMenu.contains(e.target) && !menuBtn.contains(e.target)) {
      setMenuOpen(false);
    }
  });

  // --- Globalt svep för att stänga ---
  // Vi lyssnar på document.body istället för navMenu
  setupSwipe(document.body, (phase, dx, dy) => {
    // Kör bara om menyn är öppen
    if (!navMenu.classList.contains("active")) return;

    // Vi bryr oss bara om svep åt vänster (dx < 0)
    if (dx < 0) {
      if (phase === "move") {
        navMenu.style.transition = "none";
        navMenu.style.transform = `translateX(${dx}px)`;
      }

      if (phase === "end") {
        navMenu.style.transition = ""; // Tillåt CSS-animation igen
        if (dx < -60) {
          setMenuOpen(false);
        } else {
          navMenu.style.transform = "translateX(0)";
        }
      }
    }
  });

  document.querySelectorAll(".link-list a").forEach(link => {
    link.addEventListener("click", () => setMenuOpen(false));
  });
}

function setupScrollWatcher() {
  let lastScrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    const navMenu = document.getElementById("nav-menu");
    // Don't animate header if menu is open
    if (navMenu?.classList.contains("active")) return;

    const currentScrollY = window.scrollY;
    const header = document.getElementById("header-container");
    const show = currentScrollY < lastScrollY || currentScrollY < 100;
    if (show) {
      header?.classList.add("visible");
    } else {
      header?.classList.remove("visible");

    }
    window._syncFilterBar?.(show);
    lastScrollY = currentScrollY;

    const footer = document.getElementById("footer");
    if (!footer) return;

    const footerInView = footer.getBoundingClientRect().top <= window.innerHeight / 2;
    const isViewPage = window.location.href.includes("/pages/view.html");
    const isPictures = window.location.href.includes("pictures.html");
    const isCommissions = window.location.href.includes("commissions.html"); // ← ny rad

    // Determine which nav link to highlight
    let currentQuery;
    if (footerInView) {
      currentQuery = "#footer"; // Highlight "kontakta mig" when footer is in view
    } else if (isViewPage) {
      currentQuery = null; // Don't highlight anything on view page when footer not visible
    } else if (isPictures) {
      currentQuery = "/pages/pictures.html";
    }  else if (isCommissions) {                              // ← nytt block
  currentQuery = "/pages/commissions.html";             // ← nytt block
    } else {
      currentQuery = "/#top";
    }

    if (currentQuery) {
      activateNavQuery(currentQuery);
    } else {
      document.querySelectorAll("nav a").forEach(a => a.classList.remove("active"));
    }
  });
}

function activateNavQuery(queryName) {
  document.querySelectorAll("nav a").forEach(a => a.classList.remove("active"));
  const link = document.querySelector(`a[href="${queryName}"]`);
  if (link) link.classList.add("active");
}

function setupModals() {
  document.addEventListener("click", (e) => {
    // Subscribe modal
    if (e.target.closest("#subscribeBtn")) {
      document.getElementById("subscribeModal").style.display = "flex";
    }
    if (e.target.closest("#subscribeClose")) {
      document.getElementById("subscribeModal").style.display = "none";
    }
    if (e.target.id === "subscribeModal") {
      e.target.style.display = "none";
    }

    // Shipping modal
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

document.addEventListener('DOMContentLoaded', () => {
  if (typeof attachFilterListeners === 'function') {
    attachFilterListeners();
  }
});