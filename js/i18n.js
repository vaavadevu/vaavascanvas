// i18n.js — language switching

function setLanguage(lang) {
  if (!translations[lang]) return;
  const t = translations[lang];

  // Update all elements with data-i18n attribute
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (t[key] === undefined) return;

    // Placeholders on inputs/textareas
    if (el.placeholder !== undefined && el.tagName !== "SELECT") {
      const phKey = el.dataset.i18nPh;
      if (phKey && t[phKey]) el.placeholder = t[phKey];
    }

    // Regular text content (skip if it's an input)
    if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") {
      // Preserve <br> for keys that use \n
      el.innerHTML = t[key].replace(/\n/g, "<br>");
    }
  });

  // Update placeholder-only elements (inputs/textareas)
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    const key = el.dataset.i18nPh;
    if (t[key]) el.placeholder = t[key];
  });

  // Update lang attribute on <html>
  document.documentElement.lang = lang;

  // Highlight active language button
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });

  // Save preference
  localStorage.setItem("lang", lang);

  // Store current lang globally so other JS can access it
  window.currentLang = lang;
}

function t(key, ...args) {
  const lang = window.currentLang || "sv";
  const val  = translations[lang]?.[key];
  if (typeof val === "function") return val(...args);
  return val ?? key;
}

function initLanguage() {
  const saved = localStorage.getItem("lang") || "sv";
  window.currentLang = saved;
  setLanguage(saved);
}
