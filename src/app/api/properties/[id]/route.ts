
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/utils/db';
import PropertyModel, { type PropertyDocument } from '@/models/Property';
import BookedDateRangeModel from '@/models/BookedDateRange'; // Import BookedDateRange model
import type { Property as PropertyType, PricePeriod } from '@/lib/types';
import * as z from 'zod';
import { startOfDay, isValid as isValidDate } from 'date-fns';

const propertyUpdateSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(20).max(5000).optional(),
  type: z.enum(["House", "Apartment", "Room", "Unique Stay"]).optional(),
  location: z.string().min(3).max(100).optional(),
  address: z.string().min(5).max(200).optional(),
  price: z.coerce.number().positive().min(1).max(100000).optional(),
  pricePeriod: z.enum(["nightly", "weekly", "monthly"] as [PricePeriod, ...PricePeriod[]]).optional(),
  bedrooms: z.coerce.number().min(0).max(20).optional(),
  bathrooms: z.coerce.number().min(0).max(10).optional(), 
  maxGuests: z.coerce.number().min(1).max(50).optional(),
  images: z.array(z.object({ url: z.string().url() })).min(1,"At least one image is required.").max(5,"Maximum 5 images allowed.").optional(),
  amenities: z.array(z.string()).optional(),
  availableFrom: z.coerce.date().nullable().optional(),
  availableTo: z.coerce.date().nullable().optional(),
}).refine(data => {
  if (data.availableFrom && data.availableTo) {
    if (!isValidDate(data.availableFrom) || !isValidDate(data.availableTo)) return false;
    return data.availableTo >= data.availableFrom;
  }
  return true;
}, {
  message: "Availability end date cannot be before start date, or dates are invalid.",
  path: ["availableTo"],
});


export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid property ID format.' }, { status: 400 });
  }

  try {
    await connectDB();
    const propertyDoc = await PropertyModel.findById(id).lean() as PropertyDocument | null; 

    if (!propertyDoc) {
      return NextResponse.json({ message: 'Property not found.' }, { status: 404 });
    }
    
    console.log(`[API /properties/${id} GET] Fetched propertyDoc (bookedDateRanges are fetched separately)`);

    const propertyResponse: PropertyType = {
        id: propertyDoc._id.toString(),
        hostId: propertyDoc.hostId.toString(),
        title: propertyDoc.title,
        description: propertyDoc.description,
        location: propertyDoc.location,
        address: propertyDoc.address,
        price: propertyDoc.price,
        pricePeriod: propertyDoc.pricePeriod,
        images: propertyDoc.images.map(img => String(img)),
        bedrooms: propertyDoc.bedrooms,
        bathrooms: propertyDoc.bathrooms,
        maxGuests: propertyDoc.maxGuests,
        amenities: propertyDoc.amenities.map(am => String(am)),
        type: propertyDoc.type,
        host: { 
          name: propertyDoc.host.name,
          avatarUrl: propertyDoc.host.avatarUrl,
        },
        rating: propertyDoc.rating,
        reviewsCount: propertyDoc.reviewsCount,
        createdAt: propertyDoc.createdAt,
        availableFrom: propertyDoc.availableFrom,
        availableTo: propertyDoc.availableTo,
    };

    return NextResponse.json(propertyResponse, { status: 200 });

  } catch (error: any) {
    console.error(`[API /properties/${id} GET] Error fetching property:`, error);
    return NextResponse.json({ message: 'Server error while fetching property.', errorDetails: error.message }, { status: 500 });
  }
}


export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized: You must be logged in to update a property.' }, { status: 401 });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid property ID format.' }, { status: 400 });
  }

  try {
    await connectDB();
    const propertyToUpdate = await PropertyModel.findById(id);

    if (!propertyToUpdate) {
      return NextResponse.json({ message: 'Property not found.' }, { status: 404 });
    }

    const isOwner = propertyToUpdate.hostId.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: 'Forbidden: You are not authorized to update this property.' }, { status: 403 });
    }

    const body = await request.json();
    const parsedBody = propertyUpdateSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ message: 'Invalid property data provided.', errors: parsedBody.error.format() }, { status: 400 });
    }
    
    const updateOperation: { $set: any, $unset?: any } = { $set: {} };
    if (Object.keys(parsedBody.data).length === 0) {
        return NextResponse.json({ message: 'No fields provided for update.' }, { status: 400 });
    }

    const { images, availableFrom, availableTo, ...restOfData } = parsedBody.data;

    for (const key in restOfData) {
      if (restOfData[key as keyof typeof restOfData] !== undefined) {
        updateOperation.$set[key] = restOfData[key as keyof typeof restOfData];
      }
    }
    
    if (images !== undefined) {
        updateOperation.$set.images = images.map(img => img.url);
    }

    if (availableFrom !== undefined) { 
      updateOperation.$set.availableFrom = availableFrom ? startOfDay(availableFrom) : null;
    }
    if (availableTo !== undefined) { 
      updateOperation.$set.availableTo = availableTo ? startOfDay(availableTo) : null;
    }
    
    if (Object.keys(updateOperation.$set).length === 0) {
        return NextResponse.json({ message: 'No valid fields provided for update (after processing).'}, { status: 400 });
    }

    const updatedProperty = await PropertyModel.findByIdAndUpdate(id, updateOperation, { new: true, runValidators: true });

    if (!updatedProperty) {
        return NextResponse.json({ message: 'Property found but update failed unexpectedly.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Property updated successfully!', property: updatedProperty.toObject() }, { status: 200 });

  } catch (error: any) {
    console.error(`[API /properties/${id} PATCH] Error updating property:`, error);
     let errorMessage = 'An unexpected error occurred while updating the property.';
    if (error.name === 'MongoNetworkError') {
        errorMessage = 'Database connection error. Please try again later.';
    } else if (error.code === 11000) { 
        errorMessage = 'A property with some of these unique details might already exist.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage, errorDetails: error.toString() }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized: You must be logged in.' }, { status: 401 });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid property ID format.' }, { status: 400 });
  }

  try {
    await connectDB();
    const propertyToDelete = await PropertyModel.findById(id);

    if (!propertyToDelete) {
      return NextResponse.json({ message: 'Property not found.' }, { status: 404 });
    }

    const isOwner = propertyToDelete.hostId.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: 'Forbidden: You are not authorized to delete this property.' }, { status: 403 });
    }

    const nonDeletableStatuses: string[] = ['pending_confirmation', 'pending_payment', 'confirmed_by_host'];
    const activeOrPendingBookedRanges = await BookedDateRangeModel.find({
      propertyId: propertyToDelete._id,
      status: { $in: nonDeletableStatuses },
      endDate: { $gte: startOfDay(new Date()) } 
    }).lean();

    if (activeOrPendingBookedRanges.length > 0) {
      console.log(`[API /properties/${id} DELETE] Deletion blocked. Found ${activeOrPendingBookedRanges.length} active/pending BookedDateRange documents.`);
      return NextResponse.json({ 
        message: 'This property cannot be deleted because it has active or upcoming bookings. Please resolve these bookings first.' 
      }, { status: 409 }); 
    }
    
    await PropertyModel.findByIdAndDelete(id);
    console.log(`[API /properties/${id} DELETE] Property document deleted.`);

    const deletionResult = await BookedDateRangeModel.deleteMany({ propertyId: new mongoose.Types.ObjectId(id) });
    console.log(`[API /properties/${id} DELETE] Deleted ${deletionResult.deletedCount} associated BookedDateRange documents.`);
    
    return NextResponse.json({ message: 'Property and associated booked date ranges deleted successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error(`[API /properties/${id} DELETE] Error deleting property:`, error);
    let errorMessage = 'An unexpected error occurred while deleting the property.';
    if (error.name === 'MongoNetworkError') {
      errorMessage = 'Database connection error.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage, errorDetails: error.toString() }, { status: 500 });
  }
}

    