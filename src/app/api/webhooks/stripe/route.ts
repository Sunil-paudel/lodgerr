
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/utils/db';
import Booking, { type BookingDocument } from '@/models/Booking';
import Payment from '@/models/Payment';
import PropertyModel, { type PropertyDocument } from '@/models/Property';
import mongoose from 'mongoose';

const STRIPE_SECRET_KEY = "sk_test_51RZ79aD5LRi4lJMY7yYuDQ8aRlBJPpAqdHdYhHOZvcSWSgJWvSzQVM3sACZJzcdWo1VHKdnZKVxxkzZJWgVYb5fz00TC8f8KKK";
const WEBHOOK_SECRET = "whsec_YOUR_STRIPE_WEBHOOK_SIGNING_SECRET"; 

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

        // Update Property's bookedDateRanges
        const property = await PropertyModel.findOneAndUpdate(
          { _id: booking.listingId, "bookedDateRanges.bookingId": booking._id },
          { $set: { "bookedDateRanges.$.status": "confirmed_by_host" } },
          { new: true }
        ) as PropertyDocument | null;

        if (property) {
            console.log(`[Webhook] Updated property ${property._id} bookedDateRanges for booking ${booking._id} to confirmed_by_host.`);
        } else {
            // If the specific subdocument wasn't found (e.g., if it was missed in initiate-payment) try to add it.
            // This scenario should be rare.
            const fallbackProperty = await PropertyModel.findById(booking.listingId) as PropertyDocument | null;
            if (fallbackProperty) {
                const existingRange = fallbackProperty.bookedDateRanges.find(r => r.bookingId.toString() === booking._id.toString());
                if (!existingRange) {
                    fallbackProperty.bookedDateRanges.push({
                        bookingId: booking._id.toString(), // Schema expects ObjectId, Mongoose handles casting
                        startDate: booking.startDate,
                        endDate: booking.endDate,
                        status: 'confirmed_by_host',
                    });
                    await fallbackProperty.save();
                    console.warn(`[Webhook] Added missing booking ${booking._id} to property ${fallbackProperty._id} bookedDateRanges as confirmed_by_host during completion.`);
                } else {
                     console.warn(`[Webhook] Booking ${booking._id} found in property ${fallbackProperty._id} but initial update query failed. Status might be already correct or another issue.`);
                }
            } else {
                console.warn(`[Webhook] Property ${booking.listingId} not found when trying to update bookedDateRanges for booking ${booking._id}.`);
            }
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

                // Remove from Property's bookedDateRanges for failed payment
                const property = await PropertyModel.findByIdAndUpdate(
                    bookingToUpdate.listingId,
                    { $pull: { bookedDateRanges: { bookingId: bookingToUpdate._id } } },
                    { new: true }
                ) as PropertyDocument | null;

                if (property) {
                    console.log(`[Webhook] Removed booking ${bookingToUpdate._id} from property ${property._id} bookedDateRanges due to payment failure.`);
                } else {
                    console.warn(`[Webhook] Property ${bookingToUpdate.listingId} not found when trying to remove booking ${bookingToUpdate._id} from bookedDateRanges after payment failure.`);
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
