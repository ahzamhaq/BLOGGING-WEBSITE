import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const MAX_NAME = 60;
const MAX_EMAIL = 254; // RFC 5321
const MAX_HANDLE_RETRIES = 5;

function deriveHandleBase(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  return base || "user";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawName     = typeof body.name     === "string" ? body.name     : "";
    const rawEmail    = typeof body.email    === "string" ? body.email    : "";
    const rawPassword = typeof body.password === "string" ? body.password : "";

    const name     = rawName.trim();
    const email    = rawEmail.trim().toLowerCase();
    const password = rawPassword;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (name.length > MAX_NAME) {
      return NextResponse.json({ error: `Name must be ${MAX_NAME} characters or fewer.` }, { status: 400 });
    }
    if (email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (password.length < MIN_PASSWORD) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD} characters.` },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const handleBase = deriveHandleBase(name);

    // Retry on handle collisions: the unique index can race even with a random
    // suffix, especially as the user count grows. Bail out cleanly if we
    // can't find a free handle after several tries.
    for (let attempt = 0; attempt < MAX_HANDLE_RETRIES; attempt++) {
      const suffix = Math.floor(1000 + Math.random() * 9000);
      const handle = `${handleBase}${suffix}`;
      try {
        const user = await prisma.user.create({
          data: { name, email, password: hashed, handle },
        });
        sendWelcomeEmail(user.email, user.name ?? "").catch(console.error);
        return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
      } catch (err: unknown) {
        // Prisma's P2002 = unique constraint violation. Retry only if it was
        // the handle; surface anything else immediately.
        const code = (err as { code?: string })?.code;
        const target = (err as { meta?: { target?: string[] | string } })?.meta?.target;
        const isHandleConflict =
          code === "P2002" &&
          (Array.isArray(target) ? target.includes("handle") : target === "handle");
        if (!isHandleConflict) {
          throw err;
        }
        // else: loop and try a new suffix
      }
    }

    return NextResponse.json(
      { error: "Could not allocate a unique handle. Please try again." },
      { status: 500 },
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
