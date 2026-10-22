import Credentials from "next-auth/providers/credentials";
import { localMode, localRequest } from "@/lib/local-mode";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/client";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/db/schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google, ...(localMode() ? [Credentials({
    id: "local", name: "本机体验", credentials: {},
    async authorize(_credentials, request) {
      if (!localRequest(request)) return null;
      await db.insert(users).values({ id: "local-owner", name: "我的健身管家", locale: "en" }).onConflictDoNothing();
      const [user] = await db.select().from(users).where(eq(users.id, "local-owner"));
      return user ?? null;
    },
  })] : [])],
  session: { strategy: localMode() ? "jwt" : "database" },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id = user?.id ?? token?.sub ?? "";
      }
      return session;
    },
  },
});
