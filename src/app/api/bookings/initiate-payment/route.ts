
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import Stripe from 'stripe';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/utils/db';
import Booking from '@/models/Booking';
import PropertyModel from '@/models/Property';
import * as z from 'zod';
import { differenceInCalendarDays, startOfDay } from 'date-fns';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
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

    await connectDB();

    const property = await PropertyModel.findById(propertyId);
    if (!property) {
      return NextResponse.json({ message: 'Property not found.' }, { status: 404 });
    }

    // Basic conflict check with property's general availability window
    if (property.availableFrom && startDate < startOfDay(new Date(property.availableFrom))) {
        return NextResponse.json({ message: 'Booking start date is before property availability window.' }, { status: 400 });
    }
    if (property.availableTo && endDate > startOfDay(new Date(property.availableTo))) {
        return NextResponse.json({ message: 'Booking end date is after property availability window.' }, { status: 400 });
    }
    
    // TODO: Advanced conflict detection - check if these dates overlap with existing CONFIRMED bookings.

    let numberOfUnits = 0;
    if (property.pricePeriod === 'nightly') {
      numberOfUnits = differenceInCalendarDays(endDate, startDate);
    } else if (property.pricePeriod === 'weekly') {
      numberOfUnits = Math.ceil(differenceInCalendarDays(endDate, startDate) / 7);
    } else if (property.pricePeriod === 'monthly') {
      numberOfUnits = Math.ceil(differenceInCalendarDays(endDate, startDate) / 30);
    }
     if (numberOfUnits <= 0 && !(property.pricePeriod === 'nightly' && differenceInCalendarDays(endDate, startDate) === 0) ) {
        return NextResponse.json({ message: 'Booking duration is invalid for the selected price period.' }, { status: 400 });
    }
    if (property.pricePeriod === 'nightly' && numberOfUnits === 0 && differenceInCalendarDays(endDate, startDate) === 0) {
        numberOfUnits = 1; 
    }
    const totalPrice = property.price * Math.max(numberOfUnits, 1);

    // Create a booking record in our database first
    const newBooking = new Booking({
      listingId: propertyId,
      guestId,
      startDate: startOfDay(startDate),
      endDate: startOfDay(endDate),
      totalPrice,
      paymentStatus: 'pending',
      bookingStatus: 'pending_payment', // New status
    });
    await newBooking.save();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    // Create a Stripe Checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd', // Make this configurable if needed
            product_data: {
              name: property.title,
              images: property.images && property.images.length > 0 ? [property.images[0]] : undefined,
            },
            unit_amount: Math.round(totalPrice * 100), // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${newBooking._id.toString()}`,
      cancel_url: `${appUrl}/booking/cancel?booking_id=${newBooking._id.toString()}`,
      client_reference_id: newBooking._id.toString(), // Our internal booking ID
      metadata: {
        bookingId: newBooking._id.toString(),
        propertyId: propertyId,
        guestId: guestId,
      }
    });

    if (!stripeSession.id) {
        // If session creation fails, we might want to roll back our booking or mark it as failed.
        // For now, log and return an error.
        console.error("Stripe session creation failed for booking:", newBooking._id);
        await Booking.findByIdAndDelete(newBooking._id); // Simple rollback
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
