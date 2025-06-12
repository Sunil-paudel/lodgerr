
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId; // Explicitly define _id
  name: string;
  email: string;
  passwordHash?: string;
  role: "guest" | "host" | "admin";
  stripeAccountId?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date; // Mongoose adds this with timestamps
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    role: { type: String, enum: ["guest", "host", "admin"], default: "guest" },
    stripeAccountId: { type: String },
    avatarUrl: { type: String },
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true, // ensure virtuals are included
      transform: function (doc, ret) {
        ret.id = ret._id.toString(); // map _id to id
        delete ret._id;
        delete ret.passwordHash; // remove passwordHash
        delete ret.__v; // remove __v
      }
    },
    toObject: { // Also apply transform for toObject if needed elsewhere
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.passwordHash;
        delete ret.__v;
      }
    }
  }
);

export default mongoose.models.User || mongoose.model<IUser>("User", userSchema);
