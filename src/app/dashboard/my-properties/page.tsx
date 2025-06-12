
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/property/PropertyCard";
import type { Property } from "@/lib/types";
import connectDB from "@/utils/db";
import PropertyModel from "@/models/Property"; // Mongoose model
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import mongoose from "mongoose";

async function getUserProperties(userId: string): Promise<Property[]> {
  await connectDB();
  // The Mongoose model uses `hostId` as ObjectId.
  // The query should convert the string userId to ObjectId for matching.
  const propertiesFromDB = await PropertyModel.find({ hostId: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .lean(); // Use .lean() for plain JS objects

  // Manually transform to match the PropertyType, especially _id to id
  // and ensure hostId is a string if it isn't already by toJSON.
  // The toJSON transform in the model should ideally handle this when propertiesFromDB are Mongoose docs,
  // but with .lean(), we often need to do it manually or ensure lean includes virtuals if set up.
  // Given the model's toJSON, it should be fine if not using .lean(), but .lean() is faster.
  return propertiesFromDB.map(prop => {
    const { _id, __v, hostId, ...rest } = prop as any;
    return {
      id: _id.toString(),
      hostId: hostId.toString(), // Ensure hostId is a string
      ...rest,
      // Make sure all other fields conform to Property type, e.g. dates
      createdAt: new Date(prop.createdAt), // Ensure Date objects
      // Assuming other fields like images, amenities, host object are correctly structured
    } as Property;
  });
}


export default async function MyPropertiesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login?callbackUrl=/dashboard/my-properties");
  }

  const properties = await getUserProperties(session.user.id);

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

        {properties.length === 0 ? (
          <div className="text-center py-10 bg-card shadow-md rounded-lg">
            <p className="text-xl text-muted-foreground mb-4">You haven&apos;t listed any properties yet.</p>
            <p className="text-sm text-muted-foreground">Why not share your space with the world?</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property.id} className="flex flex-col">
                <PropertyCard property={property} />
                <div className="mt-2 flex gap-2">
                    <Button variant="outline" className="w-full" asChild>
                        <Link href={`/properties/${property.id}/edit`}>Edit</Link>
                    </Button>
                    {/* Delete button can be added here later */}
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
