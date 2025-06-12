
import PropertyCard from './PropertyCard';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { Property as PropertyType } from '@/lib/types';
import connectDB from '@/utils/db';
import PropertyModel, { type PropertyDocument } from '@/models/Property'; 
import mongoose from 'mongoose';
import { startOfDay } from 'date-fns';

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
    const searchRegex = new RegExp(searchParams.searchLocation, 'i');
    query.$or = [
      { location: { $regex: searchRegex } },
      { title: { $regex: searchRegex } },
      // { address: { $regex: searchRegex } }, // Optionally search address
    ];
  }

  const dateConditions: mongoose.FilterQuery<PropertyDocument>[] = [];

  if (searchParams?.searchCheckIn) {
    const checkInDate = startOfDay(new Date(searchParams.searchCheckIn));
    // Property's availability must start on or before the search check-in date,
    // OR the property has no specific start date defined.
    dateConditions.push({
      $or: [
        { availableFrom: { $exists: false } },
        { availableFrom: null },
        { availableFrom: { $lte: checkInDate } }
      ]
    });
  }

  if (searchParams?.searchCheckOut) {
    const checkOutDate = startOfDay(new Date(searchParams.searchCheckOut));
    // Property's availability must end on or after the search check-out date,
    // OR the property has no specific end date defined.
    dateConditions.push({
      $or: [
        { availableTo: { $exists: false } },
        { availableTo: null },
        { availableTo: { $gte: checkOutDate } }
      ]
    });
  }
  
  // If a property has specific availability dates, ensure the search range doesn't violate them.
  // This is implicitly handled by the above, but we can be more explicit if needed
  // e.g. if a property has availableFrom, searchCheckOut cannot be before it.
  // if (searchParams?.searchCheckOut && searchParams.searchCheckIn) {
  // This complex logic is better handled by checking actual booking slots in a more advanced system.
  // The current logic checks if the property *could* be available during the search window
  // based on its own defined start/end dates.
  // }


  if (dateConditions.length > 0) {
    if (query.$and) {
      query.$and.push(...dateConditions);
    } else {
      query.$and = dateConditions;
    }
  }

  // Add guest count filtering in the future if needed
  // if (searchParams?.searchGuests) {
  //   query.maxGuests = { $gte: parseInt(searchParams.searchGuests, 10) };
  // }

  const propertiesFromDB = await PropertyModel.find(query)
    .sort({ createdAt: -1 }) // Keep default sort by newest
    .lean();

  return propertiesFromDB.map(prop => {
    const { _id, __v, hostId, createdAt, updatedAt, images, availableFrom, availableTo, ...rest } = prop as any;
    return {
      id: _id.toString(),
      hostId: (hostId as mongoose.Types.ObjectId).toString(),
      images: images || [],
      createdAt: createdAt instanceof Date ? createdAt : new Date(createdAt),
      updatedAt: updatedAt instanceof Date ? updatedAt : new Date(updatedAt),
      availableFrom: availableFrom ? new Date(availableFrom) : undefined,
      availableTo: availableTo ? new Date(availableTo) : undefined,
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

  // Logic to show user's own properties first (if logged in and properties exist)
  // This sorting happens *after* filtering by search criteria.
  if (userId && allProperties.length > 0) {
    const userProperties: PropertyType[] = [];
    const otherProperties: PropertyType[] = [];

    for (const property of allProperties) {
      if (property.hostId === userId) {
        userProperties.push(property);
      } else {
        otherProperties.push(property);
      }
    }
    // Both arrays (userProperties, otherProperties) are already sorted by createdAt from fetchProperties
    propertiesToDisplay = [...userProperties, ...otherProperties];
  } else {
    propertiesToDisplay = allProperties; // Already sorted by createdAt
  }

  if (!propertiesToDisplay || propertiesToDisplay.length === 0) {
    const message = props.searchLocation || props.searchCheckIn || props.searchCheckOut 
        ? `No properties found matching your search criteria.` 
        : "No properties found.";
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
