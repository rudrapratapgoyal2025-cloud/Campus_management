import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { classes } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const [row] = await db
    .update(classes)
    .set({
      subjectId: body.subjectId ? Number(body.subjectId) : null,
      title: body.title ?? undefined,
      dayOfWeek: body.dayOfWeek ?? undefined,
      startTime: body.startTime ?? undefined,
      endTime: body.endTime ?? undefined,
      room: body.room ?? undefined,
      teacher: body.teacher ?? undefined,
    })
    .where(and(eq(classes.id, Number(id)), eq(classes.userId, user.id)))
    .returning();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ class: row });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.delete(classes).where(and(eq(classes.id, Number(id)), eq(classes.userId, user.id)));
  return NextResponse.json({ ok: true });
}
