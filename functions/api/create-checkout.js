import Stripe from 'stripe';

// Server-side price catalog — never trust client-supplied prices
const PAINTINGS = [
  { id: 'herrOchFruAndersson', originalPrice: 3200, status: 'sold' },
  { id: 'aldrigEnsam',         originalPrice: 700,  status: 'for_sale' },
  { id: 'operationBaver',      originalPrice: 700,  status: 'for_sale' },
  { id: 'koslapp',             framedPrice: 3600, framedOnly: true, status: 'for_sale' },
  { id: 'tjuvsmak',            originalPrice: 700,  status: 'for_sale' },
  { id: 'maskrosdrom',         originalPrice: 700,  status: 'for_sale' },
  { id: 'vattenfall',          originalPrice: 1100, status: 'sold' },
  { id: 'minMamma',            originalPrice: 1600, framedPrice: 1900, frameAvailable: true, status: 'for_sale' },
  { id: 'solnedgang',          originalPrice: 1100, status: 'for_sale' },
  { id: 'solvarmeISkogen',     originalPrice: 1900, status: 'sold' },
  { id: 'efterIde',            originalPrice: 2300, framedPrice: 2600, frameAvailable: true, status: 'for_sale' },
  { id: 'sommarstuga',         originalPrice: 1600, status: 'sold' },
  { id: 'sommarPaStranden',    originalPrice: 1900, status: 'for_sale' },
  { id: 'skaViPlockaBlommor',  originalPrice: 1600, status: 'sold' },
  { id: 'savannan',            originalPrice: 1600, status: 'for_sale' },
  { id: 'varkansla',           originalPrice: 1600, status: 'sold' },
  { id: 'norrsken',            originalPrice: 1100, status: 'for_sale' },
  { id: 'vargen',              originalPrice: 1600, status: 'for_sale' },
  { id: 'radjur',              originalPrice: 1600, status: 'for_sale' },
  { id: 'skogsvila',           originalPrice: 3100, status: 'for_sale' },
  { id: 'vinterlek',           originalPrice: 1600, status: 'sold' },
  { id: 'sommarvila',          originalPrice: 2100, status: 'for_sale' },
  { id: 'dagensFynd',          originalPrice: 2000, framedPrice: 2300, frameAvailable: true, status: 'for_sale' },
  { id: 'sugenPaEttApple',     originalPrice: 1900, framedPrice: 2200, frameAvailable: true, status: 'for_sale' },
  { id: 'varlek',              originalPrice: 2300, framedPrice: 2600, frameAvailable: true, status: 'for_sale' },
];

const PRINT_PRICES = {
  'A4': 450, 'A3': 550, 'A2': 650,
  '30x30': 450, '40x40': 550, '50x50': 650,
};

const PRINT_PAINTINGS = new Set(['minMamma', 'efterIde', 'sommarvila']);

const FREE_SHIPPING_THRESHOLD = 599;
const SHIPPING_COST_SE = 59;
const SHIPPING_COST_EU = 149;

const EU_COUNTRIES = ['AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR','HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK'];

function resolvePrice(item) {
  if (item.type === 'print') {
    const paintingPart = item.id.split('-print-')[0];
    const paintingCamel = paintingPart.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (!PRINT_PAINTINGS.has(paintingCamel)) return null;
    return PRINT_PRICES[item.size] ?? null;
  }

  if (item.type === 'original') {
    const isFramed = typeof item.id === 'string' && item.id.endsWith('-framed');
    const baseId = isFramed ? item.id.slice(0, -7) : item.id;
    const painting = PAINTINGS.find(p => p.id === baseId);
    if (!painting || painting.status === 'sold') return null;
    if (isFramed) return painting.framedPrice ?? null;
    if (painting.framedOnly) return painting.framedPrice ?? null;
    return painting.originalPrice ?? null;
  }

  return null;
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

    const line_items = [];
    let subtotal = 0;

    for (const item of items) {
      const price = resolvePrice(item);
      if (price === null) {
        return Response.json(
          { error: `Invalid item: ${item.id} (${item.type}${item.size ? ', ' + item.size : ''})` },
          { status: 400 }
        );
      }
      const qty = Math.max(1, Math.floor(item.qty || 1));
      subtotal += price * qty;

      line_items.push({
        price_data: {
          currency: 'sek',
          product_data: {
            name: item.type === 'print'
              ? `${item.title} – Fine Art Print (${item.size})`
              : `${item.title} – Original målning`,
            description: item.type === 'print'
              ? 'Trycks på beställning, arkivkvalitetspapper. Leverans 3–7 arbetsdagar.'
              : 'Signerat original på duk. Leverans inom Sverige.',
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

    const origin = new URL(context.request.url).origin;

    try {
      const session = await stripe.checkout.sessions.create({
        line_items,
        mode: 'payment',
        success_url: `${origin}/?order=success`,
        cancel_url: `${origin}/pages/pictures.html`,
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
