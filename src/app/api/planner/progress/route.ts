import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { progress } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(progress).where(eq(progress.userId, user.id));
  return NextResponse.json({ progress: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const subjectId = Number(body.subjectId);
  if (!subjectId) return NextResponse.json({ error: "subjectId required" }, { status: 400 });
  const chaptersTotal = Number(body.chaptersTotal ?? 0);
  const chaptersDone = Number(body.chaptersDone ?? 0);
  const [existing] = await db
    .select()
    .from(progress)
    .where(and(eq(progress.userId, user.id), eq(progress.subjectId, subjectId)));
  if (existing) {
    const [row] = await db
      .update(progress)
      .set({ chaptersTotal, chaptersDone })
      .where(eq(progress.id, existing.id))
      .returning();
    return NextResponse.json({ progressItem: row });
  }
  const [row] = await db
    .insert(progress)
    .values({ userId: user.id, subjectId, chaptersTotal, chaptersDone })
    .returning();
  return NextResponse.json({ progressItem: row });
}
