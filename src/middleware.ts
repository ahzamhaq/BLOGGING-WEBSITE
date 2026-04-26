import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Hard-protected: redirect immediately to signup
const PROTECTED_PATHS = ["/dashboard", "/reading-list", "/editor", "/settings", "/drafts"];

// Soft-protected: allow viewing but block actions (handled client-side)
// /article, /community, /profile — guests can read, but not interact

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !isLoggedIn) {
    const signupUrl = new URL("/auth/signup", req.url);
    signupUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signupUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
