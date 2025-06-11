
import type { DefaultSession, DefaultUser, User as DefaultAuthUser } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user?: {
      id?: string | null;
      name?: string | null; // Ensure name is part of session user
      email?: string | null; // Ensure email is part of session user
      image?: string | null; // Ensure image is part of session user
      role?: string | null; // Example: Add role if you use it
    } & DefaultSession["user"];
  }

  interface User extends DefaultAuthUser {
    id: string;
    // name, email, image are already part of DefaultAuthUser
    // but you can override or extend if needed.
    // The object returned by `authorize` must match this structure.
    // For example, if authorize returns `avatarUrl`, you'd add it here
    // and then map it to `image` in the jwt callback.
    // For simplicity, we ensure `authorize` returns an `image` field.
    role?: string; // Example
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    picture?: string | null; // NextAuth typically uses 'picture' for image in JWT
    role?: string; // Example
    // name and email are typically part of DefaultJWT (sub, name, email)
  }
}
