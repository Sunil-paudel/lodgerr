
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User"; 
import connectDB from "@/utils/db"; 
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[NextAuth Authorize] Processing credentials for:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log("[NextAuth Authorize] Missing email or password in credentials");
          throw new Error("Please enter both email and password.");
        }
        
        try {
          console.log("[NextAuth Authorize] Attempting DB connection for user:", credentials.email);
          await connectDB();
          console.log("[NextAuth Authorize] DB connection successful (or already connected).");

          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            console.log("[NextAuth Authorize] No user found with email:", credentials.email);
            throw new Error("No user found with this email.");
          }
          console.log("[NextAuth Authorize] User found:", user.email);

          if (!user.passwordHash) {
            console.log("[NextAuth Authorize] User account not configured for password login (no passwordHash):", credentials.email);
            throw new Error("User account is not properly configured for password login.");
          }

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordCorrect) {
            console.log("[NextAuth Authorize] Incorrect password for email:", credentials.email);
            throw new Error("Invalid password.");
          }

          const userToReturn = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.avatarUrl, 
            role: user.role,
          };
          console.log("[NextAuth Authorize] User authenticated successfully, returning:", userToReturn);
          return userToReturn;

        } catch (error: any) {
          console.error("[NextAuth Authorize] Critical error in authorize callback:", error.message);
          console.error("[NextAuth Authorize] Full error details:", error); 
          
          if (error.message && (error.message === "Connection failed!" || error.message.startsWith("Database connection failed:"))) {
             throw new Error("Database connection error. Please try again later.");
          }
          // Ensure we always throw an actual Error object for NextAuth to handle
          if (error instanceof Error) {
            throw error; // Re-throw the original error if it's already an Error instance
          } else {
            throw new Error(String(error) || "Authentication failed due to an unknown server error.");
          }
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      try {
        // console.log("[NextAuth JWT] Invoked. Trigger:", trigger, "User:", user ? user.id : 'No user', "Token:", token);
        if (trigger === "update" && session?.user) {
          console.log("[NextAuth JWT] Updating token from session update");
          token.name = session.user.name;
          token.email = session.user.email;
          token.picture = session.user.image; 
          token.role = session.user.role;
        }
        if (user) { // This `user` object comes from the `authorize` callback on initial sign-in
          console.log("[NextAuth JWT] Populating token from user object (initial sign-in)");
          token.id = user.id;
          token.name = user.name;
          token.email = user.email;
          token.picture = user.image; 
          token.role = user.role;
        }
        // console.log("[NextAuth JWT] Returning token:", token);
        return token;
      } catch (e: any) {
        console.error("[NextAuth JWT] Error in JWT callback:", e.message, e);
        // It's better to throw an error here and let NextAuth handle it,
        // which might result in a generic error on the client but avoids malformed tokens/sessions.
        throw new Error("Error processing JWT. Please try again.");
      }
    },
    async session({ session, token }) {
      try {
        // console.log("[NextAuth Session] Invoked. Token:", token, "Session:", session);
        if (token && session.user) { 
          session.user.id = token.id as string;
          session.user.name = token.name as string | null | undefined;
          session.user.email = token.email as string | null | undefined;
          session.user.image = token.picture as string | null | undefined; 
          session.user.role = token.role as string | null | undefined; 
        }
        // console.log("[NextAuth Session] Returning session:", session);
        return session;
      } catch (e: any) {
        console.error("[NextAuth Session] Error in session callback:", e.message, e);
        throw new Error("Error constructing session. Please try again.");
      }
    },
  },
  pages: {
    error: "/login", 
    signIn: '/login', 
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
