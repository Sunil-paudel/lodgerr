
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/utils/db';
import Booking, { type BookingDocument } from '@/models/Booking';
import Property, { type PropertyDocument } from '@/models/Property';
import * as z from 'zod';
import type { BookingStatus } from '@/lib/types';

const manageBookingSchema = z.object({
  status: z.enum([
    'confirmed_by_host', 
    'rejected_by_host',
    // Potentially add 'cancelled_by_host' later if different from rejected
  ] as [BookingStatus, ...BookingStatus[]]), 
  // Add other manageable fields later, e.g., notes for host
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

    const property = await Property.findById(booking.listingId) as PropertyDocument | null;
    if (!property) {
      // This should ideally not happen if booking.listingId is valid
      return NextResponse.json({ message: 'Associated property not found.' }, { status: 404 });
    }

    // Authorization check: User must be the host of the property or an admin
    const isHost = property.hostId.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';

    if (!isHost && !isAdmin) {
      return NextResponse.json({ message: 'Forbidden: You are not authorized to manage this booking.' }, { status: 403 });
    }

    // Logic for status transitions (e.g., can only confirm if 'pending_confirmation')
    if (booking.bookingStatus !== 'pending_confirmation') {
        return NextResponse.json({ message: `Cannot update booking. Current status is '${booking.bookingStatus}', not 'pending_confirmation'.`}, { status: 409 }); // Conflict
    }

    booking.bookingStatus = newStatus;
    // Add any other side effects here, e.g., sending notifications

    await booking.save();

    return NextResponse.json({ message: `Booking status updated to ${newStatus}.`, booking }, { status: 200 });

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
