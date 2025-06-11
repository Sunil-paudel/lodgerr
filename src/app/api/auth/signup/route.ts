
import { NextResponse, type NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
// IMPORTANT: Password hashing (e.g., with bcryptjs) should be added here for security.

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    console.log("Database connected successfully for signup.");

    const { fullName, email, password } = await request.json();
    console.log("Signup request received for:", { fullName, email });

    if (!fullName || !email || !password) {
      console.log("Missing required fields");
      return NextResponse.json({ message: 'Missing required fields: fullName, email, and password.' }, { status: 400 });
    }

    // Check if user already exists
    console.log(`Checking if user exists with email: ${email}`);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User with email ${email} already exists.`);
      return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 }); // 409 Conflict
    }
    console.log(`User with email ${email} does not exist. Proceeding to create.`);

    // TODO: Hash the password securely before saving
    // For now, storing password directly as passwordHash for demonstration.
    // This is NOT secure for production.
    const newUser = new User({
      name: fullName,
      email,
      passwordHash: password, // Replace with hashed password
      role: 'guest', // Default role
    });

    console.log("Attempting to save new user:", newUser.email);
    await newUser.save();
    console.log("User saved successfully:", newUser.email, "ID:", newUser._id);

    return NextResponse.json({ message: 'User created successfully!', userId: newUser._id }, { status: 201 });
  } catch (error) {
    console.error('Signup API error:', error); // Log the full error object
    let errorMessage = 'An unexpected error occurred during signup.';
    let errorDetails = 'No additional details.';
    if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = error.stack || 'No stack trace available.';
    } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
    } else {
        errorMessage = String(error);
    }
    return NextResponse.json({ 
        message: 'Server error during signup.', 
        error: errorMessage,
        details: errorDetails // Optionally send stack in dev, remove for prod
    }, { status: 500 });
  }
}
