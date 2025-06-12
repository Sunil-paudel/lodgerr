
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/utils/db';
import PropertyModel from '@/models/Property'; // Mongoose model
import type { Property as PropertyType } from '@/lib/types'; // Client-side Property type
import * as z from 'zod';

// Schema for validating property updates - adjust as needed for editable fields
const propertyUpdateSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(20).max(5000).optional(),
  type: z.enum(["House", "Apartment", "Room", "Unique Stay"]).optional(),
  location: z.string().min(3).max(100).optional(),
  address: z.string().min(5).max(200).optional(),
  pricePerNight: z.coerce.number().positive().min(10).max(10000).optional(),
  bedrooms: z.coerce.number().min(0).max(20).optional(),
  bathrooms: z.coerce.number().min(1).max(10).optional(), // Assuming bathrooms can be 0 for some unique stays or rooms
  maxGuests: z.coerce.number().min(1).max(50).optional(),
  images: z.array(z.object({ url: z.string().url() })).min(1).max(5).optional(),
  amenities: z.array(z.string()).optional(),
});


// GET handler to fetch a single property by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid property ID format.' }, { status: 400 });
  }

  try {
    await connectDB();
    const propertyDoc = await PropertyModel.findById(id);

    if (!propertyDoc) {
      return NextResponse.json({ message: 'Property not found.' }, { status: 404 });
    }

    // Use Mongoose's toObject to apply transforms including _id to id
    const propertyObject = propertyDoc.toObject() as any;
    
    // Construct the response object matching PropertyType
    const propertyResponse: PropertyType = {
        id: propertyObject.id.toString(),
        hostId: propertyObject.hostId.toString(),
        title: propertyObject.title,
        description: propertyObject.description,
        location: propertyObject.location,
        address: propertyObject.address,
        pricePerNight: propertyObject.pricePerNight,
        images: propertyObject.images,
        bedrooms: propertyObject.bedrooms,
        bathrooms: propertyObject.bathrooms,
        maxGuests: propertyObject.maxGuests,
        amenities: propertyObject.amenities,
        type: propertyObject.type,
        host: {
          name: propertyObject.host.name,
          avatarUrl: propertyObject.host.avatarUrl,
        },
        rating: propertyObject.rating,
        reviewsCount: propertyObject.reviewsCount,
        createdAt: new Date(propertyObject.createdAt),
    };

    return NextResponse.json(propertyResponse, { status: 200 });

  } catch (error: any) {
    console.error(`[API /properties/${id} GET] Error fetching property:`, error);
    return NextResponse.json({ message: 'Server error while fetching property.', errorDetails: error.message }, { status: 500 });
  }
}


// PATCH handler to update a property by ID
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

    // Authorization: Check if the logged-in user is the host of the property
    if (propertyToUpdate.hostId.toString() !== session.user.id) {
      return NextResponse.json({ message: 'Forbidden: You are not authorized to update this property.' }, { status: 403 });
    }

    const body = await request.json();
    const parsedBody = propertyUpdateSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ message: 'Invalid property data provided.', errors: parsedBody.error.format() }, { status: 400 });
    }
    
    const updateData = parsedBody.data;

    // Special handling for images if they are part of the update
    if (updateData.images) {
        (updateData as any).images = updateData.images.map(img => img.url);
    }


    const updatedProperty = await PropertyModel.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });

    if (!updatedProperty) {
        // Should not happen if findById found it, but as a safeguard
        return NextResponse.json({ message: 'Property found but update failed unexpectedly.' }, { status: 500 });
    }
    
    console.log(`[API /properties/${id} PATCH] Property updated successfully by user ${session.user.id}`);
    return NextResponse.json({ message: 'Property updated successfully!', property: updatedProperty.toObject() }, { status: 200 });

  } catch (error: any) {
    console.error(`[API /properties/${id} PATCH] Error updating property:`, error);
     let errorMessage = 'An unexpected error occurred while updating the property.';
    if (error.name === 'MongoNetworkError') {
        errorMessage = 'Database connection error. Please try again later.';
    } else if (error.code === 11000) { // Duplicate key error (e.g. if trying to set a unique field to an existing value)
        errorMessage = 'A property with some of these unique details might already exist.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage, errorDetails: error.toString() }, { status: 500 });
  }
}

    