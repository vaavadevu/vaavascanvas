// ui.js — header, mobile menu, scroll watcher, misc modals

// Helper function to adjust header padding
function adjustHeaderPadding() {
  const headerContainer = document.getElementById('header-container');
  const mainContent = document.querySelector('main');
  if (headerContainer && mainContent) {
    const headerHeight = headerContainer.getBoundingClientRect().height;
    mainContent.style.paddingTop = headerHeight + 'px';
  }
}

async function buildComponents() {
  const headerContainer = document.getElementById("header-container");
  if (headerContainer) {
    try {
      const res = await fetch("/components/header.html");
      if (!res.ok) throw new Error(`Failed to load header: ${res.status}`);
      headerContainer.innerHTML = await res.text();
      headerContainer.classList.add("visible");

      // Move cart drawer and overlay out of header-container so they
      // aren't affected by the header's translateY transform
      const cartDrawer = document.getElementById('cart-drawer');
      const cartOverlay = document.getElementById('cart-overlay');
      if (cartDrawer) document.body.appendChild(cartDrawer);
      if (cartOverlay) document.body.appendChild(cartOverlay);

      const isIndex = window.location.pathname.includes("index") || window.location.pathname === "/";
      const isPictures = window.location.pathname.includes("pictures");
      const isPortfolio = window.location.pathname.includes("portfolio");
      const isCommissions = window.location.pathname.includes("commissions");
      const isBlog = window.location.pathname.includes("blog");
      const isPrints = window.location.pathname.includes("prints");
      if (isIndex) document.querySelector('a[href="/##top"]')?.classList.add("active");
      if (isPictures) document.querySelector('a[href="/pages/pictures.html"]')?.classList.add("active");
      if (isPortfolio) document.querySelector('a[href="/pages/portfolio.html"]')?.classList.add("active");
      if (isCommissions) document.querySelector('a[href="/pages/commissions.html"]')?.classList.add("active");
      if (isBlog) document.querySelector('a[href="/pages/blog.html"]')?.classList.add("active");
      if (isPrints) document.querySelector('a[href="/pages/prints.html"]')?.classList.add("active");


      setupMobileMenu();

  

      const removeFirstMainTopMargin = () => {
        const first = document.querySelector('main > *');
        if (!first) return;
        const mt = parseFloat(getComputedStyle(first).marginTop || '0');
        if (mt > 0) {
          first.style.marginTop = '0px';
        }
      };

      // Initialize site banner (dismissible, date-limited)
      try {
        const banner = document.getElementById('site-banner');
        if (banner) {
          const endDate = new Date('2026-05-24T23:59:59Z');
          const now = new Date();
          const dismissed = localStorage.getItem('site_banner_dismissed');
          const shouldShow = now <= endDate && !dismissed;
          banner.classList.toggle('visible', shouldShow);

          const closeBtn = document.getElementById('site-banner-close');
          if (closeBtn) closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // remove visible class to start CSS collapse
            banner.classList.remove('visible');
            localStorage.setItem('site_banner_dismissed', '1');

            // Immediately set main padding to header height so content moves up
            const headerNow = document.getElementById('header-container');
            const mainContent = document.querySelector('main');
            const headerHNow = headerNow ? headerNow.getBoundingClientRect().height : 100;
            if (mainContent) mainContent.style.paddingTop = headerHNow + 'px';

            // After the banner transition ends, recompute final values
            const onTransitionEnd = (ev) => {
              // only react to max-height or opacity transition end
              if (ev.propertyName && !/max-height|opacity/.test(ev.propertyName)) return;
              try { adjustHeaderPadding(); } catch (err) {}
              banner.removeEventListener('transitionend', onTransitionEnd);
            };
            banner.addEventListener('transitionend', onTransitionEnd);
          });

          // Recalculate immediately and remove any top margin on the first main child
          adjustHeaderPadding();
          removeFirstMainTopMargin();

          // Recalc on resize
          window.addEventListener('resize', () => {
            adjustHeaderPadding();
            removeFirstMainTopMargin();
          });
        }
      } catch (err) {
        console.warn('Banner init failed', err);
      }

      requestAnimationFrame(() => {
        adjustHeaderPadding();
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
      if (typeof Cart !== "undefined") Cart.closeCart();
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
    const isViewPage = window.location.pathname.includes("/view");
    const isPictures = window.location.pathname.includes("pictures");
    const isCommissions = window.location.pathname.includes("commissions");
    const isPrints = window.location.pathname.includes("prints");
    const isBlog = window.location.pathname.includes("blog");

    // Determine which nav link to highlight
    let currentQuery;
    if (footerInView) {
      currentQuery = "#footer";
    } else if (isViewPage) {
      currentQuery = null;
    } else if (isPictures) {
      currentQuery = "/pages/pictures.html";
    } else if (isCommissions) {
      currentQuery = "/pages/commissions.html";
    } else if (isPrints) {
      currentQuery = "/pages/prints.html";
    } else if (isBlog) {
      currentQuery = "/pages/blog.html";
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
  const dismissSubscribeModal = () => {
    localStorage.setItem("subscribeModal_dismissed", String(Date.now()));
  };

  document.addEventListener("click", (e) => {
    // Subscribe modal
    if (e.target.closest("#subscribeBtn")) {
      document.getElementById("subscribeModal").style.display = "flex";
    }
    if (e.target.closest("#subscribeClose")) {
      document.getElementById("subscribeModal").style.display = "none";
      dismissSubscribeModal();
    }
    if (e.target.id === "subscribeModal") {
      e.target.style.display = "none";
      dismissSubscribeModal();
    }

    // Shipping modal
    if (e.target.closest("#shippingBtn")) {
      e.preventDefault();
      document.getElementById("shippingModal")?.style.setProperty("display", "flex");
    }
    if (e.target.closest("#shippingClose")) {
      document.getElementById("shippingModal")?.style.setProperty("display", "none");
    }
    if (e.target.id === "shippingModal") {
      e.target.style.display = "none";
    }

    // Success popup
    if (e.target.closest("#successPopupClose")) {
      document.getElementById("successPopup").style.display = "none";
    }
    if (e.target.id === "successPopup") {
      document.getElementById("successPopup").style.display = "none";
    }

    // Success → Shipping
    if (e.target.closest("#successShippingLink")) {
      e.preventDefault();
      document.getElementById("successPopup").style.display = "none";
      document.getElementById("shippingModal").style.display = "flex";
    }
  });

  document.addEventListener("change", (e) => {
    if (e.target.id === "subscribeAlreadyCheckbox") {
      const modal = document.getElementById("subscribeModal");
      if (e.target.checked && modal) {
        modal.style.display = "none";
        dismissSubscribeModal();
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof attachFilterListeners === 'function') {
    attachFilterListeners();
  }
});

// Auto-show subscribe modal on index page
function setupAutoShowSubscribeModal() {
  // Only show on index/home page
  const isIndex = window.location.pathname.includes("index") || window.location.pathname === "/";
  if (!isIndex) return;

  const modal = document.getElementById("subscribeModal");
  if (!modal) return;

  const dismissed = localStorage.getItem("subscribeModal_dismissed");
  if (dismissed) return;

  const lastShownKey = "subscribeModal_lastShown";
  const lastShown = localStorage.getItem(lastShownKey);
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  // If shown recently, don't show again
  if (lastShown && (now - parseInt(lastShown)) < sevenDaysMs) {
    return;
  }

  // Show modal after 4 seconds
  const showTimer = setTimeout(() => {
    modal.style.display = "flex";
    localStorage.setItem(lastShownKey, String(now));
  }, 4000);

  // Exit-intent detection: if mouse leaves top of viewport, show modal earlier
  const exitIntentHandler = (e) => {
    if (e.clientY <= 0) {
      clearTimeout(showTimer);
      modal.style.display = "flex";
      localStorage.setItem(lastShownKey, String(now));
      document.removeEventListener("mouseleave", exitIntentHandler);
    }
  };

  document.addEventListener("mouseleave", exitIntentHandler);

  modal.addEventListener("click", () => {
    document.removeEventListener("mouseleave", exitIntentHandler);
  }, { once: true });
}