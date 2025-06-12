
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { MapPin, BedDouble, Bath, Users, Star, Edit3, AlertTriangle, Home as HomeIcon, ImageIcon, UserCircle, Calendar as CalendarIconLucide, DollarSign, Wifi } from 'lucide-react';
import type { Metadata } from 'next';
import { PropertyAmenityIcon } from '@/components/property/PropertyAmenityIcon';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/utils/db';
import PropertyModel from '@/models/Property';
import type { Property as PropertyType } from '@/lib/types';
import mongoose from 'mongoose';
import { PropertyBookingCalendar } from '@/components/property/PropertyBookingCalendar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"


interface PropertyDetailsPageProps {
  params: { id: string };
}

async function fetchPropertyById(id: string): Promise<PropertyType | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.warn(`[PropertyDetailsPage] Invalid property ID format: ${id}`);
    return null;
  }
  await connectDB();
  try {
    const propertyDoc = await PropertyModel.findById(id).lean();
    if (!propertyDoc) {
      console.warn(`[PropertyDetailsPage] Property not found for ID: ${id}`);
      return null;
    }

    const { _id, __v, hostId, createdAt, updatedAt, ...rest } = propertyDoc as any;

    return {
      id: _id.toString(),
      hostId: (hostId as mongoose.Types.ObjectId).toString(),
      images: propertyDoc.images || [],
      price: propertyDoc.price, 
      pricePeriod: propertyDoc.pricePeriod, 
      createdAt: createdAt instanceof Date ? createdAt : new Date(createdAt),
      updatedAt: updatedAt instanceof Date ? updatedAt : new Date(updatedAt),
      host: {
          name: propertyDoc.host?.name || 'Unknown Host',
          avatarUrl: propertyDoc.host?.avatarUrl
      },
      ...rest,
    } as PropertyType;

  } catch (error) {
    console.error(`[PropertyDetailsPage] Error fetching property by ID ${id}:`, error);
    return null;
  }
}

export async function generateMetadata({ params }: PropertyDetailsPageProps): Promise<Metadata> {
  const property = await fetchPropertyById(params.id);
  if (!property) {
    return {
      title: 'Property Not Found - Lodger',
    };
  }
  return {
    title: `${property.title} - Lodger`,
    description: property.description.substring(0, 160),
  };
}

const PropertyDetailsPage = async ({ params }: PropertyDetailsPageProps) => {
  const session = await getServerSession(authOptions);
  const property = await fetchPropertyById(params.id);

  if (!property) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 text-center flex flex-col justify-center items-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-3xl font-bold mb-4 font-headline text-primary">Property Not Found</h1>
          <p className="text-muted-foreground mb-6">The property ID might be invalid, the property does not exist, or there was an issue fetching the details.</p>
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/">Go Back to Homepage</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwner = session?.user?.id === property.hostId;
  const isAdmin = session?.user?.role === 'admin';

  const hostAvatarHint = "host avatar";

  const getPricePeriodText = (period: PropertyType['pricePeriod']) => {
    switch (period) {
      case 'weekly':
        return '/ week';
      case 'monthly':
        return '/ month';
      case 'nightly':
      default:
        return '/ night';
    }
  };

  const hasImages = property.images && property.images.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-wrap justify-between items-start mb-6">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-primary font-headline">{property.title}</h1>
                <div className="flex flex-wrap items-center text-muted-foreground text-sm md:text-base">
                    <MapPin size={18} className="mr-2 flex-shrink-0" />
                    <span className="mr-2">{property.address || property.location}</span>
                    {property.rating !== undefined && property.rating !== null && (
                        <>
                            <span className="mx-1 hidden sm:inline">·</span>
                            <Star size={18} className="mr-1 text-amber-500 fill-current flex-shrink-0" />
                            <span>{property.rating.toFixed(1)} ({property.reviewsCount || 0} reviews)</span>
                        </>
                    )}
                </div>
            </div>
            {(isOwner || isAdmin) && (
              <Button asChild variant="outline" className="mt-4 md:mt-0 border-primary text-primary hover:bg-primary/10">
                <Link href={`/properties/${property.id}/edit`}>
                  <Edit3 className="mr-2 h-4 w-4" /> Edit Property
                </Link>
              </Button>
            )}
        </div>

        {/* Image Carousel Section */}
        <div className="mb-8">
          {hasImages ? (
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-4xl mx-auto"
            >
              <CarouselContent>
                {property.images.map((imgUrl, index) => (
                  <CarouselItem key={index} className="md:basis-full">
                    <div className="relative aspect-video md:aspect-[16/9] rounded-lg overflow-hidden shadow-lg">
                      <Image
                        src={imgUrl}
                        alt={`${property.title} image ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                        className="object-cover"
                        priority={index === 0} 
                        data-ai-hint={property.type === 'House' ? `house photo ${index+1}` : property.type === 'Apartment' ? `apartment photo ${index+1}` : `accommodation photo ${index+1}`}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {property.images.length > 1 && (
                <>
                  <CarouselPrevious className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-background/70 hover:bg-background text-foreground disabled:bg-background/40" />
                  <CarouselNext className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-background/70 hover:bg-background text-foreground disabled:bg-background/40" />
                </>
              )}
            </Carousel>
          ) : (
            <div className="relative aspect-video md:aspect-[16/9] rounded-lg overflow-hidden shadow-lg bg-muted flex items-center justify-center max-w-4xl mx-auto">
              <ImageIcon size={64} className="text-muted-foreground/50" data-ai-hint="placeholder property" />
            </div>
          )}
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <div className="pb-6 border-b border-border">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold font-headline">
                            {property.type} hosted by {property.host.name}
                        </h2>
                        <p className="text-muted-foreground">
                            {property.maxGuests} guests · {property.bedrooms} bedroom(s) · {property.bathrooms} bath(s)
                        </p>
                    </div>
                    {property.host.avatarUrl ? (
                        <Image src={property.host.avatarUrl} alt={property.host.name} width={60} height={60} className="rounded-full shadow" data-ai-hint={hostAvatarHint} />
                    ) : (
                        <div className="w-[60px] h-[60px] rounded-full bg-muted flex items-center justify-center shadow" data-ai-hint="avatar placeholder">
                            <UserCircle size={30} className="text-muted-foreground" />
                        </div>
                    )}
                </div>
            </div>

            <div className="py-6 border-b border-border">
              <h3 className="text-xl font-semibold mb-3 font-headline">About this place</h3>
              <p className="text-foreground/90 whitespace-pre-line leading-relaxed">{property.description}</p>
            </div>

            {property.amenities && property.amenities.length > 0 && (
                <div className="py-6">
                <h3 className="text-xl font-semibold mb-4 font-headline">What this place offers</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    {property.amenities.map((amenity) => (
                    <li key={amenity} className="flex items-center">
                        <PropertyAmenityIcon amenity={amenity} className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
                        <span>{amenity}</span>
                    </li>
                    ))}
                </ul>
                </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 border border-border rounded-lg shadow-xl bg-card">
              <p className="text-2xl font-bold mb-1">
                <DollarSign className="inline h-6 w-6 mr-1 relative -top-0.5" />
                {property.price}{' '}
                <span className="text-base font-normal text-muted-foreground">{getPricePeriodText(property.pricePeriod)}</span>
              </p>
              {property.rating !== undefined && property.rating !== null && (
                <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <Star size={16} className="mr-1 text-amber-500 fill-current" />
                    <span>{property.rating.toFixed(1)} ({property.reviewsCount || 0} reviews)</span>
                </div>
              )}

              <div className="mb-4">
                <PropertyBookingCalendar />
              </div>

              <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                Reserve (Coming Soon)
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">You won&apos;t be charged yet</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PropertyDetailsPage;

