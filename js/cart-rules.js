// cart-rules.js — what may go in the cart, and whether checkout may proceed
//
// The companion to js/cart-math.js: that file works out what a cart costs, this
// one works out what belongs in it. Both are plain functions over their
// arguments with no DOM and no globals, so tests/cart-rules.js can call them
// directly. The toasts, the drawer and the shake animations stay in cart.js —
// only the decisions live here.
//
// Loaded as a plain <script> before cart.js (so the names are globals in the
// browser) and required by the tests in Node via the export tail at the bottom.

// A cart line is identified by product and size; everything without a size is
// keyed as 'original' so the same painting never lands twice under two keys
function cartItemKey(item) {
  return `${item.id}-${item.size || 'original'}`;
}

// One-of-a-kind pieces: a second copy can never be ordered. Everything in the
// shop is one — a painting, a clay piece, a bookmark — each is the only one
// there is, so none of them takes a quantity. The cart hides the +/- for these
// and refuses a second copy; create-checkout.js refuses one again, because the
// cart is the buyer's to edit.
const UNIQUE_ITEM_TYPES = ['original', 'clay', 'bookmark'];

function isUniqueItem(item) {
  return UNIQUE_ITEM_TYPES.includes(item.type);
}

// Framed and unframed are the same physical painting under two ids
// ('minMamma' and 'minMamma-framed'), so both collapse to the same base
function paintingBaseId(item) {
  return item.paintingBaseId || item.id.replace(/-framed$/, '');
}

// Drops every frame-variant of one painting, used when the buyer picks the
// other variant of something already in the cart
function withoutFrameVariants(items, baseId) {
  return items.filter(i => !(i.type === 'original' && paintingBaseId(i) === baseId));
}

// Decides what adding `item` to `items` should do, without changing either:
//
//   duplicate — a one-of-a-kind piece already in the cart; nothing to do
//   increment — a repeatable product already in the cart; raise its quantity
//   replace   — the other frame-variant of this painting is in the cart and
//               has to come out first (`baseId` says which painting)
//   add       — append it as a new line
function resolveAdd(items, item) {
  const key = cartItemKey(item);
  const existing = items.find(i => i.key === key);

  if (!isUniqueItem(item)) {
    return existing ? { action: 'increment', key } : { action: 'add', key };
  }

  if (existing) return { action: 'duplicate', key };

  if (item.type === 'original') {
    const baseId = paintingBaseId(item);
    const variantInCart = items.some(i => i.type === 'original' && paintingBaseId(i) === baseId);
    if (variantInCart) return { action: 'replace', key, baseId };
  }

  return { action: 'add', key };
}

// Checkout is blocked until the buyer has picked a shipping region and accepted
// the terms. Returns every blocker rather than the first, so the drawer can
// flag both at once instead of making the buyer discover them one at a time.
function validateCheckout({ country, termsAccepted }) {
  const blockers = [];
  if (!country) blockers.push('country');
  if (!termsAccepted) blockers.push('terms');
  return { ok: blockers.length === 0, blockers };
}

// The shape both the analytics events and the stored order summary use
function buildOrderItems(items) {
  return items.map(i => ({
    item_id: i.id,
    item_name: i.title,
    item_category: i.type,
    price: i.price,
    quantity: i.qty || 1,
  }));
}

// ── Node export tail (ignored by the browser) ─────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    cartItemKey,
    UNIQUE_ITEM_TYPES,
    isUniqueItem,
    paintingBaseId,
    withoutFrameVariants,
    resolveAdd,
    validateCheckout,
    buildOrderItems,
  };
}
