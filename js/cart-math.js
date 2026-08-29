// cart-math.js — the cart's money rules, with no DOM and no globals
//
// Split out of cart.js so the arithmetic a buyer is shown can be called
// directly by tests/cart-math.js. Everything here is a plain function over its
// arguments: same input, same output, no reading of `paintings`, `document` or
// module state.
//
// Loaded as a plain <script> before cart.js (so the names are globals in the
// browser) and required by the tests in Node via the export tail at the bottom.

// Shipping rates — must stay in sync with functions/api/create-checkout.js,
// which recalculates them server-side (tests/validate.js enforces this)
const FREE_SHIPPING_THRESHOLD = 599;
const SHIPPING_COST_SE = 59;
const SHIPPING_COST_EU = 149;

// ── Totals ────────────────────────────────────────────────────

function calcSubtotal(items) {
  return items.reduce((sum, i) => sum + i.price * (i.qty || 1), 0);
}

// `country` is '' until the buyer picks one, which is treated as Sweden for
// display purposes — the drawer blocks checkout until a real choice is made
function calcShipping(subtotal, country) {
  if (country === 'EU') return SHIPPING_COST_EU;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST_SE;
}

function calcTotal(items, country) {
  const subtotal = calcSubtotal(items);
  return subtotal + calcShipping(subtotal, country);
}

function calcCount(items) {
  return items.reduce((sum, i) => sum + (i.qty || 1), 0);
}

// ── Bookmark group pricing ────────────────────────────────────

// Bookmarks are priced as a group: buying several drops every one of them to
// the lower per-piece price. Each bookmark is one physical piece, so the count
// that matters is how many are in the cart, not their quantities — the same
// thing getBookmarkUnitPrice() counts server-side in create-checkout.js.
//
// `catalogEntry` is the bookmark product from the catalog, or null when it
// cannot be resolved; the prices stored on the cart items are the fallback so
// an older localStorage cart still totals up to something sane.
function resolveBookmarkPricing(bookmarks, catalogEntry) {
  if (!bookmarks || bookmarks.length === 0) return null;

  const stored = bookmarks[0];
  const base = catalogEntry?.originalPrice ?? stored.basePrice ?? stored.price;
  const multiPrice = catalogEntry?.multiBuyPrice ?? stored.multiBuyPrice ?? base;
  const minQuantity = catalogEntry?.multiBuyMinQuantity ?? stored.multiBuyMinQuantity ?? 2;

  return {
    base,
    multiPrice,
    minQuantity,
    unitPrice: bookmarks.length >= minQuantity ? multiPrice : base,
  };
}

// Writes the settled prices back onto the cart items. Mutates in place because
// the cart holds on to item identity elsewhere (lookups go by `key`).
function applyBookmarkPricing(items, catalogEntry) {
  const bookmarks = items.filter(i => i.type === 'bookmark');
  const pricing = resolveBookmarkPricing(bookmarks, catalogEntry);
  if (!pricing) return null;

  bookmarks.forEach(i => {
    i.basePrice = pricing.base;
    i.multiBuyPrice = pricing.multiPrice;
    i.multiBuyMinQuantity = pricing.minQuantity;
    i.price = pricing.unitPrice;
  });

  return pricing;
}

// ── Struck-through prices ─────────────────────────────────────

// The "was" price, or null when the item is at full price. Discounted originals
// compare against their pre-discount price; bookmarks against the single-piece
// price they lose once the multi-buy rate applies.
function cartItemOldPrice(item) {
  if (item.type === 'original') {
    const before = item.withFrame ? item.originalFramedPrice : item.originalBasePrice;
    const now = item.withFrame ? item.framedPrice : item.basePrice;
    return before && before !== now ? before : null;
  }
  return item.basePrice && item.price < item.basePrice ? item.basePrice : null;
}

// ── Node export tail (ignored by the browser) ─────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
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
  };
}
