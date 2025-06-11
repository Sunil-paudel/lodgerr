import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
      
    },
    
    resetToken: String, // Store the reset token here
    resetTokenExpiry: Date, // Store the token's expiration date here
  },
  { timestamps: true }
);

// If the User collection does not exist, create a new one.
export default mongoose.models.User || mongoose.model("User", userSchema);