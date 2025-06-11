
import User from "@/models/User";
import connectDB from "@/utils/db"; // Changed from connect to connectDB
import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import nodemailer from "nodemailer";

export const POST = async (request: NextRequest) => {
  try {
    const { fullName, email, password } = await request.json();

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields: fullName, email, and password." },
        { status: 400 }
      );
    }
    console.log("Signup API: Attempting DB connection for signup.");
    await connectDB(); // Changed from connect() to connectDB()
    console.log("Signup API: DB connection successful (or already connected).");


    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Signup API: User already exists with email:", email);
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 } 
      );
    }

    const hashedPassword = await bcrypt.hash(password, 5);
    console.log("Generated hashedPassword:", hashedPassword); 

    const newUser = new User({
      name: fullName,
      email,
      passwordHash: hashedPassword, 
    });

    console.log("New user object before save:", JSON.stringify(newUser.toObject(), null, 2)); 

    await newUser.save();
    console.log("User saved successfully."); 

    // Sending confirmation email
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GOOGLE_EMAIL,
          pass: process.env.GOOGLE_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.GOOGLE_EMAIL,
        to: email,
        subject: "Registration Confirmation - Lodger",
        text: `Thank you for registering on Lodger, ${fullName}! Your registration is successful. If you did not apply for registration, please contact us.`,
      };

      await transporter.sendMail(mailOptions);
      console.log("Confirmation email sent to:", email);
    } catch (emailError: any) {
      console.error("Failed to send confirmation email:", emailError.message || emailError);
    }

    return NextResponse.json(
      { message: "User created successfully. Confirmation email sent." },
      { status: 201 }
    );

  } catch (err: any) {
    console.error("Signup API Error:", err); 
    
    let errorMessage = "An unexpected error occurred during signup.";
    let errorDetails = ""; // For more detailed logging on the server

    if (err.message) {
        errorMessage = err.message;
    }
    
    // Capture stack or full error object for server logs
    if (err.stack) {
        errorDetails = err.stack;
    } else if (typeof err === 'object' && err !== null) {
        errorDetails = JSON.stringify(err);
    }
    
    // Specific message if it's a DB connection error from our connectDB function
    if (errorMessage.startsWith("Database connection failed:") || errorMessage === "Server configuration error: MONGODB_URI is not defined.") {
         console.error("Signup API - Database Connection Error Details:", errorDetails || errorMessage);
         return NextResponse.json(
            { message: "Server error: Could not connect to the database. Please try again later.", error: errorMessage }, // Keep client message generic
            { status: 500 }
        );
    }

    // Generic server error for other issues
    console.error("Signup API - Other Error Details:", errorDetails || errorMessage);
    return NextResponse.json(
        { message: "Server error during signup. Please try again later.", error: errorMessage }, // Keep client message generic
        { status: 500 }
    );
  }
};
