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
    const { items: itemsJson } = session.metadata;
    
    let items = [];
    try {
      items = JSON.parse(itemsJson || '[]');
    } catch (e) {
      console.error('Failed to parse items metadata:', e);
      items = [];
    }

    const shipping = session.shipping_details;

    console.log('Order received:', {
      sessionId: session.id,
      customerEmail: session.customer_email,
      items,
      shippingAddress: shipping,
      totalAmount: session.amount_total / 100,
    });

    // Handle print orders with Gelato integration
    const printItems = items.filter(item => item.type === 'print');
    for (const item of printItems) {
      const gelatoOrder = {
        orderReferenceId: `${session.id}-${item.id}`,
        customerReferenceId: session.customer_email || session.id,
        currency: 'SEK',
        items: [
          {
            itemReferenceId: `${item.id}-${item.size}`,
            productUid: GELATO_UIDS[item.size] || 'fine-art-print_210x297-mm_vertical',
            files: [
              {
                type: 'default',
                url: PRINT_IMAGES[item.id],
              },
            ],
            quantity: item.qty || 1,
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

    // Handle original paintings (requires manual processing)
    const originalItems = items.filter(item => item.type === 'original');
    if (originalItems.length > 0) {
      console.log('Original painting order - requires manual processing:', {
        sessionId: session.id,
        items: originalItems,
        shippingAddress: shipping,
      });
      // TODO: Implement email notification or database storage for original painting orders
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
