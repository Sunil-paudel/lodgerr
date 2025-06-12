
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/utils/db';
import BookedDateRangeModel, { type BookedDateRangeDocument } from '@/models/BookedDateRange';
import type { BookedDateRange as BookedDateRangeType, BookingStatus } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // Ensure 'id' is used here
) {
  const { id } = params; // Use 'id' from params

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid property ID format.' }, { status: 400 });
  }

  try {
    await connectDB();
    console.log(`[API /properties/${id}/booked-ranges GET] Attempting to fetch booked ranges for property ID: ${id}`);

    const relevantStatuses: BookingStatus[] = ['pending_payment', 'pending_confirmation', 'confirmed_by_host'];

    const bookedRangesDocs = await BookedDateRangeModel.find({
      propertyId: new mongoose.Types.ObjectId(id), // Use 'id' for querying
      status: { $in: relevantStatuses }
    }).lean();

    console.log(`[API /properties/${id}/booked-ranges GET] Found ${bookedRangesDocs.length} relevant booked range documents.`);

    const bookedRanges: BookedDateRangeType[] = bookedRangesDocs.map(doc => {
      // Cast to BookedDateRangeDocument to access Mongoose document properties like _id
      const range = doc as unknown as BookedDateRangeDocument; 
      return {
        id: range._id.toString(),
        propertyId: range.propertyId.toString(),
        bookingId: range.bookingId.toString(),
        startDate: range.startDate, 
        endDate: range.endDate,
        status: range.status,
        createdAt: range.createdAt, // Ensure these are passed if needed by frontend type
        updatedAt: range.updatedAt, // Ensure these are passed if needed by frontend type
      };
    });
    
    // Truncate long log output if necessary
    console.log(`[API /properties/${id}/booked-ranges GET] Transformed booked ranges:`, JSON.stringify(bookedRanges, null, 2).substring(0, 500) + (JSON.stringify(bookedRanges, null, 2).length > 500 ? '...' : ''));


    return NextResponse.json(bookedRanges, { status: 200 });

  } catch (error: any) {
    console.error(`[API /properties/${id}/booked-ranges GET] Critical error fetching booked ranges:`, error.message, error.stack);
    let errorMessage = 'Server error while fetching booked ranges.';
    if (error.name === 'MongoNetworkError') {
      errorMessage = 'Database connection error during booked ranges fetch.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage, errorDetails: error.toString() }, { status: 500 });
  }
}
