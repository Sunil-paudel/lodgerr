
export type UserRole = 'guest' | 'host' | 'admin';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PricePeriod = 'nightly' | 'weekly' | 'monthly';

// New type for booking status
export type BookingStatus = 
  | 'pending_confirmation' 
  | 'confirmed_by_host' 
  | 'rejected_by_host' 
  | 'cancelled_by_guest' 
  | 'completed' 
  | 'no_show';

export interface User {
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  stripeAccountId?: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface Property {
  id: string;
  hostId: string;
  title: string;
  description: string;
  price: number; 
  pricePeriod: PricePeriod; 
  location: string;
  address?: string;
  maxGuests: number;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  type: 'House' | 'Apartment' | 'Room' | 'Unique Stay';
  host: {
    name: string;
    avatarUrl?: string;
  };
  rating?: number;
  reviewsCount?: number;
  createdAt: Date;
  availableFrom?: Date;
  availableTo?: Date;
}

export interface Booking {
  id: string;
  listingId: string; // Should be Property ID
  guestId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus; // Added booking status
  createdAt: Date;
  guestDetails?: { // Populated from User model
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null; 
  };
  propertyDetails?: { // Optional: for views where bookings are listed directly
    title?: string;
    mainImage?: string;
    id?: string;
  }
}

export interface Review {
  id: string;
  listingId: string;
  guestId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  bookingId: string;
  stripePaymentId: string;
  amount: number;
  status: PaymentStatus | 'succeeded';
  createdAt: Date;
}

