import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { lostFound, messages } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const item = await db.select().from(lostFound).where(eq(lostFound.id, Number(id)));
  if (!item[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.lostFoundId, Number(id)))
    .orderBy(messages.createdAt);
  return NextResponse.json({ messages: rows });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const content = String(body.content ?? "").trim();
  if (!content) return NextResponse.json({ error: "Message required" }, { status: 400 });
  const item = await db
    .select()
    .from(lostFound)
    .where(and(eq(lostFound.id, Number(id)), eq(lostFound.userId, user.id)));
  const owner = item[0];
  if (!owner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [row] = await db
    .insert(messages)
    .values({ fromUserId: user.id, toUserId: owner.userId, lostFoundId: Number(id), content })
    .returning();
  return NextResponse.json({ message: row });
}
