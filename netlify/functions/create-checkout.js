const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { items } = JSON.parse(event.body);

    if (!items || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No items in cart' }) };
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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${event.headers.origin}/?order=success`,
      cancel_url: `${event.headers.origin}/pages/pictures.html`,
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
