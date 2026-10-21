import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assignments } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const [row] = await db
    .update(assignments)
    .set({
      subjectId: body.subjectId ? Number(body.subjectId) : null,
      title: body.title ?? undefined,
      description: body.description ?? undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      status: body.status ?? undefined,
      marksObtained: body.marksObtained !== undefined ? (body.marksObtained === null ? null : Number(body.marksObtained)) : undefined,
      marksTotal: body.marksTotal ?? undefined,
    })
    .where(and(eq(assignments.id, Number(id)), eq(assignments.userId, user.id)))
    .returning();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ assignment: row });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.delete(assignments).where(and(eq(assignments.id, Number(id)), eq(assignments.userId, user.id)));
  return NextResponse.json({ ok: true });
}
