const form = document.getElementById("post-club-form");
const status = document.getElementById("post-club-status");
const submitButton = form?.querySelector("button[type='submit']");

function setStatus(message, type) {
  if (!status) return;
  status.textContent = message;
  status.className = `post-club-status ${type}`;
}

function translated(key, fallback) {
  return typeof t === "function" ? t(key) : fallback;
}

form?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim().toLowerCase();

  submitButton.disabled = true;
  setStatus(translated("post_club_status_sending", "Skickar..."), "pending");

  try {
    const response = await fetch("/api/create-post-club-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email })
    });
    const result = await response.json();

    if (!response.ok || !result.url) {
      throw new Error(result.error || "Could not create checkout session");
    }

    window.location.href = result.url;
  } catch (error) {
    console.error("Could not create post club checkout", error);
    setStatus(translated("post_club_status_error", "Något gick fel. Försök igen eller kontakta info@vaavascanvas.se."), "error");
  } finally {
    submitButton.disabled = false;
  }
});
