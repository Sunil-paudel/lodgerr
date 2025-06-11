export type UserRole = 'guest' | 'host' | 'admin';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface User {
  id: string;
  name: string; // Changed from fullName
  email: string;
  passwordHash?: string; // Added - should be handled server-side mostly
  role: UserRole;
  stripeAccountId?: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface Property { // Corresponds to Listings
  id: string;
  hostId: string; // FK to User.id
  title: string;
  description: string;
  pricePerNight: number;
  location: string;
  address?: string; // Kept from original, useful detail
  maxGuests: number; // Changed from numGuests to maxGuests for consistency
  images: string[];
  bedrooms: number; // Kept from original
  bathrooms: number; // Kept from original
  amenities: string[]; // Kept from original
  type: 'House' | 'Apartment' | 'Room' | 'Unique Stay'; // Kept from original
  host: { // Denormalized host info for convenience, primary link is hostId
    name: string;
    avatarUrl?: string;
  };
  rating?: number; // Kept from original, likely an aggregate
  reviewsCount?: number; // Kept from original, likely an aggregate
  createdAt: Date;
}

export interface Booking {
  id: string;
  listingId: string; // FK to Property.id
  guestId: string; // FK to User.id
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  createdAt: Date;
}

export interface Review {
  id: string;
  listingId: string; // FK to Property.id
  guestId: string; // FK to User.id
  rating: number; // Individual rating for this review
  comment: string;
  createdAt: Date;
}

// Optional Image model if you decide to have a separate table/entity for images
// export interface ListingImage {
//   id: string;
//   listingId: string; // FK to Property.id
//   url: string;
//   description?: string; // Optional alt text or caption
// }

export interface Payment {
  id: string;
  bookingId: string; // FK to Booking.id
  stripePaymentId: string;
  amount: number;
  status: PaymentStatus | 'succeeded'; // Stripe might use 'succeeded'
  createdAt: Date;
}
