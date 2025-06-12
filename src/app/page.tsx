
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SearchBar from '@/components/search/SearchBar';
import PropertyList from '@/components/property/PropertyList';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const PropertyListSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col">
        <Skeleton className="aspect-[4/3] w-full rounded-t-lg" />
        <div className="p-4 space-y-2 flex-grow">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
           <Skeleton className="h-4 w-1/3 mt-2" />
        </div>
        <div className="flex items-center p-4 border-t justify-between">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-5 w-1/5" />
        </div>
      </div>
    ))}
  </div>
);

interface HomePageProps {
  searchParams?: {
    location?: string;
    checkIn?: string;
    checkOut?: string;
    // guests?: string; // Add other params as needed
  };
}

export default function HomePage({ searchParams }: HomePageProps) {
  const location = searchParams?.location;
  const checkIn = searchParams?.checkIn;
  const checkOut = searchParams?.checkOut;
  // const guests = searchParams?.guests;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-primary font-headline mb-3">
            Find Your Next Stay
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover unique homes and experiences. Unforgettable trips start with Lodger.
            </p>
        </div>
        <SearchBar /> {/* SearchBar will set URL query params */}
        <Suspense fallback={<PropertyListSkeleton />}>
          {/* Pass search params to PropertyList */}
          <PropertyList 
            searchLocation={location}
            searchCheckIn={checkIn}
            searchCheckOut={checkOut}
            // searchGuests={guests}
          />
        </Suspense>
       
      </main>
      <Footer />
    </div>
  );
}
