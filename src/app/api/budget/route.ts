import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { budgets } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let [row] = await db.select().from(budgets).where(eq(budgets.userId, user.id));
  if (!row) {
    [row] = await db.insert(budgets).values({ userId: user.id, monthlyLimit: 8000 }).returning();
  }
  return NextResponse.json({ budget: row });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const monthlyLimit = Number(body.monthlyLimit);
  if (!monthlyLimit || monthlyLimit < 0) {
    return NextResponse.json({ error: "Invalid budget amount" }, { status: 400 });
  }
  let [row] = await db.select().from(budgets).where(eq(budgets.userId, user.id));
  if (row) {
    [row] = await db
      .update(budgets)
      .set({ monthlyLimit })
      .where(eq(budgets.userId, user.id))
      .returning();
  } else {
    [row] = await db.insert(budgets).values({ userId: user.id, monthlyLimit }).returning();
  }
  return NextResponse.json({ budget: row });
}
