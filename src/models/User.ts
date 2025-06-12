
import mongoose, { Schema, Document } from "mongoose";

// Define the user interface extending Mongoose's Document
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: "guest" | "host" | "admin";
  stripeAccountId?: string;
  avatarUrl?: string;
  createdAt: Date;
}

// Define the user schema
const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true }, // Removed unique: true
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    role: { type: String, enum: ["guest", "host", "admin"], default: "guest" },
    stripeAccountId: { type: String },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

// Use mongoose.model and mongoose.models to avoid model overwrite issues
export default mongoose.models.User || mongoose.model<IUser>("User", userSchema);

