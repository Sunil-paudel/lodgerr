
import type { DefaultSession, User as DefaultAuthUser } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Represents the user object in your session.
   * Extends DefaultSession to include `expires`.
   */
  interface Session {
    user: {
      id: string; // User ID should always be present for an authenticated user
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
    };
    expires: DefaultSession["expires"]; // From DefaultSession
  }

  /**
   * Represents the user object returned by the `authorize` callback
   * or from an OAuth provider.
   */
  interface User extends DefaultAuthUser {
    id: string; // Ensure `id` is part of the User type returned by authorize
    // name, email, image are already part of DefaultAuthUser
    role?: string; // Add custom fields like role
  }
}

declare module "next-auth/jwt" {
  /**
   * Represents the JWT token.
   */
  interface JWT extends DefaultJWT {
    id?: string;
    // name, email, sub are typically part of DefaultJWT
    picture?: string | null; // NextAuth often uses 'picture' for image in JWT
    role?: string;
  }
}
