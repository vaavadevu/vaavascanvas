// Portfolio Dynamic Loader
const portfolioMediums = {
  akryl: { id: 'akryl', label: 'Akryl', folder: 'akryl' },
  oljapastell: { id: 'oilpastel', label: 'Oljepastell', folder: 'oljapastell' },
  akvarell: { id: 'akvarell', label: 'Akvarell', folder: 'akvarell' },
  digitalt: { id: 'digital', label: 'Digitalt', folder: 'digitalt' }
};

const emptyMessage = 'Just nu är det tomt här, men det kommer mer snart!';

// Get image files from a folder via manifest
async function getImagesFromFolder(folderName) {
  try {
    const response = await fetch('/data/portfolio-manifest.json');
    if (!response.ok) return [];
    const manifest = await response.json();
    return manifest[folderName] || [];
  } catch (error) {
    console.error(`Error loading portfolio manifest:`, error);
    return [];
  }
}

// Create an item with just an image preview, fixed size in the grid
function createPieceFigure(imagePath, title, medium) {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'piece';
  item.dataset.title = title;
  item.dataset.medium = medium;
  item.dataset.date = new Date().getFullYear();
  
  const frame = document.createElement('div');
  frame.className = 'piece-frame';
  
  const img = document.createElement('img');
  img.src = imagePath;
  img.alt = title;
  img.loading = 'lazy';
  
  frame.appendChild(img);
  item.appendChild(frame);
  
  return item;
}


// Load portfolio sections
async function loadPortfolioSections() {
  let totalImages = 0;
  
  for (const [key, medium] of Object.entries(portfolioMediums)) {
    const gridId = medium.id + '-masonry';
    const grid = document.getElementById(gridId);
    if (!grid) continue;
    
    const images = await getImagesFromFolder(medium.folder);
    
    if (images.length === 0) {
      // Hide empty sections completely
      const section = grid.closest('section');
      if (section) section.style.display = 'none';
    } else {
      grid.innerHTML = '';
      images.forEach((imagePath) => {
        const fileName = imagePath.split('/').pop().split('.')[0];
        const figure = createPieceFigure(
          imagePath,
          fileName.charAt(0).toUpperCase() + fileName.slice(1),
          medium.label
        );
        grid.appendChild(figure);
      });
      totalImages += images.length;
    }
  }

  // Setup lightbox
  setupLightbox();
}

// Setup lightbox functionality
function setupLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxMeta = document.getElementById('lightboxMeta');
  const lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(item) {
    const img = item.querySelector('img');
    if (lightboxImg) lightboxImg.src = img.src;
    if (lightboxImg) lightboxImg.alt = img.alt;
    if (lightboxTitle) lightboxTitle.textContent = item.dataset.title || '';
    if (lightboxMeta) {
      const meta = [item.dataset.medium, item.dataset.date]
        .filter(Boolean)
        .join(' · ');
      lightboxMeta.textContent = meta;
    }
    lightbox.classList.add('open');
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
  }

  document.addEventListener('click', (e) => {
    const item = e.target.closest('.piece');
    if (item) {
      e.preventDefault();
      openLightbox(item);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const item = e.target.closest('.piece');
      if (item) {
        e.preventDefault();
        openLightbox(item);
      }
    }
  });

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });
}

// Load on page load
document.addEventListener('DOMContentLoaded', loadPortfolioSections);
