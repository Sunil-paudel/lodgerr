
'use server';
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

          if (!user.passwordHash) {
            // console.error("Authorize error: User account is not set up for password login (missing passwordHash).");
            return null;
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!isValidPassword) {
            // console.error("Authorize error: Incorrect password.");
            return null;
          }

          // If all checks pass, return the user object
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.avatarUrl,
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
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  // NEXTAUTH_URL is usually picked up automatically, but ensure it's correct in .env.local for development
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
