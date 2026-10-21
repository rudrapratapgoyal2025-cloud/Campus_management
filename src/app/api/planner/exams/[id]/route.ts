import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { exams } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const [row] = await db
    .update(exams)
    .set({
      subjectId: body.subjectId ? Number(body.subjectId) : null,
      title: body.title ?? undefined,
      examDate: body.examDate ? new Date(body.examDate) : undefined,
      room: body.room ?? undefined,
      marks: body.marks ?? undefined,
    })
    .where(and(eq(exams.id, Number(id)), eq(exams.userId, user.id)))
    .returning();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ exam: row });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.delete(exams).where(and(eq(exams.id, Number(id)), eq(exams.userId, user.id)));
  return NextResponse.json({ ok: true });
}
