
import mongoose, { Schema, Document } from 'mongoose';
import type { Property as PropertyType, PricePeriod } from '@/lib/types';

// BookedDateRange subdocument schema and array are removed from here

export interface PropertyDocument extends Omit<PropertyType, 'id' | 'hostId' | 'images' | 'createdAt' | 'host'>, Document {
  hostId: mongoose.Types.ObjectId;
  images: string[];
  price: number;
  pricePeriod: PricePeriod;
  host: {
    name: string;
    avatarUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  availableFrom?: Date;
  availableTo?: Date;
  // bookedDateRanges field is removed
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
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    pricePeriod: {
      type: String,
      enum: ['nightly', 'weekly', 'monthly'] as PricePeriod[],
      required: true,
      default: 'nightly',
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
    availableFrom: {
      type: Date,
      required: false,
    },
    availableTo: {
      type: Date,
      required: false,
    },
    // bookedDateRanges field is removed
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        if (ret.hostId instanceof mongoose.Types.ObjectId) {
          ret.hostId = ret.hostId.toString();
        }
        // Transformation for bookedDateRanges is removed
      }
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        if (ret.hostId instanceof mongoose.Types.ObjectId) {
          ret.hostId = ret.hostId.toString();
        }
        // Transformation for bookedDateRanges is removed
      }
    }
  }
);

propertySchema.index({ location: 'text', title: 'text', description: 'text' });
propertySchema.index({ hostId: 1 });
propertySchema.index({ createdAt: -1 });
// Index for bookedDateRanges.bookingId is removed

export default mongoose.models.Property || mongoose.model<PropertyDocument>("Property", propertySchema);
