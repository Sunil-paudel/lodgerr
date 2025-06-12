
import mongoose, { Schema, Document } from 'mongoose';
import type { Payment as PaymentType, PaymentStatus } from '@/lib/types';

// Interface for the Mongoose Document, extending your PaymentType
export interface PaymentDocument extends Omit<PaymentType, 'id' | 'createdAt' | 'bookingId'>, Document {
  bookingId: mongoose.Types.ObjectId; // Override to use Mongoose ObjectId for ref
  createdAt: Date; // Mongoose adds this via timestamps
  updatedAt: Date; // Mongoose adds this via timestamps
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    stripeChargeId: { // Optional, as PaymentIntent is primary
      type: String,
      index: true,
    },
    amount: { // Store amount in smallest currency unit (e.g., cents)
      type: Number,
      required: true,
      min: 0,
    },
    currency: { // e.g., 'usd', 'eur'
        type: String,
        required: true,
        lowercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'succeeded'] as (PaymentStatus | 'succeeded')[],
      required: true,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields
);

paymentSchema.index({ bookingId: 1 });

export default mongoose.models.Payment || mongoose.model<PaymentDocument>("Payment", paymentSchema);
