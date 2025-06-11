import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User";
import connectDB from "@/utils/db"; // Changed from connect to connectDB
import bcrypt from "bcryptjs";
import type { DefaultSession, User as NextAuthUser } from "next-auth"; // Keep existing imports

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("NextAuth: Missing email or password in credentials");
          throw new Error("Please enter both email and password.");
        }
        console.log("NextAuth Authorize: Attempting to connect to DB for user:", credentials.email);
        try {
          await connectDB(); // Changed from connect() to connectDB()
          console.log("NextAuth Authorize: DB connection successful (or already connected).");

          const user = await User.findOne({ email: credentials.email }).lean(); // .lean() is good for performance here

          if (!user) {
            console.log("NextAuth Authorize: No user found with email:", credentials.email);
            throw new Error("No user found with this email.");
          }

          if (!user.passwordHash) {
            console.log("NextAuth Authorize: User account not configured for password login (missing passwordHash):", credentials.email);
            throw new Error("User account is not properly configured for password login.");
          }

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordCorrect) {
            console.log("NextAuth Authorize: Incorrect password for user:", credentials.email);
            throw new Error("Invalid password.");
          }

          console.log("NextAuth Authorize: Credentials valid for user:", credentials.email);
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            // role: user.role, // Uncomment if you add role to your User model and want it in the token
          } as NextAuthUser; // Cast to NextAuthUser type

        } catch (error: any) {
          console.error("Critical error in NextAuth authorize callback:", error.message);
          // Log the full error for server-side debugging, but don't expose detailed errors to the client.
          // The error message thrown here will be sent to the client.
          if (error.message.startsWith("Database connection failed:")) {
             throw new Error("Database connection error. Please try again later.");
          }
          if (error.message === "No user found with this email." || error.message === "Invalid password.") {
            throw error; // Re-throw specific known errors
          }
          // For other errors, throw a generic message to avoid exposing internal details
          throw new Error("An internal server error occurred during authentication.");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) { // user object is available during sign-in
        token.id = user.id;
        // token.name = user.name; // Already included by default if available
        // token.email = user.email; // Already included by default if available
        // token.role = (user as any).role; // Add custom properties like role if they exist on your user object
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        // session.user.name = token.name as string; // Already included by default
        // session.user.email = token.email as string; // Already included by default
        // session.user.role = token.role as string; // Add custom properties
      }
      return session;
    },
  },
  pages: {
    error: "/login", // Error code passed in query string as ?error=
    // signIn: '/login', // Can specify if your login page is different, default is /api/auth/signin
  },
  secret: process.env.NEXTAUTH_SECRET,
  // debug: process.env.NODE_ENV === 'development', // Enable debug logs in development
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
