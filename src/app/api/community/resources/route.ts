import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const rows = await db.select().from(resources).orderBy(desc(resources.createdAt));
  return NextResponse.json({ resources: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Resource title required" }, { status: 400 });
  const [row] = await db
    .insert(resources)
    .values({
      title,
      description: body.description ?? null,
      subject: body.subject ?? null,
      url: body.url ?? null,
      uploadedById: user.id,
      authorName: user.name,
    })
    .returning();
  return NextResponse.json({ resource: row });
}
