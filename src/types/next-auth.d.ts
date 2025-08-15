import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name?: string;
    suburb: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      suburb: string;
    };
    needsProfileCompletion?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    suburb: string;
    needsProfileCompletion?: boolean;
  }
} 