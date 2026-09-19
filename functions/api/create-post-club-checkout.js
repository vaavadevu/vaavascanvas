import Stripe from 'stripe';

const POST_CLUB_PRICE = 10900;

export async function onRequestPost(context) {
  try {
    const origin = new URL(context.request.url).origin;
    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'sek',
          product_data: {
            name: 'Djurvänners Postklubb',
            description: 'Ett konsttryck i A5 på fotopapper, ett laminerat bokmärke, två stickers och ett brev om kvartalets djur. Nytt tema varje kvartal. Frakt inom Sverige ingår.',
          },
          unit_amount: POST_CLUB_PRICE,
        },
        quantity: 1,
      }],
      customer_creation: 'always',
      shipping_address_collection: { allowed_countries: ['SE'] },
      metadata: {
        orderType: 'post-club',
      },
      success_url: `${origin}/pages/post-club.html?postClub=success`,
      cancel_url: `${origin}/pages/post-club.html?postClub=cancelled`,
      locale: 'sv',
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Could not create post club checkout:', error);
    return Response.json({ error: 'Payment session could not be created' }, { status: 500 });
  }
}