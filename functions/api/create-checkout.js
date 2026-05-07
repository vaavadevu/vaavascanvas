import Stripe from 'stripe';

export async function onRequestPost(context) {
  try {
  const stripe = new Stripe(context.env.STRIPE_SECRET_KEY);

  let items, shipping;
  try {
    ({ items, shipping } = await context.request.json());
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!items || items.length === 0) {
    return Response.json({ error: 'No items in cart' }, { status: 400 });
  }

  const line_items = items.map(item => ({
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
      unit_amount: item.price * 100,
    },
    quantity: item.qty || 1,
  }));

  if (shipping && shipping > 0) {
    line_items.push({
      price_data: {
        currency: 'sek',
        product_data: {
          name: 'Frakt',
          description: 'Leverans inom Sverige',
        },
        unit_amount: shipping * 100,
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
        allowed_countries: ['SE', 'NO', 'DK', 'FI', 'DE', 'NL', 'GB'],
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
    return Response.json({ error: err.message }, { status: 500 });
  }
  } catch (err) {
    console.error('Function error:', err);
    return Response.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
