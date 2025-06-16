import type { Property } from './types';

// Adding createdAt dates and hostIds to mock properties
// These mockProperties, getProperties, and getPropertyById are no longer
// actively used by the main property listing and detail flows, which now fetch from MongoDB.
// They are kept here for potential reference or isolated testing if ever needed, but
// could be removed for a cleaner codebase.
const mockProperties: Property[] = [
  {
    id: '1',
    hostId: 'host-alice-001', // Example hostId
    title: 'Cozy Beachfront Cottage',
    description: 'A beautiful cottage right on the beach, perfect for a relaxing getaway. Enjoy stunning ocean views and direct beach access.',
    location: 'Malibu, California',
    address: '123 Ocean Drive, Malibu, CA',
    price: 250, // Assuming pricePerNight is now 'price'
    pricePeriod: 'nightly', // Added pricePeriod
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
    ],
    bedrooms: 2,
    bathrooms: 1,
    maxGuests: 4,
    amenities: ['WiFi', 'Kitchen', 'Air Conditioning', 'Beach Access', 'Free Parking'],
    host: {
      name: 'Alice Wonderland',
      avatarUrl: 'https://placehold.co/100x100.png',
    },
    rating: 4.8,
    reviewsCount: 120,
    type: 'House',
    createdAt: new Date('2023-01-15T10:00:00Z'),
  },
  {
    id: '2',
    hostId: 'user-logged-in-id', 
    title: 'Modern Downtown Apartment',
    description: 'Stylish apartment in the heart of the city. Close to all major attractions, restaurants, and nightlife. Features a rooftop terrace.',
    location: 'New York, New York',
    address: '456 Main Street, New York, NY',
    price: 180,
    pricePeriod: 'nightly',
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
    ],
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    amenities: ['WiFi', 'Kitchen', 'Elevator', 'Gym', 'Rooftop Access'],
    host: {
      name: 'Bob The Builder', 
      avatarUrl: 'https://placehold.co/100x100.png',
    },
    rating: 4.5,
    reviewsCount: 85,
    type: 'Apartment',
    createdAt: new Date('2023-03-20T14:30:00Z'),
  },
  // Add more mock properties if needed, ensuring they match the new Property type
];


export const mockLocations: string[] = [
  "Malibu, California",
  "New York, New York",
  "Asheville, North Carolina",
  "Paris, France",
  "Tuscany, Italy",
  "London, UK",
  "Tokyo, Japan",
  "Sydney, Australia",
  "Rome, Italy",
  "Barcelona, Spain",
];

export const getSuggestedLocations = async (query: string): Promise<string[]> => {
  await new Promise(resolve => setTimeout(resolve, 100)); 
  if (!query) return [];
  return mockLocations.filter(loc => loc.toLowerCase().includes(query.toLowerCase()));
};
