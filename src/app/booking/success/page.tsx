"use client"
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { CheckCircle, Loader2, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function BookingSuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams?.get('session_id');
    const bkId = searchParams?.get('booking_id');

    if (!sessionId) {
      setError('Missing payment session information. Your booking may not be confirmed.');
      toast({
        title: 'Confirmation Issue',
        description: 'Payment session ID is missing. Please check your bookings or contact support.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (!bkId) {
      setError('Missing booking information. Your booking confirmation might be delayed.');
      toast({
        title: 'Confirmation Pending',
        description:
          "Booking ID is missing. We'll confirm your booking status shortly. Check your dashboard.",
        variant: 'destructive',
      });
    }

    setBookingId(bkId);
    setIsLoading(false);
  }, [searchParams, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Confirming your booking...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-lg shadow-xl text-center">
          <CardHeader>
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-3xl font-bold font-headline text-primary">
              {error ? 'Confirmation Pending' : 'Booking Successful!'}
            </CardTitle>
            <CardDescription className="text-base">
              {error
                ? error
                : 'Thank you for your booking! Your payment has been processed successfully. A confirmation has been sent to your email (feature pending).'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bookingId && !error && (
              <p className="text-sm text-muted-foreground mb-4">
                Your booking ID is: <span className="font-semibold text-foreground">{bookingId}</span>.
                You can view your booking details in your dashboard.
              </p>
            )}
            {error && (
              <p className="text-sm text-destructive mb-4">
                If you have questions, please contact support with session ID:{' '}
                {searchParams?.get('session_id') || 'N/A'}.
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-6">
            <Button
              asChild
              className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" /> Go to Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/">Browse More Properties</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading confirmation...</div>}>
      <BookingSuccessClient />
    </Suspense>
  );
}
