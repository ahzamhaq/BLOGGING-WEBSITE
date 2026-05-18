import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cleanMessage } from "@/lib/notify";

// GET /api/notifications
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take:    30,
  });

  // Strip internal dedupe suffix before returning to the client.
  return NextResponse.json(
    notifications.map(n => ({ ...n, message: cleanMessage(n.message) })),
  );
}

// PATCH /api/notifications — mark all as read
export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data:  { read: true },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/notifications?id=xxx — delete single notification
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.notification.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
