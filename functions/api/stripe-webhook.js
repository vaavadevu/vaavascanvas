import Stripe from 'stripe';

export async function onRequestPost(context) {
  const stripe = new Stripe(context.env.STRIPE_SECRET_KEY);
  const sig = context.request.headers.get('stripe-signature');
  const body = await context.request.text();

  let stripeEvent;
  try {
    stripeEvent = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      context.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const shipping = session.shipping_details;

    let items = [];
    try {
      items = JSON.parse(session.metadata.items || '[]');
    } catch (e) {
      console.error('Failed to parse items metadata:', e);
    }

    console.log('Order received:', {
      sessionId: session.id,
      customerEmail: session.customer_email,
      items,
      shippingAddress: shipping,
      totalAmount: session.amount_total / 100,
    });

    const originalItems = items.filter(i => i.type === 'original');
    if (originalItems.length > 0) {
      console.log('Original painting order – requires manual processing:', {
        sessionId: session.id,
        items: originalItems,
        shippingAddress: shipping,
      });
    }
  }

  return Response.json({ received: true });
}
