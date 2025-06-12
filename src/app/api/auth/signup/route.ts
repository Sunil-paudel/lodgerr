
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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("[Signup API] User already exists with email:", email);
      return NextResponse.json(
        { message: "User with this email already exists. Please use a different email or log in." },
        { status: 409 } // Conflict
      );
    }
    console.log("[Signup API] No existing user found with email:", email);

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("[Signup API] Password hashed successfully for email:", email);

    const newUser = new User({
      name: fullName,
      email,
      passwordHash: hashedPassword,
      // role defaults to 'guest' as per schema
    });

    console.log("[Signup API] Attempting to save new user:", { name: newUser.name, email: newUser.email });
    await newUser.save();
    console.log("[Signup API] User saved successfully:", { id: newUser._id, email: newUser.email });

    return NextResponse.json(
      { message: "User created successfully. You can now log in." },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[Signup API] Error during signup process:", err);

    // Specifically check for MongoDB duplicate key error (code 11000)
    if (err.code === 11000) {
      let DMessage = "A user with these details already exists.";
      if (err.keyPattern?.email) {
        DMessage = "This email address is already registered. Please use a different email or log in.";
      }
      // Add checks for other unique fields if you have them
      // else if (err.keyPattern?.someOtherUniqueField) {
      //   DMessage = "This someOtherUniqueField is already in use.";
      // }
      console.log("[Signup API] Duplicate key error:", DMessage);
      return NextResponse.json(
        { message: DMessage },
        { status: 409 } // Conflict
      );
    }

    // General server error
    return NextResponse.json(
      { message: "An internal server error occurred during signup. Please try again later.", error: err.message },
      { status: 500 }
    );
  }
};
