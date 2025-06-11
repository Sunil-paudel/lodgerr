
import User from "@/models/User";
import connect from "@/utils/db";
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

    await connect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 5);

    const newUser = new User({
      name: fullName,
      email,
      password: hashedPassword, // Changed from passwordHash to password
      // role: 'guest', // Role is not defined in the User model, so commenting out for now
    });

    await newUser.save();

    // Sending confirmation email (optional, consider environment variables for credentials)
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
      // Decide if user creation should fail if email fails. For now, it doesn't.
    }

    return NextResponse.json(
      { message: "User created successfully. Confirmation email sent." },
      { status: 201 }
    );

  } catch (err: any) {
    console.error("Signup API Error:", err); 
    const errorMessage = err.message || "An unexpected error occurred during signup.";
    let errorDetails = "";
    if (err.stack) {
        errorDetails = err.stack;
    } else if (typeof err === 'object' && err !== null) {
        errorDetails = JSON.stringify(err);
    }
    
    // Specific check for "Connection failed!" from db.ts
    if (errorMessage === "Connection failed!") {
         return NextResponse.json(
            { message: "Server error during signup.", error: "Connection failed!", details: err.stack || "No stack available." },
            { status: 500 }
        );
    }

    return NextResponse.json(
        { message: "Server error during signup.", error: errorMessage, details: errorDetails },
        { status: 500 }
    );
  }
};
