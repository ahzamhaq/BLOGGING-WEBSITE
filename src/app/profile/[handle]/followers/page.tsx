import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { FollowListPage } from "../FollowListPage";

interface Props { params: Promise<{ handle: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const user = await prisma.user.findUnique({ where: { handle }, select: { name: true } });
  if (!user) return { title: "Not Found" };
  return { title: `People following ${user.name ?? handle} — WriteSpace` };
}

export default async function FollowersPage({ params }: Props) {
  const { handle } = await params;
  const user = await prisma.user.findUnique({
    where: { handle },
    select: { name: true, handle: true, _count: { select: { followers: true } } },
  });
  if (!user) notFound();

  return (
    <FollowListPage
      handle={handle}
      name={user.name}
      type="followers"
      count={user._count.followers}
    />
  );
}
