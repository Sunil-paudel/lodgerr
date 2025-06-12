import { getProperties } from '@/lib/mock-data';
import PropertyCard from './PropertyCard';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path as necessary
import type { Property } from '@/lib/types';

const PropertyList = async () => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const allProperties = await getProperties(); // Already sorted newest first

  let propertiesToDisplay: Property[] = [];

  if (userId) {
    const userProperties: Property[] = [];
    const otherProperties: Property[] = [];

    for (const property of allProperties) {
      // For mock data, we assume session.user.id would be 'user-logged-in-id' if that user logs in
      // In a real scenario, property.hostId would be the actual ObjectId string from the User model.
      if (property.hostId === userId) {
        userProperties.push(property);
      } else {
        otherProperties.push(property);
      }
    }
    // Both userProperties and otherProperties will retain the newest-first sort order
    // from allProperties because we iterate through allProperties in order.
    propertiesToDisplay = [...userProperties, ...otherProperties];
  } else {
    // If no user is logged in, display all properties sorted by newest first
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
