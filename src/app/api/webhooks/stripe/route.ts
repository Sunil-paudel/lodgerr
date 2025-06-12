
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/utils/db';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment';
import { Readable } from 'stream';

// **WARNING: Hardcoded Stripe Secret Key for testing. Remove before deployment!**
const STRIPE_SECRET_KEY = "sk_test_51RZ79aD5LRi4lJMY7yYuDQ8aRlBJPpAqdHdYhHOZvcSWSgJWvSzQVM3sACZJzcdWo1VHKdnZKVxxkzZJWgVYb5fz00TC8f8KKK";

// **WARNING: Hardcoded Stripe Webhook Secret. Replace with your actual secret from Stripe Dashboard!**
// ** This endpoint WILL NOT WORK securely without the correct webhook secret. **
const WEBHOOK_SECRET = "whsec_YOUR_STRIPE_WEBHOOK_SIGNING_SECRET"; // <-- REPLACE THIS!

const stripe = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

async function requestToBuffer(request: NextRequest) {
    const reader = request.body?.getReader();
    if (!reader) {
        throw new Error('Failed to get reader from request body for webhook');
    }
    const chunks: Uint8Array[] = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
    }
    return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  if (!WEBHOOK_SECRET || WEBHOOK_SECRET === "whsec_YOUR_STRIPE_WEBHOOK_SIGNING_SECRET") {
    console.error("Stripe webhook secret is not configured or is using the placeholder. Please set it up in your Stripe Dashboard and update the code.");
    return NextResponse.json({ message: "Webhook secret not configured. Payment confirmation will fail." }, { status: 500 });
  }
  
  let event: Stripe.Event;
  const sig = request.headers.get('stripe-signature');

  try {
    const rawBody = await requestToBuffer(request);
    if (!sig) {
      console.warn("Stripe webhook error: Missing signature.");
      return NextResponse.json({ message: "Missing Stripe signature." }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error(`Stripe webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ message: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  await connectDB();

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('[Webhook] Checkout session completed:', session.id);

      const bookingId = session.client_reference_id || session.metadata?.bookingId;
      const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;


      if (!bookingId) {
        console.error('[Webhook] Error: bookingId not found in session client_reference_id or metadata.', session);
        return NextResponse.json({ message: 'Booking ID missing in session data.' }, { status: 400 });
      }
      if (!paymentIntentId) {
        console.error('[Webhook] Error: payment_intent ID not found in session.', session);
        return NextResponse.json({ message: 'Payment Intent ID missing in session data.' }, { status: 400 });
      }

      try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
          console.error(`[Webhook] Booking not found with ID: ${bookingId}`);
          return NextResponse.json({ message: 'Booking not found.' }, { status: 404 });
        }

        if (booking.paymentStatus === 'paid') {
          console.log(`[Webhook] Booking ${bookingId} already marked as paid. Ignoring duplicate event.`);
          return NextResponse.json({ received: true, message: 'Booking already processed.' });
        }

        booking.paymentStatus = 'paid';
        booking.bookingStatus = 'confirmed_by_host';
        await booking.save();
        console.log(`[Webhook] Booking ${bookingId} updated to paid and confirmed.`);

        const newPayment = new Payment({
          bookingId: booking._id,
          stripePaymentIntentId: paymentIntentId,
          amount: session.amount_total, 
          currency: session.currency?.toLowerCase() || 'usd',
          status: 'succeeded',
        });
        await newPayment.save();
        console.log(`[Webhook] Payment record created for booking ${bookingId}, paymentIntent ${paymentIntentId}`);

      } catch (dbError: any) {
        console.error(`[Webhook] Database error processing session ${session.id} for booking ${bookingId}:`, dbError);
        return NextResponse.json({ message: 'Database error processing payment.', error: dbError.message }, { status: 500 });
      }
      break;
    
    case 'checkout.session.async_payment_failed':
      const failedSession = event.data.object as Stripe.Checkout.Session;
      console.log('[Webhook] Checkout session async payment failed:', failedSession.id);
      const failedBookingId = failedSession.client_reference_id || failedSession.metadata?.bookingId;
      if (failedBookingId) {
        try {
            const bookingToUpdate = await Booking.findById(failedBookingId);
            if (bookingToUpdate && bookingToUpdate.paymentStatus !== 'paid') {
                bookingToUpdate.paymentStatus = 'failed';
                await bookingToUpdate.save();
                console.log(`[Webhook] Booking ${failedBookingId} paymentStatus updated to failed.`);
            }
        } catch (dbError: any) {
            console.error(`[Webhook] Database error updating booking ${failedBookingId} for async_payment_failed:`, dbError);
        }
      }
      break;

    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
