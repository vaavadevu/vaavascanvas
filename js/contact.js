// contact.js — contact form, artwork dropdowns, buy flow, Mailchimp

async function buildContactForm() {
  const container = document.getElementById("formContainer");
  if (!container) return;

  const response = await fetch("form.html");
  container.innerHTML = await response.text();

  setupContactForm();
  populateArtworkDropdowns();
}

function setupContactForm() {
  const form           = document.getElementById("footerForm");
  const typeSelect     = document.getElementById("f-type");
  const subjectInput   = document.getElementById("f-subject");
  const printField     = document.getElementById("f-printField");
  const commissionInfo = document.getElementById("f-commissionInfo");
  const originalField  = document.getElementById("f-originalField");
  const originalInfo   = document.getElementById("f-originalInfo");
  const printInfo      = document.getElementById("f-printInfo");

  if (!form) return;

  typeSelect.addEventListener("change", () => {
    const val = typeSelect.value;
    printField.style.display     = val === "Prints"      ? "block" : "none";
    commissionInfo.style.display = val === "Commissions" ? "block" : "none";
    if (originalField) originalField.style.display = val === "Originals" ? "block" : "none";
    if (originalInfo)  originalInfo.style.display  = val === "Originals" ? "block" : "none";
    if (printInfo)     printInfo.style.display      = val === "Prints"    ? "block" : "none";
    subjectInput.value = val ? `New Inquiry - ${val}` : "New Inquiry";
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(form);
    const response = await fetch(form.action, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" }
    });

    if (response.ok) {
      const subscribeCheckbox = document.getElementById("f-subscribe");
      const emailInput        = document.getElementById("f-email");
      if (subscribeCheckbox?.checked && emailInput?.value) {
        subscribeToMailchimp(emailInput.value);
      }

      form.reset();
      if (originalField) originalField.style.display = "none";
      if (originalInfo)  originalInfo.style.display  = "none";
      if (printInfo)     printInfo.style.display      = "none";
      subjectInput.value           = "New Inquiry";
      printField.style.display     = "none";
      commissionInfo.style.display = "none";
      showSuccessPopup();
    } else {
      alert("Något gick fel. Maila direkt till info@vaavascanvas.se");
    }
  });
}

function handleBuyClick(painting) {
  const typeSelect     = document.getElementById("f-type");
  const subjectInput   = document.getElementById("f-subject");
  const messageInput   = document.getElementById("f-message");
  const originalSelect = document.getElementById("f-artwork-original");

  if (typeSelect) {
    typeSelect.value = "Originals";
    typeSelect.dispatchEvent(new Event("change"));
  }
  if (subjectInput)   subjectInput.value = "New Inquiry - Originals";
  if (originalSelect) {
    originalSelect.value = painting.id;
    originalSelect.dispatchEvent(new Event("change"));
  }
  if (messageInput) {
    messageInput.value = t("buy_message", painting.title, painting.size, painting.originalPrice);
  }

  closeModal();
  document.getElementById("footer").scrollIntoView({ behavior: "smooth" });
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
    option.textContent   = `${p.title} – ${p.size} – ${p.originalPrice} kr`;
    option.dataset.title = p.title;
    originalSelect.appendChild(option);
  });

  printSelect.addEventListener("change",    () => updateArtworkPreview(printSelect,    "f-artwork-preview"));
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
  preview.src           = `images/paintings/${paintingId}/01.jpg`;
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
