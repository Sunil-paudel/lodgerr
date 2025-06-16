
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { Booking as BookingType, BookingStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Loader2, CalendarDays, UserCircle, Info, ShieldAlert, Trash2, Edit3 } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PropertyBookingManagerProps {
  propertyId: string;
  initialBookings: BookingType[];
}

interface FormattedBooking extends BookingType {
  formattedStartDate?: string;
  formattedEndDate?: string;
  formattedCreatedAt?: string;
  formattedBookingStatus?: string;
}

const getInitials = (name?: string | null) => {
  if (!name) return "GU";
  const names = name.split(" ");
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  return (names[0][0] + (names[names.length - 1][0] || "")).toUpperCase();
};

const getStatusColorClass = (status?: BookingStatus) => {
  switch (status) {
    case 'pending_confirmation': return 'text-yellow-600 bg-yellow-100/80 border-yellow-300';
    case 'pending_payment': return 'text-orange-600 bg-orange-100/80 border-orange-300';
    case 'confirmed_by_host': return 'text-green-600 bg-green-100/80 border-green-300';
    case 'rejected_by_host': return 'text-red-600 bg-red-100/80 border-red-300';
    case 'cancelled_by_guest': return 'text-slate-600 bg-slate-100/80 border-slate-300';
    case 'cancelled_by_admin': return 'text-purple-600 bg-purple-100/80 border-purple-300';
    case 'completed': return 'text-blue-600 bg-blue-100/80 border-blue-300';
    default: return 'text-gray-600 bg-gray-100/80 border-gray-300';
  }
};

const formatBookingStatusDisplay = (status?: BookingStatus): string => {
  if (!status || typeof status !== 'string') {
    return 'Unknown Status';
  }
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};


export function PropertyBookingManager({ propertyId, initialBookings }: PropertyBookingManagerProps) {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<FormattedBooking[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, { action?: 'manage' | 'delete'; isLoading: boolean }>>({});
  const router = useRouter();
  const { toast } = useToast();
  const [isFormatting, setIsFormatting] = useState(true);
  const [deleteAlertState, setDeleteAlertState] = useState<{ isOpen: boolean; bookingId: string | null; bookingTitle?: string }>({ isOpen: false, bookingId: null });

  useEffect(() => {
    setIsFormatting(true);
    const newFormattedBookings = initialBookings.map(booking => {
      const startDate = booking.startDate && isValid(new Date(booking.startDate)) ? new Date(booking.startDate) : null;
      const endDate = booking.endDate && isValid(new Date(booking.endDate)) ? new Date(booking.endDate) : null;
      const createdAt = booking.createdAt && isValid(new Date(booking.createdAt)) ? new Date(booking.createdAt) : null;

      return {
        ...booking,
        formattedStartDate: startDate ? format(startDate, 'LLL dd, yyyy') : 'N/A',
        formattedEndDate: endDate ? format(endDate, 'LLL dd, yyyy') : 'N/A',
        formattedCreatedAt: createdAt ? format(createdAt, 'LLL dd, yyyy p') : 'N/A',
        formattedBookingStatus: formatBookingStatusDisplay(booking.bookingStatus),
      };
    });
    setBookings(newFormattedBookings);
    setIsFormatting(false);
  }, [initialBookings]);

  const handleManageBooking = async (bookingId: string, newStatus: 'confirmed_by_host' | 'rejected_by_host' | 'cancelled_by_admin') => {
    setLoadingStates(prev => ({ ...prev, [bookingId]: { action: 'manage', isLoading: true } }));
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

      const formattedNewStatusDisplay = formatBookingStatusDisplay(newStatus);

      toast({
        title: 'Booking Updated',
        description: `Booking status changed to ${formattedNewStatusDisplay}.`,
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error Updating Booking',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [bookingId]: { action: 'manage', isLoading: false } }));
    }
  };

  const handleDeleteBooking = async (bookingId: string | null) => {
    if (!bookingId) return;
    setLoadingStates(prev => ({ ...prev, [bookingId]: { action: 'delete', isLoading: true } }));
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete booking.');
      }
      toast({
        title: 'Booking Deleted',
        description: 'The booking has been permanently deleted.',
      });
      setDeleteAlertState({ isOpen: false, bookingId: null });
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error Deleting Booking',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [bookingId]: { action: 'delete', isLoading: false } }));
    }
  };

  const isAdmin = session?.user?.role === 'admin';

  if (initialBookings.length === 0) {
    return (
        <div className="text-center py-6 bg-muted/30 rounded-lg">
            <Info className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No booking requests or active bookings for this property yet.</p>
        </div>
    );
  }

  if (isFormatting) {
    return (
      <div className="space-y-3">
        {[...Array(Math.min(initialBookings.length, 2))].map((_, i) => (
          <Card key={`skeleton-${i}`} className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
            <CardFooter className="flex justify-end space-x-2 pt-3">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }


  return (
    <>
      <div className="space-y-3">
        {bookings.map(booking => {
          const isLoadingAction = loadingStates[booking.id]?.isLoading;
          const currentAction = loadingStates[booking.id]?.action;
          const guestName = booking.guestDetails?.name || 'Guest User';
          const bookingTitleForAlert = `booking for ${guestName} (${booking.formattedStartDate} - ${booking.formattedEndDate})`;

          return (
            <Card key={booking.id} className={`shadow-sm hover:shadow-md transition-shadow ${getStatusColorClass(booking.bookingStatus)} border-opacity-60`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 border-2 border-white/50">
                      <AvatarImage src={booking.guestDetails?.avatarUrl || undefined} alt={guestName} />
                      <AvatarFallback className="bg-opacity-50">{getInitials(guestName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base font-semibold">{guestName}</CardTitle>
                      <CardDescription className="text-xs opacity-80">{booking.guestDetails?.email}</CardDescription>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColorClass(booking.bookingStatus)} border`}>
                    {booking.formattedBookingStatus} (Payment: {booking.paymentStatus})
                  </span>
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-1.5 opacity-90">
                <p className="flex items-center"><CalendarDays className="mr-2 h-4 w-4"/> Dates: {booking.formattedStartDate} - {booking.formattedEndDate}</p>
                <p>Total Price: ${booking.totalPrice.toFixed(2)}</p>
                <p>Requested: {booking.formattedCreatedAt}</p>
              </CardContent>
              <CardFooter className="flex flex-wrap justify-end items-center space-x-2 p-4 border-t mt-2 gap-y-2">
                {isAdmin && (
                    <Button variant="outline" size="sm" className="border-blue-500 text-blue-600 hover:bg-blue-500/10 hover:text-blue-700" asChild>
                      <Link href={`/bookings/${booking.id}/edit`}>
                        <Edit3 className="mr-2 h-4 w-4" /> Edit
                      </Link>
                    </Button>
                )}
                {booking.bookingStatus === 'pending_confirmation' && (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleManageBooking(booking.id, 'rejected_by_host')}
                      disabled={isLoadingAction}
                      title="Reject this booking request"
                    >
                      {isLoadingAction && currentAction === 'manage' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <XCircle className="mr-1.5 h-4 w-4" />}
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-primary-foreground"
                      onClick={() => handleManageBooking(booking.id, 'confirmed_by_host')}
                      disabled={isLoadingAction}
                      title="Accept this booking request"
                    >
                      {isLoadingAction && currentAction === 'manage' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1.5 h-4 w-4" />}
                      Accept
                    </Button>
                  </>
                )}
                {isAdmin && ['confirmed_by_host', 'pending_confirmation'].includes(booking.bookingStatus) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white"
                    onClick={() => handleManageBooking(booking.id, 'cancelled_by_admin')}
                    disabled={isLoadingAction}
                    title="Cancel this booking as Admin. This will mark it as refunded (conceptually) and free up dates."
                  >
                    {isLoadingAction && currentAction === 'manage' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-1.5 h-4 w-4" />}
                    Admin Cancel
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="bg-red-700 hover:bg-red-800 text-white"
                    onClick={() => setDeleteAlertState({ isOpen: true, bookingId: booking.id, bookingTitle: bookingTitleForAlert })}
                    disabled={isLoadingAction}
                    title="Permanently delete this booking record as Admin. This action cannot be undone."
                  >
                    {isLoadingAction && currentAction === 'delete' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
                    Admin Delete
                  </Button>
                )}
                
                {!isAdmin && booking.bookingStatus !== 'pending_confirmation' && (
                     <p className="text-xs text-muted-foreground w-full text-right italic">No actions available for this booking status.</p>
                )}
                 {isAdmin && booking.bookingStatus !== 'pending_confirmation' && !['confirmed_by_host'].includes(booking.bookingStatus) && (
                     <p className="text-xs text-muted-foreground w-full text-right italic">Admin: Manage via &quot;Admin Delete&quot; for this status.</p>
                )}
                 {isAdmin && booking.bookingStatus === 'confirmed_by_host' && (
                     <p className="text-xs text-muted-foreground w-full text-right italic">Admin: Manage via &quot;Admin Cancel&quot; or &quot;Admin Delete&quot;.</p>
                 )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={deleteAlertState.isOpen} onOpenChange={(isOpen) => setDeleteAlertState(prev => ({ ...prev, isOpen }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {deleteAlertState.bookingTitle || 'selected booking'}.
              All associated data for this booking, including its booked date range, will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingStates[deleteAlertState.bookingId!]?.isLoading && loadingStates[deleteAlertState.bookingId!]?.action === 'delete'}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteBooking(deleteAlertState.bookingId)}
              disabled={loadingStates[deleteAlertState.bookingId!]?.isLoading && loadingStates[deleteAlertState.bookingId!]?.action === 'delete'}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {(loadingStates[deleteAlertState.bookingId!]?.isLoading && loadingStates[deleteAlertState.bookingId!]?.action === 'delete') && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Delete Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
