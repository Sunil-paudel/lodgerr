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
