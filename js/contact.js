// contact.js — contact form, artwork dropdowns, buy flow, Mailchimp

async function buildContactForm() {
  const container = document.getElementById("formContainer");
  if (!container) return;

  try {
    const response = await fetch("/pages/form.html");
    if (!response.ok) throw new Error(`Failed to load form: ${response.status}`);
    container.innerHTML = await response.text();
  } catch (err) {
    console.warn("Could not load contact form:", err);
    return;
  }

  setupContactForm();
  populateArtworkDropdowns();
}

function setupContactForm() {
  const form           = document.getElementById("footerForm");
  const typeSelect     = document.getElementById("f-type");
  const subjectInput   = document.getElementById("f-subject");
  const printField     = document.getElementById("f-printField");
  const originalField  = document.getElementById("f-originalField");
  const commissionFields = document.getElementById("f-commissionFields");
  const originalInfo   = document.getElementById("f-originalInfo");
  const printInfo      = document.getElementById("f-printInfo");
  const messageField   = document.getElementById("f-message");

  if (!form || !typeSelect) return;
  // 🔥 AUTOSELECT från URL (NU funkar det)
const params = new URLSearchParams(window.location.search);
const type = params.get("type");

if (type) {
  typeSelect.value = type;
  applyTypeVisibility(type); // VIKTIGT
}
  function applyTypeVisibility(val) {
  if (printField)     printField.style.display     = val === "Prints"      ? "block" : "none";
  if (originalField)  originalField.style.display  = val === "Originals"   ? "block" : "none";
  if (commissionFields) commissionFields.style.display = val === "Commissions" ? "block" : "none";

  if (originalInfo)   originalInfo.style.display   = val === "Originals"   ? "block" : "none";
  if (printInfo)      printInfo.style.display      = val === "Prints"      ? "block" : "none";

  if (subjectInput)   subjectInput.value = val ? `New Inquiry - ${val}` : "New Inquiry";
}

  // Auto-expand textarea as user types
  if (messageField) {
    messageField.addEventListener("input", () => {
      messageField.style.height = "40px";
      messageField.style.height = messageField.scrollHeight + "px";
    });
  }

  typeSelect.addEventListener("change", () => applyTypeVisibility(typeSelect.value));

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(form);
    const response = await fetch(form.action, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" }
    });

    if (response.ok) {
      form.reset();
      applyTypeVisibility("");
      showSuccessPopup();
    } else {
      alert("Något gick fel. Maila direkt till info@vaavascanvas.se");
    }
  });
}

function handleBuyClick(painting, frameChoice = null) {
  const typeSelect     = document.getElementById("f-type");
  const subjectInput   = document.getElementById("f-subject");
  const originalSelect = document.getElementById("f-artwork-original");
  const messageField   = document.getElementById("f-message");

  if (typeSelect) {
    typeSelect.value = "Originals";
    typeSelect.dispatchEvent(new Event("change"));
  }
  if (subjectInput)   subjectInput.value = "New Inquiry - Originals";
  if (originalSelect) {
    originalSelect.value = painting.id;
    originalSelect.dispatchEvent(new Event("change"));
  }

  // Förifyll meddelandet med ramval om relevant
  if (messageField && frameChoice) {
    const frameText = frameChoice === "with"
      ? t("frame_price_with")
      : t("frame_price_without");
    messageField.value = frameText;
  }

  document.getElementById("formContainer").scrollIntoView({ behavior: "smooth" });
}

function populateArtworkDropdowns() {
  const printSelect    = document.getElementById("f-artwork");
  const originalSelect = document.getElementById("f-artwork-original");
  if (!printSelect || !originalSelect) return;

  paintings.forEach(p => {
    const option = document.createElement("option");
    option.value         = p.id;
    option.textContent   = p.title;
    option.dataset.title = p.title;
    printSelect.appendChild(option);
  });

  paintings.filter(p => p.status === STATUS.FOR_SALE).forEach(p => {
    const option = document.createElement("option");
    option.value         = p.id;
    const dimensions = p.shape === SHAPE.CIRCLE
      ? `${p.diameter} cm`
      : `${p.width} x ${p.height} cm`;
    option.textContent   = `${p.title} – ${dimensions} – ${formatPrice(p.originalPrice)}`;
    option.dataset.title = p.title;
    option.dataset.dimensions = dimensions;
    originalSelect.appendChild(option);
  });

  printSelect.addEventListener("change",    () => updateArtworkPreview(printSelect,    "f-artwork-preview"));
  originalSelect.addEventListener("change", () => updateArtworkPreview(originalSelect, "f-artwork-original-preview"));

  window.addEventListener("languagechange", () => {
    originalSelect.querySelectorAll("option[value]").forEach(option => {
      const p = paintings.find(p => p.id === option.value);
      if (p) option.textContent = `${p.title} – ${option.dataset.dimensions} – ${formatPrice(p.originalPrice)}`;
    });
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
  preview.src           = `/images/paintings/${paintingId}/desktop/01.jpg`;
  preview.alt           = select.options[select.selectedIndex].dataset.title;
  preview.style.display = "block";
}

function subscribeToMailchimp(email) {
  const iframe = document.querySelector(".subscribe-iframe");
  if (!iframe) return;
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  const mcEmail   = iframeDoc.getElementById("mce-EMAIL");
  const mcForm    = iframeDoc.getElementById("mc-embedded-subscribe-form");
  if (mcEmail && mcForm) {
    mcEmail.value = email;
    mcForm.submit();
  }
}

function showSuccessPopup() {
  const popup = document.getElementById("successPopup");
  if (!popup) return;
  popup.style.display = "flex";
}
