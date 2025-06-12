
import mongoose, { Schema, Document } from 'mongoose';
import type { Property as PropertyType } from '@/lib/types';

// PropertyDocument now correctly reflects that 'createdAt' comes from timestamps:true
// and is part of PropertyType. The Omit should not remove 'createdAt' if it's in PropertyType.
// However, Mongoose's timestamps will add createdAt and updatedAt automatically.
export interface PropertyDocument extends Omit<PropertyType, 'id' | 'hostId' | 'images'>, Document {
  hostId: mongoose.Types.ObjectId;
  images: string[]; 
  // createdAt and updatedAt will be automatically added by Mongoose due to timestamps: true
}

const propertySchema = new Schema<PropertyDocument>(
  {
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    maxGuests: { 
      type: Number,
      required: true,
      min: 1,
    },
    images: { 
      type: [String], 
      validate: {
        validator: function(v: string[]) {
          return v == null || v.length === 0 || v.every(url => typeof url === 'string' && url.startsWith('http'));
        },
        message: 'All image entries must be valid URLs.'
      },
      default: [],
    },
    bedrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    bathrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    amenities: {
      type: [String],
      default: [],
    },
    type: {
      type: String,
      enum: ['House', 'Apartment', 'Room', 'Unique Stay'],
      required: true,
    },
    host: { 
      name: { type: String, required: true },
      avatarUrl: { type: String },
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true } // This automatically adds createdAt and updatedAt fields
);

propertySchema.index({ location: 'text', title: 'text', description: 'text' }); 
// MongoDB will automatically create an index on createdAt if you query by it often.
// Or you can explicitly add: propertySchema.index({ createdAt: -1 });

export default mongoose.models.Property || mongoose.model<PropertyDocument>("Property", propertySchema);
