import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clubs } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const rows = await db.select().from(clubs).orderBy(desc(clubs.createdAt));
  return NextResponse.json({ clubs: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Club name required" }, { status: 400 });
  const [row] = await db
    .insert(clubs)
    .values({
      name,
      description: body.description ?? null,
      category: String(body.category ?? "other"),
      leaderName: body.leaderName ?? user.name,
      contactEmail: body.contactEmail ?? user.email,
    })
    .returning();
  return NextResponse.json({ club: row });
}
