
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/utils/db';
import Booking, { type BookingDocument } from '@/models/Booking';
import Property from '@/models/Property'; 
import BookedDateRangeModel from '@/models/BookedDateRange';
import type { BookingStatus, PaymentStatus } from '@/lib/types';

export async function DELETE(
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

    await connectDB();

    // Fetch booking and populate listingId to get hostId
    // Instead of lean, we will operate on the Mongoose document to use instance methods if needed,
    // but for simple field access and deletion, lean is fine. Let's keep it simple.
    const booking = await Booking.findById(bookingId)
        .populate<{ listingId: { _id: mongoose.Types.ObjectId, hostId: mongoose.Types.ObjectId } }>({
            path: 'listingId',
            select: 'hostId _id' // Only select hostId and _id from property
        }).lean() as (BookingDocument & { listingId: { _id: mongoose.Types.ObjectId, hostId: mongoose.Types.ObjectId } | null }) | null;


    if (!booking) {
      return NextResponse.json({ message: 'Booking not found.' }, { status: 404 });
    }
    if (!booking.listingId || !booking.listingId.hostId) { // Check if listingId and hostId are populated
        console.error(`[API /bookings/${bookingId} DELETE] Booking ${booking._id} has no valid associated property or hostId.`);
        return NextResponse.json({ message: 'Booking is not associated with a valid property or host.' }, { status: 500 });
    }

    const isGuest = booking.guestId.toString() === session.user.id;
    const isHost = booking.listingId.hostId.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';

    let actionTakenMessage: string;

    if (isAdmin || isHost) {
      // Admin or Host can delete the booking and its associated date range
      await Booking.findByIdAndDelete(booking._id);
      const deletedRange = await BookedDateRangeModel.findOneAndDelete({ bookingId: booking._id });
      
      actionTakenMessage = `Booking ${booking._id} and associated date range (if any) deleted by ${isAdmin ? 'admin' : 'host'}.`;
      console.log(`[API /bookings/${bookingId} DELETE] ${actionTakenMessage}`);
      return NextResponse.json({ message: 'Booking successfully deleted.' }, { status: 200 });

    } else if (isGuest) {
      // Guest can cancel their booking
      if (booking.bookingStatus === 'pending_payment' || booking.bookingStatus === 'pending_confirmation') {
        // For pending bookings, delete them entirely
        await Booking.findByIdAndDelete(booking._id);
        await BookedDateRangeModel.findOneAndDelete({ bookingId: booking._id });
        actionTakenMessage = `Pending booking ${booking._id} cancelled and removed by guest.`;
        console.log(`[API /bookings/${bookingId} DELETE] ${actionTakenMessage}`);
        return NextResponse.json({ message: 'Booking successfully cancelled and removed.' }, { status: 200 });

      } else if (booking.bookingStatus === 'confirmed_by_host') {
        // For confirmed bookings, mark as 'cancelled_by_guest'
        // Conceptual refund status; actual Stripe refund is not implemented here.
        const updatedBooking = await Booking.findByIdAndUpdate(
          booking._id,
          { 
            $set: { 
              bookingStatus: 'cancelled_by_guest' as BookingStatus, 
              paymentStatus: 'refunded' as PaymentStatus // Conceptual refund
            } 
          },
          { new: true }
        );
        // Delete the BookedDateRange to free up dates
        await BookedDateRangeModel.findOneAndDelete({ bookingId: booking._id });
        actionTakenMessage = `Booking ${booking._id} status updated to 'cancelled_by_guest' by guest. Associated date range removed.`;
        console.log(`[API /bookings/${bookingId} DELETE] ${actionTakenMessage}`);
        return NextResponse.json({ message: 'Booking successfully cancelled.', booking: updatedBooking?.toObject() }, { status: 200 });
      
      } else {
        // If booking is already cancelled, rejected, completed, etc.
        return NextResponse.json({ message: `Cannot cancel booking. Current status: '${booking.bookingStatus}'.` }, { status: 409 });
      }
    } else {
      // User is not guest, host, or admin
      return NextResponse.json({ message: 'Forbidden: You are not authorized to perform this action on this booking.' }, { status: 403 });
    }

  } catch (error: any) {
    console.error(`[API /bookings/${params.bookingId} DELETE] Error:`, error);
    let errorMessage = 'An unexpected error occurred while managing the booking.';
    if (error.name === 'MongoNetworkError') {
      errorMessage = 'Database connection error.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage, errorDetails: error.toString() }, { status: 500 });
  }
}
