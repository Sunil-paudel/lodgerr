import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User";
import connectDB from "@/utils/db"; // This import should now correctly find connectDB
import bcrypt from "bcryptjs";


export const authOptions: NextAuthOptions = {
 providers: [
   CredentialsProvider({
     name: "Credentials", // This name is fine, it's for display purposes if you have multiple providers
     credentials: {
       email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
       password: { label: "Password", type: "password" },
     },
     async authorize(credentials) {
       console.log("[NextAuth Authorize] Entered authorize callback with credentials:", credentials ? { email: credentials.email, password_exists: !!credentials.password } : "null_credentials");

       if (!credentials?.email || !credentials?.password) {
         console.log("[NextAuth Authorize] Missing email or password in credentials.");
         throw new Error("Please enter both email and password.");
       }
       
       console.log("[NextAuth Authorize] Attempting DB connection for user:", credentials.email);
       try {
         await connectDB(); // This should now correctly call the renamed function
         console.log("[NextAuth Authorize] DB connection successful (or already connected).");

         const user = await User.findOne({ email: credentials.email });

         if (!user) {
           console.log("[NextAuth Authorize] No user found with email:", credentials.email);
           throw new Error("No user found with this email.");
         }

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

         console.log("[NextAuth Authorize] User authenticated successfully:", credentials.email, "User ID:", user._id.toString());
         // Ensure the returned object matches the User interface expected by NextAuth
         return {
           id: user._id.toString(), // Mongoose _id
           name: user.name,
           email: user.email,
           image: user.avatarUrl, // Map avatarUrl to image
           role: user.role,
         };
       } catch (error: any) {
         console.error("[NextAuth Authorize] Error during authorization process:", error.message);
         console.error("[NextAuth Authorize] Full error details:", error);

         // Check for specific error messages to pass them through cleanly
         // These are messages that are already user-friendly or indicative of the problem.
         if (error.message && (
             error.message.startsWith("Database connection failed:") ||
             error.message.startsWith("Server configuration error:") ||
             error.message === "No user found with this email." ||
             error.message === "Invalid password." ||
             error.message === "User account is not properly configured for password login." ||
             error.message === "Please enter both email and password."
            )) {
            throw error; // Re-throw the original Error object
         }

         // For other, unexpected errors, provide a generic message.
         throw new Error("Authentication failed due to an unexpected server issue. Please try again.");
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
        if (trigger === "update" && session?.user) {
            token.name = session.user.name;
            token.email = session.user.email;
            token.picture = session.user.image;
            token.role = session.user.role; 
        }
        // If user object exists (it's passed on initial sign in)
        if (user) {
            token.id = user.id;
            token.name = user.name;
            token.email = user.email;
            token.picture = user.image; // 'image' from authorize becomes 'picture' in JWT
            token.role = user.role;
        }
     } catch (error: any) {
        console.error("[NextAuth JWT Callback] Error:", error.message, error.stack);
        // Decide if you want to throw or handle, for now, just log and return token to prevent breaking session
     }
     return token;
   },
   async session({ session, token }) {
     try {
        if (token && session.user) { 
            session.user.id = token.id as string;
            session.user.name = token.name as string | null | undefined;
            session.user.email = token.email as string | null | undefined;
            session.user.image = token.picture as string | null | undefined; // 'picture' from JWT becomes 'image' in session
            session.user.role = token.role as string | null | undefined; 
        }
     } catch (error: any) {
        console.error("[NextAuth Session Callback] Error:", error.message, error.stack);
        // Decide if you want to throw or handle, for now, just log and return session
     }
     return session;
   },
 },
 pages: {
   error: "/login", // Error code passed in query string as ?error=
   signIn: '/login', // Redirect here for sign in
 },
 secret: process.env.NEXTAUTH_SECRET, // Make sure this is set in your .env.local
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };