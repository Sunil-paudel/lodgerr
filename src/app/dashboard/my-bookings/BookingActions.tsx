
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
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
import { Loader2, Trash2, Ban } from 'lucide-react';
import type { BookingStatus } from '@/lib/types';

interface BookingActionsProps {
  bookingId: string;
  bookingStatus: BookingStatus;
  propertyTitle?: string;
}

export function BookingActions({ bookingId, bookingStatus, propertyTitle = "this property" }: BookingActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const canCancel = ['pending_payment', 'pending_confirmation', 'confirmed_by_host'].includes(bookingStatus);

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to cancel booking.');
      }

      toast({
        title: 'Booking Cancelled',
        description: `Your booking for "${propertyTitle}" has been successfully cancelled.`,
      });
      setIsAlertOpen(false);
      router.refresh(); // Refresh the page to update the list of bookings
    } catch (error: any) {
      toast({
        title: 'Error Cancelling Booking',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canCancel) {
    return null; // Or a disabled button, or info text
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full sm:w-auto border-destructive text-destructive hover:bg-destructive/10"
        onClick={() => setIsAlertOpen(true)}
        disabled={isLoading}
      >
        <Ban className="mr-2 h-4 w-4" />
        Cancel My Booking
      </Button>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to cancel your booking for &quot;<strong>{propertyTitle}</strong>&quot;.
              {bookingStatus === 'confirmed_by_host' && " For confirmed bookings, this action may be subject to the property's cancellation policy. We will mark this as cancelled."}
              { (bookingStatus === 'pending_payment' || bookingStatus === 'pending_confirmation') && " This booking is still pending and will be removed."}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Cancelling...' : 'Yes, Cancel Booking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
