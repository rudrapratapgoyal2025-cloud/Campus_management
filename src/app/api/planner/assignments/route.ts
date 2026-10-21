import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assignments } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(assignments).where(eq(assignments.userId, user.id));
  return NextResponse.json({ assignments: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Assignment title required" }, { status: 400 });
  const dueDate = body.dueDate ? new Date(body.dueDate) : new Date();
  if (isNaN(dueDate.getTime())) return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
  const [row] = await db
    .insert(assignments)
    .values({
      userId: user.id,
      subjectId: body.subjectId ? Number(body.subjectId) : null,
      title,
      description: body.description ?? null,
      dueDate,
      status: "pending",
      marksTotal: body.marksTotal ? Number(body.marksTotal) : 100,
    })
    .returning();
  return NextResponse.json({ assignment: row });
}
