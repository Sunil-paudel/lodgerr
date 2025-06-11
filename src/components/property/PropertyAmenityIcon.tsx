import { Wifi, ParkingCircle, Utensils, Tv, Wind, CheckCircle, Bath, BedDouble, ShieldCheck, Sun, Trees, Waves, PawPrint, Coffee, Heater, Dumbbell, WashingMachine, Box, Warehouse, UserCheck } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface PropertyAmenityIconProps extends LucideProps {
  amenity: string;
}

export const PropertyAmenityIcon = ({ amenity, ...props }: PropertyAmenityIconProps) => {
  const lowerAmenity = amenity.toLowerCase();

  if (lowerAmenity.includes('wifi')) return <Wifi {...props} />;
  if (lowerAmenity.includes('parking')) return <ParkingCircle {...props} />;
  if (lowerAmenity.includes('kitchen')) return <Utensils {...props} />;
  if (lowerAmenity.includes('tv') || lowerAmenity.includes('television')) return <Tv {...props} />;
  if (lowerAmenity.includes('air conditioning') || lowerAmenity.includes('ac')) return <Wind {...props} />;
  if (lowerAmenity.includes('washer')) return <WashingMachine {...props} />;
  if (lowerAmenity.includes('dryer')) return <Box {...props} />; // Using Box as proxy for Dryer
  if (lowerAmenity.includes('pool')) return <Waves {...props} />; 
  if (lowerAmenity.includes('gym') || lowerAmenity.includes('fitness')) return <Dumbbell {...props} />;
  if (lowerAmenity.includes('pet friendly')) return <PawPrint {...props} />;
  if (lowerAmenity.includes('heating') || lowerAmenity.includes('heater')) return <Heater {...props} />;
  if (lowerAmenity.includes('dedicated workspace')) return <UserCheck {...props} />; // UserCheck for workspace

  // More generic ones
  if (lowerAmenity.includes('bath')) return <Bath {...props} />;
  if (lowerAmenity.includes('bed')) return <BedDouble {...props} />;
  if (lowerAmenity.includes('garden') || lowerAmenity.includes('patio')) return <Sun {...props} />;
  if (lowerAmenity.includes('forest') || lowerAmenity.includes('hiking')) return <Trees {...props} />;
  if (lowerAmenity.includes('beach')) return <Waves {...props} />;
  if (lowerAmenity.includes('coffee')) return <Coffee {...props} />;
  if (lowerAmenity.includes('elevator')) return <Warehouse {...props} />; // Using Warehouse as proxy for Elevator
  

  // Default icon for unmapped amenities
  return <CheckCircle {...props} />;
};
