import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Settings page flow: currentPassword + newPassword (no token)
    if (body.currentPassword !== undefined && body.newPassword !== undefined) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (body.newPassword.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
      }
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (!user?.password) {
        return NextResponse.json({ error: "Cannot change password for OAuth accounts." }, { status: 400 });
      }
      const valid = await bcrypt.compare(body.currentPassword, user.password);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }
      const hashed = await bcrypt.hash(body.newPassword, 12);
      await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });
      return NextResponse.json({ ok: true });
    }

    // Forgot-password token flow
    const { token, password } = body;
    if (!token) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.used || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "Reset link is invalid or has expired." }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reset-password error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
