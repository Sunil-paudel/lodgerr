import mongoose, { Schema, Document } from 'mongoose';
import type { Payment as PaymentType, PaymentStatus } from '@/lib/types';

export interface PaymentDocument extends Omit<PaymentType, 'id' | 'createdAt' | 'bookingId'>, Document {
  bookingId: mongoose.Types.ObjectId;
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    stripePaymentId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'succeeded'] as (PaymentStatus | 'succeeded')[],
      required: true,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ stripePaymentId: 1 });
paymentSchema.index({ bookingId: 1 });

export default mongoose.models.Payment || mongoose.model<PaymentDocument>("Payment", paymentSchema);
