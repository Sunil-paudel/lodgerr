
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/utils/db';
import PropertyModel from '@/models/Property';
import type { Property as PropertyType, PricePeriod } from '@/lib/types';
import * as z from 'zod';

const propertyUpdateSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(20).max(5000).optional(),
  type: z.enum(["House", "Apartment", "Room", "Unique Stay"]).optional(),
  location: z.string().min(3).max(100).optional(),
  address: z.string().min(5).max(200).optional(),
  price: z.coerce.number().positive().min(1).max(100000).optional(),
  pricePeriod: z.enum(["nightly", "weekly", "monthly"] as [PricePeriod, ...PricePeriod[]]).optional(),
  bedrooms: z.coerce.number().min(0).max(20).optional(),
  bathrooms: z.coerce.number().min(0).max(10).optional(), // Allow 0 for unique cases
  maxGuests: z.coerce.number().min(1).max(50).optional(),
  images: z.array(z.object({ url: z.string().url() })).min(1).max(5).optional(),
  amenities: z.array(z.string()).optional(),
});


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

    const propertyObject = propertyDoc.toObject() as any;

    const propertyResponse: PropertyType = {
        id: propertyObject.id.toString(),
        hostId: propertyObject.hostId.toString(),
        title: propertyObject.title,
        description: propertyObject.description,
        location: propertyObject.location,
        address: propertyObject.address,
        price: propertyObject.price,
        pricePeriod: propertyObject.pricePeriod,
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
        availableFrom: propertyObject.availableFrom ? new Date(propertyObject.availableFrom) : undefined,
        availableTo: propertyObject.availableTo ? new Date(propertyObject.availableTo) : undefined,
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

    const updateData = parsedBody.data;

    if (updateData.images) {
        (updateData as any).images = updateData.images.map(img => img.url);
    }

    const updatedProperty = await PropertyModel.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });

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
