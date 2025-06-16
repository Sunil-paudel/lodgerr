
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Edit3, CalendarDays, UserCircle, Home, PackageCheck, CreditCard, DollarSign, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Booking as BookingTypeFromLib, BookedDateRange as ActiveBookingRange, Property as PropertyTypeFromLib } from '@/lib/types'; 
import { format, startOfDay as startOfDayFn, isValid } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { PropertyBookingCalendar } from '@/components/property/PropertyBookingCalendar';
import type { DateRange } from 'react-day-picker';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Label } from '@/components/ui/label';


interface ExtendedBookingType extends BookingTypeFromLib {
  propertyDetails?: BookingTypeFromLib['propertyDetails'] & {
    price?: number;
    pricePeriod?: PropertyTypeFromLib['pricePeriod'];
    availableFrom?: Date | string;
    availableTo?: Date | string;
  };
  activeBookingsForProperty?: ActiveBookingRange[]; // For the calendar
}

const editBookingSchema = z.object({
  startDate: z.coerce.date({ required_error: "Check-in date is required."}),
  endDate: z.coerce.date({ required_error: "Check-out date is required."}),
}).refine(data => data.endDate > data.startDate, {
  message: "Check-out date must be after check-in date.",
  path: ["endDate"],
});

type EditBookingFormData = z.infer<typeof editBookingSchema>;

export default function EditBookingPage() {
  const { bookingId } = useParams() as { bookingId: string };
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [booking, setBooking] = useState<ExtendedBookingType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  const [activeBookingsForProperty, setActiveBookingsForProperty] = useState<ActiveBookingRange[] | null>(null);
  const [isLoadingActiveBookings, setIsLoadingActiveBookings] = useState(false);


  const { control, handleSubmit, setValue, watch, formState: { errors, isDirty, isValid: isFormValid } } = useForm<EditBookingFormData>({
    resolver: zodResolver(editBookingSchema),
    mode: 'onChange',
  });

  const watchedStartDate = watch('startDate');
  const watchedEndDate = watch('endDate');

  useEffect(() => {
    if (watchedStartDate && watchedEndDate) {
      setSelectedDateRange({ from: watchedStartDate, to: watchedEndDate });
    } else if (watchedStartDate) {
      setSelectedDateRange({ from: watchedStartDate, to: undefined });
    } else {
      setSelectedDateRange(undefined);
    }
  }, [watchedStartDate, watchedEndDate]);


  const fetchBookingDetails = useCallback(async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`);
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Failed to fetch booking details.');
      }
      const data: ExtendedBookingType = await response.json();
      
      if (session?.user?.id !== data.guestId && session?.user?.role !== 'admin') {
        throw new Error("You are not authorized to view or edit this booking.");
      }
      setBooking(data);
      setValue('startDate', new Date(data.startDate));
      setValue('endDate', new Date(data.endDate));
      setSelectedDateRange({ from: new Date(data.startDate), to: new Date(data.endDate) });

      if (data.propertyDetails?.id && session?.user?.role === 'admin') {
        setIsLoadingActiveBookings(true);
        const bookedRangesResponse = await fetch(`/api/properties/${data.propertyDetails.id}/booked-ranges`);
        if (bookedRangesResponse.ok) {
          const bookedRangesData = await bookedRangesResponse.json();
          setActiveBookingsForProperty(bookedRangesData);
        } else {
          console.warn("Failed to fetch active bookings for property calendar display.");
          setActiveBookingsForProperty(null);
        }
        setIsLoadingActiveBookings(false);
      }

    } catch (err: any) {
      setPageError(err.message || "An error occurred.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, session, setValue, toast]);


  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace(`/login?callbackUrl=/bookings/${bookingId}/edit`);
      return;
    }
    if (authStatus === 'authenticated' && bookingId) {
      fetchBookingDetails();
    }
  }, [authStatus, bookingId, router, fetchBookingDetails]);


  const handleDateRangeChangeForForm = (range: DateRange | undefined) => {
    setSelectedDateRange(range); // For calendar display
    if (range?.from) setValue('startDate', range.from, { shouldValidate: true, shouldDirty: true });
    if (range?.to) setValue('endDate', range.to, { shouldValidate: true, shouldDirty: true });
     // If only 'from' is selected, clear 'to' to ensure user selects it if needed
    if (range?.from && !range?.to) {
        setValue('endDate', undefined as any, { shouldValidate: true, shouldDirty: true });
    }
  };
  

  const onSubmitChanges: SubmitHandler<EditBookingFormData> = async (data) => {
    if (!booking || !session || session.user?.role !== 'admin') {
      toast({ title: "Error", description: "Unauthorized or booking data missing.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: { startDate?: Date; endDate?: Date } = {};
      let hasChanges = false;

      const formStartDate = data.startDate ? startOfDayFn(data.startDate) : null;
      const originalStartDate = booking.startDate ? startOfDayFn(new Date(booking.startDate)) : null;
      if (formStartDate && originalStartDate && formStartDate.getTime() !== originalStartDate.getTime()) {
        payload.startDate = formStartDate;
        hasChanges = true;
      } else if (formStartDate && !originalStartDate) {
        payload.startDate = formStartDate;
        hasChanges = true;
      }


      const formEndDate = data.endDate ? startOfDayFn(data.endDate) : null;
      const originalEndDate = booking.endDate ? startOfDayFn(new Date(booking.endDate)) : null;
      if (formEndDate && originalEndDate && formEndDate.getTime() !== originalEndDate.getTime()) {
        payload.endDate = formEndDate;
        hasChanges = true;
      } else if (formEndDate && !originalEndDate) {
        payload.endDate = formEndDate;
        hasChanges = true;
      }
      
      if (!hasChanges) {
        toast({ title: "No Changes", description: "You haven't made any changes to the dates." });
        setIsSubmitting(false);
        return;
      }
      
      // Ensure both dates are sent if one is changed.
      if (payload.startDate && !payload.endDate) payload.endDate = booking.endDate;
      if (!payload.startDate && payload.endDate) payload.startDate = booking.startDate;


      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to update booking.");
      }

      toast({
        title: "Booking Updated",
        description: `Booking ${bookingId} has been successfully updated by admin.`,
      });
      fetchBookingDetails(); // Re-fetch to show updated data
      router.refresh(); // Could also use router.refresh() if other parts of the app need to update
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatStatusDisplay = (status?: string): string => {
    if (!status || typeof status !== 'string') return 'N/A';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const isAdmin = session?.user?.role === 'admin';


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
        <Card className="max-w-2xl mx-auto shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle className="text-2xl md:text-3xl font-bold font-headline text-primary flex items-center">
                <Edit3 className="mr-3 h-7 w-7" /> {isAdmin ? "Edit Booking (Admin)" : "Booking Details"}
                </CardTitle>
                {booking.propertyDetails?.id && (
                    <Link href={`/properties/${booking.propertyDetails.id}`} passHref>
                        <Button variant="outline" size="sm">View Property</Button>
                    </Link>
                )}
            </div>
            <CardDescription>
              Booking ID: {booking.id} for {booking.propertyDetails?.title || "property"}.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit(onSubmitChanges)}>
            <CardContent className="space-y-6">
                {!isAdmin && (
                    <div className="border border-dashed border-amber-500 bg-amber-50 p-4 rounded-md text-amber-700">
                        <h4 className="font-semibold text-md mb-1 flex items-center">
                            <AlertTriangle size={18} className="mr-2"/> Important Notice
                        </h4>
                        <p className="text-sm">
                            To modify your booking, such as changing dates or other core details, please contact support or your host.
                        </p>
                    </div>
                )}

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
                    
                    {/* Dates Display/Edit Section */}
                    {isAdmin ? (
                        <div className="space-y-2">
                            <Label htmlFor="booking-dates-admin-edit">Booking Dates</Label>
                            <Controller
                                name="startDate" // Not directly used by PropertyBookingCalendar, but good for form context
                                control={control}
                                render={({ field }) => ( // field is not directly used here since PropertyBookingCalendar handles its own state
                                     <PropertyBookingCalendar
                                        selectedRange={selectedDateRange}
                                        onDateChange={handleDateRangeChangeForForm}
                                        price={booking.propertyDetails?.price || 0}
                                        pricePeriod={booking.propertyDetails?.pricePeriod || 'nightly'}
                                        availableFrom={booking.propertyDetails?.availableFrom}
                                        availableTo={booking.propertyDetails?.availableTo}
                                        activeBookings={activeBookingsForProperty}
                                    />
                                )}
                            />
                             {errors.startDate && <p className="text-sm text-destructive pt-1">{errors.startDate.message}</p>}
                             {errors.endDate && !errors.startDate && <p className="text-sm text-destructive pt-1">{errors.endDate.message}</p>}
                        </div>
                    ) : (
                        <div className="text-sm">
                            <CalendarDays className="inline mr-2 h-5 w-5 text-muted-foreground" />
                            <strong>Dates:</strong> {format(new Date(booking.startDate), 'LLL dd, yyyy')} - {format(new Date(booking.endDate), 'LLL dd, yyyy')}
                        </div>
                    )}

                    <div className="text-sm">
                        <DollarSign className="inline mr-2 h-5 w-5 text-muted-foreground" />
                        <strong>Total Price:</strong> ${booking.totalPrice.toFixed(2)}
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
                        Booked on: {format(new Date(booking.createdAt), 'LLL dd, yyyy, p')}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-3 pt-6 border-t">
                <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSubmitting}>
                Back
                </Button>
                {isAdmin && (
                    <Button type="submit" disabled={isSubmitting || !isDirty || !isFormValid} className="bg-accent hover:bg-accent/80 text-accent-foreground">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                )}
            </CardFooter>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
