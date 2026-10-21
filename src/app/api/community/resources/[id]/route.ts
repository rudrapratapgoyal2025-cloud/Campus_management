import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.delete(resources).where(and(eq(resources.id, Number(id)), eq(resources.uploadedById, user.id)));
  return NextResponse.json({ ok: true });
}
