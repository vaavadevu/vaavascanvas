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
  // Only populate artwork dropdowns if paintings data is loaded
  if (typeof paintings !== "undefined") {
    populateArtworkDropdowns();
  }
}

function setupContactForm() {
  const form           = document.getElementById("footerForm");
  const typeSelect     = document.getElementById("f-type");
  const subjectInput   = document.getElementById("f-subject");
  const printField     = document.getElementById("f-printField");
  const commissionFields = document.getElementById("f-commissionFields");
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
  if (printField)       printField.style.display       = val === "Prints"       ? "block" : "none";
  if (commissionFields) commissionFields.style.display = val === "Commissions"  ? "block" : "none";
  if (printInfo)        printInfo.style.display        = val === "Prints"       ? "block" : "none";
  if (subjectInput)     subjectInput.value = val ? `New Inquiry - ${val}` : "New Inquiry";
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
      trackEvent('contact_form_submit', { form_type: typeSelect.value || 'General' });
      form.reset();
      applyTypeVisibility("");
      showSuccessPopup();
    } else {
      alert("Något gick fel. Maila direkt till info@vaavascanvas.se");
    }
  });
}

function populateArtworkDropdowns() {
  if (typeof paintings === "undefined") return;

  const printSelect = document.getElementById("f-artwork");
  if (!printSelect) return;

  paintings.forEach(p => {
    const option = document.createElement("option");
    option.value         = p.id;
    option.textContent   = p.title;
    option.dataset.title = p.title;
    printSelect.appendChild(option);
  });

  printSelect.addEventListener("change", () => updateArtworkPreview(printSelect, "f-artwork-preview"));
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
