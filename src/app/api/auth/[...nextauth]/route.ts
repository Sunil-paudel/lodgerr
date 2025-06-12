
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import connectDB from "@/utils/db";         // MongoDB connection utility
import User from "@/models/User";           // Mongoose User model

export const authOptions: NextAuthOptions = {
  // === Authentication Providers ===
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",

      // Fields for sign-in formx
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" },
      },

      // Core login logic
      async authorize(credentials) {
        console.log("[Authorize] Credentials received:", credentials ? { email: credentials.email, password_exists: !!credentials.password } : "null_credentials");

        // Validate input
        if (!credentials?.email || !credentials?.password) {
          console.log("[Authorize] Missing email or password.");
          throw new Error("Please enter both email and password.");
        }

        try {
          console.log("[Authorize] Connecting to DB...");
          await connectDB();
          console.log("[Authorize] DB connection successful.");

          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            console.log("[Authorize] No user found with email:", credentials.email);
            throw new Error("No user found with this email.");
          }

          if (!user.passwordHash) {
            console.log("[Authorize] User has no password set:", credentials.email);
            throw new Error("User account is not properly configured for password login.");
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValidPassword) {
            console.log("[Authorize] Incorrect password for:", credentials.email);
            throw new Error("Invalid password.");
          }

          // Success: Return user data matching the `User` interface in next-auth.d.ts
          console.log("[Authorize] Login success for user:", user._id.toString(), user.email);
          return {
            id: user._id.toString(), // Mongoose _id to string
            name: user.name,
            email: user.email,
            image: user.avatarUrl, // This will map to DefaultAuthUser's `image`
            role: user.role,
          };
        } catch (error: any) {
          console.error("[Authorize] Unexpected error:", error.message, error.stack);

          // Re-throw specific known errors for NextAuth to handle and potentially display to user
          if (
            [
              "No user found with this email.",
              "Invalid password.",
              "User account is not properly configured for password login.",
              "Please enter both email and password.",
            ].includes(error.message) || error.message.startsWith("Database connection failed:") || error.message.startsWith("Server configuration error:")
          ) {
            throw error;
          }
          // For other unexpected errors, throw a generic message
          throw new Error("Authentication failed due to an unexpected server issue. Please try again.");
        }
      },
    }),
  ],

  // === Session Configuration ===
  session: {
    strategy: "jwt", // Use JWT tokens instead of DB sessions
  },

  // === Callback Functions ===
  callbacks: {
    // Modify JWT on login or session update
    async jwt({ token, user, trigger, session: newSessionData }) { // Renamed `session` to `newSessionData` to avoid conflict
      // On initial sign in, the `user` object from `authorize` is available
      if (user) {
        console.log("[JWT Callback] Initial user object from authorize:", user);
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image; // `user.image` from authorize maps to `token.picture`
        token.role = user.role;
      }

      // Handle session updates (e.g., user updates profile)
      if (trigger === "update" && newSessionData?.user) {
        console.log("[JWT Callback] Updating token from session update data:", newSessionData.user);
        token.name = newSessionData.user.name;
        token.email = newSessionData.user.email;
        token.picture = newSessionData.user.image;
        token.role = newSessionData.user.role;
      }
      console.log("[JWT Callback] Token before returning:", token);
      return token;
    },

    // Attach token data to session for use on client side
    async session({ session, token }) {
      console.log("[Session Callback] Token received:", token);
      if (token) {
        // Ensure session.user exists and is structured according to `next-auth.d.ts`
        session.user = {
          id: token.id as string,
          name: token.name,
          email: token.email,
          image: token.picture, // Map token.picture (from JWT) to session.user.image
          role: token.role as string | undefined,
        };
      }
      console.log("[Session Callback] Session user before returning:", session.user);
      return session;
    },
  },

  // === Custom Auth Pages ===
  pages: {
    signIn: "/login",
    error: "/login", // Errors will append ?error= to the URL
  },

  // === Secret for signing JWT ===
  secret: process.env.NEXTAUTH_SECRET
};

// Export for Next.js API routes
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
