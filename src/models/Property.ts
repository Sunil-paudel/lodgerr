import mongoose, { Schema, Document } from 'mongoose';
import type { Property as PropertyType } from '@/lib/types';

export interface PropertyDocument extends Omit<PropertyType, 'id' | 'createdAt' | 'hostId'>, Document {
  hostId: mongoose.Types.ObjectId;
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
    maxGuests: { // Changed from numGuests to align with types.ts
      type: Number,
      required: true,
      min: 1,
    },
    images: {
      type: [String],
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
    host: { // Denormalized host info
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

propertySchema.index({ location: 'text', title: 'text', description: 'text' }); // For text search

export default mongoose.models.Property || mongoose.model<PropertyDocument>("Property", propertySchema);
