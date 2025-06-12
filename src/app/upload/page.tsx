
"use client";

import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import NextImage from "next/image";
import { Loader2, UploadCloud, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// These should be set in your .env.local file
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export default function UploadPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setUploadedUrl(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File is too large. Maximum size is 5MB.");
        setImage(null);
        setPreview(null);
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!image) {
      setError("Please select an image file first.");
      return;
    }
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      setError("Cloudinary environment variables are not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env.local file. You also need to create an 'unsigned' upload preset in your Cloudinary dashboard.");
      toast({
        title: "Configuration Error",
        description: "Cloudinary environment variables are not set for client-side upload.",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    setUploading(true);
    setError(null);
    setUploadedUrl(null);

    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok && data.secure_url) {
        setUploadedUrl(data.secure_url);
        toast({
          title: "Upload Successful!",
          description: "Your image has been uploaded to Cloudinary.",
        });
        setImage(null); // Clear the file input after successful upload
        // setPreview(null); // Optionally clear preview
      } else {
        throw new Error(data.error?.message || "Failed to upload image to Cloudinary.");
      }
    } catch (err: any) {
      console.error("Cloudinary Upload Error:", err);
      setError(err.message || "An unknown error occurred during upload.");
      toast({
        title: "Upload Failed",
        description: err.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="text-2xl font-bold font-headline text-primary mt-2">
              Client-Side Image Upload
            </CardTitle>
            <CardDescription>
              Upload an image directly to Cloudinary (unsigned). Requires an unsigned upload preset.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                <div>
                  <strong>Configuration Incomplete:</strong>
                  <p className="text-xs">
                    <code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> and/or <code>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code> are not set in your <code>.env.local</code> file. This page requires them for client-side uploads. You also need to create an "unsigned" upload preset in your Cloudinary dashboard.
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="image-upload">Choose an image</Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/png, image/jpeg, image/gif, image/webp"
                onChange={handleImageChange}
                disabled={uploading || (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET)}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              <p className="text-xs text-muted-foreground">Max file size: 5MB. Allowed types: PNG, JPG, GIF, WEBP.</p>
            </div>

            {preview && (
              <div className="mt-4 p-2 border rounded-md bg-muted/30 relative aspect-video max-h-[300px] mx-auto w-full sm:w-auto sm:max-w-md">
                <NextImage
                  src={preview}
                  alt="Selected image preview"
                  fill
                  className="object-contain rounded-md"
                  sizes="(max-width: 640px) 90vw, 50vw"
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 shrink-0" />
                {error}
              </div>
            )}

            {uploadedUrl && (
              <div className="p-3 bg-green-500/10 text-green-700 text-sm rounded-md space-y-2">
                <div className="flex items-center font-semibold">
                  <CheckCircle className="h-5 w-5 mr-2 shrink-0 text-green-600" />
                  Image Uploaded Successfully!
                </div>
                <p className="text-xs break-all">
                  URL: <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-green-800">{uploadedUrl}</a>
                </p>
                <div className="mt-2 border rounded-md bg-muted/30 relative aspect-video max-h-[200px] mx-auto w-full sm:w-auto sm:max-w-xs">
                    <NextImage
                      src={uploadedUrl}
                      alt="Uploaded image"
                      fill
                      className="object-contain rounded-md"
                      sizes="(max-width: 640px) 80vw, 30vw"
                    />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleUpload}
              disabled={!image || uploading || (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET)}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              size="lg"
            >
              {uploading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {uploading ? "Uploading..." : "Upload to Cloudinary"}
            </Button>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
