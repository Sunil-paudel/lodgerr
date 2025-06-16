
"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function BookingCancelDetails() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const bookingId = searchParams?.get('booking_id');
    // You could potentially update the booking status in your DB to 'cancelled_by_user_during_payment'
    // or similar, but for now, we just inform the user.
    // The booking in the DB would remain 'pending_payment'.
    // A cleanup job could later remove old 'pending_payment' bookings.
    
    // toast({
    //   title: "Payment Cancelled",
    //   description: bookingId ? `The payment process for booking ${bookingId} was not completed.` : "The payment process was not completed.",
    //   variant: "default", // Or "warning" if you add such a variant
    // });
  }, [searchParams, toast]);

  return (
    <Card className="w-full max-w-lg shadow-xl text-center">
      <CardHeader>
        <AlertTriangle className="mx-auto h-16 w-16 text-amber-500 mb-4" />
        <CardTitle className="text-3xl font-bold font-headline text-primary">
          Payment Not Completed
        </CardTitle>
        <CardDescription className="text-base">
          Your booking was not completed because the payment process was cancelled or failed.
          Your card has not been charged.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          If you'd like to try again, you can return to the property page. If you continue to experience issues, please contact support.
        </p>
        {searchParams?.get('booking_id') && (
             <p className="text-xs text-muted-foreground">Booking ID: {searchParams.get('booking_id')}</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-6">
        <Button asChild className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" /> Go to Homepage
          </Link>
        </Button>
        {/* Optionally, link back to the property page if you have the property ID */}
        {/* <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href={searchParams?.get('property_id') ? `/properties/${searchParams.get('property_id')}` : '/'}>
            Return to Property
          </Link>
        </Button> */}
      </CardFooter>
    </Card>
  );
}
