import mongoose, { Schema, Document, models, model } from "mongoose";


export interface IUser extends Document {
 
  name: string;
  email: string;
  passwordHash?: string;
  role: "guest" | "host" | "admin";
  stripeAccountId?: string;
  avatarUrl?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    id: { type: Number, unique: true }, 
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    role: { type: String, enum: ["guest", "host", "admin"], default: "guest" },
    stripeAccountId: { type: String },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);



export default models.User || model<IUser>("User", userSchema);
