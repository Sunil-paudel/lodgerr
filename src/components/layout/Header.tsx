"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogIn, UserPlus, HomeIcon, LogOut, UserCircle } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Added Avatar

const Header = () => {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' }); // Redirect to homepage after sign out
  };

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + (names[names.length - 1][0] || '')).toUpperCase();
  };


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <HomeIcon className="h-7 w-7 text-primary" />
          <span className="font-bold text-xl text-primary font-headline">Lodger</span>
        </Link>
        
        <nav className="hidden flex-1 items-center space-x-4 md:flex">
          <Button variant="link" asChild className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground hover:no-underline">
            <Link href="/">
              Browse
            </Link>
          </Button>
          <Button variant="link" asChild className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground hover:no-underline">
            <Link href="/list-property">
              List your property
            </Link>
          </Button>
        </nav>

        <div className="hidden flex-1 items-center justify-end space-x-2 md:flex">
          {isAuthenticated && session?.user ? (
            <>
              <Button variant="ghost" asChild>
                 {/* This could link to a dashboard or profile page */}
                <Link href="/dashboard" className="flex items-center"> 
                  <Avatar className="h-7 w-7 mr-2">
                    <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
                    <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
                  </Avatar>
                  My Account
                </Link>
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </>
          ) : status === 'loading' ? (
            <div className="h-8 w-24 animate-pulse bg-muted rounded-md"></div>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/signup">
                  <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="flex flex-1 justify-end md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background">
              <nav className="flex flex-col space-y-4 mt-8">
                <Button variant="link" asChild className="text-lg font-medium justify-start p-0 h-auto">
                    <Link href="/">Browse</Link>
                </Button>
                <Button variant="link" asChild className="text-lg font-medium justify-start p-0 h-auto">
                   <Link href="/list-property">List your property</Link>
                </Button>
                <hr className="my-4 border-border" />
                {isAuthenticated && session?.user ? (
                  <>
                    <Button variant="ghost" asChild className="w-full justify-start text-lg">
                      <Link href="/dashboard"> {/* Link to a dashboard or profile page */}
                        <UserCircle className="mr-2 h-5 w-5" /> My Account
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={handleSignOut} className="w-full justify-start text-lg">
                       <LogOut className="mr-2 h-5 w-5" /> Sign Out
                    </Button>
                  </>
                ) : status === 'loading' ? (
                   <div className="h-10 w-full animate-pulse bg-muted rounded-md my-1"></div>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="w-full justify-start text-lg">
                      <Link href="/login">
                        <LogIn className="mr-2 h-5 w-5" /> Login
                      </Link>
                    </Button>
                    <Button asChild className="w-full justify-start text-lg bg-accent hover:bg-accent/90 text-accent-foreground">
                      <Link href="/signup">
                        <UserPlus className="mr-2 h-5 w-5" /> Sign Up
                      </Link>
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
