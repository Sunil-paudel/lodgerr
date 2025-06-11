
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import User from "@/models/User"; // Assuming IUser is the Mongoose document type
import connect from "@/utils/db"; // Your database connection utility

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("NextAuth: Missing email or password in credentials");
          throw new Error("Please enter both email and password.");
        }
        
        console.log("NextAuth Authorize: Attempting to authorize user:", credentials.email);
        try {
          await connect(); // Ensure DB connection
          console.log("NextAuth Authorize: DB connection successful (or already connected).");

          const user = await User.findOne({ email: credentials.email }).lean();

          if (!user) {
            console.log("NextAuth Authorize: No user found with email:", credentials.email);
            throw new Error("No user found with this email.");
          }

          if (!user.passwordHash) {
            console.error("NextAuth Authorize: User found but passwordHash is missing for user:", credentials.email);
            throw new Error("User account is not properly configured for password login.");
          }
          
          console.log("NextAuth Authorize: Comparing password for user:", credentials.email);
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!isValid) {
            console.log("NextAuth Authorize: Invalid password for user:", credentials.email);
            throw new Error("Invalid password.");
          }

          console.log("NextAuth Authorize: Credentials valid for user:", credentials.email);
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            // role: user.role, // Uncomment if you add role to your User model and want it in the token
          };
        } catch (error: any) {
          // Log the specific error that occurred during authorization
          console.error(`Critical error in NextAuth authorize callback for ${credentials.email}:`, error.message);
          console.error("Full error object in authorize:", error);

          // Re-throw specific errors or a generic one for NextAuth to handle
          if (error.message?.startsWith("Database connection failed:") || 
              error.message === "Server configuration error: MONGODB_URI is not defined." ||
              error.message === "No user found with this email." ||
              error.message === "Invalid password." ||
              error.message === "User account is not properly configured for password login." ||
              error.message === "Please enter both email and password.") {
            throw error; // Re-throw known/specific errors
          }
          // For other unexpected errors, throw a generic message
          throw new Error("Authentication failed due to a server issue. Please check server logs.");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // The 'user' object is available here only on sign-in/sign-up
      if (user) {
        token.id = user.id; // 'user.id' comes from the object returned by 'authorize'
        // token.role = user.role; // Add other properties from 'user' to token if needed
      }
      return token;
    },
    async session({ session, token }) {
      // 'token' contains the data from the 'jwt' callback
      if (token && session.user) {
        session.user.id = token.id as string; // Ensure type casting if necessary
        // session.user.role = token.role as string; // Add to session if needed
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET, // Essential for JWT signing
  // debug: process.env.NODE_ENV === 'development', // Optional: more verbose logs in dev
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
