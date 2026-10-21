import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(subjects).where(eq(subjects.userId, user.id));
  return NextResponse.json({ subjects: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Subject name required" }, { status: 400 });
  const [row] = await db
    .insert(subjects)
    .values({ userId: user.id, name, color: String(body.color ?? "#6366f1"), description: body.description ?? null })
    .returning();
  return NextResponse.json({ subject: row });
}
