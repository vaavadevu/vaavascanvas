#!/usr/bin/env node

/**
 * Painting model unit tests for Vaavascanvas
 *
 * js/paintings.js is the catalog plus the rules derived from it: what a piece
 * costs, what size bracket it falls in, what the product page should show in
 * its price section, and how big it should render relative to the others.
 *
 * Those rules used to be spelled out inline in page-view.js and gallery.js
 * where nothing could reach them. They are called directly here.
 */

const {
  STATUS, SHAPE, SIZE,
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
} = require('../js/paintings.js');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m'
};

const log = {
  error: (msg) => console.error(`${colors.red}✗ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
};

let errorCount = 0;
let testCount = 0;

function test(name, fn) {
  testCount++;
  try {
    fn();
    log.success(name);
  } catch (err) {
    log.error(`${name}\n  ${err.message}`);
    errorCount++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
}

function assertClose(actual, expected, message, tolerance = 1e-9) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

const rect = (width, height, extra = {}) => ({ shape: SHAPE.RECTANGULAR, width, height, ...extra });
const circle = (diameter, extra = {}) => ({ shape: SHAPE.CIRCLE, diameter, ...extra });

console.log('\n' + colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset);
console.log(colors.blue + 'VAAVASCANVAS PAINTING MODEL UNIT TESTS' + colors.reset);
console.log(colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset + '\n');

// ─────────────────────────────────────────────────────────────
// SUITE 1: Size brackets
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '[1] SIZE BRACKETS' + colors.reset);

test('The size bracket follows the longest edge', () => {
  assertEqual(getPaintingSize(rect(18, 24)), SIZE.SMALL, '24 cm should be small');
  assertEqual(getPaintingSize(rect(90, 30)), SIZE.LARGE, '90 cm should be large');
});

test('The size brackets change exactly on their boundaries', () => {
  // small < 40 <= medium < 60 <= large
  assertEqual(getPaintingSize(rect(10, 39)), SIZE.SMALL, '39 cm should still be small');
  assertEqual(getPaintingSize(rect(10, 40)), SIZE.MEDIUM, '40 cm should be medium');
  assertEqual(getPaintingSize(rect(10, 59)), SIZE.MEDIUM, '59 cm should still be medium');
  assertEqual(getPaintingSize(rect(10, 60)), SIZE.LARGE, '60 cm should be large');
});

test('A round piece is bracketed by its diameter', () => {
  assertEqual(getPaintingSize(circle(30)), SIZE.SMALL, 'A 30 cm circle should be small');
  assertEqual(getPaintingSize(circle(70)), SIZE.LARGE, 'A 70 cm circle should be large');
});

// ─────────────────────────────────────────────────────────────
// SUITE 2: Area and display scale
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[2] AREA AND DISPLAY SCALE' + colors.reset);

test('A rectangle measures width times height', () => {
  assertEqual(paintingArea(rect(20, 30)), 600, 'Wrong rectangular area');
});

test('A circle measures pi r squared', () => {
  assertClose(paintingArea(circle(10)), Math.PI * 25, 'Wrong circular area');
});

test('A piece without measurements has no area', () => {
  assertEqual(paintingArea({ shape: SHAPE.RECTANGULAR, width: 20 }), null, 'A missing height means no area');
  assertEqual(paintingArea({ shape: SHAPE.CIRCLE }), null, 'A missing diameter means no area');
  assertEqual(paintingArea({}), null, 'A shapeless piece has no area');
});

test('The smallest and largest pieces land at the ends of the scale', () => {
  const list = [rect(10, 10), rect(50, 50), rect(100, 100)];
  assignSizeScales(list);

  assertClose(list[0].sizeScale, 0.8, 'The smallest piece should sit at the bottom of the range');
  assertClose(list[2].sizeScale, 1.2, 'The largest piece should sit at the top of the range');
  assert(list[1].sizeScale > 0.8 && list[1].sizeScale < 1.2,
    'A middling piece should land between the two ends');
});

test('A catalog of one size lands in the middle instead of dividing by zero', () => {
  const list = [rect(20, 20), rect(20, 20)];
  assignSizeScales(list);

  list.forEach(p => assertEqual(p.sizeScale, 1, 'Identically sized pieces should all scale to 1'));
});

test('Pieces without measurements scale to 1', () => {
  const list = [rect(10, 10), { id: 'no-dimensions' }, rect(100, 100)];
  assignSizeScales(list);

  assertEqual(list[1].sizeScale, 1, 'An unmeasured piece should render at its natural size');
});

test('A catalog with nothing measurable is left alone', () => {
  const list = [{ id: 'a' }, { id: 'b' }];
  assignSizeScales(list);

  assertEqual(list[0].sizeScale, undefined, 'Nothing to scale against means no scale is assigned');
});

test('Every painting in the real catalog gets a usable scale', () => {
  const list = paintings.map(p => ({ ...p }));
  assignSizeScales(list);

  list.forEach(p => {
    assert(typeof p.sizeScale === 'number' && p.sizeScale >= 0.8 && p.sizeScale <= 1.2,
      `"${p.id}" got an out-of-range sizeScale: ${p.sizeScale}`);
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE 3: The product page price section
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[3] PRODUCT PAGE PRICE SECTION' + colors.reset);

test('A sold painting shows a status line instead of a price', () => {
  const model = getPriceModel({ status: STATUS.SOLD, originalPrice: 1500 });
  assertEqual(model.status, 'sold', 'A sold painting should report the sold status');
  assertEqual(model.price, undefined, 'A sold painting should not offer a price');
});

test('A personal painting shows a status line instead of a price', () => {
  const model = getPriceModel({ status: STATUS.PERSONAL, originalPrice: 1500 });
  assertEqual(model.status, 'personal', 'A personal painting should report the personal status');
});

test('A plain for-sale painting shows one price and no discount', () => {
  const model = getPriceModel({ status: STATUS.FOR_SALE, originalPrice: 1500 });
  assertEqual(model.status, 'priced', 'A for-sale painting should be priced');
  assertEqual(model.price, 1500, 'Wrong price');
  assertEqual(model.oldPrice, null, 'An undiscounted painting should have no struck-through price');
  assertEqual(model.discountPercent, null, 'An undiscounted painting should have no discount note');
});

test('A discounted painting shows the sale price, the old price and the percentage', () => {
  const model = getPriceModel({ status: STATUS.FOR_SALE, originalPrice: 1000, discountPercent: 25 });
  assertEqual(model.price, 750, 'Wrong discounted price');
  assertEqual(model.oldPrice, 1000, 'The pre-discount price should be struck through');
  assertEqual(model.discountPercent, 25, 'Wrong discount percentage');
});

test('A framed-only painting is priced at its framed price', () => {
  const model = getPriceModel({ status: STATUS.FOR_SALE, framedPrice: 2500, framedOnly: true });
  assertEqual(model.status, 'priced', 'A framed-only painting should be priced');
  assertEqual(model.price, 2500, 'Wrong framed-only price');
  assertEqual(model.oldPrice, null, 'Nothing to strike through at full price');
});

test('A painting with no price on record shows nothing', () => {
  assertEqual(getPriceModel({ status: STATUS.FOR_SALE }).status, 'none',
    'A painting without a price should render no price section');
});

test('An uneven discount is rounded to the nearest krona', () => {
  // Rounded, not floored or ceilinged, and never shown to the buyer with ören.
  // Both directions are checked, so swapping Math.round for either neighbour
  // fails here rather than only in the client/server parity test.
  const price = (originalPrice, discountPercent) =>
    getPriceModel({ status: STATUS.FOR_SALE, originalPrice, discountPercent }).price;

  // 223.11 rounds down — Math.ceil would give 224
  assertEqual(price(333, 33), 223, 'An uneven discount should round down when it is nearer the lower krona');

  // 249.75 rounds up — Math.floor would give 249
  assertEqual(price(333, 25), 250, 'An uneven discount should round up when it is nearer the higher krona');

  // 849.15 rounds down
  assertEqual(price(999, 15), 849, 'Wrong rounding on an uneven discount');
});

test('A discount of 0 or 100 percent is not a discount', () => {
  // Guards against a typo silently pricing a painting at zero
  assertEqual(getPriceModel({ status: STATUS.FOR_SALE, originalPrice: 1000, discountPercent: 0 }).oldPrice, null,
    'A 0% discount should not be shown as a discount');
  assertEqual(getPriceModel({ status: STATUS.FOR_SALE, originalPrice: 1000, discountPercent: 100 }).price, 1000,
    'A 100% discount should be refused rather than giving the painting away');
});

test('The price model matches the pricing helpers it is built on', () => {
  paintings.filter(p => p.status === STATUS.FOR_SALE).forEach(p => {
    const model = getPriceModel(p);
    if (model.status !== 'priced') return;

    const expected = p.framedOnly && p.framedPrice
      ? (getPaintingFramedSalePrice(p) || p.framedPrice)
      : getPaintingDiscountedPrice(p);

    assertEqual(model.price, expected, `"${p.id}" is priced differently by the model and the helpers`);
  });
});

test('Every for-sale painting in the catalog offers a price', () => {
  paintings.filter(p => p.status === STATUS.FOR_SALE).forEach(p => {
    const model = getPriceModel(p);
    assertEqual(model.status, 'priced', `"${p.id}" is for sale but shows no price`);
    assert(typeof model.price === 'number' && model.price > 0,
      `"${p.id}" is for sale at a nonsensical price: ${model.price}`);
  });
});

test('No sold painting in the catalog leaks a price', () => {
  paintings.filter(p => p.status === STATUS.SOLD).forEach(p => {
    assertEqual(getPriceModel(p).status, 'sold', `"${p.id}" is sold but does not report the sold status`);
  });
});

test('A discounted framed-only painting shows its framed price struck through', () => {
  const model = getPriceModel({
    status: STATUS.FOR_SALE, framedPrice: 2500, framedOnly: true, discountPercent: 20,
  });

  assertEqual(model.price, 2000, 'The discount should come off the framed price');
  assertEqual(model.oldPrice, 2500, 'The undiscounted framed price should be struck through');
  assertEqual(model.discountPercent, 20, 'The discount note should show the percentage');
});

test('The product page and the gallery tile agree on discounted prices', () => {
  // getGalleryPriceHtml() in gallery.js builds its numbers from
  // getPaintingEffectivePrice()/getPaintingDiscountedPrice() and strikes through
  // framedPrice for framedOnly pieces, originalPrice otherwise. The product page
  // must not quote something different for the same painting.
  const cases = [
    { id: 'framed-only', status: STATUS.FOR_SALE, framedPrice: 2500, framedOnly: true, discountPercent: 20 },
    { id: 'framed-only-odd', status: STATUS.FOR_SALE, framedPrice: 3333, framedOnly: true, discountPercent: 15 },
    { id: 'plain', status: STATUS.FOR_SALE, originalPrice: 1500, discountPercent: 25 },
    { id: 'plain-undiscounted', status: STATUS.FOR_SALE, originalPrice: 1500 },
    { id: 'framed-only-undiscounted', status: STATUS.FOR_SALE, framedPrice: 2500, framedOnly: true },
  ];

  cases.forEach(p => {
    const model = getPriceModel(p);

    const galleryPrice = p.framedOnly
      ? getPaintingEffectivePrice(p, true)
      : getPaintingDiscountedPrice(p);
    const galleryOldPrice = hasPaintingDiscount(p)
      ? (p.framedOnly ? p.framedPrice : p.originalPrice)
      : null;

    assertEqual(model.price, galleryPrice,
      `"${p.id}": the product page and the gallery quote different prices`);
    assertEqual(model.oldPrice, galleryOldPrice ?? null,
      `"${p.id}": the product page and the gallery disagree on the struck-through price`);
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE 4: Buyer-chosen sort orders
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[4] BUYER-CHOSEN SORT ORDERS' + colors.reset);

// Every piece carries a _randomGalleryOrder in the browser, so the tie-break
// is exercised the same way here
const sortedIds = (list, order) =>
  list
    .map((p, i) => ({ _randomGalleryOrder: i, status: STATUS.FOR_SALE, ...p }))
    .sort(comparePaintingsBy(order))
    .map(p => p.id);

test('The default order has no comparator, leaving the curated arrangement alone', () => {
  assertEqual(comparePaintingsBy(GALLERY_SORT.DEFAULT), null,
    'The default order should fall through to gallery.js sortPaintings()');
  assertEqual(comparePaintingsBy('sort_nonsense'), null,
    'An unknown order should fall through rather than throw');
});

test('Sorting by price runs cheapest to dearest and back again', () => {
  const list = [
    { id: 'mid', originalPrice: 1500 },
    { id: 'dear', originalPrice: 3000 },
    { id: 'cheap', originalPrice: 600 },
  ];

  assertEqual(sortedIds(list, GALLERY_SORT.PRICE_ASC).join(' → '), 'cheap → mid → dear',
    'Lowest price first is in the wrong order');
  assertEqual(sortedIds(list, GALLERY_SORT.PRICE_DESC).join(' → '), 'dear → mid → cheap',
    'Highest price first is in the wrong order');
});

test('Sorting by price uses what the buyer pays today, not the pre-discount price', () => {
  const list = [
    { id: 'discounted-2400', originalPrice: 3000, discountPercent: 20 },
    { id: 'plain-2500', originalPrice: 2500 },
  ];

  assertEqual(sortedIds(list, GALLERY_SORT.PRICE_ASC).join(' → '), 'discounted-2400 → plain-2500',
    'A discounted painting should sort on its discounted price');
  assertEqual(paintingSortPrice({ status: STATUS.FOR_SALE, framedPrice: 2000, framedOnly: true }), 2000,
    'A framed-only piece sorts on its framed price');
});

test('Sorting by size runs on area, so a wide piece outranks a tall thin one', () => {
  const list = [
    { id: 'tall-thin', ...rect(30, 90) },   // 2700 cm²
    { id: 'wide', ...rect(90, 60) },        // 5400 cm²
    { id: 'small', ...rect(18, 24) },       // 432 cm²
  ];

  assertEqual(sortedIds(list, GALLERY_SORT.SIZE_ASC).join(' → '), 'small → tall-thin → wide',
    'Smallest size first is in the wrong order');
  assertEqual(sortedIds(list, GALLERY_SORT.SIZE_DESC).join(' → '), 'wide → tall-thin → small',
    'Largest size first is in the wrong order');
});

test('Sold pieces stay behind available ones in every order', () => {
  const list = [
    { id: 'sold-cheap', status: STATUS.SOLD, originalPrice: 500 },
    { id: 'for-sale-dear', originalPrice: 3000 },
    { id: 'sold-dear', status: STATUS.SOLD, originalPrice: 4000 },
    { id: 'for-sale-cheap', originalPrice: 600 },
  ];

  assertEqual(sortedIds(list, GALLERY_SORT.PRICE_ASC).join(' → '),
    'for-sale-cheap → for-sale-dear → sold-cheap → sold-dear',
    'Cheapest first should still lead with what can be bought');
  assertEqual(sortedIds(list, GALLERY_SORT.PRICE_DESC).join(' → '),
    'for-sale-dear → for-sale-cheap → sold-dear → sold-cheap',
    'Dearest first should still lead with what can be bought');
});

test('A piece the sort key cannot measure sinks below the ones it can', () => {
  const list = [
    { id: 'unmeasured' },
    { id: 'measured', ...rect(20, 20), originalPrice: 800 },
  ];

  [GALLERY_SORT.SIZE_ASC, GALLERY_SORT.SIZE_DESC, GALLERY_SORT.PRICE_ASC, GALLERY_SORT.PRICE_DESC]
    .forEach(order => {
      assertEqual(sortedIds(list, order).join(' → '), 'measured → unmeasured',
        `${order} put a piece with nothing to sort on ahead of a real one`);
    });
});

test('Equal values keep the order the page shuffled them into', () => {
  const list = [
    { id: 'second', originalPrice: 1000, ...rect(20, 20) },
    { id: 'first', originalPrice: 1000, ...rect(20, 20) },
  ];

  // Both keys tie, so the ids come back in _randomGalleryOrder order — the
  // grid must not reshuffle itself each time an order is picked
  assertEqual(sortedIds(list, GALLERY_SORT.PRICE_ASC).join(' → '), 'second → first',
    'Equal prices should fall back on the shuffled order');
  assertEqual(sortedIds(list, GALLERY_SORT.SIZE_DESC).join(' → '), 'second → first',
    'Equal areas should fall back on the shuffled order');
});

test('Every catalog piece can be ranked by both keys without crashing', () => {
  const ranked = paintings.map((p, i) => ({ ...p, _randomGalleryOrder: i }));
  Object.values(GALLERY_SORT).forEach(order => {
    const comparator = comparePaintingsBy(order);
    if (!comparator) return;
    const result = [...ranked].sort(comparator);
    assertEqual(result.length, paintings.length, `${order} lost or duplicated a painting`);

    let seenSold = null;
    result.forEach(p => {
      if (p.status === STATUS.SOLD) seenSold = seenSold || p.id;
      else if (seenSold) assert(false, `${order}: "${p.id}" is sorted after sold painting "${seenSold}"`);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────

console.log('\n' + colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset);
console.log(colors.blue + 'PAINTING MODEL TEST RESULTS' + colors.reset);
console.log(colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset);
console.log(`\nTotal tests: ${testCount}`);
console.log(`${colors.green}Passed: ${testCount - errorCount}${colors.reset}`);

if (errorCount > 0) {
  console.log(`${colors.red}Failed: ${errorCount}${colors.reset}\n`);
  process.exit(1);
} else {
  console.log(`${colors.green}Failed: 0${colors.reset}`);
  console.log(`\n${colors.green}✓ All painting model tests passed!${colors.reset}\n`);
  process.exit(0);
}
