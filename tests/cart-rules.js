#!/usr/bin/env node

/**
 * Cart rules unit tests for Vaavascanvas
 *
 * js/cart-rules.js decides what may go in the cart and whether checkout may
 * proceed. The rules it encodes are the fiddly ones — a one-of-a-kind piece
 * cannot be ordered twice, and picking the framed version of a painting has to
 * swap out the unframed one rather than sell the same canvas twice — so they
 * are worth pinning down away from the drawer's DOM code.
 *
 * See tests/cart-math.js for the arithmetic half.
 */

const {
  cartItemKey,
  isUniqueItem,
  paintingBaseId,
  withoutFrameVariants,
  resolveAdd,
  validateCheckout,
  buildOrderItems,
} = require('../js/cart-rules.js');

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

// Cart lines as the cart itself stores them: `key` is assigned on the way in
const inCart = (item) => ({ ...item, key: cartItemKey(item) });

const original = (id, extra = {}) => ({
  id, title: 'A painting', type: 'original', price: 1500,
  paintingBaseId: id.replace(/-framed$/, ''), ...extra,
});
const bookmark = (variant) => ({
  id: `bookmarks::${variant}`, title: 'Bookmark', type: 'bookmark', price: 120,
});
const shopItem = (id, extra = {}) => ({ id, title: 'A print', type: 'shop', price: 200, ...extra });

console.log('\n' + colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset);
console.log(colors.blue + 'VAAVASCANVAS CART RULES UNIT TESTS' + colors.reset);
console.log(colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset + '\n');

// ─────────────────────────────────────────────────────────────
// SUITE 1: Keys and identity
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '[1] KEYS AND IDENTITY' + colors.reset);

test('Items without a size are keyed as originals', () => {
  assertEqual(cartItemKey({ id: 'vargen' }), 'vargen-original', 'Wrong key for a sizeless item');
});

test('The size is part of the key', () => {
  assertEqual(cartItemKey({ id: 'poster', size: 'A3' }), 'poster-A3', 'Size was not included in the key');
  assert(cartItemKey({ id: 'poster', size: 'A3' }) !== cartItemKey({ id: 'poster', size: 'A4' }),
    'Two sizes of one product must not share a key');
});

// Everything the shop sells is the only one of itself: the canvas, the fired
// clay piece and the hand-painted bookmark all exist once. Only a repeatable
// product — a print, were there ever one — takes a quantity.
test('Everything handmade is one of a kind', () => {
  assertEqual(isUniqueItem({ type: 'original' }), true, 'Originals are one of a kind');
  assertEqual(isUniqueItem({ type: 'clay' }), true, 'Clay pieces are one of a kind');
  assertEqual(isUniqueItem({ type: 'bookmark' }), true, 'Bookmarks are one of a kind');
  assertEqual(isUniqueItem({ type: 'shop' }), false, 'A repeatable product still takes a quantity');
});

test('A second copy of a one-of-a-kind piece is refused, not counted up', () => {
  ['original', 'clay', 'bookmark'].forEach(type => {
    const item = { id: 'a-piece', type };
    const inCart = [{ ...item, key: cartItemKey(item), qty: 1 }];
    assertEqual(resolveAdd(inCart, item).action, 'duplicate',
      `Adding a second ${type} should be refused, not raise a quantity`);
  });
});

test('Frame variants collapse to the same painting', () => {
  assertEqual(paintingBaseId({ id: 'minMamma-framed' }), 'minMamma', '-framed suffix was not stripped');
  assertEqual(paintingBaseId({ id: 'minMamma' }), 'minMamma', 'Unframed id should be unchanged');
});

test('An explicit paintingBaseId wins over the id', () => {
  assertEqual(paintingBaseId({ id: 'anything-framed', paintingBaseId: 'minMamma' }), 'minMamma',
    'The stored base id should be preferred');
});

// ─────────────────────────────────────────────────────────────
// SUITE 2: Adding one-of-a-kind pieces
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[2] ADDING ONE-OF-A-KIND PIECES' + colors.reset);

test('An original goes into an empty cart', () => {
  const outcome = resolveAdd([], original('vargen'));
  assertEqual(outcome.action, 'add', 'A painting should be added to an empty cart');
  assertEqual(outcome.key, 'vargen-original', 'Wrong key on the new line');
});

test('The same original cannot be added twice', () => {
  const cart = [inCart(original('vargen'))];
  assertEqual(resolveAdd(cart, original('vargen')).action, 'duplicate',
    'A second copy of a one-of-a-kind painting must be refused');
});

test('The same bookmark variant cannot be added twice', () => {
  const cart = [inCart(bookmark('cheetah'))];
  assertEqual(resolveAdd(cart, bookmark('cheetah')).action, 'duplicate',
    'Each bookmark is one physical piece');
});

test('A different bookmark variant is a new line', () => {
  const cart = [inCart(bookmark('cheetah'))];
  assertEqual(resolveAdd(cart, bookmark('mallard')).action, 'add',
    'A different variant is a different piece');
});

// ─────────────────────────────────────────────────────────────
// SUITE 3: Frame variants
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[3] FRAME VARIANTS' + colors.reset);

test('Adding the framed version replaces the unframed one', () => {
  const cart = [inCart(original('minMamma'))];
  const outcome = resolveAdd(cart, original('minMamma-framed'));

  assertEqual(outcome.action, 'replace', 'The unframed copy should be swapped out');
  assertEqual(outcome.baseId, 'minMamma', 'Wrong painting flagged for replacement');
});

test('Adding the unframed version replaces the framed one', () => {
  const cart = [inCart(original('minMamma-framed'))];
  const outcome = resolveAdd(cart, original('minMamma'));

  assertEqual(outcome.action, 'replace', 'The framed copy should be swapped out');
  assertEqual(outcome.baseId, 'minMamma', 'Wrong painting flagged for replacement');
});

test('Replacing removes only the matching painting', () => {
  const cart = [
    inCart(original('minMamma')),
    inCart(original('vargen')),
    inCart(bookmark('cheetah')),
  ];
  const remaining = withoutFrameVariants(cart, 'minMamma').map(i => i.id);

  assertEqual(remaining.join(','), 'vargen,bookmarks::cheetah',
    'Only the frame-variants of the named painting should be removed');
});

test('A different painting is added rather than replacing', () => {
  const cart = [inCart(original('minMamma'))];
  assertEqual(resolveAdd(cart, original('vargen')).action, 'add',
    'An unrelated painting must not replace anything');
});

test('Frame variants are matched even without a stored base id', () => {
  // Older carts predate paintingBaseId, so the id has to carry the rule
  const cart = [{ id: 'minMamma', type: 'original', key: 'minMamma-original', price: 1500 }];
  const incoming = { id: 'minMamma-framed', type: 'original', price: 1800 };

  assertEqual(resolveAdd(cart, incoming).action, 'replace',
    'The -framed suffix alone should be enough to spot the variant');
});

// ─────────────────────────────────────────────────────────────
// SUITE 4: Repeatable products
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[4] REPEATABLE PRODUCTS' + colors.reset);

test('A repeatable product already in the cart raises its quantity', () => {
  const cart = [inCart(shopItem('poster', { size: 'A3' }))];
  const outcome = resolveAdd(cart, shopItem('poster', { size: 'A3' }));

  assertEqual(outcome.action, 'increment', 'A second one should raise the quantity');
  assertEqual(outcome.key, 'poster-A3', 'Wrong line flagged for the increment');
});

test('A different size of the same product is its own line', () => {
  const cart = [inCart(shopItem('poster', { size: 'A3' }))];
  assertEqual(resolveAdd(cart, shopItem('poster', { size: 'A4' })).action, 'add',
    'Two sizes should be two lines');
});

test('Adding never mutates the cart it was asked about', () => {
  const cart = [inCart(original('minMamma'))];
  const before = JSON.stringify(cart);

  resolveAdd(cart, original('minMamma-framed'));
  resolveAdd(cart, original('minMamma'));
  resolveAdd(cart, shopItem('poster'));

  assertEqual(JSON.stringify(cart), before, 'resolveAdd must only decide, never change the cart');
});

// ─────────────────────────────────────────────────────────────
// SUITE 5: Checkout validation
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[5] CHECKOUT VALIDATION' + colors.reset);

test('A country and accepted terms let checkout through', () => {
  const result = validateCheckout({ country: 'SE', termsAccepted: true });
  assertEqual(result.ok, true, 'A complete form should pass');
  assertEqual(result.blockers.length, 0, 'A passing form should list no blockers');
});

test('An unchosen country blocks checkout', () => {
  const result = validateCheckout({ country: '', termsAccepted: true });
  assertEqual(result.ok, false, 'Checkout must not proceed without a shipping region');
  assertEqual(result.blockers.join(','), 'country', 'Only the country should be flagged');
});

test('Unaccepted terms block checkout', () => {
  const result = validateCheckout({ country: 'SE', termsAccepted: false });
  assertEqual(result.ok, false, 'Checkout must not proceed without accepting the terms');
  assertEqual(result.blockers.join(','), 'terms', 'Only the terms should be flagged');
});

test('Both problems are reported at once', () => {
  // So the buyer is not made to discover them one at a time
  const result = validateCheckout({ country: '', termsAccepted: false });
  assertEqual(result.ok, false, 'An empty form should not pass');
  assertEqual(result.blockers.join(','), 'country,terms', 'Both blockers should be reported together');
});

// ─────────────────────────────────────────────────────────────
// SUITE 6: Order payload
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[6] ORDER PAYLOAD' + colors.reset);

test('Order items carry the fields analytics and the receipt need', () => {
  const [line] = buildOrderItems([{ id: 'vargen', title: 'Vargen', type: 'original', price: 1800, qty: 1 }]);
  assertEqual(line.item_id, 'vargen', 'Wrong item_id');
  assertEqual(line.item_name, 'Vargen', 'Wrong item_name');
  assertEqual(line.item_category, 'original', 'Wrong item_category');
  assertEqual(line.price, 1800, 'Wrong price');
  assertEqual(line.quantity, 1, 'Wrong quantity');
});

test('A missing quantity is reported as one', () => {
  const [line] = buildOrderItems([{ id: 'vargen', title: 'Vargen', type: 'original', price: 1800 }]);
  assertEqual(line.quantity, 1, 'Unique items are stored without a qty and should report 1');
});

test('An empty cart produces an empty payload', () => {
  assertEqual(buildOrderItems([]).length, 0, 'An empty cart should produce no order lines');
});

// ─────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────

console.log('\n' + colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset);
console.log(colors.blue + 'CART RULES TEST RESULTS' + colors.reset);
console.log(colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset);
console.log(`\nTotal tests: ${testCount}`);
console.log(`${colors.green}Passed: ${testCount - errorCount}${colors.reset}`);

if (errorCount > 0) {
  console.log(`${colors.red}Failed: ${errorCount}${colors.reset}\n`);
  process.exit(1);
} else {
  console.log(`${colors.green}Failed: 0${colors.reset}`);
  console.log(`\n${colors.green}✓ All cart rules tests passed!${colors.reset}\n`);
  process.exit(0);
}
