import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { expenses, splits } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(expenses).where(eq(expenses.userId, user.id));
  return NextResponse.json({ expenses: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const amount = Number(body.amount);
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  const spentAt = body.spentAt ? new Date(body.spentAt) : new Date();
  const [row] = await db
    .insert(expenses)
    .values({
      userId: user.id,
      category: String(body.category ?? "other"),
      amount: String(amount),
      description: body.description ?? null,
      spentAt,
    })
    .returning();

  if (body.splits && Array.isArray(body.splits)) {
    for (const s of body.splits) {
      await db.insert(splits).values({
        expenseId: row.id,
        userId: s.userId ? Number(s.userId) : user.id,
        amount: String(Number(s.amount ?? 0)),
      });
    }
  }
  return NextResponse.json({ expense: row });
}
