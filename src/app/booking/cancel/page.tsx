
"use client";

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { Suspense } from 'react';
import { BookingCancelDetails } from './BookingCancelDetails';
import { Skeleton } from '@/components/ui/skeleton';

// Skeleton component for Suspense fallback
const BookingCancelSkeleton = () => {
  return (
    <div className="w-full max-w-lg shadow-xl text-center bg-card p-6 rounded-lg">
      <Skeleton className="mx-auto h-16 w-16 rounded-full mb-4" />
      <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
      <Skeleton className="h-4 w-full mx-auto mb-4" />
      <Skeleton className="h-4 w-5/6 mx-auto mb-4" />
      <Skeleton className="h-4 w-1/2 mx-auto mb-6" />
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-6 border-t mt-4">
        <Skeleton className="h-10 w-full sm:w-40" />
      </div>
    </div>
  );
};


export default function BookingCancelPage() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-16 flex items-center justify-center">
        <Suspense fallback={<BookingCancelSkeleton />}>
          <BookingCancelDetails />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
