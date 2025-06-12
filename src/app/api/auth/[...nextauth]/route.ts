
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User"; // Mongoose User model
import connectDB from "@/utils/db"; // MongoDB connection function
import bcrypt from "bcryptjs"; // For password hashing

// Define NextAuth handler
const handler = NextAuth({
  // Configure authentication providers
  providers: [
    CredentialsProvider({
      id: "credentials", // Unique identifier for the credentials provider
      name: "Credentials", // Display name (for logging or multi-provider UIs)

      // Fields to collect from the user during sign-in
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" },
      },

      // Authorization logic for credentials login
      async authorize(credentials) {
        console.log("[Authorize] Credentials received:", credentials ? { email: credentials.email, password_exists: !!credentials.password } : "null_credentials");

        if (!credentials?.email || !credentials?.password) {
          console.log("[Authorize] Missing email or password.");
          throw new Error("Please enter both email and password.");
        }

        console.log("[Authorize] Connecting to the database...");
        try {
          await connectDB(); // Ensure DB is connected
          console.log("[Authorize] Database connected successfully.");

          // Check if user exists in the database
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            console.log("[Authorize] No user found with email:", credentials.email);
            throw new Error("No user found with this email.");
          }

          if (!user.passwordHash) {
            console.log("[Authorize] Password not configured for user:", credentials.email);
            throw new Error("User account is not properly configured for password login.");
          }

          // Compare passwords using bcrypt
          const isPasswordCorrect = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!isPasswordCorrect) {
            console.log("[Authorize] Incorrect password for:", credentials.email);
            throw new Error("Invalid password.");
          }

          console.log("[Authorize] User authenticated:", credentials.email);

          // Return user object (this becomes part of the JWT/session)
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.avatarUrl, // Optional: URL to user profile picture
            role: user.role,       // Optional: role for access control
          };

        } catch (error: any) {
          console.error("[Authorize] Error (raw):", error);
          console.error("[Authorize] Error message:", error.message);
          console.error("[Authorize] Stack Trace:", error.stack);

          // Check for specific, known error messages first
          if (
            error.message === "No user found with this email." ||
            error.message === "Invalid password." ||
            error.message === "User account is not properly configured for password login." ||
            error.message === "Please enter both email and password."
          ) {
            throw error; // Re-throw the specific, user-friendly error
          }
          
          // Check for database connection or configuration issues
          if (error.message.includes("Database connection failed:") ||
              error.message.includes("Server configuration error: MONGODB_URI is not defined.")) {
            throw new Error("Database connection error. Please try again later.");
          }
          
          // For any other errors, throw a generic one to avoid leaking details
          throw new Error("Authentication failed due to an unexpected server issue. Please try again.");
        }
      },
    }),
  ],

  // Use JWT tokens for session management
  session: {
    strategy: "jwt",
  },

  // JWT callback is triggered during sign-in and on session updates
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      try {
        // On session update, update the token values
        if (trigger === "update" && session?.user) {
          token.name = session.user.name;
          token.email = session.user.email;
          token.picture = session.user.image;
          token.role = session.user.role;
        }

        // On initial sign-in, attach user data to token
        if (user) {
          token.id = user.id;
          token.name = user.name;
          token.email = user.email;
          token.picture = user.image;
          token.role = user.role;
        }
      } catch (error: any) {
        console.error("[JWT Callback] Error:", error.message);
      }

      return token;
    },

    // Session callback builds the session object available on the client
    async session({ session, token }) {
      try {
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.name = token.name as string | null | undefined;
          session.user.email = token.email as string | null | undefined;
          session.user.image = token.picture as string | null | undefined;
          session.user.role = token.role as string | null | undefined;
        }
      } catch (error: any) {
        console.error("[Session Callback] Error:", error.message);
      }

      return session;
    },
  },

  // Custom page routes
  pages: {
    signIn: "/login", // Sign-in page
    error: "/login",  // Redirect errors to login with error query
  },

  // Secret used to sign the JWT (must be set in .env.local)
  secret: process.env.NEXTAUTH_SECRET // Removed trailing comma here
};

// Export handlers for GET and POST requests
export { handler as GET, handler as POST };
