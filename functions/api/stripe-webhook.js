import Stripe from 'stripe';

const PRINT_IMAGES = {
  'min-mamma': 'https://vaavascanvas.se/images/hires/minmamma.jpg',
  'efter-ide': 'https://vaavascanvas.se/images/hires/efteride.jpg',
  'sommarvila': 'https://vaavascanvas.se/images/hires/sommarvila.jpg',
};

const GELATO_UIDS = {
  'A4': 'fine-art-print_210x297-mm_vertical',
  'A3': 'fine-art-print_297x420-mm_vertical',
  'A2': 'fine-art-print_420x594-mm_vertical',
  '30x30': 'fine-art-print_300x300-mm',
  '40x40': 'fine-art-print_400x400-mm',
  '50x50': 'fine-art-print_500x500-mm',
};

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

    const printItems = items.filter(i => i.type === 'print');
    for (const item of printItems) {
      try {
        const response = await fetch('https://order.gelatoapis.com/v4/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': context.env.GELATO_API_KEY,
          },
          body: JSON.stringify({
            orderReferenceId: `${session.id}-${item.id}`,
            customerReferenceId: session.customer_email || session.id,
            currency: 'SEK',
            items: [{
              itemReferenceId: `${item.id}-${item.size}`,
              productUid: GELATO_UIDS[item.size] || 'fine-art-print_210x297-mm_vertical',
              files: [{ type: 'default', url: PRINT_IMAGES[item.id] }],
              quantity: item.qty || 1,
            }],
            shippingAddress: {
              firstName: shipping?.name?.split(' ')[0] || '',
              lastName: shipping?.name?.split(' ').slice(1).join(' ') || '',
              addressLine1: shipping?.address?.line1 || '',
              addressLine2: shipping?.address?.line2 || '',
              city: shipping?.address?.city || '',
              postCode: shipping?.address?.postal_code || '',
              country: shipping?.address?.country || 'SE',
            },
          }),
        });
        const result = await response.json();
        console.log('Gelato order placed:', result);
      } catch (err) {
        console.error('Gelato order failed:', err);
      }
    }

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
