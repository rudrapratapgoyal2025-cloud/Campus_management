import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { lostFound } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const rows = await db.select().from(lostFound).orderBy(desc(lostFound.createdAt));
  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Item title required" }, { status: 400 });
  const type = body.type === "found" ? "found" : "lost";
  const [row] = await db
    .insert(lostFound)
    .values({
      type,
      title,
      description: body.description ?? null,
      category: String(body.category ?? "other"),
      location: body.location ?? null,
      contactEmail: body.contactEmail ?? user.email,
      userId: user.id,
    })
    .returning();
  return NextResponse.json({ item: row });
}
