
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/utils/db';
import Property from '@/models/Property';
import User from '@/models/User'; 
import * as z from 'zod';

const propertySubmissionSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(5000),
  type: z.enum(["House", "Apartment", "Room", "Unique Stay"]),
  location: z.string().min(3).max(100),
  address: z.string().min(5).max(200),
  pricePerNight: z.number().positive().min(10).max(10000),
  bedrooms: z.number().min(0).max(20),
  bathrooms: z.number().min(1).max(10),
  maxGuests: z.number().min(1).max(50),
  images: z.array(
    z.object({
      url: z.string().url()
    })
  ).min(1, "At least one image is required.").max(5, "Maximum 5 images allowed."),
  amenities: z.array(z.string()).optional(),
  availableFrom: z.coerce.date().optional(), // Use coerce.date() for string to Date conversion
  availableTo: z.coerce.date().optional(),   // Use coerce.date() for string to Date conversion
}).refine(data => {
  if (data.availableFrom && data.availableTo) {
    return data.availableTo >= data.availableFrom;
  }
  return true;
}, {
  message: "Availability end date cannot be before start date.",
  path: ["availableTo"],
});


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized: You must be logged in to list a property.' }, { status: 401 });
    }
    
    const hostId = session.user.id;
    const hostName = session.user.name || 'Anonymous Host';
    const hostAvatarUrl = session.user.image || undefined;

    const body = await request.json();
    const parsedBody = propertySubmissionSchema.safeParse(body);

    if (!parsedBody.success) {
      console.error("[API /properties POST] Validation Errors:", parsedBody.error.format());
      return NextResponse.json({ message: 'Invalid property data provided.', errors: parsedBody.error.format() }, { status: 400 });
    }

    const {
      title,
      description,
      type,
      location,
      address,
      pricePerNight,
      bedrooms,
      bathrooms,
      maxGuests,
      images, 
      amenities,
      availableFrom,
      availableTo,
    } = parsedBody.data;

    await connectDB();

    const newProperty = new Property({
      hostId,
      title,
      description,
      type,
      location,
      address,
      pricePerNight,
      bedrooms,
      bathrooms,
      maxGuests,
      images: images.map(img => img.url), 
      amenities: amenities || [],
      host: {
        name: hostName,
        avatarUrl: hostAvatarUrl,
      },
      availableFrom,
      availableTo,
    });

    await newProperty.save();
    console.log('[API /properties POST] Property saved successfully:', newProperty._id);

    return NextResponse.json({ message: 'Property listed successfully!', propertyId: newProperty._id.toString() }, { status: 201 });

  } catch (error: any) {
    console.error('[API /properties POST] Error listing property:', error);
    let errorMessage = 'An unexpected error occurred while listing the property.';
    if (error.name === 'MongoNetworkError') {
        errorMessage = 'Database connection error. Please try again later.';
    } else if (error.code === 11000) {
        errorMessage = 'A property with similar unique details might already exist.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage, errorDetails: error.toString() }, { status: 500 });
  }
}

