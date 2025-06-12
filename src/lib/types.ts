
export type UserRole = 'guest' | 'host' | 'admin';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PricePeriod = 'nightly' | 'weekly' | 'monthly';

// New type for booking status
export type BookingStatus = 
  | 'pending_confirmation' 
  | 'pending_payment' // New status for before payment
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
  bookingStatus: BookingStatus; 
  createdAt: Date;
  guestDetails?: { 
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null; 
  };
  propertyDetails?: { 
    title?: string;
    mainImage?: string; // Will be property.images[0]
    id?: string; // Property ID
    location?: string;
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
  bookingId: string; // Reference to your Booking model's ID
  stripePaymentIntentId: string; // Stripe Payment Intent ID
  stripeChargeId?: string; // Stripe Charge ID (can be part of Payment Intent)
  amount: number; // Amount in cents
  currency: string; // e.g., 'usd'
  status: PaymentStatus | 'succeeded'; // Stripe uses 'succeeded' for successful payments
  createdAt: Date;
}

