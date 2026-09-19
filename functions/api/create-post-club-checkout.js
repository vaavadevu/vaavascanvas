import Stripe from 'stripe';

const POST_CLUB_PRICE = 14900;

// Breven går ut första veckan i januari, april, juli och oktober, och
// betalningen för ett brev dras den 25:e månaden innan.
//
// Samma regler står i js/post-club.js, som räknar fram datumen sidan visar.
// tests/checkout.js jämför de två så att de inte glider isär — det är pengar
// och leveranser som hänger på att de säger samma sak.
const SHIP_MONTHS = [1, 4, 7, 10];
const CHARGE_DAY = 25;

function chargeDate(id) {
  const [year, month] = id.split('-').map(Number);
  return new Date(Date.UTC(year, month - 2, CHARGE_DAY));
}

// Hela dragningsdagen räknas som i tid — det är den 26:e man är för sen.
function cutoff(id) {
  const [year, month] = id.split('-').map(Number);
  return new Date(Date.UTC(year, month - 2, CHARGE_DAY + 1));
}

// Brevet en ny medlem får: det första vars dragningsdag inte redan passerat.
// Går man med den 26:e hamnar man alltså i nästa kvartal.
export function nextShipmentId(now = new Date()) {
  for (let year = now.getUTCFullYear(); year <= now.getUTCFullYear() + 2; year++) {
    for (const month of SHIP_MONTHS) {
      const id = `${year}-${String(month).padStart(2, '0')}`;
      if (cutoff(id) > now) return id;
    }
  }
  return null;
}

// Dragningen efter anmälan: den som betalar brevet därpå, tre månader senare.
export function nextChargeSeconds(now = new Date()) {
  const first = chargeDate(nextShipmentId(now));
  const after = new Date(Date.UTC(
    first.getUTCFullYear(),
    first.getUTCMonth() + 3,
    CHARGE_DAY
  ));
  return Math.floor(after.getTime() / 1000);
}

export async function onRequestPost(context) {
  try {
    const origin = new URL(context.request.url).origin;
    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY);
    const now = new Date();

    // Anmälan betalas som ett engångsköp och kortet sparas. Prenumerationen
    // skapas sedan av webhooken, med första dragningen låst till den 25:e.
    // Checkout kan inte göra båda delarna i ett svep: ett engångspris går inte
    // att kombinera med proration_behavior none, och ett billing_cycle_anchor
    // måste ligga inom den första faktureringsperioden — den 25:e ligger
    // utanför tre månader för den som går med tidigt i kvartalet.
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
      payment_intent_data: { setup_future_usage: 'off_session' },
      shipping_address_collection: { allowed_countries: ['SE'] },
      metadata: {
        orderType: 'post-club',
        firstShipment: nextShipmentId(now),
        nextChargeAt: String(nextChargeSeconds(now)),
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
