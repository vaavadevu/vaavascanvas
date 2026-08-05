// shop-data.js — separate shop product data for clay and bookmarks

const SHOP_ITEMS = [
  {
    id: "handgjordKeramik",
    title: "Handgjord keramik",
    descKey: "desc_handgjordKeramik",
    status: STATUS.FOR_SALE,
    type: TYPE.CLAY,
    width: 12,
    height: 12,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 450,
    images: {
      desktop: ["/images/devika.jpg"],
      mobile: ["/images/devika.jpg"]
    }
  },
  {
    id: "blommigtBokmarke",
    title: "Blommigt bokmärke",
    descKey: "desc_blommigtBokmarke",
    status: STATUS.FOR_SALE,
    type: TYPE.BOOKMARK,
    width: 5,
    height: 15,
    shape: SHAPE.RECTANGULAR,
    originalPrice: 120,
    images: {
      desktop: ["/images/devika.jpg"],
      mobile: ["/images/devika.jpg"]
    }
  }
];
