
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import Stripe from 'stripe';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/utils/db';
import Booking, { type BookingDocument } from '@/models/Booking';
import PropertyModel, { type PropertyDocument } from '@/models/Property';
import BookedDateRangeModel from '@/models/BookedDateRange'; // Import new model
import UserModel, { type IUser } from '@/models/User';
import * as z from 'zod';
import { differenceInCalendarDays, startOfDay, format } from 'date-fns';
import { sendEmail } from '@/utils/mailer';
import mongoose from 'mongoose';
import type { BookingStatus } from '@/lib/types';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

const initiatePaymentSchema = z.object({
  propertyId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Invalid property ID format.",
  }),
  startDate: z.coerce.date().refine((date) => date >= startOfDay(new Date()), {
    message: "Start date cannot be in the past.",
  }),
  endDate: z.coerce.date(),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date.",
  path: ["endDate"],
});

const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:9002'; // Use NEXTAUTH_URL with a fallback

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id || !session.user.email) {
      return NextResponse.json({ message: 'Unauthorized: You must be logged in and have an email address.' }, { status: 401 });
    }

    const guestId = session.user.id;
    const guestEmail = session.user.email;
    const guestName = session.user.name || 'Valued Guest';

    const body = await request.json();
    const parsedBody = initiatePaymentSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ message: 'Invalid data provided.', errors: parsedBody.error.format() }, { status: 400 });
    }

    const { propertyId, startDate, endDate } = parsedBody.data;
    const normalizedStartDate = startOfDay(startDate);
    const normalizedEndDate = startOfDay(endDate);

    await connectDB();

    let property = await PropertyModel.findById(propertyId) as PropertyDocument | null;
    if (!property) {
      return NextResponse.json({ message: 'Property not found.' }, { status: 404 });
    }

    if (property.hostId.toString() === guestId) {
        return NextResponse.json({ message: 'Hosts cannot book their own properties.' }, { status: 403 });
    }

    if (property.availableFrom && normalizedStartDate < startOfDay(new Date(property.availableFrom))) {
        return NextResponse.json({ message: 'Booking start date is before property availability window.' }, { status: 400 });
    }
    if (property.availableTo && normalizedEndDate > startOfDay(new Date(property.availableTo))) {
        return NextResponse.json({ message: 'Booking end date is after property availability window.' }, { status: 400 });
    }

    // Check for conflicting BookedDateRange documents
    const conflictingRangeDoc = await BookedDateRangeModel.findOne({
      propertyId: new mongoose.Types.ObjectId(propertyId),
      status: { $in: ['confirmed_by_host', 'pending_confirmation', 'pending_payment'] as BookingStatus[] },
      startDate: { $lt: normalizedEndDate },
      endDate: { $gt: normalizedStartDate },
    });

    if (conflictingRangeDoc) {
      console.log("[API /bookings/initiate-payment POST] Conflict found with existing BookedDateRange document:", conflictingRangeDoc._id.toString(), "Status:", conflictingRangeDoc.status);
      return NextResponse.json({ message: 'These dates are no longer available for this property. Please choose different dates.' }, { status: 409 });
    }

    let numberOfUnits = 0;
    if (property.pricePeriod === 'nightly') {
      numberOfUnits = differenceInCalendarDays(normalizedEndDate, normalizedStartDate);
      if (numberOfUnits === 0 && normalizedStartDate.getTime() === normalizedEndDate.getTime()){
        numberOfUnits = 1;
      }
    } else if (property.pricePeriod === 'weekly') {
      numberOfUnits = Math.max(1, Math.ceil(differenceInCalendarDays(normalizedEndDate, normalizedStartDate) / 7));
    } else if (property.pricePeriod === 'monthly') {
      numberOfUnits = Math.max(1, Math.ceil(differenceInCalendarDays(normalizedEndDate, normalizedStartDate) / 30));
    }

     if (numberOfUnits <= 0) {
        return NextResponse.json({ message: 'Booking duration is invalid for the selected price period.' }, { status: 400 });
    }

    const totalPrice = property.price * numberOfUnits;

    const newBooking = new Booking({
      listingId: property._id,
      guestId: new mongoose.Types.ObjectId(guestId),
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      totalPrice,
      paymentStatus: 'pending',
      bookingStatus: 'pending_payment',
    }) as BookingDocument;
    await newBooking.save();
    console.log("[API /bookings/initiate-payment POST] New pending_payment booking created:", newBooking._id.toString());

    // Create a new BookedDateRange document
    const newBookedDateRange = new BookedDateRangeModel({
        propertyId: property._id,
        bookingId: newBooking._id,
        startDate: newBooking.startDate,
        endDate: newBooking.endDate,
        status: 'pending_payment', // Initial status
    });
    await newBookedDateRange.save();
    console.log(`[API /bookings/initiate-payment POST] New BookedDateRange document created: ${newBookedDateRange._id.toString()} for booking ${newBooking._id.toString()}`);

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${property.title} (Booking: ${newBooking._id.toString()})`,
              description: `Stay from ${format(normalizedStartDate, 'MMM dd, yyyy')} to ${format(normalizedEndDate, 'MMM dd, yyyy')}. Property ID: ${propertyId}`,
              images: property.images && property.images.length > 0 ? [property.images[0]] : undefined,
            },
            unit_amount: Math.round(totalPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${APP_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${newBooking._id.toString()}`,
      cancel_url: `${APP_URL}/booking/cancel?booking_id=${newBooking._id.toString()}&property_id=${propertyId}`,
      client_reference_id: newBooking._id.toString(),
      metadata: {
        bookingId: newBooking._id.toString(),
        propertyId: propertyId,
        guestId: guestId,
      },
      customer_email: guestEmail,
    });

    if (!stripeSession.id) {
        console.warn("[API /bookings/initiate-payment POST] Stripe session creation failed. Deleting temporary booking and booked date range:", newBooking._id.toString());
        await Booking.findByIdAndDelete(newBooking._id);
        await BookedDateRangeModel.findOneAndDelete({ bookingId: newBooking._id });
        console.warn(`[API /bookings/initiate-payment POST] Cleaned up booking ${newBooking._id.toString()} and associated BookedDateRange due to Stripe failure.`);
        return NextResponse.json({ message: 'Failed to initiate payment session with provider.' }, { status: 500 });
    }
    console.log("[API /bookings/initiate-payment POST] Stripe session created:", stripeSession.id, "for booking:", newBooking._id.toString());

    const formattedStartDateString = format(normalizedStartDate, 'MMMM dd, yyyy');
    const formattedEndDateString = format(normalizedEndDate, 'MMMM dd, yyyy');

    const guestEmailResult = await sendEmail({
      to: guestEmail,
      subject: `Your Booking for ${property.title} is Pending Payment`,
      text: `Hi ${guestName},\n\nYour booking request for "${property.title}" from ${formattedStartDateString} to ${formattedEndDateString} for a total of $${totalPrice.toFixed(2)} is currently pending payment.\n\nYour booking is not confirmed until payment is successfully completed. You should have been redirected to Stripe to finalize your payment. If not, please check your browser or contact support.\n\nBooking ID: ${newBooking._id.toString()}\n\nThank you,\nThe Lodger Team`,
      html: `<p>Hi ${guestName},</p><p>Your booking request for <strong>"${property.title}"</strong> from <strong>${formattedStartDateString}</strong> to <strong>${formattedEndDateString}</strong> for a total of <strong>$${totalPrice.toFixed(2)}</strong> is currently pending payment.</p><p>Your booking is not confirmed until payment is successfully completed. You should have been redirected to Stripe to finalize your payment. If not, please check your browser or contact support.</p><p>Booking ID: ${newBooking._id.toString()}</p><p>Thank you,<br/>The Lodger Team</p>`,
    });
    if (guestEmailResult.success) {
      console.log(`[API /bookings/initiate-payment POST] Pending payment email sent to guest ${guestEmail} for booking ${newBooking._id.toString()}`);
    } else {
      console.warn(`[API /bookings/initiate-payment POST] Failed to send pending payment email to guest ${guestEmail} for booking ${newBooking._id.toString()}. Error: ${guestEmailResult.error}`);
    }

    const hostUser = await UserModel.findById(property.hostId).lean() as IUser | null;
    if (hostUser && hostUser.email) {
      const hostEmailResult = await sendEmail({
        to: hostUser.email,
        subject: `Action Required: Booking Request (Pending Payment) for ${property.title}`,
        text: `Hi ${hostUser.name || 'Host'},\n\nA guest (${guestName}, ${guestEmail}) has initiated a booking for your property "${property.title}" for the dates ${formattedStartDateString} to ${formattedEndDateString}.\n\nThe booking is currently pending payment by the guest. No action is required from you at this moment. You will be notified once the payment is confirmed and the booking status changes.\n\nBooking ID: ${newBooking._id.toString()}\nProperty ID: ${property.id}\n\nRegards,\nThe Lodger Team`,
        html: `<p>Hi ${hostUser.name || 'Host'},</p><p>A guest (<strong>${guestName}</strong>, ${guestEmail}) has initiated a booking for your property "<strong>${property.title}</strong>" for the dates <strong>${formattedStartDateString}</strong> to <strong>${formattedEndDateString}</strong>.</p><p>The booking is currently pending payment by the guest. No action is required from you at this moment. You will be notified once the payment is confirmed and the booking status changes.</p><p>Booking ID: ${newBooking._id.toString()}<br/>Property ID: ${property.id}</p><p>Regards,<br/>The Lodger Team</p>`,
      });
       if (hostEmailResult.success) {
        console.log(`[API /bookings/initiate-payment POST] Pending payment notification sent to host ${hostUser.email} for booking ${newBooking._id.toString()}`);
      } else {
        console.warn(`[API /bookings/initiate-payment POST] Failed to send pending payment notification to host ${hostUser.email} for booking ${newBooking._id.toString()}. Error: ${hostEmailResult.error}`);
      }
    } else {
      console.warn(`[API /bookings/initiate-payment POST] Could not find host email for property ${property.id} to send pending payment notification. Host ID: ${property.hostId}`);
    }

    return NextResponse.json({ sessionId: stripeSession.id }, { status: 200 });

  } catch (error: any) {
    console.error('[API /bookings/initiate-payment POST] Error:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error.name === 'MongoNetworkError') {
      errorMessage = 'Database connection error.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage, errorDetails: error.toString() }, { status: 500 });
  }
}
