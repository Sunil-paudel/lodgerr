export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  address?: string;
  pricePerNight: number;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  amenities: string[];
  host: {
    name: string;
    avatarUrl?: string;
  };
  rating?: number;
  reviewsCount?: number;
  type: 'House' | 'Apartment' | 'Room' | 'Unique Stay';
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  // You can add other user-specific fields here, for example:
  // dateJoined: Date;
  // isHost: boolean;
}
