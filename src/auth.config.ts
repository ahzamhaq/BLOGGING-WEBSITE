import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Edge-safe config: no Node.js-only modules (no bcrypt, prisma, nodemailer)
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID     ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error:  "/auth/error",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const PROTECTED_PATHS = ["/dashboard", "/reading-list", "/editor", "/settings", "/drafts"];
      const isProtected = PROTECTED_PATHS.some((p) => nextUrl.pathname.startsWith(p));
      if (isProtected && !isLoggedIn) {
        const signupUrl = new URL("/auth/signup", nextUrl);
        signupUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return Response.redirect(signupUrl);
      }
      return true;
    },
  },
};
