import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "../../../lib/db";
import { adminUsers, adminRoles } from "../../../lib/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { JWT } from "next-auth/jwt";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // Fetch user - select only needed fields
          const users = await db
            .select({
              id: adminUsers.id,
              name: adminUsers.name,
              email: adminUsers.email,
              password: adminUsers.password,
              roleId: adminUsers.roleId,
              status: adminUsers.status,
            })
            .from(adminUsers)
            .where(eq(adminUsers.email, credentials.email))
            .limit(1);

          const user = users[0];
          if (!user) return null;

          // Check if user is active
          if (user.status !== true) return null;

          // Validate password
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;

          // Fetch role
          const roles = await db
            .select({ name: adminRoles.name })
            .from(adminRoles)
            .where(eq(adminRoles.id, user.roleId))
            .limit(1);

          const role = roles[0]?.name || "user";

          return {
            id: user.id,
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
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
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