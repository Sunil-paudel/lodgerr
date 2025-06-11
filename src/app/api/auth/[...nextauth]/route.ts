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
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing email or password.');
        }

        await connect();

        const user = await User.findOne({ email: credentials.email }).lean();

        if (!user) {
          throw new Error('No user found with this email.');
        }

        if (!user.passwordHash) {
            throw new Error('User account is not set up for password login.');
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValidPassword) {
          throw new Error('Incorrect password.');
        }

        // Return an object that NextAuth.js can use for the session/token
        // Ensure this matches the structure expected or defined in next-auth.d.ts
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.avatarUrl, // Or any other field you want for image
          // role: user.role, // If you have roles and want them in the token
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt', // Using JWT for session strategy
  },
  pages: {
    signIn: '/login', // Redirect to your custom login page
    // error: '/login', // Optionally, redirect to login page on error
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist the user ID and other custom properties to the token
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
      }
      // if (session.user && token.role) {
      //   (session.user as any).role = token.role; // Example if you add role
      // }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
