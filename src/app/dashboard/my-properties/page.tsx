
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/property/PropertyCard";
import type { Property as PropertyType } from "@/lib/types";
import connectDB from "@/utils/db";
import PropertyModel from "@/models/Property"; // Mongoose model
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, AlertTriangle } from "lucide-react";
import mongoose from "mongoose";

async function getUserProperties(userId: string): Promise<PropertyType[]> {
  await connectDB();
  const propertiesFromDB = await PropertyModel.find({ hostId: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .lean(); 

  return propertiesFromDB.map(prop => {
    const { _id, __v, hostId, createdAt, updatedAt, ...rest } = prop as any;
    return {
      id: _id.toString(),
      hostId: hostId.toString(),
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt),
      // Ensure host object is correctly structured
      host: {
          name: prop.host.name,
          avatarUrl: prop.host.avatarUrl
      },
      ...rest,
    } as PropertyType;
  });
}


export default async function MyPropertiesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login?callbackUrl=/dashboard/my-properties");
  }

  let properties: PropertyType[] = [];
  let fetchError: string | null = null;
  try {
    properties = await getUserProperties(session.user.id);
  } catch (error: any) {
    console.error("[MyPropertiesPage] Error fetching properties:", error);
    fetchError = "Failed to load your properties. Please try again later.";
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
                <p className="text-xl text-destructive mb-2">Error Loading Properties</p>
                <p className="text-muted-foreground">{fetchError}</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-10 bg-card shadow-md rounded-lg">
            <p className="text-xl text-muted-foreground mb-4">You haven&apos;t listed any properties yet.</p>
            <p className="text-sm text-muted-foreground">Why not share your space with the world?</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property.id} className="flex flex-col"> {/* Added flex flex-col and h-full to PropertyCard parent */}
                <PropertyCard property={property} />
                <div className="mt-2 flex gap-2">
                    <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10" asChild>
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


    