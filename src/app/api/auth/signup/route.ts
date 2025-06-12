
import User from "@/models/User";
import connectDB from "@/utils/db";
import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { sendEmail } from "@/utils/mailer"; // Import the sendEmail utility

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

    // Send welcome email
    // Avoid sending emails in a test environment if SMTP isn't set up or if you want to skip them
    if (process.env.NODE_ENV !== 'test_skip_email') { 
      const { success: emailSent, error: emailError } = await sendEmail({
        to: newUser.email,
        subject: "Welcome to Lodger!",
        text: `Hi ${newUser.name},\n\nWelcome to Lodger! We're excited to have you join our community.\n\nStart exploring unique stays or list your own property today.\n\nIf you have any questions, feel free to reach out to our support team.\n\nBest regards,\nThe Lodger Team`,
        // Example HTML content (optional)
        // html: `
        //   <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        //     <h1 style="color: #333;">Welcome to Lodger, ${newUser.name}!</h1>
        //     <p>We're thrilled to have you join our community.</p>
        //     <p>With Lodger, you can discover unique places to stay and unforgettable experiences. Whether you're planning your next vacation or looking to share your own space, we've got you covered.</p>
        //     <p>Here are a few things you can do to get started:</p>
        //     <ul>
        //       <li><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}" style="color: #007bff; text-decoration: none;">Browse Properties</a></li>
        //       <li><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/list-property" style="color: #007bff; text-decoration: none;">List Your Property</a></li>
        //       <li><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/dashboard" style="color: #007bff; text-decoration: none;">Visit Your Dashboard</a></li>
        //     </ul>
        //     <p>If you have any questions, don't hesitate to contact our support team.</p>
        //     <p>Best regards,<br/>The Lodger Team</p>
        //     <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
        //     <p style="font-size: 0.9em; color: #777;">You're receiving this email because you signed up for Lodger.</p>
        //   </div>
        // `
      });
      if (!emailSent) {
        console.warn(`[Signup API] Welcome email failed to send to ${newUser.email}. Error: ${emailError}`);
        // Do not fail the signup process if email sending fails, just log it.
        // You might want to add more robust error handling or a retry mechanism in a production app.
      } else {
        console.log(`[Signup API] Welcome email successfully sent to ${newUser.email}`);
      }
    }


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
