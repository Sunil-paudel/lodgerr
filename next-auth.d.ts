import type { DefaultSession, DefaultUser, User as DefaultAuthUser } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user?: {
      id?: string | null;
      // Add other custom properties for user in session, e.g.
      // role?: string | null;
    } & DefaultSession["user"]; // Keep existing properties like name, email, image
  }

  // This User type is what's returned by the `authorize` callback
  // and used in the `jwt` callback `user` parameter.
  interface User extends DefaultAuthUser {
    id: string; // Ensure id is always string
    // Add other custom properties for the user object, e.g.
    // role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    // Add other custom properties for the token, e.g.
    // role?: string;
  }
}
