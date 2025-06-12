
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/utils/db';
import BookedDateRangeModel, { type BookedDateRangeDocument } from '@/models/BookedDateRange';
import type { BookedDateRange as BookedDateRangeType } from '@/lib/types';

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
    console.log(`[API /properties/${propertyId}/booked-ranges GET] Fetching booked ranges for property ID: ${propertyId}`);

    const bookedRangesDocs = await BookedDateRangeModel.find({ 
      propertyId: new mongoose.Types.ObjectId(propertyId) 
    }).lean();

    console.log(`[API /properties/${propertyId}/booked-ranges GET] Found ${bookedRangesDocs.length} booked range documents.`);

    const bookedRanges: BookedDateRangeType[] = bookedRangesDocs.map(doc => {
      const range = doc as unknown as BookedDateRangeDocument; // Cast to include _id, createdAt, etc.
      return {
        id: range._id.toString(),
        propertyId: range.propertyId.toString(),
        bookingId: range.bookingId.toString(),
        startDate: range.startDate, // Dates are already Date objects from lean()
        endDate: range.endDate,
        status: range.status,
        createdAt: range.createdAt, // Timestamps
        updatedAt: range.updatedAt,
      };
    });
    
    console.log(`[API /properties/${propertyId}/booked-ranges GET] Transformed booked ranges:`, JSON.stringify(bookedRanges, null, 2));

    return NextResponse.json(bookedRanges, { status: 200 });

  } catch (error: any) {
    console.error(`[API /properties/${propertyId}/booked-ranges GET] Error fetching booked ranges:`, error);
    return NextResponse.json({ message: 'Server error while fetching booked ranges.', errorDetails: error.message }, { status: 500 });
  }
}
