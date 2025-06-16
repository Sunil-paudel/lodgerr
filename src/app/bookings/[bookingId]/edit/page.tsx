
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Edit3, CalendarDays, UserCircle, Home as HomeIcon, PackageCheck, CreditCard, DollarSign } from 'lucide-react'; // Removed Save icon
import { useToast } from '@/hooks/use-toast';
import type { Booking as BookingTypeFromLib } from '@/lib/types'; 
import { format, isValid } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
// Removed PropertyBookingCalendar, form-related imports (useForm, Controller, zodResolver, z, Label)

interface ExtendedBookingType extends BookingTypeFromLib {
  propertyDetails?: BookingTypeFromLib['propertyDetails'] & {
    mainImage?: string; // Ensure mainImage is available
    location?: string;  // Ensure location is available
    // Add other fields if needed from PropertyType that are part of propertyDetails
    price?: number;
    pricePeriod?: BookingTypeFromLib['propertyDetails'] extends infer PD ? PD extends { pricePeriod: any } ? PD['pricePeriod'] : never : never;
    availableFrom?: Date | string;
    availableTo?: Date | string;
  };
  guestDetails?: BookingTypeFromLib['guestDetails']; // Ensure guestDetails is defined
}

// Removed editBookingSchema and EditBookingFormData

export default function EditBookingPage() {
  const { bookingId } = useParams() as { bookingId: string };
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [booking, setBooking] = useState<ExtendedBookingType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  // Removed isSubmitting and form-related states (selectedDateRange, activeBookingsForProperty, etc.)

  // Removed react-hook-form initialization
  // const { control, handleSubmit, setValue, watch, formState: { errors, isDirty, isValid: isFormValid } } = useForm...

  const fetchBookingDetails = useCallback(async () => {
    if (!bookingId) {
      setPageError("Booking ID is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setPageError(null);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`);
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Failed to fetch booking details.');
      }
      const data: ExtendedBookingType = await response.json();
      
      // Authorization check: guest or admin can view
      if (session?.user?.id !== data.guestId && session?.user?.role !== 'admin') {
        setPageError("You are not authorized to view this booking's details.");
        setBooking(null);
        setIsLoading(false);
        return;
      }
      setBooking(data);
      // No form values to set since it's informational
    } catch (err: any) {
      setPageError(err.message || "An error occurred.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setBooking(null);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, session, toast]); // Removed setValue from dependencies

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace(`/login?callbackUrl=/bookings/${bookingId}/edit`);
      return;
    }
    if (authStatus === 'authenticated' && bookingId) {
      fetchBookingDetails();
    }
  }, [authStatus, bookingId, router, fetchBookingDetails]);

  // Removed onSubmitChanges and related form logic

  const formatStatusDisplay = (status?: string): string => {
    if (!status || typeof status !== 'string') return 'N/A';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // const isAdmin = session?.user?.role === 'admin'; // Not strictly needed if form is removed

  if (authStatus === 'loading' || isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Loading booking details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12 text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-semibold text-destructive mb-2">Access Denied or Error</h1>
          <p className="text-muted-foreground mb-6">{pageError}</p>
          <Button onClick={() => router.push('/dashboard')} variant="outline">Go to Dashboard</Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12 text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Booking Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested booking could not be found.</p>
          <Button onClick={() => router.back()} variant="outline">Go Back</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        {/* Changed form to a div, removed onSubmit */}
        <Card className="max-w-2xl mx-auto shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle className="text-2xl md:text-3xl font-bold font-headline text-primary flex items-center">
                <Edit3 className="mr-3 h-7 w-7" /> Booking Details
                </CardTitle>
                {booking.propertyDetails?.id && (
                    <Link href={`/properties/${booking.propertyDetails.id}`} passHref>
                        <Button variant="outline" size="sm">View Property</Button>
                    </Link>
                )}
            </div>
            <CardDescription>
              Reviewing booking ID: {booking.id} for {booking.propertyDetails?.title || "property"}.
            </CardDescription>
          </CardHeader>
          
            <CardContent className="space-y-6">
                {/* Informational message about editing */}
                 <div className="border border-dashed border-amber-500 bg-amber-50 p-4 rounded-md text-amber-700">
                    <h4 className="font-semibold text-md mb-1 flex items-center">
                        <AlertTriangle size={18} className="mr-2"/> Booking Management
                    </h4>
                    <p className="text-sm">
                       Currently, direct editing of core booking details (like dates or price) is not supported through this interface.
                       For such changes, please cancel this booking (if applicable) and create a new one, or contact support for assistance.
                    </p>
                </div>

                {booking.propertyDetails && (
                    <div className="p-4 border rounded-lg bg-background/50">
                        <h3 className="text-lg font-semibold mb-2 text-foreground">Property Details</h3>
                        <div className="flex items-center space-x-4">
                            {booking.propertyDetails.mainImage && (
                                <div className="relative w-24 h-24 rounded-md overflow-hidden">
                                    <Image src={booking.propertyDetails.mainImage} alt={booking.propertyDetails.title || 'Property image'} layout="fill" objectFit="cover" data-ai-hint="property photo"/>
                                </div>
                            )}
                            <div>
                                <p className="font-medium">{booking.propertyDetails.title}</p>
                                <p className="text-sm text-muted-foreground">{booking.propertyDetails.location}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-4 border rounded-lg bg-background/50 space-y-3">
                    <h3 className="text-lg font-semibold mb-2 text-foreground">Booking Information</h3>
                    <div className="text-sm">
                        <UserCircle className="inline mr-2 h-5 w-5 text-muted-foreground" />
                        <strong>Guest:</strong> {booking.guestDetails?.name || 'N/A'} ({booking.guestDetails?.email || 'N/A'})
                    </div>
                    
                    {/* Dates Display Section (read-only) */}
                    <div className="text-sm">
                        <CalendarDays className="inline mr-2 h-5 w-5 text-muted-foreground" />
                        <strong>Dates:</strong> {isValid(new Date(booking.startDate)) ? format(new Date(booking.startDate), 'LLL dd, yyyy') : 'Invalid date'} - {isValid(new Date(booking.endDate)) ? format(new Date(booking.endDate), 'LLL dd, yyyy') : 'Invalid date'}
                    </div>
                    {/* Removed PropertyBookingCalendar and Controller for dates */}

                    <div className="text-sm">
                        <DollarSign className="inline mr-2 h-5 w-5 text-muted-foreground" />
                        <strong>Total Price:</strong> ${typeof booking.totalPrice === 'number' ? booking.totalPrice.toFixed(2) : 'N/A'}
                    </div>
                    <div className="text-sm">
                        <PackageCheck className="inline mr-2 h-5 w-5 text-muted-foreground" />
                        <strong>Booking Status:</strong> <span className="font-medium">{formatStatusDisplay(booking.bookingStatus)}</span>
                    </div>
                    <div className="text-sm">
                        <CreditCard className="inline mr-2 h-5 w-5 text-muted-foreground" />
                        <strong>Payment Status:</strong> <span className="font-medium">{formatStatusDisplay(booking.paymentStatus)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Booked on: {isValid(new Date(booking.createdAt)) ? format(new Date(booking.createdAt), 'LLL dd, yyyy, p') : 'Invalid date'}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-3 pt-6 border-t">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                Back
                </Button>
                {/* Removed Save Changes button */}
            </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
