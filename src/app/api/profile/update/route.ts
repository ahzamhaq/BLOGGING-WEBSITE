import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// PATCH /api/profile/update — update current user's profile
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, bio, handle, image } = body;

  // Validate handle if changing
  if (handle !== undefined) {
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(handle)) {
      return NextResponse.json(
        { error: "Handle must be 3–30 characters, letters/numbers/underscores only" },
        { status: 400 }
      );
    }
    // Check uniqueness
    const conflict = await prisma.user.findUnique({ where: { handle } });
    if (conflict && conflict.id !== session.user.id) {
      return NextResponse.json({ error: "That handle is already taken" }, { status: 409 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined ? { name: name.trim() || null } : {}),
      ...(bio  !== undefined ? { bio:  bio.trim()  || null } : {}),
      ...(handle !== undefined ? { handle } : {}),
      ...(image  !== undefined ? { image: image ?? null } : {}),
    },
    select: { id: true, name: true, handle: true, bio: true, image: true },
  });

  return NextResponse.json(updated);
}

// GET /api/profile/update — fetch current user's profile for the settings page
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, handle: true, bio: true, image: true, email: true },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}
