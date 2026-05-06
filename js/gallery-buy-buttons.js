// ============================================================
// HUR DU LÄGGER TILL KÖPKNAPPAR I DIN BEFINTLIGA GALLERY
// ============================================================
//
// 1. Hitta i din gallery.js där du renderar varje målning-kort.
//    Det bör finnas något som skapar ett kort med titel och pris.
//    Lägg till denna funktion och anropa den i kort-renderingen.
//
// 2. Kopiera denna funktion till din gallery.js:

function createBuyButton(painting) {
  if (painting.status === 'sold') {
    return `<button class="btn-add-to-cart sold" disabled>Såld</button>`;
  }
  if (painting.status === 'personal') {
    return '';
  }

  const imageUrl = `https://vaavascanvas.se/images/paintings/${painting.id}/desktop/01.jpg`;

  return `
    <button
      class="btn-add-to-cart"
      onclick="Cart.add({
        id: '${painting.id}',
        title: '${painting.title.replace(/'/g, "\\'")}',
        type: 'original',
        price: ${painting.originalPrice},
        image: '${imageUrl}'
      })"
    >
      🛍 Lägg i varukorg – ${painting.originalPrice.toLocaleString('sv-SE')} kr
    </button>
  `;
}

// ============================================================
// 3. I varje paintings-kort, lägg till:
//    ${createBuyButton(painting)}
// ============================================================

// ============================================================
// PRINTS – köpknapp med storleksval
// ============================================================

const PRINT_SIZES = {
  square: [
    { label: '30×30 cm', size: '30x30', price: 450 },
    { label: '40×40 cm', size: '40x40', price: 550 },
    { label: '50×50 cm', size: '50x50', price: 650 },
  ],
  standard: [
    { label: 'A4', size: 'A4', price: 450 },
    { label: 'A3', size: 'A3', price: 550 },
    { label: 'A2', size: 'A2', price: 650 },
  ],
};

// Vilka målningar som finns som prints (lägg till fler här)
const PRINT_PAINTINGS = ['minMamma', 'efterIde', 'sommarvila'];

function createPrintButton(painting) {
  if (!PRINT_PAINTINGS.includes(painting.id)) return '';

  const isSquare = painting.shape === 'square' || painting.shape === 'SQUARE';
  const sizes = isSquare ? PRINT_SIZES.square : PRINT_SIZES.standard;
  const defaultSize = sizes[0];
  const imageUrl = `https://vaavascanvas.se/images/paintings/${painting.id}/desktop/01.jpg`;

  return `
    <div class="print-option">
      <select class="print-size-select" id="print-size-${painting.id}">
        ${sizes.map(s => `<option value="${s.size}" data-price="${s.price}">${s.label} – ${s.price} kr</option>`).join('')}
      </select>
      <button
        class="btn-add-to-cart"
        onclick="
          const sel = document.getElementById('print-size-${painting.id}');
          const opt = sel.options[sel.selectedIndex];
          Cart.add({
            id: '${painting.id}-print',
            title: '${painting.title.replace(/'/g, "\\'")}',
            type: 'print',
            size: opt.value,
            price: parseInt(opt.dataset.price),
            image: '${imageUrl}'
          });
        "
      >
        🖼 Köp print
      </button>
    </div>
  `;
}
