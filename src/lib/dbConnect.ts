
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
    // This might involve a more complex promise cache in a real app,
    // but for this simpler version, we'll just log and let it proceed.
    // Or, you could implement a promise to wait on.
    // For now, to avoid multiple unhandled connection attempts,
    // we will rely on subsequent calls to simply re-attempt if the first one failed.
  }

  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(process.env.MONGO!); // Added non-null assertion as we check MONGO above
    console.log("Successfully connected to MongoDB.");
  } catch (error) {
    console.error("Connection to MongoDB failed!", error);
    // It's often better to let the application decide how to handle this,
    // rather than throwing an error that might crash a serverless function
    // on startup if the DB isn't immediately available.
    // For now, we re-throw as per the original request.
    throw new Error("Connection failed!");
  }
};

export default connect;
