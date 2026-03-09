// types/next-auth.d.ts
import "next-auth";

declare module "next-auth" {
  interface User {
    id: number;
    role?: string;  // Optional banao
    roles?: string[];
    primaryRole?: string;
  }
  
  interface Session {
    user: {
      id: number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles?: string[];
      primaryRole?: string;
      role?: string;
    } & DefaultSession["user"];
  }
}