#!/usr/bin/env node

/**
 * Checkout logic tests for Vaavascanvas
 *
 * Runs the real Cloudflare function from functions/api/create-checkout.js
 * against a stubbed Stripe client, so the rules that protect the money path
 * (sold items, client-supplied prices, quantities, bookmark inventory) are
 * exercised rather than just inspected as data.
 *
 * Also checks that the pricing helpers duplicated between the browser bundle
 * and the server function still agree — they are copy-pasted, and a change to
 * one side would silently charge a different amount than the cart displays.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  error: (msg) => console.error(`${colors.red}✗ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warn: (msg) => console.warn(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`)
};

let errorCount = 0;
let testCount = 0;

async function test(name, fn) {
  testCount++;
  try {
    await fn();
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

const checkoutPath = path.join(__dirname, '../functions/api/create-checkout.js');

// The browser side exports its helpers, so the parity test below compares the
// real js/paintings.js rather than a copy sliced out of its source
const clientPricing = require('../js/paintings.js');

// Cloudflare Workers always provide Response.json(); older Node versions don't,
// so give the function the same footing it has in production
if (typeof Response === 'undefined') {
  log.error('This Node version has no global Response — Node 18 or newer is required');
  process.exit(1);
}
if (typeof Response.json !== 'function') {
  Response.json = (data, init = {}) => new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
  });
}

// ─────────────────────────────────────────────────────────────
// Load the real function with Stripe stubbed out
// ─────────────────────────────────────────────────────────────

// Captures the session Stripe would have been asked to create
let lastSession = null;

const STRIPE_STUB = `
class Stripe {
  constructor() {
    this.checkout = {
      sessions: {
        create: async (options) => {
          globalThis.__lastStripeSession = options;
          return { url: 'https://checkout.stripe.test/session' };
        }
      }
    };
  }
}
`;

async function loadCheckoutFunction() {
  const source = fs.readFileSync(checkoutPath, 'utf8');
  const importLine = /^import Stripe from 'stripe';$/m;

  if (!importLine.test(source)) {
    throw new Error(
      'Could not find the Stripe import in create-checkout.js — this test stubs it out by ' +
      'rewriting that line, so update the test if the import changed'
    );
  }

  // Write the stubbed copy to a temp dir; .mjs so Node treats the ES module
  // syntax correctly regardless of package.json type
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-checkout-'));
  const stubbedPath = path.join(tempDir, 'create-checkout.mjs');
  fs.writeFileSync(stubbedPath, source.replace(importLine, STRIPE_STUB));

  try {
    const mod = await import(`file://${stubbedPath.replace(/\\/g, '/')}`);
    return mod.onRequestPost;
  } finally {
    // Node has the module cached by now, so the file on disk is disposable
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// Runs the function the way Cloudflare would and returns a flat result
async function checkout(onRequestPost, items, country = 'SE') {
  globalThis.__lastStripeSession = null;

  const response = await onRequestPost({
    env: { STRIPE_SECRET_KEY: 'sk_test_stub' },
    request: {
      url: 'https://vaavascanvas.se/api/create-checkout',
      json: async () => ({ items, country }),
    },
  });

  const body = await response.json();
  lastSession = globalThis.__lastStripeSession;

  const lineItems = (lastSession?.line_items || []).map(li => ({
    name: li.price_data.product_data.name,
    amount: li.price_data.unit_amount / 100,
    quantity: li.quantity,
    images: li.price_data.product_data.images || [],
  }));

  return {
    status: response.status,
    error: body.error,
    url: body.url,
    lineItems,
    // Everything except the shipping line
    products: lineItems.filter(li => li.name !== 'Frakt'),
    shipping: lineItems.find(li => li.name === 'Frakt')?.amount ?? 0,
    total: lineItems.reduce((sum, li) => sum + li.amount * li.quantity, 0),
  };
}

// ─────────────────────────────────────────────────────────────
// Pull the catalogs out of the function source for building cases
// ─────────────────────────────────────────────────────────────

function loadCatalogs() {
  const content = fs.readFileSync(checkoutPath, 'utf8');

  const paintingsMatch = content.match(/const PAINTINGS = \[([\s\S]+?)\];/);
  if (!paintingsMatch) throw new Error('Could not find PAINTINGS in create-checkout.js');
  let str = `[${paintingsMatch[1]}]`;
  str = str.replace(/'([^']*)'/g, '"$1"');
  str = str.replace(/(\{|,)\s*([\w]+):/g, '$1"$2":');
  str = str.replace(/,(\s*[}\]])/g, '$1');
  const paintings = JSON.parse(str);

  const bookmarksMatch = content.match(/const BOOKMARKS = \{([\s\S]*?)\n\};/);
  if (!bookmarksMatch) throw new Error('Could not find BOOKMARKS in create-checkout.js');
  let bstr = `{${bookmarksMatch[1]}}`;
  bstr = bstr.replace(/\/\/.*$/gm, '');
  bstr = bstr.replace(/'([^']*)'/g, '"$1"');
  bstr = bstr.replace(/(\{|,)\s*([\w]+):/g, '$1"$2":');
  bstr = bstr.replace(/,(\s*[}\]])/g, '$1');
  const bookmarks = JSON.parse(bstr);

  return { paintings, bookmarks };
}

// ─────────────────────────────────────────────────────────────
// Extract the shared pricing helpers from the server function
//
// js/paintings.js is require()d directly (see clientPricing above).
// functions/api/create-checkout.js is a Cloudflare module with no export tail,
// so its copy still has to be lifted out of the source.
// ─────────────────────────────────────────────────────────────

const PRICING_FUNCTIONS = [
  'hasPaintingDiscount',
  'getPaintingDiscountedPrice',
  'getPaintingFramedSalePrice',
  'getPaintingEffectivePrice',
];

// Grabs `function name(...) { ... }` up to the closing brace in column 0
function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start === -1) return null;
  const end = source.indexOf('\n}', start);
  if (end === -1) return null;
  return source.slice(start, end + 2);
}

function loadPricingHelpers(filePath, label) {
  const source = fs.readFileSync(filePath, 'utf8');
  const parts = PRICING_FUNCTIONS.map(name => {
    const fn = extractFunction(source, name);
    if (!fn) throw new Error(`Could not extract ${name}() from ${label}`);
    return fn;
  });

  const factory = new Function(`${parts.join('\n')}\nreturn { ${PRICING_FUNCTIONS.join(', ')} };`);
  return factory();
}

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

async function runTests() {
  console.log('\n' + colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.blue + 'VAAVASCANVAS CHECKOUT LOGIC TESTS' + colors.reset);
  console.log(colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset + '\n');

  let onRequestPost, catalogs;
  try {
    onRequestPost = await loadCheckoutFunction();
    catalogs = loadCatalogs();
  } catch (err) {
    log.error('Failed to load the checkout function: ' + err.message);
    process.exit(1);
  }

  const { paintings: serverPaintings, bookmarks } = catalogs;
  const forSale = serverPaintings.find(p => p.status === 'for_sale' && p.originalPrice && !p.framedOnly);
  const sold = serverPaintings.find(p => p.status === 'sold');
  const availableBookmarks = Object.entries(bookmarks.variants)
    .filter(([, entry]) => entry.status === 'for_sale')
    .map(([id]) => id);
  const soldBookmark = Object.entries(bookmarks.variants).find(([, e]) => e.status === 'sold')?.[0];

  const original = (id, extra = {}) => ({ id, title: 'Test', type: 'original', price: 9999, ...extra });
  const clay = (id, extra = {}) => ({ id, title: 'Test', type: 'clay', price: 9999, ...extra });
  const bookmark = (id, extra = {}) => ({ id, title: 'Test', type: 'bookmark', price: 9999, ...extra });

  console.log(colors.blue + '[1] PRICE AUTHORITY' + colors.reset);

  await test('Server ignores client-supplied prices for paintings', async () => {
    const result = await checkout(onRequestPost, [original(forSale.id, { price: 1 })]);
    assert(!result.error, `Unexpected rejection: ${result.error}`);
    assertEqual(result.products[0].amount, forSale.originalPrice,
      `Charged the client's price instead of the catalog price for "${forSale.id}"`);
  });

  await test('Server ignores client-supplied prices for bookmarks', async () => {
    const result = await checkout(onRequestPost, [bookmark(availableBookmarks[0], { price: 1 })]);
    assert(!result.error, `Unexpected rejection: ${result.error}`);
    assertEqual(result.products[0].amount, bookmarks.price,
      'Charged the client\'s price instead of the catalog price for a bookmark');
  });

  // Quantities used to be honoured, floored to a whole number. Nothing in the
  // shop comes in more than one, so whatever a cart claims, one is what is
  // sold — see "one of a kind" below.
  await test('A quantity in the payload changes nothing', async () => {
    for (const qty of [2.7, -5, 0, 99]) {
      const result = await checkout(onRequestPost, [original(forSale.id, { qty })]);
      assert(!result.error, `Unexpected rejection for qty ${qty}: ${result.error}`);
      assertEqual(result.products[0].quantity, 1, `qty ${qty} was not reduced to one piece`);
    }
  });

  console.log(colors.blue + '\n[2] SOLD INVENTORY IS UNBUYABLE' + colors.reset);

  await test('Sold paintings are rejected', async () => {
    const result = await checkout(onRequestPost, [original(sold.id)]);
    assertEqual(result.status, 400, `Sold painting "${sold.id}" was accepted for checkout`);
  });

  await test('Every sold painting in the catalog is rejected', async () => {
    for (const p of serverPaintings.filter(p => p.status === 'sold')) {
      const result = await checkout(onRequestPost, [original(p.id)]);
      assertEqual(result.status, 400, `Sold painting "${p.id}" was accepted for checkout`);
    }
  });

  await test('Sold bookmarks are rejected', async () => {
    assert(soldBookmark, 'No sold bookmark in the catalog to test with');
    const result = await checkout(onRequestPost, [bookmark(soldBookmark)]);
    assertEqual(result.status, 400, `Sold bookmark "${soldBookmark}" was accepted for checkout`);
  });

  await test('One sold item rejects the whole order', async () => {
    const result = await checkout(onRequestPost, [
      original(forSale.id),
      bookmark(soldBookmark),
    ]);
    assertEqual(result.status, 400, 'Order containing a sold bookmark was accepted');
  });

  await test('Unknown ids are rejected', async () => {
    const unknown = await checkout(onRequestPost, [original('no-such-painting')]);
    assertEqual(unknown.status, 400, 'Unknown painting id was accepted');

    const unknownBookmark = await checkout(onRequestPost, [bookmark('bookmark-no-such-animal')]);
    assertEqual(unknownBookmark.status, 400, 'Unknown bookmark was accepted');
  });

  console.log(colors.blue + '\n[3] BOOKMARK RULES' + colors.reset);

  await test('A single bookmark pays the full per-piece price', async () => {
    const result = await checkout(onRequestPost, [bookmark(availableBookmarks[0])]);
    assert(!result.error, `Unexpected rejection: ${result.error}`);
    assertEqual(result.products[0].amount, bookmarks.price,
      'One bookmark on its own should not get the multi-buy price');
  });

  await test('Buying several drops every bookmark to the multi-buy price', async () => {
    const needed = bookmarks.multiBuyMinQuantity;
    assert(availableBookmarks.length >= needed,
      `Need at least ${needed} available bookmarks to test multi-buy pricing`);

    const result = await checkout(onRequestPost, availableBookmarks.slice(0, needed).map(bookmark));
    assert(!result.error, `Unexpected rejection: ${result.error}`);

    result.products.forEach((line, i) => {
      assertEqual(line.amount, bookmarks.multiBuyPrice,
        `Bookmark ${i + 1} of ${needed} should be priced at the multi-buy rate`);
    });
  });

  await test('The multi-buy price applies below the threshold to nothing', async () => {
    const below = bookmarks.multiBuyMinQuantity - 1;
    if (below < 1) return; // threshold of 1 means everything is always discounted

    const result = await checkout(onRequestPost, availableBookmarks.slice(0, below).map(bookmark));
    assert(!result.error, `Unexpected rejection: ${result.error}`);
    result.products.forEach(line => {
      assertEqual(line.amount, bookmarks.price,
        `Orders below the multi-buy threshold should pay the full price`);
    });
  });

  await test('The same bookmark cannot be ordered twice', async () => {
    // Every bookmark is one physical piece — there is no second copy to sell
    const result = await checkout(onRequestPost, [
      bookmark(availableBookmarks[0]),
      bookmark(availableBookmarks[0]),
    ]);
    assertEqual(result.status, 400, 'Duplicate bookmark variant was accepted — each one is unique');
  });

  await test('Bookmark quantities are forced to 1', async () => {
    const result = await checkout(onRequestPost, [bookmark(availableBookmarks[0], { qty: 4 })]);
    assert(!result.error, `Unexpected rejection: ${result.error}`);
    assertEqual(result.products[0].quantity, 1, 'Bookmark quantity above 1 was accepted');
  });

  console.log(colors.blue + '\n[3b] ONE OF A KIND' + colors.reset);

  // Every piece in the shop is the only one of itself. The cart hides the +/-
  // for them and refuses a second copy, but the cart is a thing the buyer
  // holds — an order that asks for four of one painting has to be refused
  // here, or four people are promised the same canvas.
  const forSaleClay = serverPaintings.find(p =>
    p.status === 'for_sale' && p.originalPrice === 250 && !p.framedOnly);

  await test('Clay can be bought at all', async () => {
    assert(forSaleClay, 'No for-sale clay piece in the catalog to test with');
    const result = await checkout(onRequestPost, [clay(forSaleClay.id)]);
    assert(!result.error, `A clay piece was refused: ${result.error}`);
    assertEqual(result.products[0].amount, forSaleClay.originalPrice,
      'Clay was charged something other than the catalog price');
  });

  await test('Clay is priced from the catalog, not from the cart', async () => {
    const result = await checkout(onRequestPost, [clay(forSaleClay.id, { price: 1 })]);
    assert(!result.error, `Unexpected rejection: ${result.error}`);
    assertEqual(result.products[0].amount, forSaleClay.originalPrice,
      "Charged the client's price instead of the catalog price for clay");
  });

  await test('Sold clay is rejected', async () => {
    const soldClay = serverPaintings.find(p => p.status === 'sold' && p.originalPrice === 250);
    assert(soldClay, 'No sold clay piece in the catalog to test with');
    const result = await checkout(onRequestPost, [clay(soldClay.id)]);
    assertEqual(result.status, 400, `Sold clay "${soldClay.id}" was accepted for checkout`);
  });

  for (const [label, item] of [
    ['A painting', () => original(forSale.id, { qty: 4 })],
    ['A clay piece', () => clay(forSaleClay.id, { qty: 4 })],
    ['A bookmark', () => bookmark(availableBookmarks[0], { qty: 4 })],
  ]) {
    await test(`${label} is sold one at a time, whatever quantity is asked for`, async () => {
      const result = await checkout(onRequestPost, [item()]);
      assert(!result.error, `Unexpected rejection: ${result.error}`);
      assertEqual(result.products.length, 1, 'Expected a single line');
      assertEqual(result.products[0].quantity, 1,
        `${label} was ordered in a quantity above 1`);
    });
  }

  for (const [label, item] of [
    ['painting', () => original(forSale.id)],
    ['clay piece', () => clay(forSaleClay.id)],
    ['bookmark', () => bookmark(availableBookmarks[0])],
  ]) {
    await test(`The same ${label} cannot be listed twice in one order`, async () => {
      const result = await checkout(onRequestPost, [item(), item()]);
      assertEqual(result.status, 400,
        `The same ${label} was accepted twice — there is only one of it`);
    });
  }

  await test('A painting cannot be ordered framed and unframed at once', async () => {
    // Both ids are the same physical canvas
    const framable = serverPaintings.find(p =>
      p.status === 'for_sale' && p.frameAvailable && !p.framedOnly);
    assert(framable, 'No framable for-sale painting in the catalog to test with');

    const result = await checkout(onRequestPost, [
      original(framable.id),
      original(`${framable.id}-framed`),
    ]);
    assertEqual(result.status, 400, 'The same canvas was accepted twice, once with a frame');
  });

  console.log(colors.blue + '\n[3c] TYPE CONFUSION' + colors.reset);

  await test('A bookmark cannot be smuggled through as an original', async () => {
    // The two paths price differently: an original pays its own price, a
    // bookmark pays the multi-buy rate the drawer showed
    const result = await checkout(onRequestPost, [original(availableBookmarks[0])]);
    assertEqual(result.status, 400, 'A bookmark was accepted as an original painting');
  });

  await test('Bookmark line items carry the piece, not the set', async () => {
    const id = availableBookmarks[0];
    const result = await checkout(onRequestPost, [bookmark(id)]);
    assert(!result.error, `Unexpected rejection: ${result.error}`);

    const line = result.products[0];
    assert(line.name.includes(bookmarks.variants[id].title),
      `The Stripe line should name the bookmark, got: ${line.name}`);

    const image = line.images[0];
    assert(image && /^https?:\/\//.test(image),
      `Bookmark image must be an absolute URL for Stripe, got: ${image}`);
    assert(image.endsWith(bookmarks.variants[id].image),
      `The Stripe line should show this bookmark's own picture, got: ${image}`);
  });

  console.log(colors.blue + '\n[4] SHIPPING' + colors.reset);

  const content = fs.readFileSync(checkoutPath, 'utf8');
  const freeThreshold = parseInt(content.match(/const FREE_SHIPPING_THRESHOLD = (\d+)/)[1]);
  const costSE = parseInt(content.match(/const SHIPPING_COST_SE = (\d+)/)[1]);
  const costEU = parseInt(content.match(/const SHIPPING_COST_EU = (\d+)/)[1]);

  await test('Orders under the threshold pay Swedish shipping', async () => {
    // Cheapest thing in the shop — usually a single bookmark, since the
    // cheapest painting may well sit above the threshold on its own
    const cheapPainting = serverPaintings
      .filter(p => p.status === 'for_sale' && p.originalPrice && p.originalPrice < freeThreshold)
      .sort((a, b) => a.originalPrice - b.originalPrice)[0];
    const item = cheapPainting
      ? original(cheapPainting.id)
      : bookmark(availableBookmarks[0]);
    assert(bookmarks.price < freeThreshold || cheapPainting,
      'Nothing in the shop costs less than the free-shipping threshold');

    const result = await checkout(onRequestPost, [item], 'SE');
    assert(result.total - result.shipping < freeThreshold,
      `Test setup is wrong: order subtotal ${result.total - result.shipping} is not below the threshold`);
    assertEqual(result.shipping, costSE, 'Wrong shipping cost below the free-shipping threshold');
  });

  await test('Orders at or above the threshold ship free', async () => {
    const expensive = serverPaintings.find(p =>
      p.status === 'for_sale' && (p.originalPrice || p.framedPrice) >= freeThreshold);
    assert(expensive, 'No for-sale painting at or above the free-shipping threshold');

    const result = await checkout(onRequestPost, [original(expensive.id)], 'SE');
    assertEqual(result.shipping, 0, 'Order above the free-shipping threshold was still charged shipping');
  });

  await test('EU orders always pay EU shipping', async () => {
    const expensive = serverPaintings.find(p =>
      p.status === 'for_sale' && (p.originalPrice || p.framedPrice) >= freeThreshold);

    const result = await checkout(onRequestPost, [original(expensive.id)], 'EU');
    assertEqual(result.shipping, costEU, 'EU order did not pay EU shipping');
  });

  console.log(colors.blue + '\n[5] REQUEST VALIDATION' + colors.reset);

  await test('Empty and malformed carts are rejected', async () => {
    const empty = await checkout(onRequestPost, []);
    assertEqual(empty.status, 400, 'Empty cart was accepted');

    const notAnArray = await checkout(onRequestPost, { id: 'nope' });
    assertEqual(notAnArray.status, 400, 'Non-array items payload was accepted');
  });

  await test('Unknown item types are rejected', async () => {
    const result = await checkout(onRequestPost, [
      { id: 'anything', title: 'Test', type: 'print', price: 100 },
    ]);
    assertEqual(result.status, 400, 'An unsupported item type was accepted');
  });

  console.log(colors.blue + '\n[6] CLIENT / SERVER PRICING PARITY' + colors.reset);

  await test('Pricing helpers behave identically in the browser bundle and the server function', () => {
    const client = clientPricing;
    const server = loadPricingHelpers(checkoutPath, 'functions/api/create-checkout.js');

    PRICING_FUNCTIONS.forEach(name => {
      assert(typeof client[name] === 'function',
        `js/paintings.js no longer exports ${name}() — the parity check cannot run without it`);
    });

    // Real catalog entries plus edge cases the catalog may not contain yet
    const cases = [
      ...serverPaintings,
      { id: 'synthetic-plain', originalPrice: 1000 },
      { id: 'synthetic-discount', originalPrice: 1000, discountPercent: 25 },
      { id: 'synthetic-framed', originalPrice: 1000, framedPrice: 1400, frameAvailable: true },
      { id: 'synthetic-framed-discount', originalPrice: 1000, framedPrice: 1400, frameAvailable: true, discountPercent: 15 },
      { id: 'synthetic-framed-only', framedPrice: 2500, framedOnly: true },
      { id: 'synthetic-framed-only-discount', framedPrice: 2500, framedOnly: true, discountPercent: 10 },
      { id: 'synthetic-odd-discount', originalPrice: 333, discountPercent: 33 },
      { id: 'synthetic-zero-discount', originalPrice: 1000, discountPercent: 0 },
      { id: 'synthetic-full-discount', originalPrice: 1000, discountPercent: 100 },
    ];

    const mismatches = [];
    cases.forEach(p => {
      PRICING_FUNCTIONS.forEach(name => {
        [false, true].forEach(withFrame => {
          // Only getPaintingEffectivePrice takes the frame argument
          if (withFrame && name !== 'getPaintingEffectivePrice') return;
          const a = client[name](p, withFrame);
          const b = server[name](p, withFrame);
          if (a !== b) {
            mismatches.push(`${name}(${p.id}${withFrame ? ', withFrame' : ''}): client=${a}, server=${b}`);
          }
        });
      });
    });

    assert(mismatches.length === 0,
      'Pricing logic has drifted between js/paintings.js and functions/api/create-checkout.js:\n  ' +
      mismatches.join('\n  '));
  });

  console.log('\n' + colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.blue + 'CHECKOUT TEST RESULTS' + colors.reset);
  console.log(colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset);
  console.log(`\nTotal tests: ${testCount}`);
  console.log(`${colors.green}Passed: ${testCount - errorCount}${colors.reset}`);

  if (errorCount > 0) {
    console.log(`${colors.red}Failed: ${errorCount}${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}Failed: 0${colors.reset}`);
    console.log(`\n${colors.green}✓ All checkout tests passed!${colors.reset}\n`);
    process.exit(0);
  }
}

runTests().catch(err => {
  log.error(`Unhandled error: ${err.message}`);
  process.exit(1);
});
