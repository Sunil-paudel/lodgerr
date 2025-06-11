import { getProperties } from '@/lib/mock-data';
import PropertyCard from './PropertyCard';

const PropertyList = async () => {
  const properties = await getProperties();

  if (!properties || properties.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No properties found matching your criteria.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
};

export default PropertyList;
