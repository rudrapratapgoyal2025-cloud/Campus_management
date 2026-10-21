import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const content = String(body.content ?? "").trim();
  const toUserId = Number(body.toUserId);
  if (!content || !toUserId) {
    return NextResponse.json({ error: "Message and recipient required" }, { status: 400 });
  }
  const [row] = await db
    .insert(messages)
    .values({
      fromUserId: user.id,
      toUserId,
      projectId: body.projectId ? Number(body.projectId) : null,
      content,
    })
    .returning();
  return NextResponse.json({ message: row });
}
