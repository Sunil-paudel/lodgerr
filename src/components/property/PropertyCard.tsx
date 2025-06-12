import Image from 'next/image';
import Link from 'next/link';
import type { Property } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, BedDouble, Bath, Users, Star } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  // Determine appropriate AI hint based on property type
  let aiHint = "building exterior"; // Default hint
  if (property.type === 'House') aiHint = "house exterior";
  else if (property.type === 'Apartment') aiHint = "apartment building";
  else if (property.type === 'Room') aiHint = "house room";
  else if (property.type === 'Unique Stay') aiHint = "unique accommodation";

  const imageSrc = property.images && property.images.length > 0 ? property.images[0] : 'https://placehold.co/600x400.png';
  const imageAlt = property.images && property.images.length > 0 ? property.title : "Placeholder image";
  const finalAiHint = property.images && property.images.length > 0 ? aiHint : "placeholder property";


  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full rounded-lg">
      <CardHeader className="p-0 relative">
        <Link href={`/properties/${property.id}`} className="block aspect-[4/3] relative">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            data-ai-hint={finalAiHint}
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Link href={`/properties/${property.id}`}>
          <CardTitle className="text-lg font-semibold mb-1 hover:text-primary transition-colors font-headline line-clamp-2">{property.title}</CardTitle>
        </Link>
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
          <span className="truncate">{property.location}</span>
        </div>
        <div className="flex items-center space-x-3 text-sm text-muted-foreground mb-3">
          <span className="flex items-center"><BedDouble className="h-4 w-4 mr-1 flex-shrink-0" /> {property.bedrooms} beds</span>
          <span className="flex items-center"><Bath className="h-4 w-4 mr-1 flex-shrink-0" /> {property.bathrooms} baths</span>
          <span className="flex items-center"><Users className="h-4 w-4 mr-1 flex-shrink-0" /> {property.maxGuests} guests</span>
        </div>
        {property.rating && (
           <div className="flex items-center text-sm text-amber-500">
             <Star className="h-4 w-4 mr-1 fill-current" />
             <span>{property.rating.toFixed(1)} ({property.reviewsCount} reviews)</span>
           </div>
         )}
      </CardContent>
      <CardFooter className="p-4 border-t">
        <div className="flex justify-between items-center w-full">
          <p className="text-lg font-bold text-primary">
            ${property.pricePerNight} <span className="text-sm font-normal text-muted-foreground">/ night</span>
          </p>
          <Link href={`/properties/${property.id}`} className="text-sm font-medium text-accent hover:text-accent/80">
            View Details
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;
