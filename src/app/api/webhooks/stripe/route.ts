
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/utils/db';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment'; // Assuming you have a Payment model
import { Readable } from 'stream';

// Ensure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are set in your .env.local
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper to convert NextRequest stream to Node.js Readable stream
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


// Disable Next.js body parsing for this route to access the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error("Stripe webhook secret is not configured.");
    return NextResponse.json({ message: "Webhook secret not configured." }, { status: 500 });
  }
  
  let event: Stripe.Event;
  const sig = request.headers.get('stripe-signature');

  try {
    const rawBody = await requestToBuffer(request);
    if (!sig) {
      console.warn("Stripe webhook error: Missing signature.");
      return NextResponse.json({ message: "Missing Stripe signature." }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Stripe webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ message: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  await connectDB();

  // Handle the event
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

        // Update Booking
        booking.paymentStatus = 'paid';
        booking.bookingStatus = 'confirmed_by_host'; // Or 'payment_successful_awaiting_final_confirmation'
        await booking.save();
        console.log(`[Webhook] Booking ${bookingId} updated to paid and confirmed.`);

        // Create Payment record
        const newPayment = new Payment({
          bookingId: booking._id,
          stripePaymentIntentId: paymentIntentId,
          // stripeChargeId might need to be retrieved separately if not directly on paymentIntent or if using charges API
          amount: session.amount_total, // amount_total is in cents
          currency: session.currency?.toLowerCase() || 'usd',
          status: 'succeeded', // from Stripe's perspective
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
                // bookingToUpdate.bookingStatus = 'payment_failed'; // Potentially add a new status
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
