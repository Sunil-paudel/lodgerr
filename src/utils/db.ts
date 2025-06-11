
import mongoose from 'mongoose';

// This is the hardcoded MongoDB connection string that was previously in use.
// It's generally recommended to use environment variables for sensitive data like this.
const MONGO = "mongodb+srv://muhammadabdullahcse23:qJVH09i0AIxXgQhW@cluster0.gffx04i.mongodb.net/test?retryWrites=true&w=majority";

if (!MONGO) {
  // This check remains, though with a hardcoded string, MONGO will always be defined here.
  // If you intend to switch to environment variables, this check becomes more relevant for process.env.MONGODB_URI
  throw new Error("MongoDB connection string is not defined.");
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    console.log("MongoDB: Using cached connection.");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    // Mask password in log
    const maskedUri = MONGO.replace(/\/\/([^:]+):([^@]+)@/, '//REDACTED_USER:********@');
    console.log(`MongoDB: Attempting to connect to ${maskedUri}`);

    cached.promise = mongoose.connect(MONGO, opts).then((mongooseInstance) => {
      console.log("MongoDB: Connection successful!");
      return mongooseInstance;
    }).catch(err => {
      console.error("MongoDB: Connection failed.", err.message);
      // console.error("Full Mongoose connection error:", JSON.stringify(err, Object.getOwnPropertyNames(err))); // Potentially too verbose
      cached.promise = null; // Reset promise on failure
      throw new Error(`Database connection failed: ${err.message}`);
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
