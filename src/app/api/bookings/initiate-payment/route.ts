
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import Stripe from 'stripe';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/utils/db';
import Booking from '@/models/Booking';
import PropertyModel from '@/models/Property';
import * as z from 'zod';
import { differenceInCalendarDays, startOfDay, format } from 'date-fns';

// **WARNING: Hardcoded Stripe Secret Key for testing. Remove before deployment!**
const STRIPE_SECRET_KEY = "sk_test_51RZ79aD5LRi4lJMY7yYuDQ8aRlBJPpAqdHdYhHOZvcSWSgJWvSzQVM3sACZJzcdWo1VHKdnZKVxxkzZJWgVYb5fz00TC8f8KKK";

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

// **WARNING: Hardcoded App URL for testing. Revert to process.env for deployment!**
const APP_URL = "https://6000-firebase-studio-1749627677554.cluster-sumfw3zmzzhzkx4mpvz3ogth4y.cloudworkstations.dev";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized: You must be logged in.' }, { status: 401 });
    }

    const guestId = session.user.id;
    const body = await request.json();
    const parsedBody = initiatePaymentSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ message: 'Invalid data provided.', errors: parsedBody.error.format() }, { status: 400 });
    }

    const { propertyId, startDate, endDate } = parsedBody.data;
    const normalizedStartDate = startOfDay(startDate);
    const normalizedEndDate = startOfDay(endDate);


    await connectDB();

    const property = await PropertyModel.findById(propertyId);
    if (!property) {
      return NextResponse.json({ message: 'Property not found.' }, { status: 404 });
    }

    if (property.hostId.toString() === guestId) {
        return NextResponse.json({ message: 'Hosts cannot book their own properties.' }, { status: 403 });
    }

    // Basic conflict check with property's general availability window
    if (property.availableFrom && normalizedStartDate < startOfDay(new Date(property.availableFrom))) {
        return NextResponse.json({ message: 'Booking start date is before property availability window.' }, { status: 400 });
    }
    if (property.availableTo && normalizedEndDate > startOfDay(new Date(property.availableTo))) {
        return NextResponse.json({ message: 'Booking end date is after property availability window.' }, { status: 400 });
    }
    
    // Advanced conflict detection: Check against existing confirmed/pending bookings
    const conflictingBooking = await Booking.findOne({
      listingId: propertyId,
      bookingStatus: { $in: ['confirmed_by_host', 'pending_confirmation'] }, 
      startDate: { $lt: normalizedEndDate },
      endDate: { $gt: normalizedStartDate },
    });

    if (conflictingBooking) {
      return NextResponse.json({ message: 'These dates are no longer available for this property. Please choose different dates.' }, { status: 409 }); 
    }

    let numberOfUnits = 0;
    if (property.pricePeriod === 'nightly') {
      numberOfUnits = differenceInCalendarDays(normalizedEndDate, normalizedStartDate);
    } else if (property.pricePeriod === 'weekly') {
      numberOfUnits = Math.ceil(differenceInCalendarDays(normalizedEndDate, normalizedStartDate) / 7);
    } else if (property.pricePeriod === 'monthly') {
      numberOfUnits = Math.ceil(differenceInCalendarDays(normalizedEndDate, normalizedStartDate) / 30);
    }
     if (numberOfUnits <= 0 && !(property.pricePeriod === 'nightly' && differenceInCalendarDays(normalizedEndDate, normalizedStartDate) === 0) ) {
        return NextResponse.json({ message: 'Booking duration is invalid for the selected price period.' }, { status: 400 });
    }
    if (property.pricePeriod === 'nightly' && numberOfUnits === 0 && differenceInCalendarDays(normalizedEndDate, normalizedStartDate) === 0) {
        numberOfUnits = 1; 
    }
    const totalPrice = property.price * Math.max(numberOfUnits, 1);

    const newBooking = new Booking({
      listingId: propertyId,
      guestId,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      totalPrice,
      paymentStatus: 'pending',
      bookingStatus: 'pending_payment', 
    });
    await newBooking.save();

    const appUrl = APP_URL; // Using hardcoded value for now
    // For a proper setup, use:
    // const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    // if (!appUrl) {
    //   console.error("[API /bookings/initiate-payment POST] Error: NEXT_PUBLIC_APP_URL is not set in environment variables.");
    //   return NextResponse.json({ message: 'Application URL is not configured. Cannot create Stripe session.' }, { status: 500 });
    // }


    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd', 
            product_data: {
              name: `${property.title} (Booking: ${newBooking._id.toString()})`,
              description: `Stay from ${format(normalizedStartDate, 'MMM dd, yyyy')} to ${format(normalizedEndDate, 'MMM dd, yyyy')}`,
              images: property.images && property.images.length > 0 ? [property.images[0]] : undefined,
            },
            unit_amount: Math.round(totalPrice * 100), 
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${newBooking._id.toString()}`,
      cancel_url: `${appUrl}/booking/cancel?booking_id=${newBooking._id.toString()}&property_id=${propertyId}`,
      client_reference_id: newBooking._id.toString(), 
      metadata: {
        bookingId: newBooking._id.toString(),
        propertyId: propertyId,
        guestId: guestId,
      },
      customer_email: session.user.email,
    });

    if (!stripeSession.id) {
        await Booking.findByIdAndDelete(newBooking._id); 
        return NextResponse.json({ message: 'Failed to initiate payment session with provider.' }, { status: 500 });
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
