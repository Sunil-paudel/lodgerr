
"use client"; 

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, SubmitHandler, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const MAX_IMAGES = 5;

const propertySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long.").max(100, "Title cannot exceed 100 characters."),
  description: z.string().min(20, "Description must be at least 20 characters long.").max(5000, "Description cannot exceed 5000 characters."),
  type: z.enum(["House", "Apartment", "Room", "Unique Stay"], { required_error: "Property type is required."}),
  location: z.string().min(3, "Location is required.").max(100, "Location cannot exceed 100 characters."),
  address: z.string().min(5, "Full address is required.").max(200, "Address cannot exceed 200 characters."),
  pricePerNight: z.coerce.number().positive("Price must be a positive number.").min(10, "Price must be at least $10.").max(10000, "Price cannot exceed $10,000."),
  bedrooms: z.coerce.number().min(0, "Bedrooms cannot be negative.").max(20, "Bedrooms cannot exceed 20."),
  bathrooms: z.coerce.number().min(1, "At least 1 bathroom is required.").max(10, "Bathrooms cannot exceed 10."),
  maxGuests: z.coerce.number().min(1, "At least 1 guest is required.").max(50,"Max guests cannot exceed 50."),
  images: z.array(
    z.object({
      url: z.string().url("Please enter a valid URL.").min(1, "Image URL cannot be empty.")
    })
  ).min(1, "At least one image URL is required.").max(MAX_IMAGES, `You can add a maximum of ${MAX_IMAGES} images.`),
  amenities: z.array(z.string()).optional(), // Amenities will be handled separately
});

type PropertyFormData = z.infer<typeof propertySchema>;

const availableAmenitiesList = [
  'WiFi', 'Kitchen', 'Air Conditioning', 'Free Parking', 'TV', 
  'Washer', 'Dryer', 'Pool', 'Gym', 'Pet Friendly', 'Heating', 'Dedicated Workspace',
  'Beach Access', 'Fireplace', 'Rooftop Access', 'Elevator'
];

export default function ListPropertyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const { register, handleSubmit, control, formState: { errors }, watch, setValue } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      type: "House",
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      images: [{ url: '' }], // Start with one empty image URL field
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "images"
  });

  const watchedImages = watch("images");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/list-property");
    }
  }, [status, router]);

  const onSubmit: SubmitHandler<PropertyFormData> = async (data) => {
    setIsLoading(true);
    if (!session?.user?.id) {
        toast({ title: "Authentication Error", description: "You must be logged in to list a property.", variant: "destructive"});
        setIsLoading(false);
        return;
    }

    const propertyDataToSubmit = {
      ...data,
      images: data.images.map(img => img.url).filter(url => url.trim() !== ''), // Submit only non-empty URLs
      amenities: selectedAmenities,
      hostId: session.user.id,
      host: { // Denormalized host info
        name: session.user.name || "Unknown Host",
        avatarUrl: session.user.image || undefined,
      }
    };

    if (propertyDataToSubmit.images.length === 0) {
        toast({ title: "Validation Error", description: "Please provide at least one valid image URL.", variant: "destructive"});
        setIsLoading(false);
        return;
    }
    
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyDataToSubmit),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to list property.");
      }

      toast({
        title: "Property Listed!",
        description: "Your property has been successfully listed.",
      });
      router.push(`/properties/${result.propertyId}`); // Redirect to the new property's page

    } catch (error: any) {
      toast({
        title: "Listing Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmenityChange = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(item => item !== amenity) : [...prev, amenity]
    );
  };
  
  if (status === "loading") {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!session) { // Handles case where session is null after loading (should be caught by unauthenticated)
    return (
         <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p>Redirecting to login...</p>
        </main>
        <Footer />
      </div>
    )
  }


  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="text-3xl font-bold text-primary font-headline">List Your Property</CardTitle>
                <CardDescription>Share your space with travelers and start earning. Fill in the details below.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="space-y-2">
                    <Label htmlFor="title">Property Title</Label>
                    <Input id="title" placeholder="e.g., Charming Seaside Cottage" {...register('title')} disabled={isLoading} />
                    {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Describe what makes your place special..." {...register('description')} rows={5} disabled={isLoading}/>
                    {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="type">Property Type</Label>
                        <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Select property type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="House">House</SelectItem>
                                    <SelectItem value="Apartment">Apartment</SelectItem>
                                    <SelectItem value="Room">Room (Private or Shared)</SelectItem>
                                    <SelectItem value="Unique Stay">Unique Stay (e.g., Cabin, Tiny House)</SelectItem>
                                </SelectContent>
                                </Select>
                            )}
                        />
                         {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pricePerNight">Price per Night ($)</Label>
                        <Input id="pricePerNight" type="number" placeholder="120" {...register('pricePerNight')} disabled={isLoading}/>
                        {errors.pricePerNight && <p className="text-sm text-destructive">{errors.pricePerNight.message}</p>}
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="location">General Location / City</Label>
                    <Input id="location" placeholder="e.g., Austin, Texas" {...register('location')} disabled={isLoading}/>
                    {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="address">Full Address (Street, City, State, Zip)</Label>
                    <Input id="address" placeholder="e.g., 456 Oak Lane, Austin, TX 78701" {...register('address')} disabled={isLoading}/>
                    {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <Input id="bedrooms" type="number" {...register('bedrooms')} disabled={isLoading}/>
                        {errors.bedrooms && <p className="text-sm text-destructive">{errors.bedrooms.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bathrooms">Bathrooms</Label>
                        <Input id="bathrooms" type="number" {...register('bathrooms')} disabled={isLoading}/>
                        {errors.bathrooms && <p className="text-sm text-destructive">{errors.bathrooms.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="maxGuests">Max Guests</Label>
                        <Input id="maxGuests" type="number" {...register('maxGuests')} disabled={isLoading}/>
                        {errors.maxGuests && <p className="text-sm text-destructive">{errors.maxGuests.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Amenities</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 border p-4 rounded-md max-h-60 overflow-y-auto">
                    {availableAmenitiesList.map(amenity => (
                        <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`amenity-${amenity}`}
                            onCheckedChange={() => handleAmenityChange(amenity)}
                            checked={selectedAmenities.includes(amenity)}
                            disabled={isLoading}
                        />
                        <Label htmlFor={`amenity-${amenity}`} className="font-normal text-sm cursor-pointer">{amenity}</Label>
                        </div>
                    ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <Label>Property Image URLs (at least 1, max {MAX_IMAGES})</Label>
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                            <Input
                                {...register(`images.${index}.url`)}
                                placeholder={`Image URL ${index + 1}`}
                                className="flex-grow"
                                disabled={isLoading}
                            />
                            {fields.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={isLoading}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                        </div>
                    ))}
                    {errors.images && !errors.images[fields.length-1]?.url && typeof errors.images.message === 'string' && (
                         <p className="text-sm text-destructive">{errors.images.message}</p>
                    )}
                     {errors.images?.map((errorObj, index) => errorObj?.url && <p key={index} className="text-sm text-destructive">{errorObj.url.message}</p>)}


                    {fields.length < MAX_IMAGES && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ url: '' })}
                            disabled={isLoading}
                        >
                            <ImagePlus className="mr-2 h-4 w-4" /> Add Image URL
                        </Button>
                    )}
                     {watchedImages && watchedImages.filter(img => img?.url && img.url.trim() !== '').length > 0 && (
                        <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {watchedImages.map((img, index) => (
                                img?.url && img.url.trim() !== '' && (
                                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                                        <img 
                                            src={img.url} 
                                            alt={`Preview ${index + 1}`} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://placehold.co/300x200.png?text=Invalid+URL';
                                                (e.target as HTMLImageElement).alt = 'Invalid image URL';
                                            }}
                                         />
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </div>

                <CardFooter className="p-0 pt-6">
                     <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Listing Property...' : 'List My Property'}
                    </Button>
                </CardFooter>
                </form>
            </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
