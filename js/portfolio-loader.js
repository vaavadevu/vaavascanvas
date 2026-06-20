// Portfolio Dynamic Loader
const portfolioMediums = {
  akryl: { id: 'acrylic', label: 'Akryl', folder: 'akryl' },
  oljapastell: { id: 'oilpastel', label: 'Oljepastell', folder: 'oljapastell' },
  digitalt: { id: 'digital', label: 'Digitalt', folder: 'digitalt' },
  akvarell: { id: 'watercolor', label: 'Akvarell', folder: 'akvarell' }
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

// Create a figure element for an image
function createPieceFigure(imagePath, title, medium) {
  const figure = document.createElement('figure');
  figure.className = 'piece';
  figure.tabIndex = 0;
  figure.dataset.title = title;
  figure.dataset.medium = medium;
  figure.dataset.date = new Date().getFullYear();
  
  const frameDiv = document.createElement('div');
  frameDiv.className = 'piece-frame';
  
  const img = document.createElement('img');
  img.src = imagePath;
  img.alt = title;
  img.loading = 'lazy';
  
  frameDiv.appendChild(img);
  
  const figcaption = document.createElement('figcaption');
  figcaption.className = 'piece-caption';
  
  const titleSpan = document.createElement('span');
  titleSpan.className = 'piece-title';
  titleSpan.textContent = title;
  
  const metaSpan = document.createElement('span');
  metaSpan.className = 'piece-meta';
  metaSpan.textContent = medium;
  
  figcaption.appendChild(titleSpan);
  figcaption.appendChild(metaSpan);
  
  figure.appendChild(frameDiv);
  figure.appendChild(figcaption);
  
  return figure;
}

// Load portfolio sections
async function loadPortfolioSections() {
  let totalImages = 0;
  
  for (const [key, medium] of Object.entries(portfolioMediums)) {
    const section = document.getElementById(medium.id);
    if (!section) continue;
    
    const masonry = section.querySelector('.masonry');
    if (!masonry) continue;
    
    const images = await getImagesFromFolder(medium.folder);
    
    if (images.length === 0) {
      masonry.innerHTML = `<p class="portfolio-empty">${emptyMessage}</p>`;
    } else {
      masonry.innerHTML = '';
      images.forEach((imagePath, index) => {
        const fileName = imagePath.split('/').pop().split('.')[0];
        const figure = createPieceFigure(
          imagePath,
          fileName.charAt(0).toUpperCase() + fileName.slice(1),
          medium.label
        );
        masonry.appendChild(figure);
      });
      totalImages += images.length;
    }
    
    // Update count
    const tallySpan = section.querySelector('.tally');
    if (tallySpan) {
      tallySpan.textContent = `${images.length} ${images.length === 1 ? 'verk' : 'verk'}`;
    }
  }
  
  // Update total count in nav
  const allTab = document.querySelector('[data-target="all"]');
  if (allTab) {
    const countSpan = allTab.querySelector('.count');
    if (countSpan) countSpan.textContent = totalImages;
  }
}

// Load on page load
document.addEventListener('DOMContentLoaded', loadPortfolioSections);
