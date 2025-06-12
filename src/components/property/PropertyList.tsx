
import PropertyCard from './PropertyCard';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { Property as PropertyType } from '@/lib/types';
import connectDB from '@/utils/db';
import PropertyModel from '@/models/Property'; // Mongoose model
import mongoose from 'mongoose';

async function fetchAllProperties(): Promise<PropertyType[]> {
  await connectDB();
  // Fetch all properties, sorted by newest first, using .lean() for plain JS objects
  const propertiesFromDB = await PropertyModel.find({})
    .sort({ createdAt: -1 })
    .lean();

  // Manually transform the data to match the PropertyType interface
  return propertiesFromDB.map(prop => {
    const { _id, __v, hostId, createdAt, updatedAt, images, ...rest } = prop as any; // Cast to any to handle _id, __v
    
    // Ensure all fields match PropertyType, especially date fields and id transformation
    return {
      id: _id.toString(),
      hostId: (hostId as mongoose.Types.ObjectId).toString(), // Ensure hostId is string
      images: images || [], // Ensure images is an array, even if undefined/null from DB
      createdAt: createdAt instanceof Date ? createdAt : new Date(createdAt),
      updatedAt: updatedAt instanceof Date ? updatedAt : new Date(updatedAt),
      host: { // Ensure host object is correctly structured
          name: prop.host?.name || 'Unknown Host',
          avatarUrl: prop.host?.avatarUrl
      },
      // Spread the rest of the properties
      ...rest,
    } as PropertyType; // Cast to PropertyType
  });
}


const PropertyList = async () => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  let allProperties: PropertyType[] = [];
  try {
    allProperties = await fetchAllProperties(); // Fetch real properties
  } catch (error) {
    console.error("[PropertyList] Error fetching properties:", error);
    return <p className="text-center text-muted-foreground py-10">Could not load properties at this time. Please try again later.</p>;
  }

  let propertiesToDisplay: PropertyType[] = [];

  if (userId) {
    const userProperties: PropertyType[] = [];
    const otherProperties: PropertyType[] = [];

    for (const property of allProperties) {
      if (property.hostId === userId) {
        userProperties.push(property);
      } else {
        otherProperties.push(property);
      }
    }
    propertiesToDisplay = [...userProperties, ...otherProperties];
  } else {
    propertiesToDisplay = allProperties;
  }

  if (!propertiesToDisplay || propertiesToDisplay.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No properties found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {propertiesToDisplay.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
};

export default PropertyList;
