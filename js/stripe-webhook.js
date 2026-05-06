const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Image URLs for each print - UPDATE THESE with your actual high-res image URLs
const PRINT_IMAGES = {
  'min-mamma': 'https://vaavascanvas.se/images/min-mamma-hires.jpg',
  'efter-ide': 'https://vaavascanvas.se/images/efter-ide-hires.jpg',
  'sommarvila': 'https://vaavascanvas.se/images/sommarvila-hires.jpg',
};

// Gelato product UIDs for fine art prints
const GELATO_UIDS = {
  'A4': 'fine-art-print_210x297-mm_vertical',
  'A3': 'fine-art-print_297x420-mm_vertical',
  'A2': 'fine-art-print_420x594-mm_vertical',
  '30x30': 'fine-art-print_300x300-mm',
  '40x40': 'fine-art-print_400x400-mm',
  '50x50': 'fine-art-print_500x500-mm',
};

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const { printId, size, title } = session.metadata;
    const shipping = session.shipping_details;

    // Build Gelato order
    const gelatoOrder = {
      orderReferenceId: session.id,
      customerReferenceId: session.customer_email || session.id,
      currency: 'SEK',
      items: [
        {
          itemReferenceId: `${printId}-${size}`,
          productUid: GELATO_UIDS[size] || 'fine-art-print_210x297-mm_vertical',
          files: [
            {
              type: 'default',
              url: PRINT_IMAGES[printId],
            },
          ],
          quantity: 1,
        },
      ],
      shippingAddress: {
        firstName: shipping?.name?.split(' ')[0] || '',
        lastName: shipping?.name?.split(' ').slice(1).join(' ') || '',
        addressLine1: shipping?.address?.line1 || '',
        addressLine2: shipping?.address?.line2 || '',
        city: shipping?.address?.city || '',
        postCode: shipping?.address?.postal_code || '',
        country: shipping?.address?.country || 'SE',
      },
    };

    try {
      const response = await fetch('https://order.gelatoapis.com/v4/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.GELATO_API_KEY,
        },
        body: JSON.stringify(gelatoOrder),
      });

      const result = await response.json();
      console.log('Gelato order placed:', result);
    } catch (err) {
      console.error('Gelato order failed:', err);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
