
export type UserRole = 'guest' | 'host' | 'admin';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PricePeriod = 'nightly' | 'weekly' | 'monthly';

export type BookingStatus = 
  | 'pending_confirmation' 
  | 'pending_payment' 
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

export interface BookedDateRange {
  bookingId: string; 
  startDate: Date;
  endDate: Date;
  status: BookingStatus;
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
  bookedDateRanges?: BookedDateRange[];
}

export interface Booking {
  id: string;
  listingId: string; 
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
    mainImage?: string; 
    id?: string; 
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
  bookingId: string; 
  stripePaymentIntentId: string; 
  stripeChargeId?: string; 
  amount: number; 
  currency: string; 
  status: PaymentStatus | 'succeeded'; 
  createdAt: Date;
}
