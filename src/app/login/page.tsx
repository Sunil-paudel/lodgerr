"use client";

import { useState, type FormEvent } from 'react';
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
  useState(() => {
    const nextAuthError = searchParams?.get('error');
    if (nextAuthError) {
      // You can map NextAuth error codes to user-friendly messages
      if (nextAuthError === "CredentialsSignin") {
        setError("Invalid email or password. Please try again.");
      } else {
        setError("An unexpected error occurred during login. Please try again.");
      }
      // Clear the error from URL to prevent re-display on refresh
      router.replace('/login', { scroll: false });
    }
  });


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false, // We'll handle redirect manually or rely on callbackUrl
        email,
        password,
      });

      if (result?.error) {
        let friendlyError = "Login failed. Please check your credentials.";
        if (result.error === "CredentialsSignin" || result.error.includes("Incorrect password") || result.error.includes("No user found")) {
           friendlyError = "Invalid email or password.";
        } else if (result.error.includes("Missing email or password")) {
          friendlyError = "Please enter both email and password.";
        } else {
          console.error("NextAuth SignIn Error:", result.error);
          friendlyError = "An unexpected error occurred. Please try again later.";
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
        // Successful login
        // NextAuth.js might redirect based on callbackUrl by default if not handling manually
        // Or, you can push to a default page:
        const callbackUrl = searchParams?.get('callbackUrl') || '/';
        router.push(callbackUrl);
      }
    } catch (e) {
      console.error("Login Page Submit Error:", e);
      setError("An unexpected error occurred. Please try again.");
       toast({
          title: "Error",
          description: "Could not connect to the server. Please try again later.",
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
