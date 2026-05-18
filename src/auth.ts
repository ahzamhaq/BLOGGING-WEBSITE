import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { authConfig } from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Email & Password",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email    as string | undefined;
        const password = credentials?.password as string | undefined;

        // Normalize email to lowercase to match registration. Accept the old
        // 6-char minimum for legacy users while requiring 8+ for new ones —
        // we just need *some* sane floor against trivial brute-force here.
        if (!rawEmail || !password || password.length < 6) return null;
        const email = rawEmail.trim().toLowerCase();

        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.password) return null;

          const valid = await bcrypt.compare(password, user.password);
          if (!valid) return null;

          // Return the Prisma DB id so it lands in token.sub
          return { id: user.id, name: user.name ?? user.handle, email: user.email, image: user.image };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    /**
     * Called on every sign-in.  For OAuth providers (Google) we upsert the
     * user into our Prisma `User` table so they get a proper DB CUID.
     * We store that CUID on `token.sub` so it flows through to the session.
     */
    async jwt({ token, user, account, profile }) {
      // Credentials sign-in: user.id is already the Prisma CUID (set in authorize)
      if (user?.id) {
        token.sub = user.id;
      }

      // Google (or any OAuth) sign-in: upsert into DB and store the DB CUID
      if (account?.provider === "google" && profile?.email) {
        try {
          const email = profile.email as string;
          const name  = (profile.name as string | undefined) ?? email.split("@")[0];
          const image = (profile.picture as string | undefined) ?? null;

          // Build a unique handle from the email prefix, make it safe
          const baseHandle = email
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "_")
            .slice(0, 30);

          // Find existing user by email
          let dbUser = await prisma.user.findUnique({ where: { email } });

          if (!dbUser) {
            // Check if handle is taken and suffix if needed
            let handle = baseHandle;
            const taken = await prisma.user.findUnique({ where: { handle } });
            if (taken) handle = `${baseHandle}_${Date.now().toString(36)}`;

            dbUser = await prisma.user.create({
              data: { email, name, handle, image, emailVerified: new Date() },
            });
            sendWelcomeEmail(dbUser.email, dbUser.name ?? "").catch(console.error);
          } else {
            // Keep image / name in sync with Google profile
            dbUser = await prisma.user.update({
              where: { email },
              data: {
                name:  dbUser.name  ?? name,
                image: dbUser.image ?? image,
                emailVerified: dbUser.emailVerified ?? new Date(),
              },
            });
          }

          // ← This is the key fix: replace the Google provider ID with DB CUID
          token.sub = dbUser.id;
        } catch (err) {
          console.error("OAuth upsert error:", err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Expose the DB CUID to the client session
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: (() => {
    const fromEnv = process.env.AUTH_SECRET;
    if (fromEnv && fromEnv.length >= 32) return fromEnv;
    // In production, refuse to boot with a missing or weak secret —
    // a publicly-known fallback would let anyone forge JWTs.
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SECRET is missing or too short (require >= 32 chars). " +
        "Set it in the deployment environment.",
      );
    }
    // Dev only: use a fixed dev-only string so local sessions persist
    // across restarts. Never use this value in production.
    return "dev-only-secret-not-for-production-use-12345678";
  })(),
});
