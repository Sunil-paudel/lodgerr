import mongoose, { Schema, Document } from 'mongoose';
import type { Review as ReviewType } from '@/lib/types';

export interface ReviewDocument extends Omit<ReviewType, 'id' | 'createdAt' | 'listingId' | 'guestId'>, Document {
  listingId: mongoose.Types.ObjectId;
  guestId: mongoose.Types.ObjectId;
}

const reviewSchema = new Schema<ReviewDocument>(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ listingId: 1, guestId: 1 }, { unique: true }); // A user can review a listing only once
reviewSchema.index({ listingId: 1, rating: 1 });

export default mongoose.models.Review || mongoose.model<ReviewDocument>("Review", reviewSchema);
