// Status constants
const STATUS = {
  SOLD: "sold",
  FOR_SALE: "for_sale",
  PERSONAL: "personal"
};

// Status display text
const STATUS_TEXT = {
  [STATUS.SOLD]: "Såld",
  [STATUS.FOR_SALE]: "TILL SALU",
  [STATUS.PERSONAL]: "Personlig målning – ej till salu"
};

// Shape constants
const SHAPE = {
  RECTANGULAR: "rectangular",
  CIRCLE: "circle"
};

// Medium constants
const MEDIUM = {
  ACRYLIC_CANVAS: "medium_acrylic_canvas",
  WATERCOLOR_PAPER_LAMINATED: "medium_watercolor_paper_laminated"
};

// Size constants
const SIZE = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large"
};

const TYPE = {
  PAINTING: "painting",
  CLAY: "clay",
  BOOKMARK: "bookmark"
};

// Helper function to get painting size category based on max dimension
function getPaintingSize(painting) {
  const maxDim = Math.max(
    painting.width || painting.diameter || 0,
    painting.height || 0
  );
  if (maxDim < 40) return SIZE.SMALL;
  if (maxDim < 60) return SIZE.MEDIUM;
  return SIZE.LARGE;
}

function hasPaintingDiscount(painting) {
  return typeof painting.discountPercent === 'number' && painting.discountPercent > 0 && painting.discountPercent < 100;
}

function getPaintingDiscountedPrice(painting) {
  const basePrice = painting.originalPrice ?? painting.framedPrice;
  if (!basePrice || !hasPaintingDiscount(painting)) return painting.originalPrice ?? painting.framedPrice;
  return Math.round(basePrice * (100 - painting.discountPercent) / 100);
}

function getPaintingFramedSalePrice(painting) {
  if (!painting.framedPrice) return null;
  if (!hasPaintingDiscount(painting)) return painting.framedPrice;
  if (painting.originalPrice) {
    const frameExtra = painting.framedPrice - painting.originalPrice;
    return Math.round(getPaintingDiscountedPrice(painting) + frameExtra);
  }
  return getPaintingDiscountedPrice(painting);
}

function getPaintingEffectivePrice(painting, withFrame = false) {
  if (painting.framedOnly) {
    return getPaintingFramedSalePrice(painting) ?? painting.framedPrice;
  }
  if (withFrame) {
    return getPaintingFramedSalePrice(painting) ?? getPaintingDiscountedPrice(painting);
  }
  return getPaintingDiscountedPrice(painting);
}

// What the product page should show in its price section, worked out without
// touching the DOM so tests/painting-model.js can check it directly:
//
//   sold / personal — a status line instead of a price
//   priced          — `price`, plus `oldPrice` and `discountPercent` when the
//                     piece is discounted, otherwise both null
//   none            — nothing to show (no price on record)
function getPriceModel(painting) {
  if (painting.status === STATUS.SOLD) return { status: 'sold' };
  if (painting.status === STATUS.PERSONAL) return { status: 'personal' };

  const priced = (price, discounted, oldPrice) => ({
    status: 'priced',
    price,
    oldPrice: discounted ? oldPrice : null,
    discountPercent: discounted ? painting.discountPercent : null,
  });

  if (painting.framedOnly && painting.framedPrice) {
    // A framedOnly painting carries no originalPrice (enforced by
    // tests/validate.js), so its framed price is the one the discount comes
    // off and the one that gets struck through — the same pair the gallery
    // tile shows via getGalleryPriceHtml()
    return priced(
      getPaintingFramedSalePrice(painting) || painting.framedPrice,
      hasPaintingDiscount(painting),
      painting.framedPrice,
    );
  }

  if (painting.originalPrice) {
    return priced(getPaintingDiscountedPrice(painting), hasPaintingDiscount(painting), painting.originalPrice);
  }

  return { status: 'none' };
}

// ── Physical size ─────────────────────────────────────────────

// Surface area in cm², or null when the piece records no measurements
function paintingArea(painting) {
  if (painting.shape === SHAPE.RECTANGULAR && painting.width && painting.height) {
    return painting.width * painting.height;
  }
  if (painting.shape === SHAPE.CIRCLE && painting.diameter) {
    const radius = painting.diameter / 2;
    return Math.PI * radius * radius;
  }
  return null;
}

// Spreads the catalog across a ±20% scale by area, so bigger canvases read as
// bigger on screen. Pieces without measurements sit at 1, and a catalog whose
// pieces are all one size lands in the middle rather than dividing by zero.
function assignSizeScales(list) {
  const areas = list.map(paintingArea).filter(a => a !== null);
  if (areas.length === 0) return list;

  const minArea = Math.min(...areas);
  const areaRange = Math.max(...areas) - minArea;

  list.forEach(p => {
    const area = paintingArea(p);
    if (area === null) {
      p.sizeScale = 1;
      return;
    }
    const normalized = areaRange > 0 ? (area - minArea) / areaRange : 0.5;
    p.sizeScale = 1 + (normalized - 0.5) * 0.4;
  });

  return list;
}

// ── Gallery sort orders ───────────────────────────────────────

// The orders the shop lets a buyer choose between. GALLERY_SORT.DEFAULT is the
// curated arrangement gallery.js builds itself (for sale first, biggest
// discounts on top); the rest are ranked on one measurable key.
const GALLERY_SORT = {
  DEFAULT: "sort_default",
  PRICE_ASC: "sort_price_asc",
  PRICE_DESC: "sort_price_desc",
  SIZE_ASC: "sort_size_asc",
  SIZE_DESC: "sort_size_desc",
};

// What the piece costs today, or null when it carries no price at all
function paintingSortPrice(painting) {
  const price = getPaintingEffectivePrice(painting);
  return typeof price === "number" && price > 0 ? price : null;
}

const GALLERY_SORT_KEYS = {
  [GALLERY_SORT.PRICE_ASC]:  { valueOf: paintingSortPrice, direction: 1 },
  [GALLERY_SORT.PRICE_DESC]: { valueOf: paintingSortPrice, direction: -1 },
  [GALLERY_SORT.SIZE_ASC]:   { valueOf: paintingArea, direction: 1 },
  [GALLERY_SORT.SIZE_DESC]:  { valueOf: paintingArea, direction: -1 },
};

// Comparator for one of the chosen orders, or null for GALLERY_SORT.DEFAULT
// and anything unrecognised, which leaves the curated order in charge.
//
// Two rules hold whichever key is picked: sold pieces stay behind available
// ones so the shop leads with what can be bought, and a piece the key cannot
// measure — no price, no dimensions — sinks below the ones it can, instead of
// landing at an arbitrary end of the run.
function comparePaintingsBy(order) {
  const key = GALLERY_SORT_KEYS[order];
  if (!key) return null;

  const soldRank = p => (p.status === STATUS.SOLD ? 1 : 0);

  return (a, b) => {
    const soldDiff = soldRank(a) - soldRank(b);
    if (soldDiff !== 0) return soldDiff;

    const valueA = key.valueOf(a);
    const valueB = key.valueOf(b);
    if (valueA === null || valueB === null) {
      if (valueA === valueB) return compareByGalleryOrder(a, b);
      return valueA === null ? 1 : -1;
    }

    if (valueA !== valueB) return (valueA - valueB) * key.direction;
    return compareByGalleryOrder(a, b);
  };
}

// Equal prices and equal areas are common, so ties fall back on the shuffled
// order the page assigned — the same arrangement the default sort uses, which
// keeps the grid from reshuffling every time an order is picked
function compareByGalleryOrder(a, b) {
  return (a._randomGalleryOrder || 0) - (b._randomGalleryOrder || 0);
}

const paintings = [
  {
    id: "herrOchFruAndersson",
    title: "Herr och Fru Andersson",
    descKey: "desc_herrOchFruAndersson",
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 90,
    height: 60,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 3200
  },
  {
    id: "aldrigEnsam",
    title: "Aldrig ensam",
    descKey: "desc_aldrigEnsam",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 18,
    height: 24,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 600
  },
  {
    id: "operationBaver",
    title: "Operation bäver",
    descKey: "desc_operationBaver",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 18,
    height: 24,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 600
  },
  {
    id: "skymningsDrom",
    title: "Skymningsdröm",
    descKey: "desc_skymningsDrom",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 30,
    height: 90,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 2000
  },
  {
    id: "koslapp",
    title: "Kosläpp",
    descKey: "desc_koslapp",
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 69,
    height: 58,
    shape: SHAPE.RECTANGULAR,
    framedPrice: 3500,
    framedOnly: true,
    frameAvailable: true
  },
  {
    id: "narhet",
    title: "Närhet",
    descKey: "desc_narhet",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 22,
    height: 16,
    shape: SHAPE.RECTANGULAR,
    framedPrice: 2500,
    framedOnly: true,
    frameAvailable: true
  },
  {
    id: "tjuvsmak",
    title: "Tjuvsmak",
    descKey: "desc_tjuvsmak",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 18,
    height: 24,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 600
  },
  {
    id: "maskrosdrom",
    title: "Maskrosdröm",
    descKey: "desc_maskrosdrom",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 24,
    height: 18,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 600
  },
  {
    id: "frihet",
    title: "Frihet",
    descKey: "desc_frihet",
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 18,
    height: 24,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 600
  },
  {
    id: "lodjur",
    title: "Lodjur",
    descKey: "desc_lodjur",
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 18,
    height: 24,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 600
  },
  {
    id: "kattuggla",
    title: "Kattuggla",
    descKey: "desc_kattuggla",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 18,
    height: 24,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 600
  },
  {
    id: "tropisktBad",
    title: "Tropiskt bad",
    descKey: "desc_tropisktBad",
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 18,
    height: 24,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 600
  },
  {
    id: "busungen",
    title: "Busungen",
    descKey: "desc_busungen",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 18,
    height: 24,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 600
  },
  {
    id: "breadwinner",
    title: "Breadwinner",
    descKey: "desc_breadwinner",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 18,
    height: 24,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 600
  },
  {
    id: "minMamma",
    title: "Min mamma",
    descKey: "desc_minMamma",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 34,
    height: 34,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1500,
    framedPrice: 1800,
    frameAvailable: true
  },
  {
    id: "solvarmeISkogen",
    title: "Solvärme i skogen",
    descKey: "desc_solvarmeISkogen",
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 42,
    height: 59,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1500
  },
  {
    id: "underHennesVingar",
    title: "Under hennes vingar",
    descKey: "desc_underHennesVingar",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 59,
    height: 42,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1800
  },
  {
    id: "vidAn",
    title: "Vid Ån",
    descKey: "desc_vidAn",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 42,
    height: 59,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1500
  },
  {
    id: "enLerigDrom",
    title: "En lerig dröm",
    descKey: "desc_enLerigDrom",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 59,
    height: 42,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1800
  },
  {
    id: "efterIde",
    title: "Efter Ide",
    descKey: "desc_efterIde",
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 40,
    height: 40,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1500,
    framedPrice: 1800,
    frameAvailable: true
  },
  {
    id: "sommarstuga",
    title: "Sommarstuga",
    descKey: "desc_sommarstuga",
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 59,
    height: 42,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1500
  },
  {
    id: "sommarPaStranden",
    title: "Beach day",
    descKey: "desc_sommarPaStranden",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 42,
    height: 59,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1500
  },
  {
    id: "skaViPlockaBlommor",
    title: "Näckrosor",
    descKey: "desc_skaViPlockaBlommor",
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 42,
    height: 59,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1500
  },
  {
    id: "varkansla",
    title: "Vårkänsla",
    descKey: "desc_varkansla",
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 59,
    height: 42,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1500
  },
  {
    id: "vargen",
    title: "Två sidor av samma mynt",
    descKey: "desc_vargen",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 42,
    height: 59,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1800
  },
  {
    id: "skogsvila",
    title: "Skogsvila",
    descKey: "desc_skogsvila",
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
    diameter: 90,
    shape: SHAPE.CIRCLE,
    originalPrice: 3000
  },
  {
    id: "vinterlek",
    title: "Vinterlek",
    descKey: "desc_vinterlek",
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 42,
    height: 59,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1800
  },
  {
    id: "sommarvila",
    title: "Sommarvila",
    descKey: "desc_sommarvila",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 42,
    height: 59,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1800
  },
  {
    id: "dagensFynd",
    title: "Dagens fynd",
    descKey: "desc_dagensFynd",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 34,
    height: 34,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1200,
    framedPrice: 2100,
    frameAvailable: true
  },
  {
    id: "sugenPaEttApple",
    title: "Sugen på ett äpple",
    descKey: "desc_sugenPaEttApple",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 30,
    height: 30,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1800,
    framedPrice: 2000,
    frameAvailable: true
  },
  {
    id: "varlek",
    title: "Vårlek",
    descKey: "desc_varlek",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 40,
    height: 40,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1600,
    framedPrice: 1900,
    frameAvailable: true
  },
  {
    id: "bookmarks",
    title: "Bokmärken",
    descKey: "desc_bookmarks",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.WATERCOLOR_PAPER_LAMINATED,
    width: 5,
    height: 15,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 120,
    type: TYPE.BOOKMARK,
    multiBuyPrice: 100,
    multiBuyMinQuantity: 2,
    soldVariants: [
      "/images/bookmarks/cheetah.jpg",
      "/images/bookmarks/chicken1.jpg",
      "/images/bookmarks/giraffe.jpg",
      "/images/bookmarks/pigeon.jpg",
      "/images/bookmarks/pingvin.jpg",
      "/images/bookmarks/rabbit.jpg"
    ],
    images: {
      desktop: [
        "/images/bookmarks/cover.jpg",
        "/images/bookmarks/cheetah.jpg",
        "/images/bookmarks/chicken1.jpg",
        "/images/bookmarks/chicken2.jpg",
        "/images/bookmarks/giraffe.jpg",
        "/images/bookmarks/mallard.jpg",
        "/images/bookmarks/pigeon.jpg",
        "/images/bookmarks/piggy.jpg",
        "/images/bookmarks/pingvin.jpg",
        "/images/bookmarks/rabbit.jpg",
        "/images/bookmarks/wilddog.jpg"
      ],
      mobile: [
        "/images/bookmarks/cover.jpg",
        "/images/bookmarks/cheetah.jpg",
        "/images/bookmarks/chicken1.jpg",
        "/images/bookmarks/chicken2.jpg",
        "/images/bookmarks/giraffe.jpg",
        "/images/bookmarks/mallard.jpg",
        "/images/bookmarks/pigeon.jpg",
        "/images/bookmarks/piggy.jpg",
        "/images/bookmarks/pingvin.jpg",
        "/images/bookmarks/rabbit.jpg",
        "/images/bookmarks/wilddog.jpg"
      ]
    }
  },
  {
    id: "foreStormen",
    title: "Före stormen",
    descKey: "desc_foreStormen",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 42,
    height: 59,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1600
  },
  {
    id: "photobomb",
    title: "Photobomb",
    descKey: "desc_photobomb",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 59,
    height: 42,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1600
  },
];

// ── Node export tail (ignored by the browser) ─────────────────
//
// Lets tests/painting-model.js and tests/checkout.js require the real catalog
// and pricing helpers instead of extracting them from this file's source.

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STATUS, STATUS_TEXT, SHAPE, MEDIUM, SIZE, TYPE,
    paintings,
    getPaintingSize,
    hasPaintingDiscount,
    getPaintingDiscountedPrice,
    getPaintingFramedSalePrice,
    getPaintingEffectivePrice,
    getPriceModel,
    paintingArea,
    assignSizeScales,
    GALLERY_SORT,
    paintingSortPrice,
    comparePaintingsBy,
  };
}
