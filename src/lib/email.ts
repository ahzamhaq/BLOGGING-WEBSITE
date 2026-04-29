import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendWelcomeEmail(to: string, name: string) {
  const displayName = name || "Writer";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://writespace.vercel.app";

  await transporter.sendMail({
    from: `"WriteSpace" <${process.env.SMTP_USER}>`,
    to,
    subject: "Welcome to WriteSpace ✍️",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f,#0d1f3c);padding:40px 40px 32px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;">
              <span style="font-size:28px;color:#348fff;">✍</span>
              <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.03em;">WriteSpace</span>
            </div>
            <p style="color:#93b4d6;margin:12px 0 0;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">Where Great Writing Lives</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#f1f5f9;line-height:1.3;">
              Welcome aboard, ${displayName}! 🎉
            </h1>
            <p style="margin:0 0 20px;font-size:15px;color:#94a3b8;line-height:1.7;">
              You've just joined a community of writers who believe in the power of thoughtful words.
              Your space to write, share, and connect is ready.
            </p>

            <!-- What you can do -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="background:#1e293b;border-radius:10px;padding:20px 24px;">
                  <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#348fff;text-transform:uppercase;letter-spacing:0.08em;">Get started</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td style="padding:6px 0;font-size:14px;color:#cbd5e1;">
                      <span style="color:#348fff;margin-right:10px;">→</span> Write your first article
                    </td></tr>
                    <tr><td style="padding:6px 0;font-size:14px;color:#cbd5e1;">
                      <span style="color:#348fff;margin-right:10px;">→</span> Explore topics you love
                    </td></tr>
                    <tr><td style="padding:6px 0;font-size:14px;color:#cbd5e1;">
                      <span style="color:#348fff;margin-right:10px;">→</span> Join community rooms
                    </td></tr>
                    <tr><td style="padding:6px 0;font-size:14px;color:#cbd5e1;">
                      <span style="color:#348fff;margin-right:10px;">→</span> Follow writers you admire
                    </td></tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${appUrl}"
                     style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#348fff);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:-0.01em;">
                    Start Writing →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 32px;border-top:1px solid #1f2937;">
            <p style="margin:0;font-size:12px;color:#475569;text-align:center;line-height:1.6;">
              You're receiving this because you created a WriteSpace account.<br>
              © ${new Date().getFullYear()} WriteSpace — Where great writing lives.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
