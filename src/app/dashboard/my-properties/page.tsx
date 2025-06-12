
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/property/PropertyCard";
import type { Property as PropertyType, Booking as BookingType, BookingStatus } from "@/lib/types";
import connectDB from "@/utils/db";
import PropertyModel from "@/models/Property"; // Mongoose model
import BookingModel, { type BookingDocument } from "@/models/Booking"; // Mongoose Booking model
import type { IUser } from "@/models/User"; // Mongoose User model
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, AlertTriangle, ListChecks, Clock } from "lucide-react";
import mongoose from "mongoose";
import { PropertyBookingManager } from "./PropertyBookingManager"; // New client component

// Extended property type for this page to include bookings
export interface PropertyWithBookings extends PropertyType {
  bookings: BookingType[];
}

async function getUserPropertiesWithBookings(userId: string): Promise<PropertyWithBookings[]> {
  await connectDB();
  const propertiesFromDB = await PropertyModel.find({ hostId: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .lean();

  const propertiesWithBookings: PropertyWithBookings[] = [];

  for (const prop of propertiesFromDB) {
    // Fetch bookings and populate guest details
    const bookingsForPropertyRaw = await BookingModel.find({ listingId: prop._id })
      .populate<{ guestId: Pick<IUser, '_id' | 'name' | 'email' | 'avatarUrl'> }>({
        path: 'guestId',
        select: '_id name email avatarUrl',
      })
      .sort({ createdAt: -1 })
      .lean() as (BookingDocument & { guestId: Pick<IUser, '_id' | 'name' | 'email' | 'avatarUrl'> | null })[];


    const formattedBookings: BookingType[] = bookingsForPropertyRaw.map(b => {
      const guest = b.guestId; // guestId is now the populated object or null
      return {
        id: b._id.toString(),
        listingId: b.listingId.toString(),
        guestId: guest?._id?.toString() || 'unknown-guest-id',
        startDate: new Date(b.startDate),
        endDate: new Date(b.endDate),
        totalPrice: b.totalPrice,
        paymentStatus: b.paymentStatus,
        bookingStatus: b.bookingStatus as BookingStatus,
        createdAt: new Date(b.createdAt),
        guestDetails: guest ? { 
            name: guest.name, 
            email: guest.email,
            avatarUrl: guest.avatarUrl 
        } : undefined,
      };
    });

    propertiesWithBookings.push({
      id: prop._id.toString(),
      hostId: (prop.hostId as mongoose.Types.ObjectId).toString(),
      title: prop.title,
      description: prop.description,
      location: prop.location,
      address: prop.address || '',
      price: prop.price,
      pricePeriod: prop.pricePeriod,
      images: prop.images.map(img => String(img)), // Ensure images are strings
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      maxGuests: prop.maxGuests,
      amenities: prop.amenities.map(am => String(am)), // Ensure amenities are strings
      type: prop.type,
      host: {
        name: prop.host?.name || 'N/A',
        avatarUrl: prop.host?.avatarUrl,
      },
      rating: prop.rating,
      reviewsCount: prop.reviewsCount,
      createdAt: new Date(prop.createdAt),
      // updatedAt should exist if timestamps:true is on Property model
      // updatedAt: new Date(prop.updatedAt), 
      availableFrom: prop.availableFrom ? new Date(prop.availableFrom) : undefined,
      availableTo: prop.availableTo ? new Date(prop.availableTo) : undefined,
      bookings: formattedBookings,
    });
  }
  return propertiesWithBookings;
}


export default async function MyPropertiesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login?callbackUrl=/dashboard/my-properties");
  }

  let properties: PropertyWithBookings[] = [];
  let fetchError: string | null = null;
  try {
    properties = await getUserPropertiesWithBookings(session.user.id);
  } catch (error: any) {
    console.error("[MyPropertiesPage] Error fetching properties and bookings:", error);
    fetchError = "Failed to load your properties and bookings. Please try again later.";
  }


  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary font-headline">My Listed Properties</h1>
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/list-property">
              <PlusCircle className="mr-2 h-5 w-5" /> List New Property
            </Link>
          </Button>
        </div>

        {fetchError ? (
            <div className="text-center py-10 bg-card shadow-md rounded-lg flex flex-col items-center">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-xl text-destructive mb-2">Error Loading Data</p>
                <p className="text-muted-foreground">{fetchError}</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-10 bg-card shadow-md rounded-lg">
            <p className="text-xl text-muted-foreground mb-4">You haven&apos;t listed any properties yet.</p>
            <p className="text-sm text-muted-foreground">Why not share your space with the world?</p>
          </div>
        ) : (
          <div className="space-y-10">
            {properties.map((property) => (
              <div key={property.id} className="bg-card shadow-lg rounded-lg p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <PropertyCard property={property} />
                    <div className="mt-3 flex gap-2">
                        <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10" asChild>
                            <Link href={`/properties/${property.id}/edit`}>Edit</Link>
                        </Button>
                        {/* Delete button can be added here later */}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <h2 className="text-xl font-semibold mb-3 text-primary flex items-center">
                        <ListChecks className="mr-2 h-5 w-5"/> Booking Requests for &quot;{property.title}&quot;
                    </h2>
                    <PropertyBookingManager propertyId={property.id} initialBookings={property.bookings} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
