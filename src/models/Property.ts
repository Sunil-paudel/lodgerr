
import mongoose, { Schema, Document } from 'mongoose';
import type { Property as PropertyType, PricePeriod, BookingStatus, BookedDateRange } from '@/lib/types';

const bookedDateRangeSchema = new Schema<BookedDateRange & {_id: false} >({ // Ensure _id is not created for subdocs unless explicitly needed
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending_confirmation', 'pending_payment', 'confirmed_by_host', 'rejected_by_host', 'cancelled_by_guest', 'completed', 'no_show'] as BookingStatus[],
    required: true 
  },
}, { _id: false });

export interface PropertyDocument extends Omit<PropertyType, 'id' | 'hostId' | 'images' | 'createdAt' | 'host' | 'bookedDateRanges'>, Document {
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
  bookedDateRanges: mongoose.Types.DocumentArray<BookedDateRange & Document>; // Use DocumentArray for subdocuments
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
    bookedDateRanges: { 
      type: [bookedDateRangeSchema],
      default: [],
    }
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
        if (ret.bookedDateRanges) {
          ret.bookedDateRanges = ret.bookedDateRanges.map((range: any) => ({
            ...range, // spread the plain object part of the subdocument
            bookingId: range.bookingId?.toString() || range.bookingId, // ensure bookingId is stringified
            startDate: range.startDate, // ensure dates are passed through
            endDate: range.endDate,
            status: range.status,
          }));
        }
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
        if (ret.bookedDateRanges) {
          ret.bookedDateRanges = ret.bookedDateRanges.map((range: any) => ({
            ...(range.toObject ? range.toObject() : range), // if it's a mongoose subdoc, call toObject()
            bookingId: range.bookingId?.toString() || range.bookingId,
          }));
        }
      }
    }
  }
);

propertySchema.index({ location: 'text', title: 'text', description: 'text' });
propertySchema.index({ hostId: 1 });
propertySchema.index({ createdAt: -1 });
propertySchema.index({ "bookedDateRanges.bookingId": 1 });


export default mongoose.models.Property || mongoose.model<PropertyDocument>("Property", propertySchema);
