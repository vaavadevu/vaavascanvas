import Stripe from 'stripe';

const POST_CLUB_PRICE = 10000;

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!name || name.length > 120 || !email || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) {
      return Response.json({ error: 'Name and a valid email are required' }, { status: 400 });
    }

    const origin = new URL(context.request.url).origin;
    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'sek',
          product_data: {
            name: 'Djurvänners Post Club',
            description: 'Ett brev med konst, bokmärke, stickers och små överraskningar. Leverans inom Sverige.',
          },
          unit_amount: POST_CLUB_PRICE,
        },
        quantity: 1,
      }],
      customer_email: email,
      shipping_address_collection: { allowed_countries: ['SE'] },
      metadata: {
        orderType: 'post-club',
        name,
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