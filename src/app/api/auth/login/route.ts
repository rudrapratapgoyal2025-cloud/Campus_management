import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { budgets, sessions, users } from "@/db/schema";
import { generateToken, verifyPassword, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    let [budget] = await db.select().from(budgets).where(eq(budgets.userId, user.id));
    if (!budget) {
      [budget] = await db.insert(budgets).values({ userId: user.id, monthlyLimit: 8000 }).returning();
    }

    const token = generateToken();
    await db.insert(sessions).values({ token, userId: user.id });

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
    return res;
  } catch (err) {
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
