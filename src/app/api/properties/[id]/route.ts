
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/utils/db';
import PropertyModel from '@/models/Property';
import type { Property as PropertyType, PricePeriod } from '@/lib/types';
import * as z from 'zod';
import { startOfDay } from 'date-fns';

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
  images: z.array(z.object({ url: z.string().url() })).min(1).max(5).optional(),
  amenities: z.array(z.string()).optional(),
  availableFrom: z.coerce.date().optional().nullable(), // Allow null to unset
  availableTo: z.coerce.date().optional().nullable(),   // Allow null to unset
}).refine(data => {
  if (data.availableFrom && data.availableTo) {
    return data.availableTo >= data.availableFrom;
  }
  return true;
}, {
  message: "Availability end date cannot be before start date.",
  path: ["availableTo"],
});


export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid property ID format.' }, { status: 400 });
  }

  try {
    await connectDB();
    const propertyDoc = await PropertyModel.findById(id).lean(); // Use lean for plain JS object

    if (!propertyDoc) {
      return NextResponse.json({ message: 'Property not found.' }, { status: 404 });
    }
    
    // Manually transform the lean object to match PropertyType structure
    const propertyResponse: PropertyType = {
        id: propertyDoc._id.toString(),
        hostId: propertyDoc.hostId.toString(),
        title: propertyDoc.title,
        description: propertyDoc.description,
        location: propertyDoc.location,
        address: propertyDoc.address,
        price: propertyDoc.price,
        pricePeriod: propertyDoc.pricePeriod,
        images: propertyDoc.images,
        bedrooms: propertyDoc.bedrooms,
        bathrooms: propertyDoc.bathrooms,
        maxGuests: propertyDoc.maxGuests,
        amenities: propertyDoc.amenities,
        type: propertyDoc.type,
        host: { // Ensure host object is correctly structured
          name: propertyDoc.host.name,
          avatarUrl: propertyDoc.host.avatarUrl,
        },
        rating: propertyDoc.rating,
        reviewsCount: propertyDoc.reviewsCount,
        createdAt: propertyDoc.createdAt, // Already a Date from lean if schema type is Date
        availableFrom: propertyDoc.availableFrom, // Already a Date
        availableTo: propertyDoc.availableTo,     // Already a Date
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

    if (propertyToUpdate.hostId.toString() !== session.user.id) {
      return NextResponse.json({ message: 'Forbidden: You are not authorized to update this property.' }, { status: 403 });
    }

    const body = await request.json();
    const parsedBody = propertyUpdateSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ message: 'Invalid property data provided.', errors: parsedBody.error.format() }, { status: 400 });
    }

    // Create an update object that will be used with $set and $unset
    const updateOperation: { $set: any, $unset?: any } = { $set: {} };

    const { images, availableFrom, availableTo, ...restOfData } = parsedBody.data;

    // Handle regular fields
    for (const key in restOfData) {
      if (restOfData[key as keyof typeof restOfData] !== undefined) {
        updateOperation.$set[key] = restOfData[key as keyof typeof restOfData];
      }
    }
    
    // Handle images
    if (images !== undefined) {
        updateOperation.$set.images = images.map(img => img.url);
    }

    // Handle date fields: set to date or null if explicitly provided as null, otherwise let $unset handle removal
    if (availableFrom !== undefined) {
      updateOperation.$set.availableFrom = availableFrom ? startOfDay(availableFrom) : null;
    }
    if (availableTo !== undefined) {
      updateOperation.$set.availableTo = availableTo ? startOfDay(availableTo) : null;
    }
    
    // If a field was in original data but is not in parsedBody.data (meaning it was intentionally cleared in form and sent as undefined/null)
    // and we want to remove it from DB, we would use $unset.
    // For simplicity, if a field is set to null in parsedBody.data (e.g. availableFrom: null), it will be set to null in DB.
    // If a field is simply omitted from parsedBody.data, it won't be in $set and remains unchanged.

    // If updateOperation.$set is empty, no actual fields were provided to set/change
    if (Object.keys(updateOperation.$set).length === 0) {
        return NextResponse.json({ message: 'No valid fields provided for update.' }, { status: 400 });
    }

    const updatedProperty = await PropertyModel.findByIdAndUpdate(id, updateOperation, { new: true, runValidators: true });

    if (!updatedProperty) {
        return NextResponse.json({ message: 'Property found but update failed unexpectedly.' }, { status: 500 });
    }

    console.log(`[API /properties/${id} PATCH] Property updated successfully by user ${session.user.id}`);
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

