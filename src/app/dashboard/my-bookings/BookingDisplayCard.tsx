
"use client"; // Add this directive

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Added import
import { MapPin, CalendarDays, DollarSign, Info, PackageCheck, CreditCard, Clock3, AlertTriangle, ImageIcon, Building, Edit3 } from 'lucide-react';
import type { BookingStatus, PaymentStatus } from '@/lib/types';
import { BookingActions } from './BookingActions';
import { useSession } from 'next-auth/react';

interface EnrichedBookingForDisplay {
  id: string;
  guestId: string; // Make sure guestId is available for comparison
  propertyDetails?: {
    id?: string;
    title?: string;
    mainImage?: string;
    location?: string;
  };
  formattedStartDate: string;
  formattedEndDate: string;
  totalPrice: number;
  formattedBookingStatus: string;
  rawBookingStatus: BookingStatus;
  formattedPaymentStatus: string;
  rawPaymentStatus: PaymentStatus;
  formattedCreatedAt: string;
}

interface BookingDisplayCardProps {
  booking: EnrichedBookingForDisplay;
}

const getBookingStatusVariant = (status: BookingStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'pending_confirmation':
    case 'pending_payment':
      return "secondary";
    case 'confirmed_by_host':
    case 'completed':
      return "default";
    case 'rejected_by_host':
    case 'cancelled_by_guest':
    case 'cancelled_by_admin':
      return "destructive";
    case 'no_show':
      return "outline";
    default:
      return "outline";
  }
};

const getPaymentStatusVariant = (status: PaymentStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'pending':
      return "secondary";
    case 'paid':
      return "default";
    case 'failed':
    case 'refunded':
      return "destructive";
    default:
      return "outline";
  }
};

const BookingDisplayCard = ({ booking }: BookingDisplayCardProps) => {
  const { data: session } = useSession();
  const propertyImage = booking.propertyDetails?.mainImage || 'https://placehold.co/600x400.png';
  const propertyTitle = booking.propertyDetails?.title || 'Property Title N/A';
  const propertyLocation = booking.propertyDetails?.location || 'Location N/A';
  const aiHint = booking.propertyDetails?.mainImage ? "booked property" : "placeholder property";

  const isCurrentUserGuest = session?.user?.id === booking.guestId;
  const isAdmin = session?.user?.role === 'admin';

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out">
      <div className="grid grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-1 relative aspect-video md:aspect-square">
          {booking.propertyDetails?.id ? (
            <Link href={`/properties/${booking.propertyDetails.id}`}>
              <Image
                src={propertyImage}
                alt={`Image of ${propertyTitle}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover"
                data-ai-hint={aiHint}
              />
            </Link>
          ) : (
             <div className="w-full h-full bg-muted flex items-center justify-center" data-ai-hint="placeholder building">
                <Building size={48} className="text-muted-foreground/50"/>
            </div>
          )}
        </div>
        <div className="md:col-span-2 flex flex-col">
          <CardHeader className="pb-3">
            {booking.propertyDetails?.id ? (
              <Link href={`/properties/${booking.propertyDetails.id}`}>
                <CardTitle className="text-xl font-semibold hover:text-primary transition-colors font-headline line-clamp-2">
                  {propertyTitle}
                </CardTitle>
              </Link>
            ) : (
              <CardTitle className="text-xl font-semibold font-headline line-clamp-2">
                {propertyTitle}
              </CardTitle>
            )}
            <CardDescription className="text-sm flex items-center text-muted-foreground">
              <MapPin size={14} className="mr-1.5 flex-shrink-0" /> {propertyLocation}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm pt-0 pb-4 flex-grow">
            <div className="flex items-center">
              <CalendarDays size={16} className="mr-2 text-primary" />
              <span>Dates: {booking.formattedStartDate} to {booking.formattedEndDate}</span>
            </div>
            <div className="flex items-center">
              <DollarSign size={16} className="mr-2 text-green-600" />
              <span>Total Price: ${booking.totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center">
              <PackageCheck size={16} className="mr-2 text-blue-600" />
              <span>Booking Status: </span>
              <Badge variant={getBookingStatusVariant(booking.rawBookingStatus)} className="ml-1.5 text-xs">
                {booking.formattedBookingStatus}
              </Badge>
            </div>
            <div className="flex items-center">
              <CreditCard size={16} className="mr-2 text-purple-600" />
              <span>Payment Status: </span>
              <Badge variant={getPaymentStatusVariant(booking.rawPaymentStatus)} className="ml-1.5 text-xs">
                {booking.formattedPaymentStatus}
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground pt-3 pb-4 px-6 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center">
                <Clock3 size={12} className="mr-1.5 flex-shrink-0" /> Booked on: {booking.formattedCreatedAt} (ID: {booking.id})
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              {(isCurrentUserGuest || isAdmin) && (
                <Button variant="outline" size="sm" className="w-full sm:w-auto border-blue-500 text-blue-600 hover:bg-blue-500/10 hover:text-blue-700" asChild>
                  <Link href={`/bookings/${booking.id}/edit`}>
                    <Edit3 className="mr-2 h-4 w-4" /> Edit Booking
                  </Link>
                </Button>
              )}
              {isCurrentUserGuest && ( // BookingActions (like cancel) are typically for the guest themselves
                <BookingActions
                  bookingId={booking.id}
                  bookingStatus={booking.rawBookingStatus}
                  propertyTitle={booking.propertyDetails?.title}
                />
              )}
            </div>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
};

export default BookingDisplayCard;
