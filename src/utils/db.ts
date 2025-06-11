
import mongoose from "mongoose";

// Ensure MONGO environment variable is checked
if (!process.env.MONGO) {
  throw new Error(
    'Please define the MONGO environment variable inside .env.local'
  );
}

mongoose.set('strictQuery', false);

const connect = async () => {
  // Check if we're already connected or connecting
  if (mongoose.connection.readyState === 1) {
    console.log("Already connected to MongoDB.");
    return;
  }
  if (mongoose.connection.readyState === 2) {
    console.log("Connecting to MongoDB...");
    // If connecting, wait for the existing connection attempt to resolve
  }

  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(process.env.MONGO!); 
    console.log("Successfully connected to MongoDB.");
  } catch (error) {
    console.error("Connection to MongoDB failed!", error);
    throw new Error("Connection failed!");
  }
};

export default connect;
