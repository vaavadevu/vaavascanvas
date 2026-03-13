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

const paintings = [
  {
    id: "herrOchFruAndersson",
    title: "Herr och Fru Andersson",
    descKey: "desc_herrOchFruAndersson",
    size: "60 x 90 cm",
    originalPrice: 3000,
    status: STATUS.SOLD,
  },
  {
    id: "womanInTheSea",
    title: "Woman of the Sea",
    descKey: "desc_womanInTheSea",
    size: "60 x 90 cm",
    originalPrice: 2000,
    status: STATUS.FOR_SALE,
  },
  {
    id: "vattenfall",
    title: "Vattenfall",
    descKey: "desc_vattenfall",
    size: "41 x 33 cm",
    originalPrice: 1000,
    status: STATUS.SOLD,
  },
  {
    id: "solnedgang",
    title: "Havet",
    descKey: "desc_solnedgang",
    size: "41 x 33 cm",
    originalPrice: 1000,
    status: STATUS.FOR_SALE,
  },
  {
    id: "sommarstuga",
    title: "Sommarstuga",
    descKey: "desc_sommarstuga",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: STATUS.FOR_SALE,
  },
  {
    id: "sommarPaStranden",
    title: "Beach day",
    descKey: "desc_sommarPaStranden",
    size: "42 x 59 cm",
    originalPrice: 1800,
    status: STATUS.FOR_SALE,
  },
  {
    id: "skaViPlockaBlommor",
    title: "Näckrosor",
    descKey: "desc_skaViPlockaBlommor",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: STATUS.SOLD,
  },
  {
    id: "savannan",
    title: "Dags att gå hem",
    descKey: "desc_savannan",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: STATUS.FOR_SALE,
  },
  {
    id: "varkansla",
    title: "Vårkänsla",
    descKey: "desc_varkansla",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: STATUS.SOLD,
  },
  {
    id: "norrsken",
    title: "Norrsken",
    descKey: "desc_norrsken",
    size: "41 x 33 cm",
    originalPrice: 1000,
    status: STATUS.FOR_SALE,
  },
  {
    id: "vargen",
    title: "Två sidor av samma mynt",
    descKey: "desc_vargen",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: STATUS.FOR_SALE,
  },
  {
    id: "radjur",
    title: "Savannan",
    descKey: "desc_radjur",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: STATUS.FOR_SALE,
  },
  {
    id: "skogsvila",
    title: "Skogsvila",
    descKey: "desc_skogsvila",
    size: "90 cm",
    originalPrice: 3000,
    status: STATUS.FOR_SALE,
  },
  {
    id: "brollopspresent",
    title: "Bröllop",
    descKey: "desc_brollopspresent",
    size: "42 x 59 cm",
    status: STATUS.PERSONAL,
  },
  {
    id: "bonnie",
    title: "Sovven och Bonnie",
    descKey: "desc_bonnie",
    size: "42 x 59 cm",
    status: STATUS.PERSONAL,
  },
  {
    id: "vinterlek",
    title: "Vinterlek",
    descKey: "desc_vinterlek",
    size: "42 x 59 cm",
    status: STATUS.PERSONAL,
  },
  {
    id: "sommarvila",
    title: "Sommarvila",
    descKey: "desc_sommarvila",
    size: "42 x 59 cm",
    originalPrice: 2000,
    status: STATUS.FOR_SALE,
  },
];