
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
      passwordHash: hashedPassword, // Ensure this matches your User model schema field name
      role: 'guest', // Default role
    });

    await newUser.save();

    // Configure nodemailer transporter
    // Ensure GOOGLE_EMAIL and GOOGLE_PASSWORD are set in .env.local
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
      text: `Thank you for registering on Lodger, ${fullName}! Your registration is successful. If you have not applied for registration please visit http://localhost:3000/contact to contact us.`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Confirmation email sent to:", email);
      return NextResponse.json(
        { message: "User has been created, and confirmation email sent" },
        { status: 201 }
      );
    } catch (emailError: any) {
      console.error("Failed to send confirmation email:", emailError);
      // User was created, but email failed.
      return NextResponse.json(
        { message: "User created, but confirmation email could not be sent.", errorDetails: emailError.message },
        { status: 201 } // Still 201 as user was created, or use a different status like 207 Multi-Status if preferred
      );
    }

  } catch (err: any) {
    console.error("Signup API Error:", err); // This will log the full error object on the server
    // The err.message here will be "Connection failed!" if that's what db.ts threw
    return NextResponse.json(
        { message: err.message || "An unexpected error occurred during signup." },
        { status: 500 }
    );
  }
};
