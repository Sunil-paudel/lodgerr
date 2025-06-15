
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/utils/db';
import Booking, { type BookingDocument } from '@/models/Booking';
import Payment from '@/models/Payment';
import BookedDateRangeModel from '@/models/BookedDateRange'; // Import new model
import mongoose from 'mongoose';

// Use the environment variable for the webhook secret
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
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
  // Check if the STRIPE_WEBHOOK_SECRET is configured
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("[Webhook] Stripe webhook secret (STRIPE_WEBHOOK_SECRET) is not configured in environment variables. Please set it up. Webhook processing will fail.");
    return NextResponse.json({ message: "Webhook secret not configured. Payment confirmation will fail." }, { status: 500 });
  }
  
  let event: Stripe.Event;
  const sig = request.headers.get('stripe-signature');

  try {
    const rawBody = await requestToBuffer(request);
    if (!sig) {
      console.warn("[Webhook] Stripe webhook error: Missing signature.");
      return NextResponse.json({ message: "Missing Stripe signature." }, { status: 400 });
    }
    // Use the environment variable STRIPE_WEBHOOK_SECRET here
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error(`[Webhook] Stripe webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ message: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  await connectDB();

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('[Webhook] Checkout session completed:', session.id);

      const bookingId = session.client_reference_id || session.metadata?.bookingId;
      const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

      if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
        console.error('[Webhook] Error: bookingId not found or invalid in session client_reference_id or metadata.', session);
        return NextResponse.json({ message: 'Booking ID missing or invalid in session data.' }, { status: 400 });
      }
      if (!paymentIntentId) {
        console.error('[Webhook] Error: payment_intent ID not found in session.', session);
        return NextResponse.json({ message: 'Payment Intent ID missing in session data.' }, { status: 400 });
      }

      try {
        const booking = await Booking.findById(bookingId) as BookingDocument | null;
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

        // Update BookedDateRange document
        const updatedBookedDateRange = await BookedDateRangeModel.findOneAndUpdate(
          { bookingId: booking._id },
          { $set: { status: "confirmed_by_host" } },
          { new: true }
        );

        if (updatedBookedDateRange) {
            console.log(`[Webhook] Updated BookedDateRange document for booking ${booking._id} to confirmed_by_host.`);
        } else {
            console.warn(`[Webhook] BookedDateRange document for booking ${booking._id} not found during completion. This might indicate an issue if it was expected to exist.`);
            // Optionally, create it if it's missing, though it should have been created in initiate-payment
            // For now, we'll just log a warning.
        }

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

      if (failedBookingId && mongoose.Types.ObjectId.isValid(failedBookingId)) {
        try {
            const bookingToUpdate = await Booking.findById(failedBookingId) as BookingDocument | null;
            if (bookingToUpdate && bookingToUpdate.paymentStatus !== 'paid') { // Ensure not already paid
                bookingToUpdate.paymentStatus = 'failed';
                // bookingToUpdate.bookingStatus = 'rejected_by_host'; // Or a new 'payment_failed' status
                await bookingToUpdate.save();
                console.log(`[Webhook] Booking ${failedBookingId} paymentStatus updated to 'failed'.`);

                // Remove the BookedDateRange document for failed payment
                const deletedRange = await BookedDateRangeModel.findOneAndDelete({ bookingId: bookingToUpdate._id });
                if (deletedRange) {
                    console.log(`[Webhook] Removed BookedDateRange document for booking ${bookingToUpdate._id} due to payment failure.`);
                } else {
                    console.warn(`[Webhook] BookedDateRange document for booking ${bookingToUpdate._id} not found when trying to remove after payment failure.`);
                }
            }
        } catch (dbError: any) {
            console.error(`[Webhook] Database error updating booking ${failedBookingId} for async_payment_failed:`, dbError);
        }
      } else {
          console.warn('[Webhook] Invalid or missing bookingId for checkout.session.async_payment_failed:', failedBookingId);
      }
      break;

    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

