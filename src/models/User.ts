import mongoose, { Schema, Document } from 'mongoose';
import type { User as UserType, UserRole } from '@/lib/types';

export interface UserDocument extends Omit<UserType, 'id' | 'createdAt'>, Document {}

const userSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      // required: true, // Make this required if users must always have a password
    },
    role: {
      type: String,
      enum: ['guest', 'host', 'admin'] as UserRole[],
      required: true,
      default: 'guest',
    },
    stripeAccountId: {
      type: String,
    },
    avatarUrl: {
      type: String,
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

export default mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);
