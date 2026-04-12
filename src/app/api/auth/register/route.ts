import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    // Generate a unique handle from name
    const base   = name.trim().toLowerCase().replace(/\s+/g, "").slice(0, 20);
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const handle = `${base}${suffix}`;

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name: name.trim(), email, password: hashed, handle },
    });

    return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
