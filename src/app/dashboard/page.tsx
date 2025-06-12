
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation"; 
import { useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, UserCog, Mail, Briefcase, Home, Settings, ShieldCheck, ListChecks } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import Link from "next/link";

const getInitials = (name?: string | null) => {
  if (!name) return "U"; 
  const names = name.split(" ");
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  return (names[0][0] + (names[names.length - 1][0] || "")).toUpperCase();
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter(); 

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/dashboard"); 
    }
  }, [status, router]);

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

  if (!session || !session.user) {
    return (
       <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center text-center">
          <div>
            <p className="text-lg text-muted-foreground mb-4">Verifying session...</p>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { user } = session;

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-primary/80 via-primary to-accent/70 text-primary-foreground p-6 md:p-8 text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-28 w-28 text-4xl border-4 border-background shadow-lg">
                  <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-3xl md:text-4xl font-bold font-headline">
                Welcome, {user.name || "User"}!
              </CardTitle>
              <CardDescription className="text-primary-foreground/80 text-base mt-1">
                Manage your Lodger account and activity.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-8">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                  <UserCog className="mr-3 h-5 w-5 text-primary" /> Account Information
                </h3>
                <div className="p-4 border rounded-lg bg-background space-y-3 text-sm">
                  <div className="flex items-center">
                    <span className="font-medium w-24 shrink-0">Full Name:</span> 
                    <span className="text-muted-foreground">{user.name || "N/A"}</span>
                  </div>
                   <div className="flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground/70 inline-block align-middle" />
                    <span className="font-medium w-24 shrink-0 ml-0.5">Email:</span> 
                    <span className="text-muted-foreground">{user.email || "N/A"}</span>
                  </div>
                   {user.id && (
                     <div className="flex items-center">
                       <span className="font-medium w-24 shrink-0">User ID:</span> 
                       <span className="text-xs text-muted-foreground">{user.id}</span>
                     </div>
                   )}
                   {user.role && (
                     <div className="flex items-center">
                       <ShieldCheck className="mr-2 h-4 w-4 text-muted-foreground/70 inline-block align-middle" />
                       <span className="font-medium w-24 shrink-0 ml-0.5">Role:</span> 
                       <span className="capitalize px-2 py-0.5 bg-accent/20 text-accent-foreground rounded-full text-xs font-medium">{user.role}</span>
                     </div>
                   )}
                </div>
              </div>

              <div className="space-y-3">
                 <h3 className="text-lg font-semibold text-foreground flex items-center">
                   <Briefcase className="mr-3 h-5 w-5 text-primary" /> Your Activity
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="hover:shadow-lg transition-shadow duration-200 ease-in-out">
                        <CardHeader>
                            <CardTitle className="text-xl font-headline flex items-center">
                              <Home className="mr-2 h-5 w-5 text-accent" /> My Bookings
                            </CardTitle>
                            <CardDescription>View and manage your stays.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10 hover:text-primary" asChild>
                                <Link href="#">View Bookings (Coming Soon)</Link>
                            </Button>
                        </CardContent>
                    </Card>
                     <Card className="hover:shadow-lg transition-shadow duration-200 ease-in-out">
                        <CardHeader>
                            <CardTitle className="text-xl font-headline flex items-center">
                              <ListChecks className="mr-2 h-5 w-5 text-accent" /> My Properties
                            </CardTitle>
                            <CardDescription>Manage your listed properties.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10 hover:text-primary" asChild>
                               <Link href="/dashboard/my-properties">View My Properties</Link>
                            </Button>
                        </CardContent>
                    </Card>
                 </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 md:p-8 border-t bg-muted/30">
               <Button variant="ghost" className="mx-auto text-muted-foreground hover:text-primary" asChild>
                  <Link href="/dashboard/edit-profile">
                    <Settings className="mr-2 h-4 w-4" /> Edit Profile
                  </Link>
                </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
