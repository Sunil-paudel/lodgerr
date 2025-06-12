
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
  console.log(`[API /properties/${propertyId}/active-bookings GET] Received request for propertyId: ${propertyId}`);

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    console.log(`[API /properties/${propertyId}/active-bookings GET] Invalid property ID format.`);
    return NextResponse.json({ message: 'Invalid property ID format.' }, { status: 400 });
  }

  try {
    await connectDB();
    console.log(`[API /properties/${propertyId}/active-bookings GET] Database connected.`);

    const query = {
      listingId: new mongoose.Types.ObjectId(propertyId),
      bookingStatus: { $in: ['pending_payment', 'pending_confirmation', 'confirmed_by_host'] },
    };
    console.log(`[API /properties/${propertyId}/active-bookings GET] Executing query:`, JSON.stringify(query));

    const bookings = await Booking.find(query).select('startDate endDate bookingStatus').lean();
    
    console.log(`[API /properties/${propertyId}/active-bookings GET] Found ${bookings.length} bookings matching criteria.`);
    if (bookings.length > 0) {
      console.log(`[API /properties/${propertyId}/active-bookings GET] Bookings found:`, JSON.stringify(bookings.map(b => ({s: b.startDate, e: b.endDate, st: b.bookingStatus}))));
    }


    const activeDateRanges = bookings.map(b => ({
      startDate: startOfDay(new Date(b.startDate)).toISOString(),
      endDate: startOfDay(new Date(b.endDate)).toISOString(),
      bookingStatus: b.bookingStatus as BookingStatus, // Include bookingStatus
    }));
    
    console.log(`[API /properties/${propertyId}/active-bookings GET] Mapped activeDateRanges:`, JSON.stringify(activeDateRanges));
    return NextResponse.json(activeDateRanges, { status: 200 });

  } catch (error: any) {
    console.error(`[API /properties/${propertyId}/active-bookings GET] Error:`, error);
    return NextResponse.json({ message: 'Server error while fetching active bookings.', errorDetails: error.message }, { status: 500 });
  }
}
