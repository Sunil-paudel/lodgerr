import mongoose from "mongoose";
mongoose.set('strictQuery', false);

// Ensure this MONGODB_URL is correct and your IP is whitelisted if using Atlas.
const MONGODB_URL= "mongodb+srv://paudelsunil16:paudelsunil16@cluster0.dlua3bq.mongodb.net/";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    console.log("MongoDB is already connected.");
    return;
  }
  try {
    if (!MONGODB_URL) {
      console.error("[DB Connect] MongoDB URI is not defined. Please set it in your environment variables or configuration.");
      throw new Error("Server configuration error: MONGODB_URI is not defined.");
    }
    console.log("[DB Connect] Attempting to connect to MongoDB...");
    await mongoose.connect(MONGODB_URL);
    console.log("[DB Connect] MongoDB connected successfully.");
  } catch (error: any) {
    console.error("[DB Connect] MongoDB connection failed:", error.message);
    if (error.stack) {
      console.error("[DB Connect] MongoDB connection error stack:", error.stack);
    } else {
      console.error("[DB Connect] MongoDB connection error details:", error);
    }
    // Construct a new error to ensure it's an Error instance with a clear message
    throw new Error("Database connection failed: " + error.message);
  }
};

export default connectDB;