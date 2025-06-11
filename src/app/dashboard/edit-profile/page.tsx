
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, Mail, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const getInitials = (name?: string | null) => {
  if (!name) return "U";
  const names = name.split(" ");
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  return (names[0][0] + (names[names.length - 1][0] || "")).toUpperCase();
};

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50, { message: "Name cannot exceed 50 characters."}),
  email: z.string().email({ message: "Please enter a valid email address." }),
  avatarUrl: z.string().url({ message: "Please enter a valid URL for your avatar." }).or(z.literal("")).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null | undefined>(session?.user?.image);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || "",
      email: session?.user?.email || "",
      avatarUrl: session?.user?.image || "",
    },
  });

  // Watch avatarUrl for preview
  const watchedAvatarUrl = watch("avatarUrl");
  useEffect(() => {
    setAvatarPreview(watchedAvatarUrl || session?.user?.image);
  }, [watchedAvatarUrl, session?.user?.image]);


  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/dashboard/edit-profile");
    }
    if (status === "authenticated" && session?.user) {
      setValue("name", session.user.name || "");
      setValue("email", session.user.email || "");
      setValue("avatarUrl", session.user.image || "");
      setAvatarPreview(session.user.image);
    }
  }, [status, router, session, setValue]);

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update profile.");
      }

      // Update the NextAuth session
      await updateSession({
        user: {
            name: result.updatedUser.name,
            email: result.updatedUser.email,
            image: result.updatedUser.avatarUrl,
        }
      });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      router.push("/dashboard"); // Or router.refresh() if staying on the same page
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || !session?.user) {
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
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl font-bold font-headline text-primary">Edit Profile</CardTitle>
              <CardDescription>Update your account details below.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-32 w-32 text-5xl border-4 border-muted shadow-md">
                    <AvatarImage src={avatarPreview || undefined} alt={session.user.name || "User"} />
                    <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
                  </Avatar>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground" /> Full Name</Label>
                  <Input id="name" {...register("name")} placeholder="Your full name" disabled={isLoading} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Email Address</Label>
                  <Input id="email" type="email" {...register("email")} placeholder="your@email.com" disabled={isLoading} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatarUrl" className="flex items-center"><ImageIcon className="mr-2 h-4 w-4 text-muted-foreground" /> Avatar URL</Label>
                  <Input 
                    id="avatarUrl" 
                    {...register("avatarUrl")} 
                    placeholder="https://example.com/your-avatar.png" 
                    disabled={isLoading}
                  />
                  {errors.avatarUrl && <p className="text-sm text-destructive">{errors.avatarUrl.message}</p>}
                   <p className="text-xs text-muted-foreground">
                    Paste a URL to an image for your avatar. For actual file uploads, a backend storage solution would be needed.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="p-6 border-t bg-muted/30 flex justify-end space-x-3">
                <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
