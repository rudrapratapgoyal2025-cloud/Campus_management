import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notices } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const rows = await db.select().from(notices).orderBy(desc(notices.createdAt));
  return NextResponse.json({ notices: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const title = String(body.title ?? "").trim();
  const bodyText = String(body.body ?? "").trim();
  if (!title || !bodyText) return NextResponse.json({ error: "Title and body required" }, { status: 400 });
  const eventDate = body.eventDate ? new Date(body.eventDate) : null;
  const [row] = await db
    .insert(notices)
    .values({
      title,
      body: bodyText,
      category: String(body.category ?? "announcement"),
      authorName: user.name,
      postedById: user.id,
      eventDate: eventDate && !isNaN(eventDate.getTime()) ? eventDate : null,
      location: body.location ?? null,
    })
    .returning();
  return NextResponse.json({ notice: row });
}
