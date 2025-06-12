import type { Property } from './types';

// Adding createdAt dates to mock properties for sorting
// Simulating newer properties having later dates
export const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Cozy Beachfront Cottage',
    description: 'A beautiful cottage right on the beach, perfect for a relaxing getaway. Enjoy stunning ocean views and direct beach access.',
    location: 'Malibu, California',
    address: '123 Ocean Drive, Malibu, CA',
    pricePerNight: 250,
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
    title: 'Modern Downtown Apartment',
    description: 'Stylish apartment in the heart of the city. Close to all major attractions, restaurants, and nightlife. Features a rooftop terrace.',
    location: 'New York, New York',
    address: '456 Main Street, New York, NY',
    pricePerNight: 180,
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
  {
    id: '3',
    title: 'Rustic Cabin in the Woods',
    description: 'Escape to this charming cabin surrounded by nature. Perfect for hiking, fishing, and unwinding by the fireplace.',
    location: 'Asheville, North Carolina',
    address: '789 Forest Lane, Asheville,NC',
    pricePerNight: 120,
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
    ],
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
    amenities: ['WiFi', 'Kitchen', 'Fireplace', 'Hiking Trails', 'Pet Friendly'],
    host: {
      name: 'Carol Danvers',
      avatarUrl: 'https://placehold.co/100x100.png',
    },
    rating: 4.9,
    reviewsCount: 200,
    type: 'House',
    createdAt: new Date('2023-05-10T09:00:00Z'),
  },
  {
    id: '4',
    title: 'Chic Studio in Arts District',
    description: 'A bright and airy studio apartment located in the vibrant arts district. Walk to galleries, cafes, and boutiques.',
    location: 'Paris, France',
    address: '10 Rue de Rivoli, Paris',
    pricePerNight: 150,
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
    ],
    bedrooms: 0, // Studio
    bathrooms: 1,
    maxGuests: 2,
    amenities: ['WiFi', 'Kitchenette', 'Air Conditioning', 'Public Transport Access'],
    host: {
      name: 'David Copperfield',
      avatarUrl: 'https://placehold.co/100x100.png',
    },
    rating: 4.7,
    reviewsCount: 95,
    type: 'Apartment',
    createdAt: new Date('2023-10-01T12:00:00Z'),
  },
  {
    id: '5',
    title: 'Spacious Villa with Pool',
    description: 'Luxurious villa with a private pool and stunning mountain views. Ideal for families or groups seeking comfort and privacy.',
    location: 'Tuscany, Italy',
    address: 'Strada del Vino, Tuscany',
    pricePerNight: 400,
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
    ],
    bedrooms: 4,
    bathrooms: 3,
    maxGuests: 8,
    amenities: ['WiFi', 'Full Kitchen', 'Private Pool', 'Air Conditioning', 'BBQ Area', 'Garden'],
    host: {
      name: 'Eva Green',
      avatarUrl: 'https://placehold.co/100x100.png',
    },
    rating: 4.9,
    reviewsCount: 150,
    type: 'House',
    createdAt: new Date('2024-02-15T11:00:00Z'), // Newest
  },
];

export const getProperties = async (): Promise<Property[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // Sort properties by createdAt date in descending order (newest first)
  const sortedProperties = [...mockProperties].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return sortedProperties;
};

export const getPropertyById = async (id: string): Promise<Property | undefined> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockProperties.find(property => property.id === id);
};

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
