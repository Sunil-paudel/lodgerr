
import mongoose, { Schema, Document } from 'mongoose';
import type { BookingStatus } from '@/lib/types';

// Interface for the Mongoose Document
export interface BookedDateRangeDocument extends Document {
  _id: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const bookedDateRangeSchema = new Schema<BookedDateRangeDocument>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true, // Each booking should only have one date range entry
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending_confirmation',
        'pending_payment',
        'confirmed_by_host',
        'rejected_by_host',
        'cancelled_by_guest',
        'completed',
        'no_show',
      ] as BookingStatus[],
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index to quickly find overlapping ranges for a property
bookedDateRangeSchema.index({ propertyId: 1, startDate: 1, endDate: 1 });
bookedDateRangeSchema.index({ propertyId: 1, status: 1 });


export default mongoose.models.BookedDateRange || mongoose.model<BookedDateRangeDocument>("BookedDateRange", bookedDateRangeSchema);
