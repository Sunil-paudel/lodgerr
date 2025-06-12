
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/utils/db';
import Booking from '@/models/Booking';
import { startOfDay } from 'date-fns';
import type { BookingStatus } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  const { propertyId } = params;

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return NextResponse.json({ message: 'Invalid property ID format.' }, { status: 400 });
  }

  try {
    await connectDB();

    const bookings = await Booking.find({
      listingId: new mongoose.Types.ObjectId(propertyId),
      bookingStatus: { $in: ['pending_payment', 'pending_confirmation', 'confirmed_by_host'] },
    }).select('startDate endDate bookingStatus').lean(); // Added bookingStatus

    const activeDateRanges = bookings.map(b => ({
      startDate: startOfDay(new Date(b.startDate)).toISOString(),
      endDate: startOfDay(new Date(b.endDate)).toISOString(),
      bookingStatus: b.bookingStatus as BookingStatus, // Include bookingStatus
    }));

    return NextResponse.json(activeDateRanges, { status: 200 });

  } catch (error: any) {
    console.error(`[API /properties/${propertyId}/active-bookings GET] Error:`, error);
    return NextResponse.json({ message: 'Server error while fetching active bookings.', errorDetails: error.message }, { status: 500 });
  }
}
