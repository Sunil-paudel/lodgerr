
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/utils/db';
import Property from '@/models/Property'; // PropertyDocument type from model
import type { Property as PropertyType } from '@/lib/types'; // Client-side Property type

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized: You must be logged in to view your properties.' }, { status: 401 });
  }

  try {
    await connectDB();
    const userId = session.user.id;

    // Mongoose can typically handle string IDs in queries if the schema field is ObjectId,
    // but it's safer to cast if you know it's an ObjectId.
    // However, session.user.id is already a string representation of ObjectId.
    // The Property model's hostId field is Schema.Types.ObjectId.
    // Mongoose query will handle the conversion.
    const userProperties = await Property.find({ hostId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 }).lean();
    
    // The .lean() method returns plain JavaScript objects, not Mongoose documents.
    // The toJSON transform should apply if you were calling .toJSON() on Mongoose documents,
    // or if you don't use .lean() and let Next.js/Express stringify the documents.
    // With .lean(), we need to manually ensure the transformation if 'id' is not present.
    const propertiesWithId: PropertyType[] = userProperties.map(prop => {
      const {_id, __v, ...rest } = prop as any; // Cast to any to handle _id, __v
      return {
        id: _id.toString(),
        hostId: (prop.hostId as mongoose.Types.ObjectId).toString(), // Ensure hostId is string
        ...rest,
        // Ensure all fields match PropertyType, especially date fields if they need conversion
        createdAt: prop.createdAt, // Assuming createdAt is already a Date or string
        updatedAt: prop.updatedAt, // Assuming updatedAt is already a Date or string
      } as PropertyType; // Cast to PropertyType
    });


    return NextResponse.json(propertiesWithId, { status: 200 });

  } catch (error: any) {
    console.error('[API /user/properties GET] Error fetching user properties:', error);
    let errorMessage = 'An unexpected error occurred while fetching your properties.';
     if (error.name === 'MongoNetworkError') {
        errorMessage = 'Database connection error. Please try again later.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage, errorDetails: error.toString() }, { status: 500 });
  }
}
