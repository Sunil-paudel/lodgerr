
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/utils/db';
import Booking, { type BookingDocument } from '@/models/Booking';
import PropertyModel, { type PropertyDocument } from '@/models/Property';
import User from '@/models/User';
import BookedDateRangeModel from '@/models/BookedDateRange';
import type { BookingStatus, PaymentStatus } from '@/lib/types';
import * as z from 'zod';
import { differenceInCalendarDays, startOfDay as startOfDayFn, isBefore } from 'date-fns';


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
      .populate<{ listingId: { _id: mongoose.Types.ObjectId, title: string, images: string[], location: string, hostId: mongoose.Types.ObjectId, price: number, pricePeriod: PropertyDocument['pricePeriod'], availableFrom?: Date, availableTo?: Date } }>({
          path: 'listingId',
          model: PropertyModel, 
          select: 'title images location hostId _id price pricePeriod availableFrom availableTo' 
      })
      .populate<{ guestId: { _id: mongoose.Types.ObjectId, name: string, email: string, avatarUrl?: string } }>({
          path: 'guestId',
          model: User, 
          select: 'name email avatarUrl _id'
      })
      .lean() as (BookingDocument & { 
          listingId: { _id: mongoose.Types.ObjectId, title: string, images: string[], location: string, hostId: mongoose.Types.ObjectId, price: number, pricePeriod: PropertyDocument['pricePeriod'], availableFrom?: Date, availableTo?: Date } | null,
          guestId: { _id: mongoose.Types.ObjectId, name: string, email: string, avatarUrl?: string } | null 
      }) | null;

    if (!booking) {
      return NextResponse.json({ message: 'Booking not found.' }, { status: 404 });
    }
    
    const isGuest = booking.guestId?._id.toString() === session.user.id;
    const isHost = booking.listingId?.hostId.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';

    if (!isGuest && !isAdmin && !isHost) { 
        return NextResponse.json({ message: 'Forbidden: You are not authorized to view this booking.' }, { status: 403 });
    }
    
    const propertyDetails = booking.listingId ? {
        id: booking.listingId._id.toString(),
        title: booking.listingId.title,
        mainImage: booking.listingId.images && booking.listingId.images.length > 0 ? booking.listingId.images[0] : undefined,
        location: booking.listingId.location,
        price: booking.listingId.price,
        pricePeriod: booking.listingId.pricePeriod,
        availableFrom: booking.listingId.availableFrom,
        availableTo: booking.listingId.availableTo,
    } : undefined;

    const guestDetails = booking.guestId ? {
        name: booking.guestId.name,
        email: booking.guestId.email,
        avatarUrl: booking.guestId.avatarUrl,
    } : undefined;


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

const adminBookingEditSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(data => {
  // If both dates are provided, endDate must be after startDate
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate;
  }
  return true; // If only one or none are provided, this specific check passes
}, {
  message: "End date must be after start date if both are provided.",
  path: ["endDate"],
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
    if (session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can edit booking details.' }, { status: 403 });
    }

    const { bookingId } = params;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ message: 'Invalid booking ID format.' }, { status: 400 });
    }

    const body = await request.json();
    const parsedBody = adminBookingEditSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ message: 'Invalid request data for edit.', errors: parsedBody.error.format() }, { status: 400 });
    }

    const { startDate: newStartDateInput, endDate: newEndDateInput } = parsedBody.data;

    if (!newStartDateInput && !newEndDateInput) {
        return NextResponse.json({ message: 'No editable fields provided (e.g., startDate, endDate).' }, { status: 400 });
    }

    await connectDB();

    const booking = await Booking.findById(bookingId)
        .populate<{ listingId: PropertyDocument }>('listingId');
        
    if (!booking) {
      return NextResponse.json({ message: 'Booking not found.' }, { status: 404 });
    }
    // Ensure listingId is populated and is a PropertyDocument
    const property = booking.listingId as unknown as PropertyDocument | null;
    if (!property || !property._id) { // Check if property is populated
        return NextResponse.json({ message: 'Associated property not found for booking or property data is incomplete.' }, { status: 500 });
    }

    const updateFields: Partial<BookingDocument> = {};
    let datesChanged = false;

    let currentProposedStartDate = newStartDateInput ? startOfDayFn(newStartDateInput) : booking.startDate;
    let currentProposedEndDate = newEndDateInput ? startOfDayFn(newEndDateInput) : booking.endDate;

    if (newStartDateInput && currentProposedStartDate.getTime() !== booking.startDate.getTime()) {
        datesChanged = true;
        updateFields.startDate = currentProposedStartDate;
    }
     if (newEndDateInput && currentProposedEndDate.getTime() !== booking.endDate.getTime()) {
        datesChanged = true;
        updateFields.endDate = currentProposedEndDate;
    }
    
    // If one date is provided for update, the other must also be valid (either from input or original booking)
    if (newStartDateInput && !newEndDateInput && !booking.endDate) {
        return NextResponse.json({ message: "If providing a start date, an end date must also exist or be provided." }, { status: 400 });
    }
    if (!newStartDateInput && newEndDateInput && !booking.startDate) {
        return NextResponse.json({ message: "If providing an end date, a start date must also exist or be provided." }, { status: 400 });
    }

    // Final effective dates for validation and calculations
    const finalStartDate = updateFields.startDate || booking.startDate;
    const finalEndDate = updateFields.endDate || booking.endDate;

    if (datesChanged) {
      if (isBefore(finalEndDate, finalStartDate)) {
        return NextResponse.json({ message: 'New end date cannot be before new start date.' }, { status: 400 });
      }
      if (isBefore(finalStartDate, startOfDayFn(new Date()))) {
        // Allow editing to past dates for admin corrections if needed, but good to be aware
        // For new bookings, this check is usually stricter. For admin edits, might be more lenient.
        // console.warn(`[API /bookings/${bookingId} PATCH AdminEdit] Admin is setting start date to the past: ${finalStartDate}`);
      }

      // Property's own general availability window check
      if (property.availableFrom && isBefore(finalStartDate, startOfDayFn(new Date(property.availableFrom)))) {
          return NextResponse.json({ message: 'New booking start date is before property general availability window.' }, { status: 400 });
      }
      if (property.availableTo && isBefore(startOfDayFn(new Date(property.availableTo)), finalEndDate)) {
          return NextResponse.json({ message: 'New booking end date is after property general availability window.' }, { status: 400 });
      }

      // Conflict check for the new date range
      const conflictingRange = await BookedDateRangeModel.findOne({
        propertyId: property._id,
        bookingId: { $ne: booking._id }, 
        status: { $in: ['confirmed_by_host', 'pending_confirmation', 'pending_payment'] as BookingStatus[] },
        startDate: { $lt: finalEndDate },
        endDate: { $gt: finalStartDate },
      });

      if (conflictingRange) {
        return NextResponse.json({ message: 'The new dates conflict with an existing booking for this property.' }, { status: 409 });
      }

      // Recalculate total price
      let numberOfUnits = 0;
      if (property.pricePeriod === 'nightly') {
        numberOfUnits = differenceInCalendarDays(finalEndDate, finalStartDate);
        if (numberOfUnits === 0 && finalStartDate.getTime() === finalEndDate.getTime()){
            numberOfUnits = 1;
        }
      } else if (property.pricePeriod === 'weekly') {
        numberOfUnits = Math.max(1, Math.ceil(differenceInCalendarDays(finalEndDate, finalStartDate) / 7));
      } else if (property.pricePeriod === 'monthly') {
        numberOfUnits = Math.max(1, Math.ceil(differenceInCalendarDays(finalEndDate, finalStartDate) / 30));
      }
      if (numberOfUnits <= 0 && !(property.pricePeriod === 'nightly' && differenceInCalendarDays(finalEndDate, finalStartDate) === 0)) {
          return NextResponse.json({ message: 'New booking duration is invalid according to price period.' }, { status: 400 });
      }
      updateFields.totalPrice = property.price * Math.max(1, numberOfUnits); // Ensure at least 1 unit if nightly and same day
    }
    
    // Apply updates to booking
    Object.assign(booking, updateFields);
    await booking.save();

    // Update BookedDateRange document if dates changed
    if (datesChanged) {
      const updatedBookedDateRange = await BookedDateRangeModel.findOneAndUpdate(
        { bookingId: booking._id },
        { $set: { startDate: finalStartDate, endDate: finalEndDate } },
        { new: true, upsert: false } 
      );
      if (!updatedBookedDateRange) {
          console.warn(`[API /bookings/${bookingId} PATCH AdminEdit] BookedDateRange for booking ${booking._id} not found when trying to update dates. This might indicate an inconsistency.`);
          // Consider creating it if it was missing, though that implies a deeper issue.
          // For now, we'll assume it should exist if the booking exists and is in a state that blocks dates.
      } else {
          console.log(`[API /bookings/${bookingId} PATCH AdminEdit] BookedDateRange for booking ${booking._id} updated successfully.`);
      }
    }

    return NextResponse.json({ message: 'Booking updated successfully by admin.', booking: booking.toObject() }, { status: 200 });

  } catch (error: any) {
    console.error(`[API /bookings/${params.bookingId} PATCH AdminEdit] Error:`, error);
    let errorMessage = 'An unexpected error occurred while editing the booking.';
    if (error.name === 'MongoNetworkError') {
      errorMessage = 'Database connection error.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage, errorDetails: error.toString() }, { status: 500 });
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

    if (isAdmin || isHost) { 
      await Booking.findByIdAndDelete(booking._id);
      const deletedRange = await BookedDateRangeModel.findOneAndDelete({ bookingId: booking._id });
      
      actionTakenMessage = `Booking ${booking._id} and associated date range (if any) deleted by ${isAdmin ? 'admin' : 'host'}.`;
      console.log(`[API /bookings/${bookingId} DELETE] ${actionTakenMessage}`);
      if (deletedRange) {
          console.log(`[API /bookings/${bookingId} DELETE] Deleted BookedDateRange ${deletedRange._id}.`);
      } else {
          console.warn(`[API /bookings/${bookingId} DELETE] No BookedDateRange found to delete for booking ${booking._id}.`);
      }
      return NextResponse.json({ message: 'Booking successfully deleted.' }, { status: 200 });

    } else if (isGuest) { 
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
