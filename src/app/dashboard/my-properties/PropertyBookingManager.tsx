
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Booking as BookingType, BookingStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Loader2, CalendarDays, UserCircle, Info } from 'lucide-react';
import { format } from 'date-fns';

interface PropertyBookingManagerProps {
  propertyId: string;
  initialBookings: BookingType[];
}

const getInitials = (name?: string | null) => {
  if (!name) return "GU"; // Guest User
  const names = name.split(" ");
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  return (names[0][0] + (names[names.length - 1][0] || "")).toUpperCase();
};

const getStatusColor = (status: BookingStatus) => {
  switch (status) {
    case 'pending_confirmation': return 'text-yellow-600 bg-yellow-100/80 border-yellow-300';
    case 'confirmed_by_host': return 'text-green-600 bg-green-100/80 border-green-300';
    case 'rejected_by_host': return 'text-red-600 bg-red-100/80 border-red-300';
    case 'cancelled_by_guest': return 'text-slate-600 bg-slate-100/80 border-slate-300';
    case 'completed': return 'text-blue-600 bg-blue-100/80 border-blue-300';
    default: return 'text-gray-600 bg-gray-100/80 border-gray-300';
  }
};


export function PropertyBookingManager({ propertyId, initialBookings }: PropertyBookingManagerProps) {
  const [bookings, setBookings] = useState<BookingType[]>(initialBookings);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({}); // { [bookingId]: isLoading }
  const router = useRouter();
  const { toast } = useToast();

  const handleManageBooking = async (bookingId: string, newStatus: 'confirmed_by_host' | 'rejected_by_host') => {
    setLoadingStates(prev => ({ ...prev, [bookingId]: true }));
    try {
      const response = await fetch(`/api/bookings/${bookingId}/manage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update booking status.');
      }

      toast({
        title: 'Booking Updated',
        description: `Booking status changed to ${newStatus.replace('_', ' ')}.`,
      });
      
      // Refresh data to show updated status
      router.refresh(); 
      // Optionally, update local state immediately if router.refresh() has a delay
      // For now, relying on router.refresh() which re-runs server components.
      // If this page were fully client-side, we'd update `bookings` state here.

    } catch (error: any) {
      toast({
        title: 'Error Updating Booking',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [bookingId]: false }));
    }
  };
  
  if (!bookings || bookings.length === 0) {
    return (
        <div className="text-center py-6 bg-muted/30 rounded-lg">
            <Info className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No booking requests for this property yet.</p>
        </div>
    );
  }

  const pendingBookings = bookings.filter(b => b.bookingStatus === 'pending_confirmation');
  const otherBookings = bookings.filter(b => b.bookingStatus !== 'pending_confirmation');


  return (
    <div className="space-y-6">
      {pendingBookings.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2 text-amber-700">Pending Confirmation ({pendingBookings.length})</h3>
          <div className="space-y-3">
            {pendingBookings.map(booking => (
              <Card key={booking.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={booking.guestDetails?.avatarUrl || undefined} alt={booking.guestDetails?.name || 'Guest'} />
                      <AvatarFallback>{getInitials(booking.guestDetails?.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base font-semibold">{booking.guestDetails?.name || 'Guest User'}</CardTitle>
                      <CardDescription className="text-xs">{booking.guestDetails?.email}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-1.5">
                  <p className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground"/> Dates: {format(new Date(booking.startDate), 'LLL dd, yyyy')} - {format(new Date(booking.endDate), 'LLL dd, yyyy')}</p>
                  <p>Total Price: ${booking.totalPrice.toFixed(2)}</p>
                  <p>Requested: {format(new Date(booking.createdAt), 'LLL dd, yyyy p')}</p>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                    onClick={() => handleManageBooking(booking.id, 'rejected_by_host')}
                    disabled={loadingStates[booking.id]}
                  >
                    {loadingStates[booking.id] ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <XCircle className="mr-1.5 h-4 w-4" />}
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
                    onClick={() => handleManageBooking(booking.id, 'confirmed_by_host')}
                    disabled={loadingStates[booking.id]}
                  >
                    {loadingStates[booking.id] ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1.5 h-4 w-4" />}
                    Accept
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {otherBookings.length > 0 && (
         <div>
            <h3 className="text-lg font-medium mt-6 mb-2 text-foreground/80">Other Bookings ({otherBookings.length})</h3>
            <div className="space-y-3">
            {otherBookings.map(booking => (
              <Card key={booking.id} className={`shadow-sm ${getStatusColor(booking.bookingStatus)} border-opacity-60`}>
                <CardHeader className="pb-3">
                   <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 border-2 border-white/50">
                            <AvatarImage src={booking.guestDetails?.avatarUrl || undefined} alt={booking.guestDetails?.name || 'Guest'} />
                            <AvatarFallback className="bg-opacity-50">{getInitials(booking.guestDetails?.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-base font-semibold">{booking.guestDetails?.name || 'Guest User'}</CardTitle>
                            <CardDescription className="text-xs opacity-80">{booking.guestDetails?.email}</CardDescription>
                        </div>
                        </div>
                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.bookingStatus)} border`}>
                            {booking.bookingStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                   </div>
                </CardHeader>
                <CardContent className="text-sm space-y-1.5 opacity-90">
                  <p className="flex items-center"><CalendarDays className="mr-2 h-4 w-4"/> Dates: {format(new Date(booking.startDate), 'LLL dd, yyyy')} - {format(new Date(booking.endDate), 'LLL dd, yyyy')}</p>
                  <p>Total Price: ${booking.totalPrice.toFixed(2)}</p>
                   <p>Created: {format(new Date(booking.createdAt), 'LLL dd, yyyy p')}</p>
                </CardContent>
              </Card>
            ))}
            </div>
         </div>
      )}
    </div>
  );
}
