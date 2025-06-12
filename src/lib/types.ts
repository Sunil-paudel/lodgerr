
export type UserRole = 'guest' | 'host' | 'admin';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PricePeriod = 'nightly' | 'weekly' | 'monthly';

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
  price: number; // Changed from pricePerNight
  pricePeriod: PricePeriod; // Added
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
  listingId: string;
  guestId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  createdAt: Date;
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
