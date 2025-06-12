
import User from "@/models/User";
import connectDB from "@/utils/db";
import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
  try {
    const { fullName, email, password } = await request.json();
    console.log("[Signup API] Received request with data:", { fullName, email, password_exists: !!password });

    if (!fullName || !email || !password) {
      console.log("[Signup API] Missing required fields.");
      return NextResponse.json(
        { message: "Missing required fields: fullName, email, and password." },
        { status: 400 }
      );
    }

    console.log("[Signup API] Connecting to DB...");
    await connectDB();
    console.log("[Signup API] DB connected.");

    // Explicitly log the email being searched for
    console.log("[Signup API] Checking for existing user with email:", email);
    const existingUser = await User.findOne({ email: email }); // Search by email

    if (existingUser) {
      // This block should ONLY be hit if the email already exists
      console.log("[Signup API] Found existing user with this email:", existingUser.toObject());
      return NextResponse.json(
        { message: "This email address is already registered. Please use a different email or log in." },
        { status: 409 } // Conflict - for duplicate email
      );
    }
    console.log("[Signup API] No existing user found with email:", email);

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("[Signup API] Password hashed successfully for email:", email);

    const newUser = new User({
      name: fullName,
      email,
      passwordHash: hashedPassword,
      // role defaults to 'guest' as per schema in User model
      // Mongoose will automatically generate a unique '_id'
      // No 'id' field is set here.
    });

    // Log the object just before saving to ensure no unexpected 'id' field is present
    const userObjectToSave = newUser.toObject();
    if ('id' in userObjectToSave) {
        console.warn("[Signup API] Warning: 'id' field present on newUser object before save. This is unexpected as Mongoose uses '_id'. Object:", userObjectToSave);
    } else {
        console.log("[Signup API] New user object structure is as expected (no 'id' field, relies on '_id').");
    }
    console.log("[Signup API] Attempting to save new user object:", userObjectToSave);
    
    await newUser.save();
    console.log("[Signup API] User saved successfully:", { _id: newUser._id, email: newUser.email });

    return NextResponse.json(
      { message: "User created successfully. You can now log in." },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[Signup API] Error during signup process:", err);

    // Check for MongoDB duplicate key error (code 11000)
    if (err.code === 11000) {
      let DMessage = "A user with some of these details already exists. Please check your input.";
      console.log("[Signup API] MongoDB duplicate key error (E11000). Key pattern:", err.keyPattern);
      if (err.keyPattern) {
          const conflictingFields = Object.keys(err.keyPattern).join(', ');
          if (err.keyPattern.email) { // Specifically check if 'email' is the conflicting field
            DMessage = `This email address is already registered. Please use a different email or log in.`;
          } else if (err.keyPattern.id) { // Specifically check if 'id' is the conflicting field
             DMessage = `An account already exists with this ID. This is unexpected, please contact support or check database configuration.`;
             console.error("[Signup API] Critical: Duplicate key error on 'id' field. This suggests a custom unique index on 'id' in the MongoDB collection which should be removed. Mongoose uses '_id'.");
          }
           else {
            DMessage = `An account already exists with this ${conflictingFields}. Please use different details.`;
          }
          console.log("[Signup API] Conflicting fields from keyPattern:", conflictingFields);
      }
      return NextResponse.json(
          { message: DMessage, errorDetails: `MongoDB E11000: Duplicate key on field(s): ${JSON.stringify(err.keyPattern)}` },
          { status: 409 } // Conflict
      );
    }
    
    // General server error
    let errorDetails = "Unknown server error.";
    if (err.name && err.message) {
      errorDetails = `${err.name}: ${err.message}`;
    } else if (err.message) {
      errorDetails = err.message;
    } else if (err.code) {
        errorDetails = `Error Code ${err.code}`;
    }

    return NextResponse.json(
      { 
        message: "An internal server error occurred during signup. Please try again later.", 
        errorDetails: errorDetails 
      },
      { status: 500 }
    );
  }
};
