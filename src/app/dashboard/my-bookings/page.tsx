
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectDB from "@/utils/db";
import BookingModel, { type BookingDocument } from "@/models/Booking";
import PropertyModel, { type PropertyDocument } from "@/models/Property";
import type { Booking as BookingType, BookingStatus, PaymentStatus } from "@/lib/types";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BookingDisplayCard from "./BookingDisplayCard";
import { AlertTriangle, Info, ListOrdered } from "lucide-react";
import mongoose from "mongoose";
import { format } from "date-fns";

interface EnrichedBookingForDisplay {
  id: string;
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

async function getUserBookings(userId: string): Promise<EnrichedBookingForDisplay[]> {
  await connectDB();

  const bookingsFromDB = await BookingModel.find({ guestId: new mongoose.Types.ObjectId(userId) })
    .populate<{ listingId: PropertyDocument | null }>({
      path: 'listingId',
      model: PropertyModel, // Explicitly specify model for population
      select: 'title images location _id', // Select necessary fields
    })
    .sort({ createdAt: -1 }) // Show newest bookings first
    .lean();

  return bookingsFromDB.map((bookingDoc) => {
    const booking = bookingDoc as unknown as BookingDocument & { listingId: PropertyDocument | null };
    
    const property = booking.listingId;

    const formatStatus = (statusString: string | undefined | null): string => {
        if (!statusString || typeof statusString !== 'string') return 'Unknown';
        return statusString.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    };

    return {
      id: booking._id.toString(),
      propertyDetails: property ? {
        id: property._id.toString(),
        title: property.title,
        mainImage: property.images && property.images.length > 0 ? property.images[0] : undefined,
        location: property.location,
      } : undefined,
      formattedStartDate: format(new Date(booking.startDate), 'LLL dd, yyyy'),
      formattedEndDate: format(new Date(booking.endDate), 'LLL dd, yyyy'),
      totalPrice: booking.totalPrice,
      formattedBookingStatus: formatStatus(booking.bookingStatus),
      rawBookingStatus: booking.bookingStatus as BookingStatus,
      formattedPaymentStatus: formatStatus(booking.paymentStatus),
      rawPaymentStatus: booking.paymentStatus as PaymentStatus,
      formattedCreatedAt: format(new Date(booking.createdAt), 'LLL dd, yyyy p'),
    };
  });
}

export default async function MyBookingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login?callbackUrl=/dashboard/my-bookings");
  }

  let bookings: EnrichedBookingForDisplay[] = [];
  let fetchError: string | null = null;

  try {
    bookings = await getUserBookings(session.user.id);
  } catch (error: any) {
    console.error("[MyBookingsPage] Error fetching bookings:", error);
    fetchError = "Failed to load your bookings. Please try refreshing the page or contact support if the issue persists.";
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary font-headline flex items-center">
            <ListOrdered className="mr-3 h-8 w-8" /> My Bookings
          </h1>
          <p className="text-muted-foreground mt-1">View and manage your upcoming and past trips.</p>
        </div>

        {fetchError ? (
          <div className="text-center py-10 bg-card shadow-md rounded-lg flex flex-col items-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-xl text-destructive mb-2">Error Loading Bookings</p>
            <p className="text-muted-foreground">{fetchError}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-10 bg-card shadow-md rounded-lg flex flex-col items-center">
            <Info className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground mb-2">No Bookings Yet</p>
            <p className="text-sm text-muted-foreground">You haven't made any bookings. Time to plan your next adventure!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <BookingDisplayCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
