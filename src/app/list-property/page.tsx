
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
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Image as ImageIcon, Calendar as CalendarIconLucide } from 'lucide-react'; 
import NextImage from 'next/image';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';


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
  images: z.array(
    z.object({
      url: z.string().url("A valid image URL from upload is required.")
    })
  ).min(1, "At least one image is required.").max(MAX_IMAGES, `You can upload a maximum of ${MAX_IMAGES} images.`),
  amenities: z.array(z.string()).optional(),
  availableFrom: z.date().optional(),
  availableTo: z.date().optional(),
}).refine(data => {
  if (data.availableFrom && data.availableTo) {
    return data.availableTo >= data.availableFrom;
  }
  return true;
}, {
  message: "Availability end date cannot be before start date.",
  path: ["availableTo"], // Path to the field to which the error will be attached
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
  const [imageUploadStates, setImageUploadStates] = useState<Array<{ file: File; isLoading: boolean; error?: string; cloudinaryUrl?: string; previewUrl?: string }>>([]);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [availabilityDateRange, setAvailabilityDateRange] = useState<DateRange | undefined>(undefined);

  const { control, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      type: "House",
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      images: [],
    }
  });

  const { fields: imageFormFields, append: appendImageFormField, remove: removeImageFormField } = useFieldArray({
    control,
    name: "images"
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/list-property");
    }
    return () => {
      imageUploadStates.forEach(state => {
        if (state.previewUrl && state.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(state.previewUrl);
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router]);
  
  useEffect(() => {
    setValue('availableFrom', availabilityDateRange?.from);
    setValue('availableTo', availabilityDateRange?.to);
    if (availabilityDateRange?.from && availabilityDateRange?.to) {
        trigger(['availableFrom', 'availableTo']); // Trigger validation for dependent fields
    }
  }, [availabilityDateRange, setValue, trigger]);


  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentUploadedCount = imageUploadStates.filter(s => s.cloudinaryUrl).length;
    if (currentUploadedCount + files.length > MAX_IMAGES) {
      toast({
        title: "Too many images",
        description: `You can upload a maximum of ${MAX_IMAGES} images. You have ${currentUploadedCount} uploaded, tried to add ${files.length}.`,
        variant: "destructive",
      });
      setFileInputKey(Date.now());
      return;
    }

    const newUploadStates = Array.from(files).map(file => ({
      file,
      isLoading: true,
      error: undefined,
      cloudinaryUrl: undefined,
      previewUrl: URL.createObjectURL(file)
    }));
    setImageUploadStates(prev => [...prev, ...newUploadStates]);
    setFileInputKey(Date.now()); 

    for (let i = 0; i < newUploadStates.length; i++) {
      const uploadState = newUploadStates[i];
      const file = uploadState.file;

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
        
        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error(`[CLIENT] Failed to parse JSON response for ${file.name}. Raw response:`, responseText, parseError);
            const errorMsg = response.status === 503 ? "Image upload service is temporarily unavailable or not configured." : "Server returned an unreadable response. Check server logs.";
            throw new Error(errorMsg);
        }

        if (!response.ok) {
          throw new Error(result.message || `Upload failed: ${result.error || `Server error ${response.status}`}`);
        }
        if (!result.imageUrl) {
          throw new Error('Upload successful but no image URL returned.');
        }

        setImageUploadStates(prev => prev.map(s => s.file === file ? { ...s, isLoading: false, cloudinaryUrl: result.imageUrl } : s));
        appendImageFormField({ url: result.imageUrl });
      } catch (err: any) {
         let uploadErrorMsg = err.message || 'Upload failed due to an unknown client error.';
          if (err.message && err.message.toLowerCase().includes('failed to fetch')) {
            uploadErrorMsg = "Network error or server not reachable.";
          }
         setImageUploadStates(prev => prev.map(s => s.file === file ? { ...s, isLoading: false, error: uploadErrorMsg } : s));
         toast({
            title: `Upload Failed for ${file.name}`,
            description: uploadErrorMsg,
            variant: "destructive",
         });
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    const imageStateToRemove = imageUploadStates[indexToRemove];
    if (imageStateToRemove) {
        if (imageStateToRemove.previewUrl && imageStateToRemove.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(imageStateToRemove.previewUrl);
        }
        if (imageStateToRemove.cloudinaryUrl) {
          const formFieldIndex = imageFormFields.findIndex(field => field.id && field.url === imageStateToRemove.cloudinaryUrl);
          if (formFieldIndex !== -1) {
            removeImageFormField(formFieldIndex);
          }
        }
    }
    setImageUploadStates(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const onSubmit: SubmitHandler<PropertyFormData> = async (data) => {
    setFormIsLoading(true);
    if (!session?.user?.id) {
        toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive"});
        setFormIsLoading(false);
        return;
    }

    const finalImageUrls = imageUploadStates
      .filter(state => state.cloudinaryUrl)
      .map(state => ({ url: state.cloudinaryUrl as string }));

    if (finalImageUrls.length === 0) {
        toast({ title: "Validation Error", description: "At least one image must be successfully uploaded.", variant: "destructive"});
        setFormIsLoading(false);
        return;
    }

    const propertyDataToSubmit = {
      ...data,
      images: finalImageUrls, 
      amenities: selectedAmenities,
      hostId: session.user.id,
      host: {
        name: session.user.name || "Unknown Host",
        avatarUrl: session.user.image || undefined,
      },
      availableFrom: data.availableFrom ? startOfDay(data.availableFrom) : undefined,
      availableTo: data.availableTo ? startOfDay(data.availableTo) : undefined,
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

                {/* Availability Date Range Picker */}
                <div className="space-y-2">
                    <Label htmlFor="availability-dates">Availability Dates</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="availability-dates"
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${!availabilityDateRange && "text-muted-foreground"}`}
                            disabled={formIsLoading}
                        >
                            <CalendarIconLucide className="mr-2 h-4 w-4" />
                            {availabilityDateRange?.from ? (
                            availabilityDateRange.to ? (
                                <>
                                {format(availabilityDateRange.from, "LLL dd, y")} -{" "}
                                {format(availabilityDateRange.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(availabilityDateRange.from, "LLL dd, y")
                            )
                            ) : (
                            <span>Pick availability period (optional)</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={availabilityDateRange?.from}
                            selected={availabilityDateRange}
                            onSelect={setAvailabilityDateRange}
                            numberOfMonths={2}
                            disabled={(date) => date < startOfDay(new Date())}
                        />
                        </PopoverContent>
                    </Popover>
                    {errors.availableFrom && <p className="text-sm text-destructive">{errors.availableFrom.message}</p>}
                    {errors.availableTo && <p className="text-sm text-destructive">{errors.availableTo.message}</p>}
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
                    <div className="space-y-2">
                        <Label htmlFor="images" className="flex items-center">
                            <ImageIcon className="mr-2 h-5 w-5 text-muted-foreground" /> Property Images (up to {MAX_IMAGES})
                        </Label>
                        <Input
                            id="images"
                            key={fileInputKey}
                            type="file"
                            multiple
                            accept="image/png, image/jpeg, image/gif, image/webp"
                            onChange={handleFileChange}
                            disabled={formIsLoading || imageUploadStates.filter(s => s.cloudinaryUrl).length >= MAX_IMAGES}
                            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        {errors.images && !imageUploadStates.some(s => s.cloudinaryUrl) && <p className="text-sm text-destructive">{errors.images.message}</p>}
                    </div>
                    
                    {imageUploadStates.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {imageUploadStates.map((uploadState, index) => (
                            <div key={index} className="relative group aspect-square border rounded-md p-1 shadow-sm bg-muted/30">
                                {uploadState.previewUrl && (
                                    <NextImage
                                        src={uploadState.previewUrl}
                                        alt={`Preview ${uploadState.file?.name || index}`}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                                        className="object-contain rounded" 
                                    />
                                )}
                                {uploadState.isLoading && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md">
                                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                                    </div>
                                )}
                                {!uploadState.isLoading && uploadState.error && (
                                    <div className="absolute inset-0 bg-destructive/90 flex flex-col items-center justify-center p-2 rounded-md text-center">
                                        <p className="text-xs text-destructive-foreground mb-1">{uploadState.error}</p>
                                        <Button variant="outline" size="sm" className="h-auto py-1 px-2 text-xs border-destructive-foreground text-destructive-foreground hover:bg-destructive-foreground/20" onClick={() => removeImage(index)}>Remove</Button>
                                    </div>
                                )}
                                {!uploadState.isLoading && uploadState.cloudinaryUrl && (
                                     <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="h-7 w-7 bg-red-500/70 hover:bg-red-600 text-white shadow-md"
                                            onClick={() => removeImage(index)}
                                            aria-label="Remove image"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                                 {!uploadState.isLoading && !uploadState.cloudinaryUrl && !uploadState.error && !uploadState.previewUrl && (
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-md">
                                        <p className="text-xs text-white">Error State</p>
                                    </div>
                                )}
                            </div>
                        ))}
                        </div>
                    )}
                     <p className="text-xs text-muted-foreground">
                        Accepted formats: PNG, JPG, GIF, WEBP. Max {MAX_FILE_SIZE_MB}MB per image.
                        {imageUploadStates.filter(s => s.cloudinaryUrl).length > 0 
                         ? ` (${imageUploadStates.filter(s => s.cloudinaryUrl).length}/${MAX_IMAGES} uploaded)`
                         : (imageUploadStates.some(s=>s.isLoading) ? ' (Uploading...)' : ' (No images selected yet)')}
                    </p>
                </div>


                <CardFooter className="p-0 pt-6">
                     <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={formIsLoading || imageUploadStates.some(s => s.isLoading)}>
                        {(formIsLoading || imageUploadStates.some(s => s.isLoading)) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {formIsLoading ? 'Listing Property...' : (imageUploadStates.some(s => s.isLoading) ? 'Processing Images...' : 'List My Property')}
                    </Button>
                </CardFooter>
                </form>
            </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );

    
