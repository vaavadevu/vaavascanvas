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
    originalPrice: 500
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
    originalPrice: 500
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
    status: STATUS.FOR_SALE,
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
    originalPrice: 500
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
    originalPrice: 500
  },
  {
    id: "Frihet",
    title: "Frihet",
    descKey: "desc_frihet",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 18,
    height: 24,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 500
  },
  {
    id: "tropisktBad",
    title: "Tropiskt bad",
    descKey: "desc_tropisktBad",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 18,
    height: 24,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 500
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
    originalPrice: 500
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
    originalPrice: 500
  },
  {
    id: "vattenfall",
    title: "Vattenfall",
    descKey: "desc_vattenfall",
    status: STATUS.SOLD,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 33,
    height: 41,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 1100
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
    status: STATUS.FOR_SALE,
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
    id: "savannan",
    title: "Dags att gå hem",
    descKey: "desc_savannan",
    status: STATUS.FOR_SALE,
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
    originalPrice: 1600
  },
  {
    id: "skogsvila",
    title: "Skogsvila",
    descKey: "desc_skogsvila",
    status: STATUS.FOR_SALE,
    medium: MEDIUM.ACRYLIC_CANVAS,
    diameter: 90,
    shape: SHAPE.CIRCLE,
    originalPrice: 2500
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
    originalPrice: 1600
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
    originalPrice: 1500
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
    originalPrice: 1800,
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
    id: "bonnie",
    title: "Bonnie",
    descKey: "desc_bonnie",
    status: STATUS.PERSONAL,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 30,
    height: 40,
    shape: SHAPE.RECTANGULAR
  },
  {
    id: "brollopspresent",
    title: "Bröllopspresent",
    descKey: "desc_brollopspresent",
    status: STATUS.PERSONAL,
    medium: MEDIUM.ACRYLIC_CANVAS,
    width: 43,
    height: 30,
    shape: SHAPE.RECTANGULAR
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
    originalPrice: 1500,
    framedPrice: 1900,
    frameAvailable: true
  },
];
