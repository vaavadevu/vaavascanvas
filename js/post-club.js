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

const checkoutResult = new URLSearchParams(window.location.search).get("postClub");
if (checkoutResult === "success") {
  setStatus(translated("post_club_status_success", "Tack! Betalningen är klar och brevet skickas hem till dig."), "success");
} else if (checkoutResult === "cancelled") {
  setStatus(translated("post_club_status_cancelled", "Betalningen avbröts. Du kan försöka igen när du vill."), "error");
}

form?.addEventListener("submit", async event => {
  event.preventDefault();

  submitButton.disabled = true;
  setStatus(translated("post_club_status_sending", "Öppnar betalningen..."), "pending");

  try {
    const response = await fetch("/api/create-post-club-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
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
