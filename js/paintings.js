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
    description: "Två gräsänder sedda uppifrån som visar ett stilla ögonblick av samhörighet på vattnet.",
    size: "60 x 90 cm",
    originalPrice: 3000,
    status: STATUS.SOLD,
  },
  {
    id: "womanInTheSea",
    title: "Woman of the Sea",
    description: "Ett självporträtt i havet målad ur ett hopp om att hitta sig själv igen.",
    size: "60 x 90 cm",
    originalPrice: 2000,
    status: STATUS.FOR_SALE,
  },
  {
    id: "vattenfall",
    title: "Vattenfall",
    description: "Där vattnet möter klippan och tiden står stilla.",
    size: "41 x 33 cm",
    originalPrice: 1000,
    status: STATUS.SOLD,
  },
  {
    id: "solnedgang",
    title: "Havet",
    description: "Himlen smälter samman med havet i ett stilla ögonblick av guld och ro.",
    size: "41 x 33 cm",
    originalPrice: 1000,
    status: STATUS.FOR_SALE,
  },
  {
    id: "sommarstuga",
    title: "Sommarstuga",
    description: "En varm sommardag i Småland och det doftar nästan nyklippt gräs.",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: STATUS.FOR_SALE,
  },
  {
    id: "sommarPaStranden",
    title: "Beach day",
    description: "Sand, sol och den där semesterkänslan som man aldrig vill ska ta slut.",
    size: "42 x 59 cm",
    originalPrice: 1800,
    status: STATUS.FOR_SALE,
  },
  {
    id: "skaViPlockaBlommor",
    title: "Näckrosor",
    description: "En stilla sjö omgiven av vackra näckrosor som en inbjudan att stanna upp lite längre.",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: STATUS.SOLD,
  },
  {
    id: "savannan",
    title: "Dags att gå hem",
    description: "Savannens varma ljus i skymningen när dagen är slut och det är dags att vandra hem.",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: STATUS.FOR_SALE,
  },
  {
    id: "varkansla",
    title: "Vårkänsla",
    description: "En trött blåmes som vilar bland körsbärsblommor våren är här, äntligen.",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: STATUS.SOLD,
  },
  {
    id: "norrsken",
    title: "Norrsken",
    description: "Ljuset dansar bakom bergen i en natt som känns som ett under.",
    size: "41 x 33 cm",
    originalPrice: 1000,
    status: STATUS.FOR_SALE,
  },
  {
    id: "vargen",
    title: "Två sidor av samma mynt",
    description: "Vargen både vild och sårbar på en gång. En påminnelse om att styrka och mjukhet kan leva sida vid sida.",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: STATUS.FOR_SALE,
  },
  {
    id: "radjur",
    title: "Savannan",
    description: "Antiloper i lugnt bete som visar livet på savannen i sin enklaste, vackraste form.",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: STATUS.FOR_SALE,
  },
  {
    id: "skogsvila",
    title: "Skogsvila",
    description: "Två rävar som myser tryggt inne i en gammal trädöppning, en plats där de kan vila och känna sig säkra.",
    size: "90 cm",
    originalPrice: 3000,
    status: STATUS.FOR_SALE,
  },
  {
    id: "brollopspresent",
    title: "Bröllop",
    description: "En handmålad present till Herr och Fru Elfqvist på deras stora dag.",
    size: "42 x 59 cm",
    status: STATUS.PERSONAL,
  },
  {
    id: "bonnie",
    title: "Sovven och Bonnie",
    description: "En illustration målad med kärlek som var ett present på ett litet livs första födelsedag.",
    size: "42 x 59 cm",
    status: STATUS.PERSONAL,
  },
  {
    id: "vinterlek",
    title: "Vinterlek",
    description: "Hundarna Shiro och Otis som leker med varandra i snön",
    size: "42 x 59 cm",
    status: STATUS.PERSONAL,
  },
  {
    id: "sommarvila",
    title: "Sommarvila",
    description: "En isbjörnsmamma och hennes ungar vilar mjukt i blomsterhaven vid Hudson Bay som visar en stund av absolut frid.",
    size: "42 x 59 cm",
    originalPrice: 2000,
    status: STATUS.FOR_SALE,
  },
];