
"use client"; 

import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { MapPin, BedDouble, Bath, Users, Star, Edit3, AlertTriangle, Home as HomeIcon, ImageIcon, UserCircle, Calendar as CalendarIconLucide, DollarSign, Wifi, Loader2, CheckCircle, Moon, Package, Banknote, CalendarX, Info } from 'lucide-react';
import { PropertyAmenityIcon } from '@/components/property/PropertyAmenityIcon';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import type { Property as PropertyType, BookingStatus, BookedDateRange as ActiveBookingRange } from '@/lib/types'; // Renamed import for clarity
import { PropertyBookingCalendar } from '@/components/property/PropertyBookingCalendar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { DateRange } from "react-day-picker";
import { format, isValid as isValidDate, differenceInCalendarDays, startOfDay, isBefore, parseISO, isSameDay } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { loadStripe } from '@stripe/stripe-js';

const NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_51RZ79aD5LRi4lJMY7NPB8uLMtw4RVctP94bSLctPHBmZmrz1qVPpJwYue3CARvQ6PiMpcHnyqUSoGgaaJZk4bogo00FEf6knF0";

const stripePromise = loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface BookingPriceDetails {
  numberOfUnits: number;
  unitType: 'night' | 'week' | 'month' | 'nights' | 'weeks' | 'months';
  totalPrice: number;
}

const PropertyDetailsPage = () => {
  const params = useParams();
  const propertyId = params.id as string;
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [property, setProperty] = useState<PropertyType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // State for fetched booked date ranges
  const [activeBookings, setActiveBookings] = useState<ActiveBookingRange[] | null>(null);
  const [isLoadingActiveBookings, setIsLoadingActiveBookings] = useState(true);
  const [activeBookingsError, setActiveBookingsError] = useState<string | null>(null);

  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  const [availabilityText, setAvailabilityText] = useState<string | null>(null);
  const [currentBookingPriceDetails, setCurrentBookingPriceDetails] = useState<BookingPriceDetails | null>(null);
  
  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) {
        setPageError("Property ID is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setPageError(null);
      setProperty(null); 

      try {
        console.log(`[PropertyDetailsPage] Fetching property with ID: ${propertyId}`);
        const response = await fetch(`/api/properties/${propertyId}`);
        if (!response.ok) {
          let errorBodyText = "Could not parse error response.";
          try {
            const errorResult = await response.json();
            errorBodyText = errorResult.message || JSON.stringify(errorResult);
          } catch (e) {
             try {
                errorBodyText = await response.text();
            } catch (textErr) {
                errorBodyText = `Failed to read error response body. Status: ${response.status}`;
            }
          }
          console.warn(`[PropertyDetailsPage] Failed to fetch property ${propertyId}: ${response.status}`, errorBodyText);
          throw new Error(`Failed to fetch property data (${response.status}). Details: ${errorBodyText}`);
        }
        const data: PropertyType = await response.json();
        console.log(`[PropertyDetailsPage] Property data fetched successfully for ID: ${propertyId}. Note: bookedDateRanges are now fetched separately.`);
        setProperty(data);
        if (data?.title) {
          document.title = `${data.title} - Lodger`;
        }
      } catch (err: any) {
        console.error(`[PropertyDetailsPage] Error fetching property ID ${propertyId}:`, err);
        setPageError(err.message || "An error occurred while loading property details.");
        setProperty(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);


  // New useEffect to fetch active bookings
  useEffect(() => {
    const fetchBookedRangesForProperty = async () => {
      if (!property || !property.id || isLoading) { // Ensure property data is loaded and not already loading main data
        console.log(`[PropertyDetailsPage] Skipping fetchBookedRanges: property.id is ${property?.id}, isLoading is ${isLoading}`);
        return;
      }
      
      setIsLoadingActiveBookings(true);
      setActiveBookingsError(null);
      setActiveBookings(null);
      console.log(`[PropertyDetailsPage] Property ID ${property.id} available. Fetching booked ranges.`);

      try {
        const fetchUrl = `/api/properties/${property.id}/booked-ranges`;
        console.log(`[PropertyDetailsPage] Fetching booked ranges from URL: ${fetchUrl}`);
        const response = await fetch(fetchUrl);

        if (!response.ok) {
          let errorBody;
          try {
            errorBody = await response.json();
          } catch (e) {
            errorBody = await response.text().catch(() => "Could not read error response body");
          }
          console.warn(`[PropertyDetailsPage] Failed to fetch booked ranges for ${property.id}: ${response.status}`, errorBody);
          throw new Error(typeof errorBody === 'string' ? errorBody : errorBody.message || `Failed to fetch booked ranges (${response.status})`);
        }
        const data: ActiveBookingRange[] = await response.json();
        console.log(`[PropertyDetailsPage] Booked ranges data received for property ${property.id}:`, data);
        setActiveBookings(data);
      } catch (err: any) {
        console.error(`[PropertyDetailsPage] Error fetching booked ranges for property ${property.id}:`, err);
        setActiveBookingsError(err.message || "An error occurred while loading booked ranges.");
        setActiveBookings(null);
      } finally {
        setIsLoadingActiveBookings(false);
      }
    };

    fetchBookedRangesForProperty();
  }, [property, isLoading]); // Depends on property and main isLoading state


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
      } else {
          text = ""; 
      }
      setAvailabilityText(text || null); 
    } else {
      setAvailabilityText(null);
    }
  }, [property]);

  useEffect(() => {
    if (property && selectedDateRange?.from && selectedDateRange?.to) {
      const from = startOfDay(selectedDateRange.from);
      const to = startOfDay(selectedDateRange.to);

      if (isBefore(to, from)) {
        setCurrentBookingPriceDetails(null);
        return;
      }

      let numberOfUnits = 0;
      let unitType: BookingPriceDetails['unitType'] = 'nights';

      if (property.pricePeriod === 'nightly') {
        numberOfUnits = differenceInCalendarDays(to, from);
        if (numberOfUnits === 0 && from.getTime() === to.getTime()) { 
            numberOfUnits = 1; 
        }
        unitType = numberOfUnits === 1 ? 'night' : 'nights';
      } else if (property.pricePeriod === 'weekly') {
        numberOfUnits = Math.max(1, Math.ceil(differenceInCalendarDays(to, from) / 7));
        unitType = numberOfUnits === 1 ? 'week' : 'weeks';
      } else if (property.pricePeriod === 'monthly') {
        numberOfUnits = Math.max(1, Math.ceil(differenceInCalendarDays(to, from) / 30));
        unitType = numberOfUnits === 1 ? 'month' : 'months';
      }
      
      if (numberOfUnits > 0) {
        setCurrentBookingPriceDetails({
          numberOfUnits,
          unitType,
          totalPrice: property.price * numberOfUnits,
        });
      } else {
         if (property.pricePeriod !== 'nightly' && differenceInCalendarDays(to, from) <= 0) {
            numberOfUnits = 1; 
            unitType = property.pricePeriod === 'weekly' ? 'week' : 'month';
             setCurrentBookingPriceDetails({
                numberOfUnits,
                unitType,
                totalPrice: property.price * numberOfUnits,
            });
         } else {
            setCurrentBookingPriceDetails(null);
         }
      }
    } else {
      setCurrentBookingPriceDetails(null);
    }
  }, [selectedDateRange, property]);


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
     if (!NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      toast({ title: "Configuration Error", description: "Stripe is not configured for payments. Please contact support.", variant: "destructive" });
      console.error("Stripe publishable key is not set.");
      return;
    }


    setIsBookingLoading(true);
    try {
      const response = await fetch('/api/bookings/initiate-payment', {
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
        if (response.status === 409) { 
            toast({
                title: "Dates No Longer Available",
                description: result.message || "The selected dates have just been booked. Please choose different dates.",
                variant: "destructive",
            });
            setSelectedDateRange(undefined); 
            setCurrentBookingPriceDetails(null);
            
            // Re-fetch booked ranges for the property to update calendar
             if (property && property.id) {
                console.log(`[PropertyDetailsPage] Re-fetching booked ranges for ${property.id} after booking conflict.`);
                setIsLoadingActiveBookings(true);
                const bookedRangesResponse = await fetch(`/api/properties/${property.id}/booked-ranges`);
                if (bookedRangesResponse.ok) {
                    const updatedBookedRangesData = await bookedRangesResponse.json();
                    setActiveBookings(updatedBookedRangesData);
                    console.log(`[PropertyDetailsPage] Booked ranges for property ${property.id} re-fetched. New data:`, updatedBookedRangesData);
                } else {
                    console.warn(`[PropertyDetailsPage] Failed to re-fetch booked ranges for ${property.id} after conflict.`);
                    setActiveBookingsError("Failed to update availability after booking conflict. Please refresh.");
                }
                setIsLoadingActiveBookings(false);
            }

        } else {
            throw new Error(result.message || "Failed to initiate booking payment.");
        }
        return; 
      }
      
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe.js has not loaded yet.");
      }
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: result.sessionId,
      });

      if (stripeError) {
        console.error("Stripe redirect error:", stripeError);
        throw new Error(stripeError.message || "Failed to redirect to Stripe.");
      }
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

  const formatBookingStatusDisplay = (status?: BookingStatus): string => {
    if (!status || typeof status !== 'string') {
      return 'Unknown';
    }
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  console.log(`[PropertyDetailsPage Render] About to render booked periods. isLoadingActiveBookings: ${isLoadingActiveBookings}, activeBookingsError: ${activeBookingsError}, activeBookings:`, activeBookings);

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

           {availabilityText === null && isLoading ? (
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
                 { (property.availableFrom || property.availableTo) && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Note: Specific dates within this period might already be booked. Please check the calendar and booked periods below.
                    </p>
                 )}
              </div>
            ) : null}

            <div className="py-6 border-b border-border">
              <h3 className="text-xl font-semibold mb-3 font-headline flex items-center">
                <CalendarX size={20} className="mr-2 text-destructive" />
                Currently Booked/Pending Periods
              </h3>
              {isLoadingActiveBookings ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-5/6" />
                </div>
              ) : activeBookingsError ? (
                 <div className="flex items-center text-sm text-destructive">
                    <AlertTriangle size={16} className="mr-2" />
                    Error loading booked periods: {activeBookingsError}
                </div>
              ) : activeBookings && activeBookings.filter(range => ['pending_payment', 'pending_confirmation', 'confirmed_by_host'].includes(range.status)).length > 0 ? (
                <ul className="space-y-1 text-sm text-foreground/80 list-disc list-inside">
                  {activeBookings
                    .filter(range => ['pending_payment', 'pending_confirmation', 'confirmed_by_host'].includes(range.status))
                    .map((booking, index) => (
                    <li key={booking.bookingId || index}>
                      {format(parseISO(booking.startDate as unknown as string), 'LLL dd, yyyy')} - {format(parseISO(booking.endDate as unknown as string), 'LLL dd, yyyy')}
                      <span className="text-xs ml-2 px-1.5 py-0.5 rounded-full bg-muted-foreground/10 text-muted-foreground font-medium">
                        {formatBookingStatusDisplay(booking.status)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                 <div className="flex items-center text-sm text-muted-foreground">
                    <Info size={16} className="mr-2 text-primary" />
                    This property has no active or pending bookings at the moment.
                </div>
              )}
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
              <div className="flex justify-between items-baseline mb-1">
                <p className="text-2xl font-bold">
                    <DollarSign className="inline h-6 w-6 mr-1 relative -top-0.5" />
                    {property.price}
                </p>
                <span className="text-sm font-normal text-muted-foreground">{getPricePeriodText(property.pricePeriod)}</span>
              </div>
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
                  activeBookings={activeBookings} 
                />
              </div>
              
              {currentBookingPriceDetails && (
                <div className="mb-4 p-3 border rounded-md bg-muted/50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      ${property.price} x {currentBookingPriceDetails.numberOfUnits} {currentBookingPriceDetails.unitType}
                    </span>
                    <span className="font-semibold">
                      ${(property.price * currentBookingPriceDetails.numberOfUnits).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-base font-bold mt-2 pt-2 border-t">
                    <span>Total</span>
                    <span>${currentBookingPriceDetails.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}


              <Button 
                size="lg" 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={handleReserve}
                disabled={isBookingLoading || !selectedDateRange?.from || !selectedDateRange?.to || !NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || !currentBookingPriceDetails}
              >
                {isBookingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isBookingLoading ? "Processing..." : "Reserve & Pay"}
              </Button>
              {!NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
                <p className="text-xs text-destructive text-center mt-2">Payments are currently unavailable.</p>
              )}
              {NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
                <p className="text-xs text-muted-foreground text-center mt-2">You will be redirected to our payment partner.</p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PropertyDetailsPage;
