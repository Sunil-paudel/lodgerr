
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Image as ImageIcon, AlertTriangle, DollarSign, Calendar as CalendarIconLucide } from 'lucide-react';
import NextImage from 'next/image';
import type { Property as PropertyType, PricePeriod } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const propertyEditSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long.").max(100).optional(),
  description: z.string().min(20, "Description must be at least 20 characters long.").max(5000).optional(),
  type: z.enum(["House", "Apartment", "Room", "Unique Stay"]).optional(),
  location: z.string().min(3).max(100).optional(),
  address: z.string().min(5).max(200).optional(),
  price: z.coerce.number().positive().min(1).max(100000).optional(),
  pricePeriod: z.enum(["nightly", "weekly", "monthly"] as [PricePeriod, ...PricePeriod[]]).optional(),
  bedrooms: z.coerce.number().min(0).max(20).optional(),
  bathrooms: z.coerce.number().min(0).max(10).optional(),
  maxGuests: z.coerce.number().min(1).max(50).optional(),
  images: z.array(
    z.object({
      url: z.string().url("A valid image URL is required.")
    })
  ).min(1, "At least one image is required.").max(MAX_IMAGES, `Maximum ${MAX_IMAGES} images.`).optional(),
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
  path: ["availableTo"],
});

type PropertyEditFormData = z.infer<typeof propertyEditSchema>;

const availableAmenitiesList = [
  'WiFi', 'Kitchen', 'Air Conditioning', 'Free Parking', 'TV',
  'Washer', 'Dryer', 'Pool', 'Gym', 'Pet Friendly', 'Heating', 'Dedicated Workspace',
  'Beach Access', 'Fireplace', 'Rooftop Access', 'Elevator'
];


export default function EditPropertyPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { toast } = useToast();

  const [propertyData, setPropertyData] = useState<PropertyType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formIsSubmitting, setFormIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [imageUploadStates, setImageUploadStates] = useState<Array<{ file?: File; isLoading: boolean; error?: string; cloudinaryUrl?: string; previewUrl?: string; isExisting?: boolean }>>([]);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [availabilityDateRange, setAvailabilityDateRange] = useState<DateRange | undefined>(undefined);


  const { control, handleSubmit, formState: { errors }, setValue, reset, watch, trigger } = useForm<PropertyEditFormData>({
    resolver: zodResolver(propertyEditSchema),
    defaultValues: {
      images: [],
      pricePeriod: "nightly",
      availableFrom: undefined,
      availableTo: undefined,
    }
  });

  const { fields: imageFormFields, append: appendImageFormField, remove: removeImageFormField, replace: replaceImageFormFields } = useFieldArray({
    control,
    name: "images"
  });


  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace(`/login?callbackUrl=/properties/${propertyId}/edit`);
    }
  }, [authStatus, router, propertyId]);

  useEffect(() => {
    if (propertyId && authStatus === "authenticated") {
      const fetchProperty = async () => {
        setIsLoading(true);
        setPageError(null);
        try {
          const response = await fetch(`/api/properties/${propertyId}`);
          if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.message || `Failed to fetch property: ${response.statusText}`);
          }
          const data: PropertyType = await response.json();

          if (data.hostId !== session?.user?.id) {
            setPageError("You are not authorized to edit this property.");
            setPropertyData(null);
            setIsLoading(false);
            return;
          }

          setPropertyData(data);
          const defaultValues: PropertyEditFormData = {
            title: data.title,
            description: data.description,
            type: data.type,
            location: data.location,
            address: data.address,
            price: data.price,
            pricePeriod: data.pricePeriod,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            maxGuests: data.maxGuests,
            availableFrom: data.availableFrom ? new Date(data.availableFrom) : undefined,
            availableTo: data.availableTo ? new Date(data.availableTo) : undefined,
            images: (data.images || []).map(url => ({ url })),
            amenities: data.amenities || []
          };
          reset(defaultValues);
          setSelectedAmenities(data.amenities || []);

          if (data.availableFrom || data.availableTo) {
            setAvailabilityDateRange({
              from: data.availableFrom ? new Date(data.availableFrom) : undefined,
              to: data.availableTo ? new Date(data.availableTo) : undefined,
            });
          } else {
            setAvailabilityDateRange(undefined);
          }

          const existingImages = (data.images || []).map(url => ({
            cloudinaryUrl: url,
            previewUrl: url,
            isLoading: false,
            isExisting: true,
          }));
          setImageUploadStates(existingImages);
          // `replaceImageFormFields` is already called by `reset` if images are part of defaultValues with correct structure.
          // If `reset` doesn't handle `useFieldArray` for images, uncomment this:
          // replaceImageFormFields(existingImages.map(img => ({ url: img.cloudinaryUrl! })));

        } catch (err: any) {
          console.error("Error fetching property for edit:", err);
          setPageError(err.message || "An error occurred while fetching property details.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchProperty();
    }
  }, [propertyId, authStatus, session, reset, replaceImageFormFields]);
  
  useEffect(() => {
    setValue('availableFrom', availabilityDateRange?.from);
    setValue('availableTo', availabilityDateRange?.to);
    if (availabilityDateRange?.from || availabilityDateRange?.to) { // Trigger validation if either is set
        trigger(['availableFrom', 'availableTo']);
    }
  }, [availabilityDateRange, setValue, trigger]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentImageCount = imageUploadStates.length;
    if (currentImageCount + files.length > MAX_IMAGES) {
      toast({
        title: "Too many images",
        description: `You can upload a maximum of ${MAX_IMAGES} images. You have ${currentImageCount} selected/uploaded.`,
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
      previewUrl: URL.createObjectURL(file),
      isExisting: false,
    }));
    setImageUploadStates(prev => [...prev, ...newUploadStates]);
    setFileInputKey(Date.now());

    for (let i = 0; i < newUploadStates.length; i++) {
      const uploadState = newUploadStates[i];
      const file = uploadState.file!;

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setImageUploadStates(prev => prev.map(s => s.file === file ? { ...s, isLoading: false, error: `File too large (max ${MAX_FILE_SIZE_MB}MB).` } : s));
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Upload failed');

        setImageUploadStates(prev => prev.map(s => s.file === file ? { ...s, isLoading: false, cloudinaryUrl: result.imageUrl } : s));
        appendImageFormField({ url: result.imageUrl });
      } catch (err: any) {
        setImageUploadStates(prev => prev.map(s => s.file === file ? { ...s, isLoading: false, error: err.message || 'Upload failed' } : s));
        toast({ title: `Upload Failed for ${file.name}`, description: err.message, variant: "destructive" });
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
            const formFieldIndex = imageFormFields.findIndex(field => field.url === imageStateToRemove.cloudinaryUrl);
            if (formFieldIndex !== -1) {
                removeImageFormField(formFieldIndex);
            }
        }
    }
    setImageUploadStates(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  const onSubmit: SubmitHandler<PropertyEditFormData> = async (data) => {
    setFormIsSubmitting(true);

    const finalImageUrls = imageUploadStates
      .filter(state => state.cloudinaryUrl && !state.error)
      .map(state => ({ url: state.cloudinaryUrl! }));

    if (finalImageUrls.length === 0) {
        toast({ title: "Validation Error", description: "At least one image must be present.", variant: "destructive"});
        setFormIsSubmitting(false);
        return;
    }

    const changedData: Partial<PropertyEditFormData> = {};
    let hasChanges = false;

    (Object.keys(data) as Array<keyof PropertyEditFormData>).forEach(key => {
        if (key === 'images' || key === 'amenities' || key === 'availableFrom' || key === 'availableTo') return; // Handle separately

        const formValue = data[key];
        const originalValue = propertyData?.[key as keyof PropertyType];
        
        // Ensure we handle undefined vs null vs empty string consistently if needed for your backend
        // For simple comparison:
        if (formValue !== originalValue && !(formValue === undefined && originalValue == null)) { // Check if actually changed
            (changedData as any)[key] = formValue;
            hasChanges = true;
        }
    });
    
    // Handle images
    const originalImageUrls = (propertyData?.images || []).join(',');
    const newImageUrls = finalImageUrls.map(img => img.url).join(',');
    if (originalImageUrls !== newImageUrls) {
      changedData.images = finalImageUrls;
      hasChanges = true;
    }

    // Handle amenities
    const originalAmenities = (propertyData?.amenities || []).slice().sort().join(',');
    const newAmenities = selectedAmenities.slice().sort().join(',');
    if (originalAmenities !== newAmenities) {
      changedData.amenities = selectedAmenities;
      hasChanges = true;
    }

    // Handle availability dates
    const originalAvailableFromTime = propertyData?.availableFrom ? startOfDay(new Date(propertyData.availableFrom)).getTime() : null;
    const newAvailableFromTime = data.availableFrom ? startOfDay(new Date(data.availableFrom)).getTime() : null;
    if (newAvailableFromTime !== originalAvailableFromTime) {
        changedData.availableFrom = data.availableFrom ? startOfDay(new Date(data.availableFrom)) : undefined; // Send undefined to potentially unset
        hasChanges = true;
    }

    const originalAvailableToTime = propertyData?.availableTo ? startOfDay(new Date(propertyData.availableTo)).getTime() : null;
    const newAvailableToTime = data.availableTo ? startOfDay(new Date(data.availableTo)).getTime() : null;
    if (newAvailableToTime !== originalAvailableToTime) {
        changedData.availableTo = data.availableTo ? startOfDay(new Date(data.availableTo)) : undefined; // Send undefined to potentially unset
        hasChanges = true;
    }


    if (!hasChanges) {
        toast({ title: "No Changes", description: "No changes were made to the property.", variant: "default" });
        setFormIsSubmitting(false);
        router.push(`/properties/${propertyId}`);
        return;
    }


    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changedData),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update property.");
      }

      toast({
        title: "Property Updated!",
        description: "Your property has been successfully updated.",
      });
      router.push(`/properties/${propertyId}`);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setFormIsSubmitting(false);
    }
  };

  const handleAmenityChange = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(item => item !== amenity) : [...prev, amenity]
    );
  };


  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Loading property details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (pageError) {
     return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-semibold text-destructive mb-2">Access Denied or Error</h1>
            <p className="text-muted-foreground mb-6">{pageError}</p>
            <Button onClick={() => router.push('/')} variant="outline">Go to Homepage</Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (!propertyData) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">Property not found or not authorized.</main>
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
                <CardTitle className="text-3xl font-bold text-primary font-headline">Edit Your Property</CardTitle>
                <CardDescription>Update the details for &quot;{propertyData.title}&quot;.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                <div className="space-y-2">
                    <Label htmlFor="title">Property Title</Label>
                    <Controller name="title" control={control} render={({ field }) => <Input {...field} id="title" placeholder="e.g., Charming Seaside Cottage" disabled={formIsSubmitting} />} />
                    {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Controller name="description" control={control} render={({ field }) => <Textarea {...field} id="description" placeholder="Describe what makes your place special..." rows={5} disabled={formIsSubmitting}/>} />
                    {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="type">Property Type</Label>
                        <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} disabled={formIsSubmitting}>
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
                       <Label>Price</Label>
                       <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Controller name="price" control={control} render={({ field }) => <Input {...field} id="price" type="number" placeholder="120" className="pl-8" disabled={formIsSubmitting} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}/>} />
                            </div>
                            <Controller
                                name="pricePeriod"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} disabled={formIsSubmitting}>
                                    <SelectTrigger id="pricePeriod" className="w-[150px]">
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="nightly">Per Night</SelectItem>
                                        <SelectItem value="weekly">Per Week</SelectItem>
                                        <SelectItem value="monthly">Per Month</SelectItem>
                                    </SelectContent>
                                    </Select>
                                )}
                            />
                       </div>
                        {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                        {errors.pricePeriod && <p className="text-sm text-destructive">{errors.pricePeriod.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="location">General Location / City</Label>
                    <Controller name="location" control={control} render={({ field }) => <Input {...field} id="location" placeholder="e.g., Austin, Texas" disabled={formIsSubmitting}/> } />
                    {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="address">Full Address (Street, City, State, Zip)</Label>
                    <Controller name="address" control={control} render={({ field }) => <Input {...field} id="address" placeholder="e.g., 456 Oak Lane, Austin, TX 78701" disabled={formIsSubmitting}/> } />
                    {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <Controller name="bedrooms" control={control} render={({ field }) => <Input {...field} id="bedrooms" type="number" disabled={formIsSubmitting} value={field.value ?? ''} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)}/>} />
                        {errors.bedrooms && <p className="text-sm text-destructive">{errors.bedrooms.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bathrooms">Bathrooms</Label>
                        <Controller name="bathrooms" control={control} render={({ field }) => <Input {...field} id="bathrooms" type="number" disabled={formIsSubmitting} value={field.value ?? ''} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)}/>} />
                        {errors.bathrooms && <p className="text-sm text-destructive">{errors.bathrooms.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="maxGuests">Max Guests</Label>
                        <Controller name="maxGuests" control={control} render={({ field }) => <Input {...field} id="maxGuests" type="number" disabled={formIsSubmitting} value={field.value ?? ''} onChange={e => field.onChange(parseInt(e.target.value,10) || 1)}/>} />
                        {errors.maxGuests && <p className="text-sm text-destructive">{errors.maxGuests.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="availability-dates-edit">Availability Dates</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="availability-dates-edit"
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${!availabilityDateRange && "text-muted-foreground"}`}
                            disabled={formIsSubmitting}
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
                            disabled={formIsSubmitting}
                        />
                        <Label htmlFor={`amenity-${amenity}`} className="font-normal text-sm cursor-pointer">{amenity}</Label>
                        </div>
                    ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="images-input" className="flex items-center">
                            <ImageIcon className="mr-2 h-5 w-5 text-muted-foreground" /> Property Images (up to {MAX_IMAGES})
                        </Label>
                        <Input
                            id="images-input"
                            key={fileInputKey}
                            type="file"
                            multiple
                            accept="image/png, image/jpeg, image/gif, image/webp"
                            onChange={handleFileChange}
                            disabled={formIsSubmitting || imageUploadStates.filter(s => s.cloudinaryUrl && !s.error).length >= MAX_IMAGES}
                            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        {errors.images && !imageUploadStates.some(s => s.cloudinaryUrl) && <p className="text-sm text-destructive">{errors.images.message}</p>}
                    </div>

                    {imageUploadStates.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {imageUploadStates.map((uploadState, index) => (
                            <div key={uploadState.previewUrl || `existing-${index}`} className="relative group aspect-square border rounded-md p-1 shadow-sm bg-muted/30">
                                {uploadState.previewUrl && (
                                    <NextImage
                                        src={uploadState.previewUrl}
                                        alt={`Preview ${uploadState.file?.name || `image ${index}`}`}
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
                                {!uploadState.isLoading && (uploadState.cloudinaryUrl || uploadState.isExisting) && !uploadState.error && (
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
                            </div>
                        ))}
                        </div>
                    )}
                     <p className="text-xs text-muted-foreground">
                        Accepted formats: PNG, JPG, GIF, WEBP. Max {MAX_FILE_SIZE_MB}MB per image.
                        {imageUploadStates.filter(s => s.cloudinaryUrl && !s.error).length > 0
                         ? ` (${imageUploadStates.filter(s => s.cloudinaryUrl && !s.error).length}/${MAX_IMAGES} images)`
                         : (imageUploadStates.some(s=>s.isLoading) ? ' (Processing Images...)' : '')}
                    </p>
                </div>

                <CardFooter className="p-0 pt-6 flex justify-end space-x-3">
                     <Button variant="outline" type="button" onClick={() => router.back()} disabled={formIsSubmitting}>
                        Cancel
                     </Button>
                     <Button type="submit" size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={formIsSubmitting || imageUploadStates.some(s => s.isLoading) || imageUploadStates.filter(s => s.cloudinaryUrl && !s.error).length === 0}>
                        {(formIsSubmitting || imageUploadStates.some(s => s.isLoading)) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {formIsSubmitting ? 'Saving Changes...' : (imageUploadStates.some(s => s.isLoading) ? 'Processing Images...' : 'Save Changes')}
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

