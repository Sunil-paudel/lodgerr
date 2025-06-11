
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User"; // Assuming IUser is the default export
import connectDB from "@/utils/db"; // Updated import
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
        if (!credentials?.email || !credentials?.password) {
          console.log("NextAuth: Missing email or password in credentials");
          throw new Error("Please enter both email and password.");
        }
        console.log("NextAuth Authorize: Attempting to connect to DB for user:", credentials.email);
        try {
          await connectDB();
          console.log("NextAuth Authorize: DB connection successful (or already connected).");

          const user = await User.findOne({ email: credentials.email }).lean();

          if (!user) {
            console.log("NextAuth Authorize: No user found with email:", credentials.email);
            throw new Error("No user found with this email.");
          }

          if (!user.passwordHash) {
            console.log("NextAuth Authorize: User account not configured for password login (no passwordHash):", credentials.email);
            throw new Error("User account is not properly configured for password login.");
          }

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordCorrect) {
            console.log("NextAuth Authorize: Incorrect password for email:", credentials.email);
            throw new Error("Invalid password.");
          }

          console.log("NextAuth Authorize: User authenticated successfully:", credentials.email);
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.avatarUrl, // Include avatarUrl as image
            // role: user.role, // Uncomment if you add role to User model and want it in session
          };
        } catch (error: any) {
          console.error("Critical error in NextAuth authorize callback:", error.message);
          console.error("Full error details:", error); 
          // Propagate a user-friendly error or the original one if it's informative
          if (error.message === "Connection failed!") {
             throw new Error("Database connection error. Please try again later.");
          }
          throw new Error(error.message || "Authentication failed due to a server error.");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.user) {
        // When session is updated (e.g. after profile edit)
        token.name = session.user.name;
        token.email = session.user.email;
        token.picture = session.user.image; // NextAuth uses 'picture' for image in token
      }
      if (user) {
        // On sign-in, 'user' is the object returned from 'authorize'
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image; // user.image comes from authorize
        // token.role = user.role; // Uncomment if user has role
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string | null | undefined;
        session.user.email = token.email as string | null | undefined;
        session.user.image = token.picture as string | null | undefined; // 'picture' from JWT becomes 'image' in session
        // session.user.role = token.role as string; // Uncomment if token has role
      }
      return session;
    },
  },
  pages: {
    error: "/login", // Error code passed in query string as ?error=
    signIn: '/login', // Redirect here for sign in if not authenticated
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
