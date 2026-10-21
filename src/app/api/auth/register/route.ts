import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { budgets, sessions, users } from "@/db/schema";
import { generateToken, hashPassword, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim();
    const password = String(body.password ?? "");

    if (!email || !name || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const [existing] = await db.select().from(users).where(eq(users.email, email));
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const [user] = await db
      .insert(users)
      .values({ email, name, passwordHash: hashPassword(password) })
      .returning();

    await db.insert(budgets).values({ userId: user.id, monthlyLimit: 8000 });

    const token = generateToken();
    await db.insert(sessions).values({ token, userId: user.id });

    const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
    return res;
  } catch (err) {
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
