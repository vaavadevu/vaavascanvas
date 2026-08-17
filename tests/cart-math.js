#!/usr/bin/env node

/**
 * Cart math unit tests for Vaavascanvas
 *
 * js/cart-math.js holds the arithmetic behind what the cart drawer shows a
 * buyer: subtotals, the free-shipping threshold, and the group pricing that
 * makes a second bookmark drop the price of the first. It has no DOM and no
 * globals, so these tests call the real functions directly rather than
 * scraping them out of the source the way the older suites have to.
 *
 * The constants themselves are checked against the server in tests/validate.js
 * ("Checkout shipping constants match the cart"); what is tested here is how
 * they are applied.
 */

const {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_COST_SE,
  SHIPPING_COST_EU,
  calcSubtotal,
  calcShipping,
  calcTotal,
  calcCount,
  resolveBookmarkPricing,
  applyBookmarkPricing,
  cartItemOldPrice,
} = require('../js/cart-math.js');

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

// Test fixtures — only the fields the math actually reads
const item = (price, extra = {}) => ({ type: 'original', price, ...extra });
const bookmarkItem = (extra = {}) => ({ type: 'bookmark', price: 120, ...extra });

console.log('\n' + colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset);
console.log(colors.blue + 'VAAVASCANVAS CART MATH UNIT TESTS' + colors.reset);
console.log(colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset + '\n');

// ─────────────────────────────────────────────────────────────
// SUITE 1: Subtotals and counts
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '[1] SUBTOTALS AND COUNTS' + colors.reset);

test('An empty cart subtotals to zero', () => {
  assertEqual(calcSubtotal([]), 0, 'Empty cart should subtotal to 0');
  assertEqual(calcCount([]), 0, 'Empty cart should count 0 items');
});

test('Subtotal adds up the line prices', () => {
  assertEqual(calcSubtotal([item(600), item(1500), item(120)]), 2220, 'Wrong subtotal');
});

test('Subtotal multiplies by quantity', () => {
  assertEqual(calcSubtotal([item(100, { qty: 3 })]), 300, 'Quantity was not applied');
  assertEqual(calcSubtotal([item(100, { qty: 3 }), item(50, { qty: 2 })]), 400, 'Wrong subtotal across lines');
});

test('A missing quantity counts as one', () => {
  // Unique items (originals, bookmarks) are stored without an explicit qty
  assertEqual(calcSubtotal([item(600)]), 600, 'Missing qty should be treated as 1');
  assertEqual(calcCount([item(600), item(120)]), 2, 'Missing qty should be counted as 1');
});

test('Count sums quantities rather than lines', () => {
  assertEqual(calcCount([item(100, { qty: 3 }), item(50, { qty: 2 })]), 5, 'Badge count should sum quantities');
});

// ─────────────────────────────────────────────────────────────
// SUITE 2: Shipping
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[2] SHIPPING' + colors.reset);

test('Orders below the free-shipping threshold pay Swedish shipping', () => {
  assertEqual(calcShipping(FREE_SHIPPING_THRESHOLD - 1, 'SE'), SHIPPING_COST_SE,
    'Just below the threshold should still pay shipping');
  assertEqual(calcShipping(0, 'SE'), SHIPPING_COST_SE, 'An empty cart should show the shipping cost');
});

test('The free-shipping threshold is inclusive', () => {
  // The boundary itself: a cart landing exactly on the threshold ships free
  assertEqual(calcShipping(FREE_SHIPPING_THRESHOLD, 'SE'), 0,
    `A subtotal of exactly ${FREE_SHIPPING_THRESHOLD} should ship free`);
  assertEqual(calcShipping(FREE_SHIPPING_THRESHOLD + 1, 'SE'), 0,
    'Above the threshold should ship free');
});

test('EU orders always pay EU shipping', () => {
  assertEqual(calcShipping(0, 'EU'), SHIPPING_COST_EU, 'EU shipping missing on a small order');
  assertEqual(calcShipping(FREE_SHIPPING_THRESHOLD * 10, 'EU'), SHIPPING_COST_EU,
    'The free-shipping threshold must not apply to EU orders');
});

test('An unselected country is quoted Swedish shipping', () => {
  // The drawer opens with no country chosen and still has to show a number;
  // checkout is blocked separately until the buyer picks one
  assertEqual(calcShipping(100, ''), SHIPPING_COST_SE, 'Unselected country should quote Swedish shipping');
  assertEqual(calcShipping(FREE_SHIPPING_THRESHOLD, ''), 0,
    'Unselected country should still get free shipping above the threshold');
});

test('Total is the subtotal plus shipping', () => {
  const cheap = [item(100)];
  assertEqual(calcTotal(cheap, 'SE'), 100 + SHIPPING_COST_SE, 'Wrong total below the threshold');
  assertEqual(calcTotal(cheap, 'EU'), 100 + SHIPPING_COST_EU, 'Wrong total for an EU order');

  const expensive = [item(FREE_SHIPPING_THRESHOLD)];
  assertEqual(calcTotal(expensive, 'SE'), FREE_SHIPPING_THRESHOLD, 'Free shipping was not applied to the total');
});

// ─────────────────────────────────────────────────────────────
// SUITE 3: Bookmark group pricing
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[3] BOOKMARK GROUP PRICING' + colors.reset);

// Mirrors the bookmark entry in js/paintings.js
const catalog = { originalPrice: 120, multiBuyPrice: 100, multiBuyMinQuantity: 2 };

test('A cart with no bookmarks is left alone', () => {
  const items = [item(600), item(1500)];
  const before = JSON.stringify(items);

  assertEqual(applyBookmarkPricing(items, catalog), null, 'Should report no bookmark pricing');
  assertEqual(JSON.stringify(items), before, 'Non-bookmark items must not be touched');
});

test('A single bookmark pays the full per-piece price', () => {
  const items = [bookmarkItem()];
  applyBookmarkPricing(items, catalog);
  assertEqual(items[0].price, catalog.originalPrice, 'One bookmark alone should not get the multi-buy price');
});

test('Reaching the multi-buy threshold reprices every bookmark', () => {
  const items = [bookmarkItem(), bookmarkItem()];
  applyBookmarkPricing(items, catalog);

  items.forEach((b, i) => {
    assertEqual(b.price, catalog.multiBuyPrice,
      `Bookmark ${i + 1} should drop to the multi-buy price once the threshold is reached`);
  });
});

test('The multi-buy threshold is inclusive and holds above it', () => {
  const below = Array.from({ length: catalog.multiBuyMinQuantity - 1 }, () => bookmarkItem());
  applyBookmarkPricing(below, catalog);
  below.forEach(b => assertEqual(b.price, catalog.originalPrice, 'Below the threshold should pay full price'));

  const above = Array.from({ length: catalog.multiBuyMinQuantity + 3 }, () => bookmarkItem());
  applyBookmarkPricing(above, catalog);
  above.forEach(b => assertEqual(b.price, catalog.multiBuyPrice, 'Above the threshold should pay the multi-buy price'));
});

test('Only bookmarks are repriced', () => {
  const original = item(600);
  const items = [original, bookmarkItem(), bookmarkItem()];
  applyBookmarkPricing(items, catalog);

  assertEqual(original.price, 600, 'A painting must not be repriced by the bookmark rule');
  assertEqual(items[1].price, catalog.multiBuyPrice, 'Bookmarks should still be repriced alongside a painting');
});

test('Bookmarks count as pieces, not quantities', () => {
  // Each bookmark is one physical piece; a stray qty must not unlock the
  // discount, because the server counts cart lines the same way
  const items = [bookmarkItem({ qty: 5 })];
  applyBookmarkPricing(items, catalog);
  assertEqual(items[0].price, catalog.originalPrice,
    'A quantity above 1 on a single bookmark must not trigger the multi-buy price');
});

test('The catalog overrides prices stored in an older cart', () => {
  // localStorage can hold a cart built before a price change
  const items = [bookmarkItem({ price: 999, basePrice: 999, multiBuyPrice: 888 })];
  applyBookmarkPricing(items, catalog);

  assertEqual(items[0].price, catalog.originalPrice, 'Stale stored price was used instead of the catalog');
  assertEqual(items[0].basePrice, catalog.originalPrice, 'Stale basePrice was not refreshed');
  assertEqual(items[0].multiBuyPrice, catalog.multiBuyPrice, 'Stale multiBuyPrice was not refreshed');
});

test('Without a catalog the cart falls back to the stored prices', () => {
  // The catalog is missing when cart.js loads on a page without paintings.js
  const items = [
    bookmarkItem({ price: 120, basePrice: 120, multiBuyPrice: 100, multiBuyMinQuantity: 2 }),
    bookmarkItem({ price: 120, basePrice: 120, multiBuyPrice: 100, multiBuyMinQuantity: 2 }),
  ];
  applyBookmarkPricing(items, null);

  items.forEach(b => assertEqual(b.price, 100, 'Stored multi-buy price should apply when the catalog is missing'));
});

test('Without a catalog or a stored base price the current price is used', () => {
  const items = [bookmarkItem({ price: 120 })];
  const pricing = applyBookmarkPricing(items, null);

  assertEqual(pricing.base, 120, 'Should fall back to the item price as the base');
  assertEqual(pricing.multiPrice, 120, 'With nothing cheaper known, the multi-buy price is the base price');
  assertEqual(items[0].price, 120, 'Price should be left as it was');
});

test('The multi-buy threshold defaults to two', () => {
  const pricing = resolveBookmarkPricing([{ type: 'bookmark', price: 120 }], null);
  assertEqual(pricing.minQuantity, 2, 'Default multi-buy threshold changed');
});

test('resolveBookmarkPricing reports nothing for an empty list', () => {
  assertEqual(resolveBookmarkPricing([], catalog), null, 'Empty bookmark list should resolve to null');
  assertEqual(resolveBookmarkPricing(undefined, catalog), null, 'Missing bookmark list should resolve to null');
});

// ─────────────────────────────────────────────────────────────
// SUITE 4: Struck-through prices
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[4] STRUCK-THROUGH PRICES' + colors.reset);

test('An undiscounted original shows no old price', () => {
  assertEqual(cartItemOldPrice({
    type: 'original', basePrice: 1500, originalBasePrice: 1500,
  }), null, 'A full-price original should not show a struck-through price');
});

test('A discounted original shows its pre-discount price', () => {
  assertEqual(cartItemOldPrice({
    type: 'original', basePrice: 1200, originalBasePrice: 1500,
  }), 1500, 'Wrong old price for a discounted original');
});

test('A framed original compares against the framed prices', () => {
  assertEqual(cartItemOldPrice({
    type: 'original', withFrame: true, framedPrice: 1600, originalFramedPrice: 1800,
    basePrice: 1200, originalBasePrice: 1500,
  }), 1800, 'A framed item should compare against the framed prices');
});

test('An original added without its pre-discount prices shows no old price', () => {
  // Guards the gallery/page-view difference in how cart items are built
  assertEqual(cartItemOldPrice({ type: 'original', basePrice: 1200 }), null,
    'Missing originalBasePrice should mean no struck-through price, not a crash');
});

test('A bookmark at the multi-buy price shows the single-piece price', () => {
  assertEqual(cartItemOldPrice({ type: 'bookmark', price: 100, basePrice: 120 }), 120,
    'A discounted bookmark should show the single-piece price struck through');
});

test('A bookmark at full price shows no old price', () => {
  assertEqual(cartItemOldPrice({ type: 'bookmark', price: 120, basePrice: 120 }), null,
    'A full-price bookmark should not show a struck-through price');
});

// ─────────────────────────────────────────────────────────────
// SUITE 5: A realistic cart end to end
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[5] A REALISTIC CART' + colors.reset);

test('Two bookmarks and a painting total correctly', () => {
  const items = [
    item(600),
    bookmarkItem(),
    bookmarkItem(),
  ];
  applyBookmarkPricing(items, catalog);

  // 600 + 100 + 100 = 800, which clears the free-shipping threshold
  assertEqual(calcSubtotal(items), 800, 'Wrong subtotal after bookmark repricing');
  assertEqual(calcShipping(calcSubtotal(items), 'SE'), 0, 'This cart should ship free');
  assertEqual(calcTotal(items, 'SE'), 800, 'Wrong total');
  assertEqual(calcCount(items), 3, 'Wrong badge count');
});

test('Adding a second bookmark can lower the cart total', () => {
  // The group discount is worth more than the second piece on a small cart
  const one = [bookmarkItem()];
  applyBookmarkPricing(one, catalog);

  const two = [bookmarkItem(), bookmarkItem()];
  applyBookmarkPricing(two, catalog);

  assertEqual(calcSubtotal(one), 120, 'One bookmark should cost the full price');
  assertEqual(calcSubtotal(two), 200, 'Two bookmarks should both drop to the multi-buy price');
});

// ─────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────

console.log('\n' + colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset);
console.log(colors.blue + 'CART MATH TEST RESULTS' + colors.reset);
console.log(colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset);
console.log(`\nTotal tests: ${testCount}`);
console.log(`${colors.green}Passed: ${testCount - errorCount}${colors.reset}`);

if (errorCount > 0) {
  console.log(`${colors.red}Failed: ${errorCount}${colors.reset}\n`);
  process.exit(1);
} else {
  console.log(`${colors.green}Failed: 0${colors.reset}`);
  console.log(`\n${colors.green}✓ All cart math tests passed!${colors.reset}\n`);
  process.exit(0);
}
