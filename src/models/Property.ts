
import mongoose, { Schema, Document } from 'mongoose';
import type { Property as PropertyType } from '@/lib/types';

export interface PropertyDocument extends Omit<PropertyType, 'id' | 'hostId' | 'images' | 'createdAt' | 'host'>, Document {
  hostId: mongoose.Types.ObjectId;
  images: string[];
  host: {
    name: string;
    avatarUrl?: string;
  };
  createdAt: Date; // Ensure createdAt is part of the interface if used by PropertyType and not just from timestamps
  updatedAt: Date; // Mongoose adds this with timestamps
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
  { 
    timestamps: true,
    toJSON: {
      virtuals: true, // ensure virtuals are included
      transform: function (doc, ret) {
        ret.id = ret._id.toString(); // map _id to id
        delete ret._id;
        delete ret.__v; // remove __v
        if (ret.hostId instanceof mongoose.Types.ObjectId) {
          ret.hostId = ret.hostId.toString();
        }
      }
    },
    toObject: { // Also apply transform for toObject if needed elsewhere
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        if (ret.hostId instanceof mongoose.Types.ObjectId) {
          ret.hostId = ret.hostId.toString();
        }
      }
    }
  }
);

propertySchema.index({ location: 'text', title: 'text', description: 'text' });
propertySchema.index({ hostId: 1 });
propertySchema.index({ createdAt: -1 });


export default mongoose.models.Property || mongoose.model<PropertyDocument>("Property", propertySchema);
