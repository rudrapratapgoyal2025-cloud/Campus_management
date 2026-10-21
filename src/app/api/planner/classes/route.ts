import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { classes } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(classes).where(eq(classes.userId, user.id));
  return NextResponse.json({ classes: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Class title required" }, { status: 400 });
  const day = Number(body.dayOfWeek);
  if (day < 0 || day > 6) return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  const [row] = await db
    .insert(classes)
    .values({
      userId: user.id,
      subjectId: body.subjectId ? Number(body.subjectId) : null,
      title,
      dayOfWeek: day,
      startTime: String(body.startTime ?? "09:00"),
      endTime: String(body.endTime ?? "10:00"),
      room: body.room ?? null,
      teacher: body.teacher ?? null,
    })
    .returning();
  return NextResponse.json({ class: row });
}
