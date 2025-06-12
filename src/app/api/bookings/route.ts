
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/utils/db';
import Booking from '@/models/Booking';
import PropertyModel from '@/models/Property';
import * as z from 'zod';
import { differenceInCalendarDays, differenceInCalendarWeeks, differenceInCalendarMonths, startOfDay } from 'date-fns';

const bookingSchema = z.object({
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
      return NextResponse.json({ message: 'Unauthorized: You must be logged in to make a booking.' }, { status: 401 });
    }

    const guestId = session.user.id;
    const body = await request.json();
    const parsedBody = bookingSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ message: 'Invalid booking data provided.', errors: parsedBody.error.format() }, { status: 400 });
    }

    const { propertyId, startDate, endDate } = parsedBody.data;

    await connectDB();

    const property = await PropertyModel.findById(propertyId);
    if (!property) {
      return NextResponse.json({ message: 'Property not found.' }, { status: 404 });
    }

    // Basic conflict check (can be expanded later to check existing bookings)
    if (property.availableFrom && startDate < startOfDay(new Date(property.availableFrom))) {
        return NextResponse.json({ message: 'Booking start date is before property availability window.' }, { status: 400 });
    }
    if (property.availableTo && endDate > startOfDay(new Date(property.availableTo))) {
        return NextResponse.json({ message: 'Booking end date is after property availability window.' }, { status: 400 });
    }

    // Simplified price calculation
    let numberOfUnits = 0;
    if (property.pricePeriod === 'nightly') {
      numberOfUnits = differenceInCalendarDays(endDate, startDate);
    } else if (property.pricePeriod === 'weekly') {
      // For weekly, ensure it's at least a week.
      // This logic might need refinement based on how partial weeks are handled.
      numberOfUnits = differenceInCalendarDays(endDate, startDate) / 7;
    } else if (property.pricePeriod === 'monthly') {
      // Similar for monthly.
      numberOfUnits = differenceInCalendarDays(endDate, startDate) / 30; // Approximation
    }

    if (numberOfUnits <= 0) {
        return NextResponse.json({ message: 'Booking duration is invalid for the selected price period.' }, { status: 400 });
    }
    const totalPrice = property.price * numberOfUnits;


    // TODO: Advanced conflict detection - check if these dates overlap with existing bookings for this property.
    // For now, we'll skip this and allow overlapping bookings for simplicity in this step.

    const newBooking = new Booking({
      listingId: propertyId,
      guestId,
      startDate: startOfDay(startDate),
      endDate: startOfDay(endDate),
      totalPrice,
      paymentStatus: 'pending',
    });

    await newBooking.save();

    return NextResponse.json({ message: 'Booking request received. Awaiting confirmation.', bookingId: newBooking._id.toString() }, { status: 201 });

  } catch (error: any) {
    console.error('[API /bookings POST] Error creating booking:', error);
    let errorMessage = 'An unexpected error occurred while creating the booking.';
     if (error.name === 'MongoNetworkError') {
        errorMessage = 'Database connection error. Please try again later.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage, errorDetails: error.toString() }, { status: 500 });
  }
}
