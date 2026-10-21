import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const [row] = await db
    .update(subjects)
    .set({
      name: body.name ?? undefined,
      color: body.color ?? undefined,
      description: body.description ?? undefined,
    })
    .where(and(eq(subjects.id, Number(id)), eq(subjects.userId, user.id)))
    .returning();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ subject: row });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.delete(subjects).where(and(eq(subjects.id, Number(id)), eq(subjects.userId, user.id)));
  return NextResponse.json({ ok: true });
}
