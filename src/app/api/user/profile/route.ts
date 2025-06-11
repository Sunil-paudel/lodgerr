
import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as necessary
import connectDB from "@/utils/db";
import User from "@/models/User"; // Assuming IUser is the default export
import * as z from "zod";

const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name cannot exceed 50 characters.").optional(),
  email: z.string().email("Invalid email address.").optional(),
  avatarUrl: z.string().url("Invalid URL for avatar.").or(z.literal("")).optional(), // Allow empty string to clear avatar
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const parsedBody = profileUpdateSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ message: "Invalid input.", errors: parsedBody.error.format() }, { status: 400 });
    }

    const { name, email, avatarUrl } = parsedBody.data;

    // Construct update object with only provided fields
    const updateData: { name?: string; email?: string; avatarUrl?: string } = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    
    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: "No fields to update." }, { status: 400 });
    }

    await connectDB();

    // If email is being changed, check if it's already taken by another user
    if (email && email !== session.user.email) {
        const existingUserWithEmail = await User.findOne({ email: email, _id: { $ne: userId } });
        if (existingUserWithEmail) {
            return NextResponse.json({ message: "Email already in use by another account." }, { status: 409 });
        }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true, lean: true  } // lean to get plain JS object
    ).select('-passwordHash'); // Exclude passwordHash from the returned document

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found or update failed." }, { status: 404 });
    }
    
    // The 'updatedUser' here is from the database.
    // The session update will happen client-side using `updateSession` from `useSession`
    // by passing the relevant fields (name, email, avatarUrl).
    return NextResponse.json({ 
        message: "Profile updated successfully", 
        updatedUser: { // Send back the fields needed for session update
            name: updatedUser.name,
            email: updatedUser.email,
            avatarUrl: updatedUser.avatarUrl
        }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error updating profile:", error);
    // Check for MongoDB duplicate key error for email (though handled above, good as a fallback)
    if (error.code === 11000 && error.keyPattern?.email) {
        return NextResponse.json({ message: "Email already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Server error during profile update.", error: error.message }, { status: 500 });
  }
}
