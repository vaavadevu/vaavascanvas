import Stripe from 'stripe';

// Server-side price catalog — never trust client-supplied prices
const PAINTINGS = [
  { id: 'herrOchFruAndersson', originalPrice: 3200, status: 'sold' },
  { id: 'aldrigEnsam', originalPrice: 600, status: 'for_sale' },
  { id: 'operationBaver', originalPrice: 600, status: 'for_sale' },
  { id: 'skymningsDrom', originalPrice: 2000, status: 'for_sale' },
  { id: 'koslapp', framedPrice: 3500, framedOnly: true, frameAvailable: true, status: 'sold' },
  { id: 'narhet', framedPrice: 2500, framedOnly: true, frameAvailable: true, status: 'for_sale' },
  { id: 'tjuvsmak', originalPrice: 600, status: 'for_sale' },
  { id: 'maskrosdrom', originalPrice: 600, status: 'for_sale' },
  { id: 'frihet', originalPrice: 600, status: 'sold' },
  { id: 'lodjur', originalPrice: 600, status: 'sold' },
  { id: 'kattuggla', originalPrice: 600, status: 'for_sale' },
  { id: 'tropisktBad', originalPrice: 600, status: 'sold' },
  { id: 'busungen', originalPrice: 600, status: 'for_sale' },
  { id: 'breadwinner', originalPrice: 600, status: 'for_sale' },
  { id: 'minMamma', originalPrice: 1500, framedPrice: 1800, frameAvailable: true, status: 'for_sale' },
  { id: 'solvarmeISkogen', originalPrice: 1500, status: 'sold' },
  { id: 'underHennesVingar', originalPrice: 1800, status: 'for_sale' },
  { id: 'vidAn', originalPrice: 1500, status: 'for_sale' },
  { id: 'enLerigDrom', originalPrice: 1800, status: 'for_sale' },
  { id: 'efterIde', originalPrice: 1500, framedPrice: 1800, frameAvailable: true, status: 'sold' },
  { id: 'sommarstuga', originalPrice: 1500, status: 'sold' },
  { id: 'sommarPaStranden', originalPrice: 1500, status: 'for_sale' },
  { id: 'skaViPlockaBlommor', originalPrice: 1500, status: 'sold' },
  { id: 'varkansla', originalPrice: 1500, status: 'sold' },
  { id: 'vargen', originalPrice: 1800, status: 'for_sale' },
  { id: 'skogsvila', originalPrice: 3000, status: 'sold' },
  { id: 'vinterlek', originalPrice: 1800, status: 'sold' },
  { id: 'sommarvila', originalPrice: 1800, status: 'for_sale' },
  { id: 'dagensFynd', originalPrice: 1200, status: 'for_sale' },
  { id: 'sugenPaEttApple', originalPrice: 1800, framedPrice: 2000, frameAvailable: true, status: 'for_sale' },
  { id: 'varlek', originalPrice: 1600, framedPrice: 1900, frameAvailable: true, status: 'for_sale' },
  { id: 'foreStormen', originalPrice: 1600, status: 'for_sale' },
  { id: 'photobomb', originalPrice: 1600, status: 'for_sale' },
  { id: 'rav', originalPrice: 250, status: 'sold' },
  { id: 'bjorn', originalPrice: 250, status: 'for_sale' },
  { id: 'tiger', originalPrice: 250, status: 'for_sale' },
  { id: 'mallard', originalPrice: 250, status: 'for_sale' },
  { id: 'owl', originalPrice: 250, status: 'for_sale' },
  { id: 'pigeon', originalPrice: 250, status: 'for_sale' },
  { id: 'piggy', originalPrice: 250, status: 'for_sale' },
  { id: 'robin', originalPrice: 250, status: 'for_sale' },
  { id: 'blame', originalPrice: 250, status: 'for_sale' },
  { id: 'kanin', originalPrice: 250, status: 'for_sale' },
];

// Bookmark inventory — one entry per physical bookmark, keyed by the same id
// the catalogue and the cart use. Generated from data/bookmarks.json by
// scripts/build-paintings.js. Bookmarks are kept out of PAINTINGS because
// their per-piece price depends on how many of them the order holds.
const BOOKMARKS = {
  price: 120,
  multiBuyPrice: 100,
  multiBuyMinQuantity: 2,
  variants: {
    'bookmark-cheetah': { title: 'Gepard', status: 'sold', image: '/images/bookmarks/cheetah/desktop/01.jpg' },
    'bookmark-chicken1': { title: 'Tupp', status: 'sold', image: '/images/bookmarks/chicken1/desktop/01.jpg' },
    'bookmark-chicken2': { title: 'Höna', status: 'for_sale', image: '/images/bookmarks/chicken2/desktop/01.jpg' },
    'bookmark-giraffe': { title: 'Giraff', status: 'sold', image: '/images/bookmarks/giraffe/desktop/01.jpg' },
    'bookmark-mallard': { title: 'Gräsand', status: 'for_sale', image: '/images/bookmarks/mallard/desktop/01.jpg' },
    'bookmark-pigeon': { title: 'Duva', status: 'sold', image: '/images/bookmarks/pigeon/desktop/01.jpg' },
    'bookmark-piggy': { title: 'Gris', status: 'sold', image: '/images/bookmarks/piggy/desktop/01.jpg' },
    'bookmark-pingvin': { title: 'Pingvin', status: 'sold', image: '/images/bookmarks/pingvin/desktop/01.jpg' },
    'bookmark-rabbit': { title: 'Kanin', status: 'sold', image: '/images/bookmarks/rabbit/desktop/01.jpg' },
    'bookmark-wilddog': { title: 'Afrikansk vildhund', status: 'for_sale', image: '/images/bookmarks/wilddog/desktop/01.jpg' },
    'bookmark-bear': { title: 'Björn', status: 'for_sale', image: '/images/bookmarks/bear/desktop/01.jpg' },
    'bookmark-cow': { title: 'Ko', status: 'sold', image: '/images/bookmarks/cow/desktop/01.jpg' },
  },
};

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

const FREE_SHIPPING_THRESHOLD = 599;
const SHIPPING_COST_SE = 59;
const SHIPPING_COST_EU = 149;

const EU_COUNTRIES = ['AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR','HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK'];

function resolvePrice(item) {
  if (item.type !== 'original') {
    return null;
  }

  const isFramed = typeof item.id === 'string' && item.id.endsWith('-framed');
  const baseId = isFramed ? item.id.slice(0, -7) : item.id;
  const painting = PAINTINGS.find(p => p.id === baseId);
  if (!painting || painting.status === 'sold') return null;
  return getPaintingEffectivePrice(painting, isFramed || painting.framedOnly) ?? null;
}

// The cart carries a bookmark under its catalogue id, `bookmark-cheetah`,
// the same as any other piece
function resolveBookmark(item) {
  if (typeof item.id !== 'string') return null;
  const bookmark = BOOKMARKS.variants[item.id];
  if (!bookmark || bookmark.status !== 'for_sale') return null;
  return bookmark;
}

// Buying several at once drops every bookmark to the lower per-piece price
function getBookmarkUnitPrice(bookmarksInOrder) {
  return bookmarksInOrder >= BOOKMARKS.multiBuyMinQuantity
    ? BOOKMARKS.multiBuyPrice
    : BOOKMARKS.price;
}

export async function onRequestPost(context) {
  try {
    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY);

    let items, country;
    try {
      ({ items, country } = await context.request.json());
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'No items in cart' }, { status: 400 });
    }

    const origin = new URL(context.request.url).origin;

    const line_items = [];
    let subtotal = 0;
    const claimedBookmarks = new Set();

    // The per-piece price depends on how many bookmarks the whole order holds,
    // so it is settled before any line item is priced. Invalid bookmarks reject
    // the order outright, so counting them up front cannot inflate the discount.
    const bookmarkUnitPrice = getBookmarkUnitPrice(
      items.filter(item => item.type === 'bookmark').length
    );

    const invalidItem = item => Response.json(
      { error: `Invalid item: ${item.id} (${item.type}${item.size ? ', ' + item.size : ''})` },
      { status: 400 }
    );

    for (const item of items) {
      // Each bookmark is one physical piece: no quantities, no duplicates,
      // and never one that has already been sold
      if (item.type === 'bookmark') {
        const bookmark = resolveBookmark(item);
        if (!bookmark || claimedBookmarks.has(item.id)) return invalidItem(item);
        claimedBookmarks.add(item.id);

        const price = bookmarkUnitPrice;
        subtotal += price;

        line_items.push({
          price_data: {
            currency: 'sek',
            product_data: {
              name: `Bokmärke – ${bookmark.title}`,
              description: 'Handgjort bokmärke. Leverans inom Sverige.',
              images: [`${origin}${bookmark.image}`],
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        });
        continue;
      }

      const price = resolvePrice(item);
      if (price === null) return invalidItem(item);

      const qty = Math.max(1, Math.floor(item.qty || 1));
      subtotal += price * qty;

      line_items.push({
        price_data: {
          currency: 'sek',
          product_data: {
            name: `${item.title} – Original målning`,
            description: 'Signerat original på duk. Leverans inom Sverige.',
            ...(item.image ? { images: [item.image] } : {}),
          },
          unit_amount: price * 100,
        },
        quantity: qty,
      });
    }

    const isEU = country === 'EU';
    const shippingCost = isEU ? SHIPPING_COST_EU : (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST_SE);
    if (shippingCost > 0) {
      line_items.push({
        price_data: {
          currency: 'sek',
          product_data: { name: 'Frakt', description: 'Leverans inom Sverige' },
          unit_amount: shippingCost * 100,
        },
        quantity: 1,
      });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        line_items,
        mode: 'payment',
        success_url: `${origin}/?order=success`,
        cancel_url: `${origin}/pictures/`,
        shipping_address_collection: {
          allowed_countries: EU_COUNTRIES,
        },
        metadata: {
          items: JSON.stringify(items.map(i => ({
            id: i.id, title: i.title, type: i.type,
            size: i.size || null, qty: i.qty || 1,
          }))),
        },
        locale: 'sv',
      });

      return Response.json({ url: session.url });
    } catch (err) {
      console.error('Stripe error:', err);
      return Response.json({ error: 'Payment session could not be created' }, { status: 500 });
    }
  } catch (err) {
    console.error('Function error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
