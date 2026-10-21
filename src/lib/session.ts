import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { SESSION_COOKIE } from "./auth";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const [session] = await db.select().from(sessions).where(eq(sessions.token, token));
    if (!session) return null;
    const [user] = await db.select().from(users).where(eq(users.id, session.userId));
    return user ?? null;
  } catch {
    return null;
  }
}
