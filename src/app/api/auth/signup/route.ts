
import { NextResponse, type NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
// IMPORTANT: Password hashing (e.g., with bcryptjs) should be added here for security.

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { fullName, email, password } = await request.json();

    if (!fullName || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields: fullName, email, and password.' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 }); // 409 Conflict
    }

    // TODO: Hash the password securely before saving
    // For now, storing password directly as passwordHash for demonstration.
    // This is NOT secure for production.
    const newUser = new User({
      name: fullName,
      email,
      passwordHash: password, // Replace with hashed password
      role: 'guest', // Default role
    });

    await newUser.save();

    return NextResponse.json({ message: 'User created successfully!', userId: newUser._id }, { status: 201 });
  } catch (error) {
    console.error('Signup API error:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Server error during signup.', error: errorMessage }, { status: 500 });
  }
}
