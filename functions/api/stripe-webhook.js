import Stripe from 'stripe';

// Prenumerationen skapas här, inte i Checkout. Skälet står i
// create-post-club-checkout.js: Checkout kan inte ta betalt direkt och
// samtidigt lägga första dragningen på den 25:e.
async function startPostClubSubscription(stripe, env, session) {
  const priceId = env.STRIPE_POST_CLUB_PRICE_ID;
  if (!priceId) {
    throw new Error('STRIPE_POST_CLUB_PRICE_ID is not set — subscription not created');
  }

  const trialEnd = Number(session.metadata?.nextChargeAt);
  if (!Number.isFinite(trialEnd)) {
    throw new Error(`Missing nextChargeAt on session ${session.id}`);
  }

  // Kortet sparades vid betalningen; hämta det så prenumerationen kan dra på det
  const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

  const subscription = await stripe.subscriptions.create({
    customer: session.customer,
    items: [{ price: priceId }],
    // Ingen dragning förrän den 25:e — anmälningsavgiften är redan betald
    trial_end: trialEnd,
    default_payment_method: paymentIntent.payment_method,
    metadata: {
      orderType: 'post-club',
      firstShipment: session.metadata?.firstShipment || '',
      checkoutSession: session.id,
    },
  }, {
    // Stripe kan leverera samma event två gånger; utan detta blir det två
    // prenumerationer på samma medlem
    idempotencyKey: `post-club-${session.id}`,
  });

  console.log('Post club subscription started:', {
    subscriptionId: subscription.id,
    customer: session.customer,
    firstShipment: session.metadata?.firstShipment,
    firstChargeAt: new Date(trialEnd * 1000).toISOString(),
  });
}

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

  // ── Postklubbens prenumeration ─────────────────────────────────

  if (stripeEvent.type === 'invoice.paid') {
    const invoice = stripeEvent.data.object;
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      if (subscription.metadata?.orderType === 'post-club') {
        // Den här raden är signalen om att ett brev ska packas
        console.log('Post club payment received — letter due:', {
          subscriptionId: subscription.id,
          customer: invoice.customer,
          customerEmail: invoice.customer_email,
          amount: invoice.amount_paid / 100,
          periodStart: new Date(invoice.period_start * 1000).toISOString(),
        });
      }
    }
    return Response.json({ received: true });
  }

  if (stripeEvent.type === 'invoice.payment_failed') {
    const invoice = stripeEvent.data.object;
    console.error('Post club payment failed — no letter until this is resolved:', {
      subscriptionId: invoice.subscription,
      customer: invoice.customer,
      customerEmail: invoice.customer_email,
      attemptCount: invoice.attempt_count,
    });
    return Response.json({ received: true });
  }

  if (stripeEvent.type === 'customer.subscription.deleted') {
    const subscription = stripeEvent.data.object;
    if (subscription.metadata?.orderType === 'post-club') {
      console.log('Post club membership ended:', {
        subscriptionId: subscription.id,
        customer: subscription.customer,
        endedAt: new Date(subscription.ended_at * 1000).toISOString(),
      });
    }
    return Response.json({ received: true });
  }

  // ── Köp i butiken ──────────────────────────────────────────────

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const shipping = session.shipping_details;

    if (session.metadata?.orderType === 'post-club') {
      console.log('Post club order received:', {
        sessionId: session.id,
        customerEmail: session.customer_email,
        shippingAddress: shipping,
        totalAmount: session.amount_total / 100,
        firstShipment: session.metadata.firstShipment,
      });

      // Ett fel här får inte sväljas: medlemmen har betalat men skulle stå utan
      // prenumeration. Status 500 gör att Stripe försöker igen i upp till tre
      // dygn, vilket räcker för att hinna rätta till exempelvis ett saknat
      // pris-ID.
      try {
        await startPostClubSubscription(stripe, context.env, session);
      } catch (err) {
        console.error('Could not start post club subscription:', err.message, {
          sessionId: session.id,
          customer: session.customer,
        });
        return new Response('Subscription could not be created', { status: 500 });
      }

      return Response.json({ received: true });
    }

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
