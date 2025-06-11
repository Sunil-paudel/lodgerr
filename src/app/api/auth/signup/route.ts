
import User from "@/models/User";
import connect from "@/utils/db"; 
import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import nodemailer from "nodemailer";

export const POST = async (request: NextRequest) => {
  try {
    const { fullName, email, password } = await request.json();

    if (!fullName || !email || !password) {
      return new NextResponse("Missing required fields: fullName, email, and password.", { status: 400 });
    }

    await connect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return new NextResponse("User with this email already exists", {
        status: 409, // 409 Conflict is more appropriate
      });
    }

    const hashedPassword = await bcrypt.hash(password, 5); // Using salt 5 as per your example

    const newUser = new User({
      name: fullName, // Mapping fullName from request to 'name' in User model
      email,
      passwordHash: hashedPassword, // Saving to passwordHash field in User model
      role: 'guest', // Default role
    });

    await newUser.save();

    // Configure nodemailer transporter
    // Ensure GOOGLE_EMAIL and GOOGLE_PASSWORD are set in .env.local
    // For Gmail, you might need to enable "less secure app access" or use an App Password.
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
      // You can also use HTML content:
      // html: `<h1>Welcome, ${fullName}!</h1><p>Thank you for registering on Lodger.</p>`
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Confirmation email sent to:", email);
      return new NextResponse("User has been created, and confirmation email sent", {
        status: 201,
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // User was created, but email failed. Still return 201 but log the email error.
      // Or, you could have a more complex error handling here if email is critical.
      return new NextResponse("User created, but confirmation email could not be sent.", {
        status: 201, 
        // Consider a different status or message if email failure is a major issue
      });
    }

  } catch (err: any) { // Catch any other errors
    console.error("Signup API Error:", err);
    return new NextResponse(err.message || "An unexpected error occurred during signup.", {
      status: 500,
    });
  }
};
