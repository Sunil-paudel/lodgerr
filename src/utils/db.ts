
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Mongoose connection caching for serverless environments
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connect() {
  if (!MONGODB_URI) {
    const errorMessage = "FATAL ERROR: MONGODB_URI is not defined in your .env.local file.";
    console.error(errorMessage);
    throw new Error("Server configuration error: MONGODB_URI is not defined.");
  }

  if (cached.conn) {
    // console.log("MongoDB: Using cached connection."); // Can be too noisy for dev
    return cached.conn;
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', false);
    // Mask password in log: replace everything between '//' and '@' that doesn't include ':' with 'username:********'
    const maskedUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//REDACTED_USER:********@');
    console.log(`MongoDB: Attempting to connect to ${maskedUri}`);
    
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false, // Disable buffering if you want quick failures for connection issues
    }).then((mongooseInstance) => {
      console.log("MongoDB: Connection successful!");
      return mongooseInstance;
    }).catch(err => {
      console.error("MongoDB: Connection failed.", err.message);
      console.error("Full Mongoose connection error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      cached.promise = null; // Reset promise on failure
      throw new Error(`Database connection failed: ${err.message}`); // Re-throw with Mongoose error message
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // This catch is if the promise was already rejected and we're re-awaiting
    cached.promise = null; // Ensure promise is cleared on re-throw
    throw e; // Re-throw the error which includes the message "Database connection failed: ..."
  }
  return cached.conn;
}

export default connect;
