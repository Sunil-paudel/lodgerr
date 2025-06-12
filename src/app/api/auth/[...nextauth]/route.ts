
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

      // Fields for sign-in form
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

          // Success: Return user data
          console.log("[Authorize] Login success:", credentials.email);
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.avatarUrl,
            role: user.role,
          };
        } catch (error: any) {
          console.error("[Authorize] Unexpected error:", error.message);

          if (
            [
              "No user found with this email.",
              "Invalid password.",
              "User account is not properly configured for password login.",
              "Please enter both email and password.",
              "Database connection failed: MongoDB connection failed: querySrv ENOTFOUND _mongodb._tcp.cluster0.dlua3bq.mongodb.net",
              "Server configuration error: MONGODB_URI is not defined."
            ].includes(error.message) || error.message.startsWith("Database connection failed:")
          ) {
            throw error; // Re-throw specific, known errors
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
    async jwt({ token, user, trigger, session }) {
      try {
        if (trigger === "update" && session?.user) {
          token.name = session.user.name;
          token.email = session.user.email;
          token.picture = session.user.image;
          token.role = session.user.role;
        }

        if (user) { // user object is available on initial sign in
          token.id = user.id;
          token.name = user.name;
          token.email = user.email;
          token.picture = user.image;
          token.role = user.role;
        }
      } catch (error: any) {
        console.error("[JWT Callback] Error:", error.message);
        // Do not throw here, but ensure token is still returned
      }
      return token;
    },

    // Attach token data to session for use on client side
    async session({ session, token }) {
      try {
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.name = token.name;
          session.user.email = token.email;
          session.user.image = token.picture;
          session.user.role = token.role as string | null | undefined;
        }
      } catch (error: any) {
        console.error("[Session Callback] Error:", error.message);
        // Do not throw here, but ensure session is still returned
      }
      return session;
    },
  },

  // === Custom Auth Pages ===
  pages: {
    signIn: "/login",
    error: "/login", // Errors will append ?error= to the URL
  },

  // === Secret for signing JWT ===
  secret: process.env.NEXTAUTH_SECRET // Removed trailing comma here
};

// Export for Next.js API routes
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
