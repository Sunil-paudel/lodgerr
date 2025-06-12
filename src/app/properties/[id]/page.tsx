
"use client"; 

import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { MapPin, BedDouble, Bath, Users, Star, Edit3, AlertTriangle, Home as HomeIcon, ImageIcon, UserCircle, Calendar as CalendarIconLucide, DollarSign, Wifi, Loader2 } from 'lucide-react';
import { PropertyAmenityIcon } from '@/components/property/PropertyAmenityIcon';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import type { Property as PropertyType } from '@/lib/types';
import { PropertyBookingCalendar } from '@/components/property/PropertyBookingCalendar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { DateRange } from 'react-day-picker';
import { format, isValid as isValidDate } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';


const PropertyDetailsPage = () => {
  const params = useParams();
  const propertyId = params.id as string;
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [property, setProperty] = useState<PropertyType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  const [availabilityText, setAvailabilityText] = useState<string | null>(null);


  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) {
        setPageError("Property ID is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setPageError(null);
      try {
        const response = await fetch(`/api/properties/${propertyId}`);
        if (!response.ok) {
          const errorResult = await response.json();
          throw new Error(errorResult.message || `Failed to fetch property: ${response.statusText}`);
        }
        const data: PropertyType = await response.json();
        setProperty(data);
        if (data?.title) {
          document.title = `${data.title} - Lodger`;
        }
      } catch (err: any) {
        setPageError(err.message || "An error occurred while loading property details.");
        setProperty(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  useEffect(() => {
    if (property) {
      const fromDate = property.availableFrom && isValidDate(new Date(property.availableFrom)) ? new Date(property.availableFrom) : null;
      const toDate = property.availableTo && isValidDate(new Date(property.availableTo)) ? new Date(property.availableTo) : null;
      let text = "";
      if (fromDate && toDate) {
          text = `Available from ${format(fromDate, 'LLL dd, yyyy')} to ${format(toDate, 'LLL dd, yyyy')}`;
      } else if (fromDate) {
          text = `Available from ${format(fromDate, 'LLL dd, yyyy')}`;
      } else if (toDate) {
          text = `Available until ${format(toDate, 'LLL dd, yyyy')}`;
      }
      setAvailabilityText(text || null); // Set to null if empty to distinguish from initial loading state
    } else {
      setAvailabilityText(null);
    }
  }, [property]);


  const handleReserve = async () => {
    if (authStatus === "unauthenticated" || !session?.user) {
      toast({ title: "Authentication Required", description: "Please log in to make a reservation.", variant: "destructive" });
      router.push(`/login?callbackUrl=/properties/${propertyId}`);
      return;
    }
    if (!selectedDateRange?.from || !selectedDateRange?.to) {
      toast({ title: "Dates Required", description: "Please select both check-in and check-out dates.", variant: "destructive" });
      return;
    }
    if (!property) {
      toast({ title: "Error", description: "Property data not available.", variant: "destructive" });
      return;
    }

    setIsBookingLoading(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          startDate: selectedDateRange.from.toISOString(),
          endDate: selectedDateRange.to.toISOString(),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create booking.");
      }
      toast({
        title: "Booking Request Sent!",
        description: result.message || "Your booking request has been sent and is pending confirmation.",
      });
      setSelectedDateRange(undefined); 
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsBookingLoading(false);
    }
  };


  if (isLoading || authStatus === "loading") {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 text-center flex flex-col justify-center items-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading property details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 text-center flex flex-col justify-center items-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-3xl font-bold mb-4 font-headline text-primary">Error</h1>
          <p className="text-muted-foreground mb-6">{pageError}</p>
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/">Go Back to Homepage</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!property) {
     return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 text-center flex flex-col justify-center items-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-3xl font-bold mb-4 font-headline text-primary">Property Not Found</h1>
          <p className="text-muted-foreground mb-6">The property details could not be loaded.</p>
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
      case 'weekly': return '/ week';
      case 'monthly': return '/ month';
      case 'nightly': default: return '/ night';
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

        <div className="mb-8">
          {hasImages ? (
            <Carousel opts={{ align: "start", loop: property.images.length > 1 }} className="w-full max-w-4xl mx-auto">
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

            {availabilityText === null && !isLoading ? ( // Show skeleton only if not loading and text is not yet computed
                <div className="py-6 border-b border-border">
                    <h3 className="text-xl font-semibold mb-2 font-headline flex items-center">
                        <CalendarIconLucide size={20} className="mr-2 text-primary" />
                        Host-Defined Availability
                    </h3>
                    <Skeleton className="h-5 w-3/4 my-1" />
                    <Skeleton className="h-4 w-full mt-1" />
                </div>
            ) : availabilityText ? (
              <div className="py-6 border-b border-border">
                <h3 className="text-xl font-semibold mb-2 font-headline flex items-center">
                  <CalendarIconLucide size={20} className="mr-2 text-primary" />
                  Host-Defined Availability
                </h3>
                <p className="text-foreground/90">{availabilityText}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Note: Specific dates within this period might already be booked. Please check the calendar below.
                </p>
              </div>
            ) : null}


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
                <PropertyBookingCalendar 
                  selectedRange={selectedDateRange}
                  onDateChange={setSelectedDateRange}
                  price={property.price}
                  pricePeriod={property.pricePeriod}
                  availableFrom={property.availableFrom}
                  availableTo={property.availableTo}
                />
              </div>

              <Button 
                size="lg" 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={handleReserve}
                disabled={isBookingLoading || !selectedDateRange?.from || !selectedDateRange?.to}
              >
                {isBookingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isBookingLoading ? "Reserving..." : "Reserve"}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">You won&apos;t be charged yet (Demo)</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PropertyDetailsPage;
