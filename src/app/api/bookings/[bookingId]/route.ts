
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/utils/db';
import Booking, { type BookingDocument } from '@/models/Booking';
import Property from '@/models/Property'; 
import User from '@/models/User';
import BookedDateRangeModel from '@/models/BookedDateRange';
import type { BookingStatus, PaymentStatus } from '@/lib/types';

export async function GET(
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

    const booking = await Booking.findById(bookingId)
      .populate<{ listingId: { _id: mongoose.Types.ObjectId, title: string, images: string[], location: string, hostId: mongoose.Types.ObjectId } }>({
          path: 'listingId',
          model: Property, // Specify the model for population
          select: 'title images location hostId _id' 
      })
      .populate<{ guestId: { _id: mongoose.Types.ObjectId, name: string, email: string, avatarUrl?: string } }>({
          path: 'guestId',
          model: User, // Specify the model for population
          select: 'name email avatarUrl _id'
      })
      .lean() as (BookingDocument & { 
          listingId: { _id: mongoose.Types.ObjectId, title: string, images: string[], location: string, hostId: mongoose.Types.ObjectId } | null,
          guestId: { _id: mongoose.Types.ObjectId, name: string, email: string, avatarUrl?: string } | null 
      }) | null;

    if (!booking) {
      return NextResponse.json({ message: 'Booking not found.' }, { status: 404 });
    }
    
    const isGuest = booking.guestId?._id.toString() === session.user.id;
    const isHost = booking.listingId?.hostId.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';

    if (!isGuest && !isAdmin && !isHost) { // Host check might be too broad here if admin is the primary editor
        return NextResponse.json({ message: 'Forbidden: You are not authorized to view this booking.' }, { status: 403 });
    }
    
    // Transform images to ensure only the first one is taken if needed, or structure as required
    const propertyDetails = booking.listingId ? {
        id: booking.listingId._id.toString(),
        title: booking.listingId.title,
        mainImage: booking.listingId.images && booking.listingId.images.length > 0 ? booking.listingId.images[0] : undefined,
        location: booking.listingId.location,
    } : undefined;

    const guestDetails = booking.guestId ? {
        name: booking.guestId.name,
        email: booking.guestId.email,
        avatarUrl: booking.guestId.avatarUrl,
    } : undefined;


    // Construct the response object to match BookingType, including populated details
    const responseBooking = {
        id: booking._id.toString(),
        listingId: booking.listingId?._id.toString(),
        guestId: booking.guestId?._id.toString(),
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalPrice: booking.totalPrice,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
        createdAt: booking.createdAt,
        propertyDetails,
        guestDetails,
    };

    return NextResponse.json(responseBooking, { status: 200 });

  } catch (error: any) {
    console.error(`[API /bookings/${params.bookingId} GET] Error:`, error);
    return NextResponse.json({ message: 'Server error while fetching booking.', errorDetails: error.message }, { status: 500 });
  }
}


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

    const booking = await Booking.findById(bookingId)
        .populate<{ listingId: { _id: mongoose.Types.ObjectId, hostId: mongoose.Types.ObjectId } }>({
            path: 'listingId',
            select: 'hostId _id' 
        }).lean() as (BookingDocument & { listingId: { _id: mongoose.Types.ObjectId, hostId: mongoose.Types.ObjectId } | null }) | null;


    if (!booking) {
      return NextResponse.json({ message: 'Booking not found.' }, { status: 404 });
    }
    if (!booking.listingId || !booking.listingId.hostId) { 
        console.error(`[API /bookings/${bookingId} DELETE] Booking ${booking._id} has no valid associated property or hostId.`);
        return NextResponse.json({ message: 'Booking is not associated with a valid property or host.' }, { status: 500 });
    }

    const isGuest = booking.guestId.toString() === session.user.id;
    const isHost = booking.listingId.hostId.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';

    let actionTakenMessage: string;

    if (isAdmin || isHost) { // Admin or Host can delete the booking
      await Booking.findByIdAndDelete(booking._id);
      const deletedRange = await BookedDateRangeModel.findOneAndDelete({ bookingId: booking._id });
      
      actionTakenMessage = `Booking ${booking._id} and associated date range (if any) deleted by ${isAdmin ? 'admin' : 'host'}.`;
      console.log(`[API /bookings/${bookingId} DELETE] ${actionTakenMessage}`);
      return NextResponse.json({ message: 'Booking successfully deleted.' }, { status: 200 });

    } else if (isGuest) { // Guest can cancel their booking
      if (booking.bookingStatus === 'pending_payment' || booking.bookingStatus === 'pending_confirmation') {
        await Booking.findByIdAndDelete(booking._id);
        await BookedDateRangeModel.findOneAndDelete({ bookingId: booking._id });
        actionTakenMessage = `Pending booking ${booking._id} cancelled and removed by guest.`;
        console.log(`[API /bookings/${bookingId} DELETE] ${actionTakenMessage}`);
        return NextResponse.json({ message: 'Booking successfully cancelled and removed.' }, { status: 200 });

      } else if (booking.bookingStatus === 'confirmed_by_host') {
        const updatedBooking = await Booking.findByIdAndUpdate(
          booking._id,
          { 
            $set: { 
              bookingStatus: 'cancelled_by_guest' as BookingStatus, 
              paymentStatus: 'refunded' as PaymentStatus 
            } 
          },
          { new: true }
        );
        await BookedDateRangeModel.findOneAndDelete({ bookingId: booking._id });
        actionTakenMessage = `Booking ${booking._id} status updated to 'cancelled_by_guest' by guest. Associated date range removed.`;
        console.log(`[API /bookings/${bookingId} DELETE] ${actionTakenMessage}`);
        return NextResponse.json({ message: 'Booking successfully cancelled.', booking: updatedBooking?.toObject() }, { status: 200 });
      
      } else {
        return NextResponse.json({ message: `Cannot cancel booking. Current status: '${booking.bookingStatus}'.` }, { status: 409 });
      }
    } else {
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
