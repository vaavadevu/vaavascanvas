// ---- Lightbox ----
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxMeta = document.getElementById('lightboxMeta');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxLink = document.getElementById('lightboxLink');

function openLightbox(piece) {
  const img = piece.querySelector('img');
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;
  lightboxTitle.textContent = piece.dataset.title || '';
  const meta = [piece.dataset.medium, piece.dataset.date].filter(Boolean).join(' · ');
  lightboxMeta.textContent = meta;

  if (piece.dataset.link) {
    lightboxLink.href = piece.dataset.link;
    lightboxLink.textContent = piece.dataset.linkLabel || 'Se mer →';
    lightboxLink.style.display = 'inline-block';
  } else {
    lightboxLink.style.display = 'none';
  }

  lightbox.classList.add('open');
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove('open');
}

document.querySelectorAll('.piece').forEach(piece => {
  piece.addEventListener('click', () => openLightbox(piece));
  piece.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox(piece);
    }
  });
});

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

// ---- Medium tab filter ----
const tabs = document.querySelectorAll('.medium-tab');
const sections = document.querySelectorAll('.medium-section');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.target;

    if (target === 'all') {
      sections.forEach(s => s.style.display = '');
    } else {
      sections.forEach(s => {
        s.style.display = (s.id === target) ? '' : 'none';
      });
    }
  });
});
