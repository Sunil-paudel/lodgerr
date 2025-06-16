
import mongoose, { Schema, Document } from 'mongoose';
import type { Booking as BookingType, PaymentStatus, BookingStatus } from '@/lib/types';

export interface BookingDocument extends Omit<BookingType, 'id' | 'createdAt' | 'listingId' | 'guestId'>, Document {
  listingId: mongoose.Types.ObjectId;
  guestId: mongoose.Types.ObjectId;
}

const bookingSchema = new Schema<BookingDocument>(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    guestId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'] as PaymentStatus[],
      required: true,
      default: 'pending',
    },
    bookingStatus: {
      type: String,
      enum: [
        'pending_confirmation', 
        'pending_payment',
        'confirmed_by_host', 
        'rejected_by_host', 
        'cancelled_by_guest', // Added new status
        'completed',
        'no_show'
      ] as BookingStatus[],
      required: true,
      default: 'pending_confirmation', 
    },
  },
  { timestamps: true }
);

bookingSchema.index({ listingId: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ guestId: 1 });

export default mongoose.models.Booking || mongoose.model<BookingDocument>("Booking", bookingSchema);

