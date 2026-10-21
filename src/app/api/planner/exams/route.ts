import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { exams } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(exams).where(eq(exams.userId, user.id));
  return NextResponse.json({ exams: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Exam title required" }, { status: 400 });
  const examDate = body.examDate ? new Date(body.examDate) : new Date();
  if (isNaN(examDate.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  const [row] = await db
    .insert(exams)
    .values({
      userId: user.id,
      subjectId: body.subjectId ? Number(body.subjectId) : null,
      title,
      examDate,
      room: body.room ?? null,
      marks: body.marks ? Number(body.marks) : 100,
    })
    .returning();
  return NextResponse.json({ exam: row });
}
