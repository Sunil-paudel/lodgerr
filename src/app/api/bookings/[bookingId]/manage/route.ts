
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/utils/db';
import Booking, { type BookingDocument } from '@/models/Booking';
import Property from '@/models/Property';
import BookedDateRangeModel from '@/models/BookedDateRange';
import * as z from 'zod';
import type { BookingStatus, PaymentStatus } from '@/lib/types';

const manageBookingSchema = z.object({
  status: z.enum([
    'confirmed_by_host', 
    'rejected_by_host',
  ] as [BookingStatus, ...BookingStatus[]]), 
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized: You must be logged in.' }, { status: 401 });
    }

    const { bookingId } = params;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ message: 'Invalid booking ID format.' }, { status: 400 });
    }

    const body = await request.json();
    const parsedBody = manageBookingSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ message: 'Invalid request data.', errors: parsedBody.error.format() }, { status: 400 });
    }

    const { status: newStatus } = parsedBody.data;

    await connectDB();

    const booking = await Booking.findById(bookingId) as BookingDocument | null;
    if (!booking) {
      return NextResponse.json({ message: 'Booking not found.' }, { status: 404 });
    }

    // Allow action only if booking is currently 'pending_confirmation'
    if (booking.bookingStatus !== 'pending_confirmation') {
        return NextResponse.json({ message: `Cannot update booking. Current status is '${booking.bookingStatus}', not 'pending_confirmation'.`}, { status: 409 }); 
    }
    
    const tempProperty = await Property.findById(booking.listingId).lean(); 
    if (!tempProperty) {
      return NextResponse.json({ message: 'Associated property not found.' }, { status: 404 });
    }
    const isHost = tempProperty.hostId.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';

    if (!isHost && !isAdmin) {
      return NextResponse.json({ message: 'Forbidden: You are not authorized to manage this booking.' }, { status: 403 });
    }

    booking.bookingStatus = newStatus;

    if (newStatus === 'confirmed_by_host') {
        const updatedBookedDateRange = await BookedDateRangeModel.findOneAndUpdate(
            { bookingId: booking._id },
            { $set: { status: newStatus } }, // Update BookedDateRange status to confirmed
            { new: true }
        );
        if (!updatedBookedDateRange) {
             console.warn(`[API /bookings/.../manage PATCH] BookedDateRange for booking ${booking._id} not found when trying to confirm. This is unexpected if it was 'pending_confirmation'.`);
             // Optionally, create it if it's mission critical and somehow missing, though it should exist.
        } else {
            console.log(`[API /bookings/.../manage PATCH] Updated BookedDateRange ${updatedBookedDateRange._id} for booking ${booking._id} to ${newStatus}.`);
        }
    } else if (newStatus === 'rejected_by_host') {
        // If booking was paid and is now rejected, set paymentStatus to 'refunded' (conceptual)
        if (booking.paymentStatus === 'paid') {
            booking.paymentStatus = 'refunded' as PaymentStatus;
        }
        const deletedBookedDateRange = await BookedDateRangeModel.findOneAndDelete({ bookingId: booking._id });
        if (deletedBookedDateRange) {
            console.log(`[API /bookings/.../manage PATCH] Deleted BookedDateRange ${deletedBookedDateRange._id} for booking ${booking._id} due to rejection.`);
        } else {
            console.warn(`[API /bookings/.../manage PATCH] BookedDateRange for booking ${booking._id} not found when trying to delete after rejection.`);
        }
    }

    await booking.save();

    return NextResponse.json({ message: `Booking status updated to ${newStatus}.`, booking: booking.toObject() }, { status: 200 });

  } catch (error: any) {
    console.error(`[API /bookings/${params.bookingId}/manage PATCH] Error:`, error);
    let errorMessage = 'An unexpected error occurred.';
    if (error.name === 'MongoNetworkError') {
      errorMessage = 'Database connection error.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage, errorDetails: error.toString() }, { status: 500 });
  }
}
