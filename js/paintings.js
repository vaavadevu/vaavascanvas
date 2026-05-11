// Status constants
const STATUS = {
  SOLD: "sold",
  FOR_SALE: "for_sale",
};

// Status display text
const STATUS_TEXT = {
  [STATUS.SOLD]: "Såld",
  [STATUS.FOR_SALE]: "TILL SALU",
};

// Shape constants
const SHAPE = {
  RECTANGULAR: "rectangular",
  CIRCLE: "circle"
};

const PRINT_PAINTINGS = ['minMamma', 'efterIde', 'sommarvila'];

const PRINT_SIZES_SQUARE = [
  { label: '30×30 cm', size: '30x30', price: 450 },
  { label: '40×40 cm', size: '40x40', price: 550 },
  { label: '50×50 cm', size: '50x50', price: 650 },
];

const PRINT_SIZES_STANDARD = [
  { label: 'A4', size: 'A4', price: 450 },
  { label: 'A3', size: 'A3', price: 550 },
  { label: 'A2', size: 'A2', price: 650 },
];

// Medium constants
const MEDIUM = {
  ACRYLIC_CANVAS: "medium_acrylic_canvas"
};

// Size constants
const SIZE = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large"
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
  if (!painting.originalPrice || !hasPaintingDiscount(painting)) return painting.originalPrice;
  return Math.round(painting.originalPrice * (100 - painting.discountPercent) / 100);
}

function getPaintingFramedSalePrice(painting) {
  if (!painting.framedPrice) return null;
  if (!hasPaintingDiscount(painting) || !painting.originalPrice) return painting.framedPrice;
  const frameExtra = painting.framedPrice - painting.originalPrice;
  return Math.round(getPaintingDiscountedPrice(painting) + frameExtra);
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

const paintings = [
  {
    id: "herrOchFruAndersson",
    title: "Herr och Fru Andersson",
    descKey: "desc_herrOchFruAndersson",
    width: 90,
    height: 60,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 3200,
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },
  {
    id: "aldrigEnsam",
    title: "Aldrig ensam",
    descKey: "desc_aldrigEnsam",
    width: 18,
    height: 24,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 700,
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },

  {
    id: "operationBaver",
    title: "Operation bäver",
    descKey: "desc_operationBaver",
    width: 18,
    height: 24,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 700,
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },
  {
    id: "koslapp",
    title: "Kosläpp",
    descKey: "desc_koslapp",
    width: 69,
    height: 58,
    shape: SHAPE.RECTANGULAR,
    framedPrice: 3600,
    framedOnly: true,
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    frameAvailable: true,
  },
  {
    id: "narhet",
    title: "Närhet",
    descKey: "desc_narhet",
    width: 22,
    height: 16,
    shape: SHAPE.RECTANGULAR,
    framedPrice: 2600,
    framedOnly: true,
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    frameAvailable: true,
  },
  {
    id: "tjuvsmak",
    title: "Tjuvsmak",
    descKey: "desc_tjuvsmak",
    width: 18,
    height: 24,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 700,
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },
  {
    id: "maskrosdrom",
    title: "Maskrosdröm",
    descKey: "desc_maskrosdrom",
    width: 24,
    height: 18,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 700,
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },
  {
    id: "vattenfall",
    title: "Vattenfall",
    descKey: "desc_vattenfall",
    width: 33,
    height: 41,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1100,
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },
  {
  id: "minMamma",
  title: "Min mamma",
  descKey: "desc_minMamma",
  width: 34,
  height: 34,
  shape: SHAPE.SQUARE,
  originalPrice: 1600,
  framedPrice: 1900,
  status: STATUS.FOR_SALE,
  medium: MEDIUM.ACRYLIC_CANVAS,
  frameAvailable: true,
},
  {
    id: "solnedgang",
    title: "Havet",
    descKey: "desc_solnedgang",
    width: 41,
    height: 33,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1100,
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },
  {
    id: "solvarmeISkogen",
    title: "Solvärme i skogen",
    descKey: "desc_solvarmeISkogen",
    width: 42,
    height: 59,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1900,
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },
  {
  id: "efterIde",
  title: "Efter Ide",
  descKey: "desc_efterIde",
  width: 40,
  height: 40,
  shape: SHAPE.SQUARE,
  originalPrice: 2300,
  framedPrice: 2600,
  status: STATUS.FOR_SALE,
  medium: MEDIUM.ACRYLIC_CANVAS,
  frameAvailable: true,
},
  {
    id: "sommarstuga",
    title: "Sommarstuga",
    descKey: "desc_sommarstuga",
    width: 59,
    height: 42,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1600,
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },
  {
    id: "sommarPaStranden",
    title: "Beach day",
    descKey: "desc_sommarPaStranden",
    width: 42,
    height: 59,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1900,
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },
  {
    id: "skaViPlockaBlommor",
    title: "Näckrosor",
    descKey: "desc_skaViPlockaBlommor",
    width: 42,
    height: 59,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1600,
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },
  {
    id: "savannan",
    title: "Dags att gå hem",
    descKey: "desc_savannan",
    width: 42,
    height: 59,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1600,
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },
  {
    id: "varkansla",
    title: "Vårkänsla",
    descKey: "desc_varkansla",
    width: 59,
    height: 42,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1600,
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },
  {
    id: "norrsken",
    title: "Norrsken",
    descKey: "desc_norrsken",
    width: 41,
    height: 33,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1100,
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },
  {
    id: "vargen",
    title: "Två sidor av samma mynt",
    descKey: "desc_vargen",
    width: 42,
    height: 59,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1600,
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },
  {
    id: "radjur",
    title: "Savannan",
    descKey: "desc_radjur",
    width: 90,
    height: 30,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1600,
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },
  {
    id: "skogsvila",
    title: "Skogsvila",
    descKey: "desc_skogsvila",
    diameter: 90,
    shape: SHAPE.CIRCLE,
    originalPrice: 3100,
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },
  {
    id: "vinterlek",
    title: "Vinterlek",
    descKey: "desc_vinterlek",
    width: 42,
    height: 59,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1600,
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },
  {
    id: "sommarvila",
    title: "Sommarvila",
    descKey: "desc_sommarvila",
    width: 42,
    height: 59,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 2100,
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
  },
  {
    id: "dagensFynd",
    title: "Dagens fynd",
    descKey: "desc_dagensFynd",
    width: 34,
    height: 34,
    shape: SHAPE.SQUARE,
    originalPrice: 2000,
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    frameAvailable: true,
    framedPrice: 2300,
  },
  
  {
    id: "sugenPaEttApple",
    title: "Sugen på ett äpple",
    descKey: "desc_sugenPaEttApple",
    width: 30,
    height: 30,
    shape: SHAPE.SQUARE,
    originalPrice: 1900,
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    frameAvailable: true,
    framedPrice: 2200,
  },
  {
  id: "varlek",
  title: "Vårlek",
  descKey: "desc_varlek",
  width: 40,
  height: 40,
  shape: SHAPE.SQUARE,
  originalPrice: 2300,
  framedPrice: 2600,
  status: STATUS.FOR_SALE,
  medium: MEDIUM.ACRYLIC_CANVAS,
  frameAvailable: true,
},
];
