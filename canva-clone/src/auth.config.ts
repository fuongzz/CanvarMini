import { z } from "zod";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import { eq } from "drizzle-orm";
import { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

import { db } from "@/db/drizzle";
import { users } from "@/db/schema";

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

declare module "next-auth/jwt" {
  interface JWT {
    id: string | undefined;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string | undefined;
  }
}

const DEMO_ACCOUNTS = [
  { email: "demo.a@canvar.com", password: "demo123", name: "Demo Account A" },
  { email: "demo.b@canvar.com", password: "demo123", name: "Demo Account B" },
];

export default {
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validatedFields = CredentialsSchema.safeParse(credentials);
        if (!validatedFields.success) return null;

        const { email, password } = validatedFields.data;

        // Auto-create demo accounts on first login
        const demo = DEMO_ACCOUNTS.find((d) => d.email === email);
        if (demo && password === demo.password) {
          const existing = await db.select().from(users).where(eq(users.email, email));
          if (!existing[0]) {
            const hashed = await bcrypt.hash(demo.password, 12);
            await db.insert(users).values({ email: demo.email, name: demo.name, password: hashed });
          }
        }

        const query = await db.select().from(users).where(eq(users.email, email));
        const user = query[0];

        if (!user || !user.password) return null;

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;

        return user;
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      if (!token.id && token.email) {
        const query = await db.select().from(users).where(eq(users.email, token.email));
        if (query[0]) {
          token.id = query[0].id;
        }
      }

      if (!token.id && token.sub) {
        token.id = token.sub;
      }

      return token;
    },
  },
} satisfies NextAuthConfig;
