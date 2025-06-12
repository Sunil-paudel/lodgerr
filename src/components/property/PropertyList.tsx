
import PropertyCard from './PropertyCard';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { Property as PropertyType } from '@/lib/types';
import connectDB from '@/utils/db';
import PropertyModel, { type PropertyDocument } from '@/models/Property'; 
import mongoose from 'mongoose';

interface PropertyListProps {
  searchLocation?: string;
  searchCheckIn?: string;
  searchCheckOut?: string;
  // searchGuests?: string; // For future use
}

async function fetchProperties(
  searchParams?: PropertyListProps
): Promise<PropertyType[]> {
  await connectDB();
  
  const query: mongoose.FilterQuery<PropertyDocument> = {};

  if (searchParams?.searchLocation) {
    // Case-insensitive search for location, can also be extended to title or description
    query.$or = [
      { location: { $regex: new RegExp(searchParams.searchLocation, 'i') } },
      { title: { $regex: new RegExp(searchParams.searchLocation, 'i') } },
      // { address: { $regex: new RegExp(searchParams.searchLocation, 'i') } }, // Optionally search address
    ];
  }

  // Basic date filtering (can be made more sophisticated)
  // This currently checks if property's general availability window overlaps with search dates.
  // More advanced logic would involve checking against actual booked dates for the property.
  if (searchParams?.searchCheckIn) {
    const checkInDate = new Date(searchParams.searchCheckIn);
    // Property should be available FROM this date or have no start date
    query.$and = query.$and || [];
    query.$and.push({ 
      $or: [
        { availableFrom: { $lte: checkInDate } }, 
        { availableFrom: { $exists: false } }
      ] 
    });
  }
  if (searchParams?.searchCheckOut) {
    const checkOutDate = new Date(searchParams.searchCheckOut);
     // Property should be available TO this date or have no end date
    query.$and = query.$and || [];
    query.$and.push({ 
      $or: [
        { availableTo: { $gte: checkOutDate } }, 
        { availableTo: { $exists: false } }
      ] 
    });
  }

  // Add guest count filtering in the future if needed
  // if (searchParams?.searchGuests) {
  //   query.maxGuests = { $gte: parseInt(searchParams.searchGuests, 10) };
  // }

  const propertiesFromDB = await PropertyModel.find(query)
    .sort({ createdAt: -1 }) // Keep default sort by newest
    .lean();

  return propertiesFromDB.map(prop => {
    const { _id, __v, hostId, createdAt, updatedAt, images, ...rest } = prop as any;
    return {
      id: _id.toString(),
      hostId: (hostId as mongoose.Types.ObjectId).toString(),
      images: images || [],
      createdAt: createdAt instanceof Date ? createdAt : new Date(createdAt),
      updatedAt: updatedAt instanceof Date ? updatedAt : new Date(updatedAt),
      host: {
          name: prop.host?.name || 'Unknown Host',
          avatarUrl: prop.host?.avatarUrl
      },
      ...rest,
    } as PropertyType;
  });
}


const PropertyList = async (props: PropertyListProps) => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  let allProperties: PropertyType[] = [];
  try {
    allProperties = await fetchProperties(props); 
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
    // User's properties still sorted by createdAt (newest first within their group)
    // Other properties also sorted by createdAt (newest first within their group)
    propertiesToDisplay = [...userProperties, ...otherProperties];
  } else {
    propertiesToDisplay = allProperties; // Already sorted by createdAt
  }

  if (!propertiesToDisplay || propertiesToDisplay.length === 0) {
    const message = props.searchLocation ? `No properties found matching "${props.searchLocation}".` : "No properties found.";
    return <p className="text-center text-muted-foreground py-10">{message}</p>;
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
