
import NextAuth, { type NextAuthOptions, type User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connect from '@/utils/db';
import User from '@/models/User'; // Assuming your Mongoose User model
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            // console.error("Authorize error: Missing credentials");
            // Returning null signals to NextAuth that authentication failed.
            // It will typically result in a generic sign-in error on the client.
            return null;
          }

          await connect(); // Attempt to connect to the database

          const user = await User.findOne({ email: credentials.email }).lean();

          if (!user) {
            // console.error("Authorize error: No user found with this email.");
            return null;
          }

          if (!user.passwordHash) { // Ensure you're checking passwordHash as per your schema
            // console.error("Authorize error: User account is not set up for password login (missing passwordHash).");
            return null;
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!isValidPassword) {
            // console.error("Authorize error: Incorrect password.");
            return null;
          }

          // If all checks pass, return the user object
          // Ensure the returned object matches what NextAuth expects or what you've defined in your types
          return {
            id: user._id.toString(), // Mongoose _id needs to be converted to string
            name: user.name,
            email: user.email,
            image: user.avatarUrl, // Assuming avatarUrl is the field for user images
          };

        } catch (error: any) {
          // Log any unexpected errors during the authorization process
          console.error("Critical error in NextAuth authorize callback:", error.message);
          // console.error("Error stack:", error.stack);

          // Return null to indicate authentication failure.
          // This ensures NextAuth handles the error gracefully and returns JSON.
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login', // Redirect users to /login if they need to sign in
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist the user ID and any other custom properties to the token
      if (user) {
        token.id = user.id;
        // token.role = (user as any).role; // Example if you add role
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like user ID and role
      if (session.user && token.id) {
        session.user.id = token.id as string;
        // session.user.role = token.role as string; // Example if you add role
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  // NEXTAUTH_URL is usually picked up automatically, but ensure it's correct in .env.local for development
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
