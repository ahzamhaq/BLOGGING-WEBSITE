import { NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond OK to prevent email enumeration
    if (!user || !user.password) {
      return NextResponse.json({ ok: true });
    }

    const token     = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await prisma.passwordResetToken.create({
      data: { token, expiresAt, userId: user.id },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

    // ── Send email ────────────────────────────────────────────────
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   ?? "smtp.gmail.com",
      port:   Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER ?? "",
        pass: process.env.SMTP_PASS ?? "",
      },
    });

    if (process.env.SMTP_USER) {
      await transporter.sendMail({
        from:    `"WriteSpace" <${process.env.SMTP_USER}>`,
        to:      email,
        subject: "Reset your WriteSpace password",
        html: `
          <div style="font-family:Inter,sans-serif;max-width:480px;margin:auto">
            <h2 style="margin-bottom:8px">Reset your password</h2>
            <p>Click the button below to set a new password. The link expires in 30 minutes.</p>
            <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#348fff;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
              Reset Password
            </a>
            <p style="color:#888;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } else {
      // Dev fallback: log the reset URL
      console.log(`[WriteSpace] Password reset URL for ${email}:\n${resetUrl}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Forgot-password error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
