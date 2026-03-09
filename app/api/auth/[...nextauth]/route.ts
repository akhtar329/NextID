// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "../../../lib/db";
import { adminUsers, adminRoles } from "../../../lib/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<"email" | "password", string> | undefined) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // Fetch user by email
          const user = await db
            .select()
            .from(adminUsers)
            .where(eq(adminUsers.email, credentials.email))
            .limit(1)
            .execute()
            .then(res => res[0]);

          if (!user) return null;

          // Validate password
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;

          // Fetch role
          const role = await db
            .select({ name: adminRoles.name })
            .from(adminRoles)
            .where(eq(adminRoles.id, user.roleId))
            .limit(1)
            .execute()
            .then(res => res[0]?.name || "user");

          return {
            id: user.id, // number
            name: user.name,
            email: user.email,
            role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/error",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
