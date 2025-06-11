
"use client"; 

import { useState, useEffect, type ChangeEvent } from 'react';
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
import { ImagePlus, Loader2, Trash2, UploadCloud, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image'; // For previewing images

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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
  // This will now store Cloudinary URLs
  images: z.array(
    z.object({
      url: z.string().url("A valid image URL from upload is required.") 
    })
  ).min(1, "At least one image is required.").max(MAX_IMAGES, `You can upload a maximum of ${MAX_IMAGES} images.`),
  amenities: z.array(z.string()).optional(),
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
  const [formIsLoading, setFormIsLoading] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [imageUploadStates, setImageUploadStates] = useState<Array<{ file: File; isLoading: boolean; error?: string; cloudinaryUrl?: string }>>([]);
  const [fileInputKey, setFileInputKey] = useState(Date.now()); // To reset file input

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      type: "House",
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      images: [], // Will be populated with Cloudinary URLs
    }
  });

  // This useFieldArray is for managing the *Cloudinary URLs* in the form data, not the file inputs directly.
  const { fields: imageFormFields, append: appendImageFormField, remove: removeImageFormField } = useFieldArray({
    control,
    name: "images"
  });

  const watchedFormImages = watch("images"); // To reflect Cloudinary URLs in form data for schema validation

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/list-property");
    }
  }, [status, router]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const currentTotalImages = imageUploadStates.filter(s => s.cloudinaryUrl).length + files.length;
    if (currentTotalImages > MAX_IMAGES) {
      toast({
        title: "Too many images",
        description: `You can upload a maximum of ${MAX_IMAGES} images. Please select fewer files.`,
        variant: "destructive",
      });
      setFileInputKey(Date.now()); // Reset file input
      return;
    }
    
    const newUploadStates = Array.from(files).map(file => ({ file, isLoading: true, error: undefined, cloudinaryUrl: undefined }));
    setImageUploadStates(prev => [...prev, ...newUploadStates]);
    setFileInputKey(Date.now()); // Reset file input so the same file can be selected again if removed

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tempId = Date.now() + i; // Temporary unique ID for this upload instance

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setImageUploadStates(prev => prev.map(s => s.file === file ? { ...s, isLoading: false, error: `File too large (max ${MAX_FILE_SIZE_MB}MB).` } : s));
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();

        if (!response.ok) throw new Error(result.message || 'Upload failed');
        
        // Update specific upload state
        setImageUploadStates(prev => prev.map(s => s.file === file ? { ...s, isLoading: false, cloudinaryUrl: result.imageUrl } : s));
        // Add Cloudinary URL to react-hook-form's images array
        appendImageFormField({ url: result.imageUrl });

      } catch (err: any) {
         setImageUploadStates(prev => prev.map(s => s.file === file ? { ...s, isLoading: false, error: err.message || 'Upload failed' } : s));
      }
    }
  };
  
  const removeImage = (indexToRemove: number) => {
    const imageStateToRemove = imageUploadStates[indexToRemove];
    // If this image had a Cloudinary URL, find and remove it from react-hook-form
    if (imageStateToRemove?.cloudinaryUrl) {
      const formFieldIndex = imageFormFields.findIndex(field => field.url === imageStateToRemove.cloudinaryUrl);
      if (formFieldIndex !== -1) {
        removeImageFormField(formFieldIndex);
      }
    }
    // Remove from local upload states
    setImageUploadStates(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  const onSubmit: SubmitHandler<PropertyFormData> = async (data) => {
    setFormIsLoading(true);
    if (!session?.user?.id) {
        toast({ title: "Authentication Error", description: "You must be logged in to list a property.", variant: "destructive"});
        setFormIsLoading(false);
        return;
    }

    // 'data.images' from react-hook-form already contains the array of { url: "cloudinary_url" }
    // We just need to ensure the server-side property schema expects this.
    const propertyDataToSubmit = {
      ...data, 
      amenities: selectedAmenities,
      hostId: session.user.id,
      host: { 
        name: session.user.name || "Unknown Host",
        avatarUrl: session.user.image || undefined,
      }
    };
    
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
      router.push(`/properties/${result.propertyId}`); 

    } catch (error: any) {
      toast({
        title: "Listing Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setFormIsLoading(false);
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
                    <Input id="title" placeholder="e.g., Charming Seaside Cottage" {...control.register('title')} disabled={formIsLoading} />
                    {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Describe what makes your place special..." {...control.register('description')} rows={5} disabled={formIsLoading}/>
                    {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="type">Property Type</Label>
                        <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={formIsLoading}>
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
                        <Input id="pricePerNight" type="number" placeholder="120" {...control.register('pricePerNight')} disabled={formIsLoading}/>
                        {errors.pricePerNight && <p className="text-sm text-destructive">{errors.pricePerNight.message}</p>}
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="location">General Location / City</Label>
                    <Input id="location" placeholder="e.g., Austin, Texas" {...control.register('location')} disabled={formIsLoading}/>
                    {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="address">Full Address (Street, City, State, Zip)</Label>
                    <Input id="address" placeholder="e.g., 456 Oak Lane, Austin, TX 78701" {...control.register('address')} disabled={formIsLoading}/>
                    {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <Input id="bedrooms" type="number" {...control.register('bedrooms')} disabled={formIsLoading}/>
                        {errors.bedrooms && <p className="text-sm text-destructive">{errors.bedrooms.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bathrooms">Bathrooms</Label>
                        <Input id="bathrooms" type="number" {...control.register('bathrooms')} disabled={formIsLoading}/>
                        {errors.bathrooms && <p className="text-sm text-destructive">{errors.bathrooms.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="maxGuests">Max Guests</Label>
                        <Input id="maxGuests" type="number" {...control.register('maxGuests')} disabled={formIsLoading}/>
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
                            disabled={formIsLoading}
                        />
                        <Label htmlFor={`amenity-${amenity}`} className="font-normal text-sm cursor-pointer">{amenity}</Label>
                        </div>
                    ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <Label htmlFor="image-upload-input">Property Images (at least 1, max {MAX_IMAGES}, {MAX_FILE_SIZE_MB}MB per file)</Label>
                    <Input 
                      id="image-upload-input"
                      key={fileInputKey} // Used to reset the input
                      type="file" 
                      multiple 
                      accept="image/png, image/jpeg, image/gif, image/webp"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      disabled={formIsLoading || imageUploadStates.filter(s => s.cloudinaryUrl).length >= MAX_IMAGES}
                    />
                     {errors.images && errors.images.message && <p className="text-sm text-destructive">{errors.images.message}</p>}
                     {errors.images?.root?.message && <p className="text-sm text-destructive">{errors.images.root.message}</p>}
                     

                    {imageUploadStates.length > 0 && (
                        <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {imageUploadStates.map((upload, index) => (
                                <div key={index} className="relative aspect-square rounded-md overflow-hidden border group shadow-sm">
                                    {upload.cloudinaryUrl ? (
                                        <Image 
                                            src={upload.cloudinaryUrl} 
                                            alt={`Uploaded preview ${index + 1}`} 
                                            fill
                                            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                                            className="object-cover"
                                         />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                            {upload.isLoading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
                                            {!upload.isLoading && upload.error && <AlertCircle className="h-8 w-8 text-destructive" title={upload.error} />}
                                            {!upload.isLoading && !upload.error && <ImagePlus className="h-8 w-8 text-muted-foreground" />}
                                        </div>
                                    )}
                                    {!upload.isLoading && (
                                      <Button 
                                        type="button" 
                                        variant="destructive" 
                                        size="icon" 
                                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeImage(index)}
                                        disabled={formIsLoading}
                                        title="Remove image"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                    {upload.error && <p className="absolute bottom-0 left-0 right-0 bg-destructive/80 text-destructive-foreground text-xs p-1 text-center truncate">{upload.error}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                     {imageUploadStates.filter(s => s.cloudinaryUrl).length < MAX_IMAGES && (
                        <p className="text-xs text-muted-foreground">
                          You can add {MAX_IMAGES - imageUploadStates.filter(s => s.cloudinaryUrl).length} more image(s).
                        </p>
                    )}
                </div>


                <CardFooter className="p-0 pt-6">
                     <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={formIsLoading || imageUploadStates.some(s => s.isLoading)}>
                        {(formIsLoading || imageUploadStates.some(s => s.isLoading)) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {formIsLoading ? 'Listing Property...' : (imageUploadStates.some(s => s.isLoading) ? 'Uploading Images...' : 'List My Property')}
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
