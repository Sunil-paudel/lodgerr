
"use client";
import { useState, type FormEvent, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';


export default function LoginPage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const { toast } = useToast();
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);


 // Check for error query parameter from NextAuth.js
 useEffect(() => {
   const nextAuthError = searchParams?.get('error');
   if (nextAuthError) {
     let friendlyMessage = "An unexpected error occurred during login.";
     // You can map NextAuth error codes to user-friendly messages
     if (nextAuthError === "CredentialsSignin") {
       friendlyMessage = "Invalid email or password. Please try again.";
     } else if (nextAuthError === "Configuration") {
       friendlyMessage = "Server configuration error. Please contact support.";
     } else {
       // Fallback for other NextAuth errors
       friendlyMessage = `Login error: ${nextAuthError}. Please try again.`;
     }
     setError(friendlyMessage);
     toast({
       title: "Login Problem",
       description: friendlyMessage,
       variant: "destructive",
     });
     // Clear the error from URL to prevent re-display on refresh
     // router.replace('/login', { scroll: false }); // Using router.replace might cause re-renders, consider if needed
   }
 }, [searchParams, toast, router]);




 const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
   event.preventDefault();
   setIsLoading(true);
   setError(null);
   console.log("Attempting sign-in with email:", email);


   try {
     const result = await signIn('credentials', {
       redirect: false,
       email,
       password,
     });


     console.log("Login Page SignIn Result:", result);


     if (result?.error) {
       let friendlyError = "Login failed. Please check your credentials.";
       // Specific error messages from NextAuth.js authorize callback
       if (result.error === "No user found with this email." ||
           result.error === "Invalid password." ||
           result.error.includes("Invalid email or password")) {
          friendlyError = "Invalid email or password.";
       } else if (result.error === "Please enter both email and password.") {
         friendlyError = "Please enter both email and password.";
       } else if (result.error === "User account is not properly configured for password login.") {
         friendlyError = "Account configuration issue. Please contact support.";
       } else if (result.error.includes("Database connection error")) {
         friendlyError = "Could not connect to the database. Please try again later.";
       } else if (result.error.includes("server issue") || result.error.includes("server error")) {
         friendlyError = "A server error occurred during login. Please try again later.";
       }
        else {
         // Fallback for other errors passed in result.error
         console.error("NextAuth SignIn Error from result.error:", result.error);
         friendlyError = result.error; // Display the error message from NextAuth directly if it's specific
       }
       setError(friendlyError);
       toast({
         title: "Login Failed",
         description: friendlyError,
         variant: "destructive",
       });
     } else if (result?.ok) {
       toast({
         title: "Login Successful!",
         description: "Welcome back!",
       });
       const callbackUrl = searchParams?.get('callbackUrl') || '/';
       router.push(callbackUrl);
       router.refresh(); // Force a refresh to ensure session is updated across layouts/components
     } else if (!result?.ok && !result?.error) {
       // Handle cases where signin might not be ok but doesn't return a specific error string
       // This could be due to network issues before NextAuth processes the request fully.
       const genericFailMsg = "Login attempt failed. Please ensure your connection is stable and try again. Check server logs for details.";
       setError(genericFailMsg);
       toast({
         title: "Login Attempt Failed",
         description: genericFailMsg,
         variant: "destructive",
       });
     }
   } catch (e: any) {
     console.error("Login Page Submit Error (catch block):", e);
     let connectError = "An unexpected error occurred during login. Please try again.";
     if (e instanceof TypeError && e.message.toLowerCase().includes("failed to fetch")) {
        connectError = "Could not connect to the server. Please check your internet connection, ensure the server is running, and verify NEXTAUTH_URL in your environment settings.";
     } else if (e.message) {
       connectError = e.message;
     }
     setError(connectError);
      toast({
         title: "Login Error",
         description: connectError,
         variant: "destructive",
       });
   } finally {
     setIsLoading(false);
   }
 };


 return (
   <div className="flex flex-col min-h-screen">
     <Header />
     <main className="flex-grow container mx-auto px-4 py-16 flex items-center justify-center">
       <Card className="w-full max-w-md shadow-xl">
         <CardHeader className="text-center">
           <CardTitle className="text-2xl font-bold font-headline text-primary">Welcome Back!</CardTitle>
           <CardDescription>Log in to continue to Lodger.</CardDescription>
         </CardHeader>
         <form onSubmit={handleSubmit}>
           <CardContent className="space-y-4">
             {error && (
               <div className="bg-destructive/10 p-3 rounded-md text-center">
                 <p className="text-sm text-destructive">{error}</p>
               </div>
             )}
             <div className="space-y-2">
               <Label htmlFor="email">Email</Label>
               <Input
                 id="email"
                 type="email"
                 placeholder="you@example.com"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 required
                 disabled={isLoading}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="password">Password</Label>
               <Input
                 id="password"
                 type="password"
                 placeholder="••••••••"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 required
                 disabled={isLoading}
               />
             </div>
             <div className="flex items-center justify-end">
                 <Button variant="link" asChild className="p-0 h-auto text-sm">
                     <Link href="#">Forgot password?</Link>
                 </Button>
             </div>
           </CardContent>
           <CardFooter className="flex flex-col space-y-3 pt-6">
             <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               {isLoading ? 'Logging In...' : 'Log In'}
             </Button>
             <p className="text-sm text-muted-foreground">
               Don&apos;t have an account?{' '}
               <Link href="/signup" className="font-medium text-accent hover:underline">
                 Sign up
               </Link>
             </p>
           </CardFooter>
         </form>
       </Card>
     </main>
     <Footer />
   </div>
 );
}
