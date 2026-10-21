import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const rows = await db.select().from(projects).orderBy(desc(projects.createdAt));
  return NextResponse.json({ projects: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Project title required" }, { status: 400 });
  const [row] = await db
    .insert(projects)
    .values({
      title,
      description: body.description ?? null,
      skills: body.skills ?? null,
      postedById: user.id,
      authorName: user.name,
      status: "recruiting",
    })
    .returning();
  return NextResponse.json({ project: row });
}
