
import mongoose, { Schema, Document } from 'mongoose';
import type { Property as PropertyType } from '@/lib/types';

export interface PropertyDocument extends Omit<PropertyType, 'id' | 'createdAt' | 'hostId' | 'images'>, Document {
  hostId: mongoose.Types.ObjectId;
  images: string[]; // Changed to array of strings for direct URL storage
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
    images: { // Storing as an array of image URL strings
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
  { timestamps: true }
);

propertySchema.index({ location: 'text', title: 'text', description: 'text' }); 

export default mongoose.models.Property || mongoose.model<PropertyDocument>("Property", propertySchema);
