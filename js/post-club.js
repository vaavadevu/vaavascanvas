import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBPJLdjWw8v9W4eMj62rFFn_RaXwq7FZqY",
  authDomain: "vaavascanvas-37626.firebaseapp.com",
  projectId: "vaavascanvas-37626",
  storageBucket: "vaavascanvas-37626.firebasestorage.app",
  messagingSenderId: "172065550967",
  appId: "1:172065550967:web:51dbb1ceac232241898c72"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
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

async function emailId(email) {
  const encoded = new TextEncoder().encode(email);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
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
    const id = await emailId(email);
    await setDoc(doc(db, "postClubWaitlist", id), {
      name,
      email,
      consent: true,
      source: "post-club-waitlist",
      updatedAt: serverTimestamp()
    }, { merge: true });

    form.reset();
    setStatus(translated("post_club_status_success", "Tack! Du står nu på väntelistan."), "success");
  } catch (error) {
    console.error("Could not save post club signup", error);
    setStatus(translated("post_club_status_error", "Något gick fel. Försök igen eller kontakta info@vaavascanvas.se."), "error");
  } finally {
    submitButton.disabled = false;
  }
});
