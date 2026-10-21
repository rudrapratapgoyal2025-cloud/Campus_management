import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lte, desc } from "drizzle-orm";
import { db } from "@/db";
import { assignments, budgets, clubs, expenses, exams, lostFound, notices, projects, progress, resources, subjects } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const question = String(body.question ?? "").trim().toLowerCase();
  if (!question) return NextResponse.json({ error: "Question required" }, { status: 400 });

  const now = new Date();
  const today = startOfDay(now);
  const weekEnd = endOfDay(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let answer = "";
  let suggestions: string[] = [];

  // --- Assignments due this week ---
  if (question.includes("assignment") || question.includes("assignments") || question.includes("due") || question.includes("homework")) {
    const weekAssignments = await db
      .select()
      .from(assignments)
      .where(and(eq(assignments.userId, user.id), gte(assignments.dueDate, today), lte(assignments.dueDate, weekEnd)));
    if (weekAssignments.length === 0) {
      answer = "🎉 Great news! You have no assignments due this week. Enjoy the free time!";
    } else {
      const lines = weekAssignments.map((a) => {
        const days = Math.ceil((a.dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        return `• ${a.title} — due ${a.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} (in ${days} days)`;
      });
      answer = `You have ${weekAssignments.length} assignment(s) due this week:\n${lines.join("\n")}`;
    }
    suggestions = ["What exams are coming up?", "How much can I spend this week?", "Find teammates for a Python project"];
  }
  // --- Upcoming events ---
  else if (question.includes("event") || question.includes("hackathon") || question.includes("internship") || question.includes("competition") || question.includes("notice") || question.includes("upcoming")) {
    const upcoming = await db
      .select()
      .from(notices)
      .where(gte(notices.eventDate, now))
      .orderBy(notices.eventDate)
      .limit(5);
    const fallback = upcoming.length === 0 ? await db.select().from(notices).orderBy(desc(notices.createdAt)).limit(5) : [];
    const items = upcoming.length > 0 ? upcoming : fallback;
    if (items.length === 0) {
      answer = "There are no upcoming events posted right now. Check back soon!";
    } else {
      const lines = items.map((n) => {
        const dateStr = n.eventDate ? n.eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "TBA";
        return `• ${n.title} — ${dateStr}${n.location ? ` @ ${n.location}` : ""} (${n.category})`;
      });
      answer = `Here are the latest campus notices and events:\n${lines.join("\n")}`;
    }
    suggestions = ["What assignments are due this week?", "Show me student clubs", "Find study resources"];
  }
  // --- Teammates / projects ---
  else if (question.includes("teammate") || question.includes("team") || question.includes("project") || question.includes("python")) {
    const projRows = await db.select().from(projects).orderBy(desc(projects.createdAt)).limit(5);
    const skills = ["python", "react", "node", "java", "flutter", "ml", "ai", "web", "app"];
    const matched = projRows.filter((p) => {
      const text = `${p.title} ${p.description ?? ""} ${p.skills ?? ""}`.toLowerCase();
      return skills.some((s) => text.includes(s));
    });
    const items = matched.length > 0 ? matched : projRows;
    if (items.length === 0) {
      answer = "No active teammate requests yet. Post your own project on the Community page!";
    } else {
      const lines = items.map((p) => `• ${p.title} by ${p.authorName}${p.skills ? ` [Skills: ${p.skills}]` : ""}`);
      answer = `Here are ${items.length} project(s) recruiting teammates:\n${lines.join("\n")}\n\nYou can contact the poster from the Community page.`;
    }
    suggestions = ["Find study resources for DSA", "What events are coming up?", "Show me student clubs"];
  }
  // --- Budget / spending ---
  else if (question.includes("spend") || question.includes("budget") || question.includes("money") || question.includes("expense") || question.includes("cash")) {
    const [budgetRow] = await db.select().from(budgets).where(eq(budgets.userId, user.id));
    const limit = budgetRow?.monthlyLimit ?? 8000;
    const monthExpenses = await db
      .select()
      .from(expenses)
      .where(gte(expenses.spentAt, monthStart));
    const spent = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const remaining = limit - spent;
    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    const weeklyAllowance = daysLeft > 0 ? Math.round(remaining / daysLeft * 7) : 0;
    answer = `💳 Your budget this month: ₹${limit.toLocaleString("en-IN")}\n spent so far: ₹${spent.toLocaleString("en-IN")}\n remaining: ₹${Math.max(0, remaining).toLocaleString("en-IN")}\n\nYou can spend about ₹${weeklyAllowance.toLocaleString("en-IN")} per week for the rest of the month.`;
    suggestions = ["Show my recent expenses", "What assignments are due this week?", "Find teammates for a project"];
  }
  // --- Exams ---
  else if (question.includes("exam") || question.includes("test") || question.includes("study") || question.includes("study plan")) {
    const upcomingExams = await db
      .select()
      .from(exams)
      .where(gte(exams.examDate, now))
      .orderBy(exams.examDate)
      .limit(5);
    if (upcomingExams.length === 0) {
      answer = "You have no upcoming exams scheduled. Add them on the Planner page!";
    } else {
      const lines = upcomingExams.map((e) => {
        const days = Math.ceil((e.examDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        return `• ${e.title} — ${e.examDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} (in ${days} days)`;
      });
      answer = `Here are your upcoming exams:\n${lines.join("\n")}\n\nTip: Plan your study schedule starting from the nearest exam.`;
    }
    suggestions = ["What assignments are due this week?", "Show my subject progress", "How much can I spend this week?"];
  }
  // --- Subject progress ---
  else if (question.includes("progress") || question.includes("chapter") || question.includes("subject")) {
    const [progressRows, subjectRows] = await Promise.all([
      db.select().from(progress).where(eq(progress.userId, user.id)),
      db.select().from(subjects).where(eq(subjects.userId, user.id)),
    ]);
    if (progressRows.length === 0) {
      answer = "No progress data yet. Add your subjects and track chapters done on the Planner page!";
    } else {
      const lines = progressRows.map((p) => {
        const subj = subjectRows.find((s) => s.id === p.subjectId)?.name ?? `Subject ${p.subjectId}`;
        const pct = p.chaptersTotal > 0 ? Math.round((p.chaptersDone / p.chaptersTotal) * 100) : 0;
        return `• ${subj}: ${p.chaptersDone}/${p.chaptersTotal} chapters (${pct}%)`;
      });
      answer = `Your subject-wise progress:\n${lines.join("\n")}`;
    }
    suggestions = ["What exams are coming up?", "What assignments are due this week?", "Show me study resources"];
  }
  // --- Lost & Found ---
  else if (question.includes("lost") || question.includes("found") || question.includes("item") || question.includes("keys") || question.includes("id card")) {
    const items = await db
      .select()
      .from(lostFound)
      .where(eq(lostFound.status, "open"))
      .orderBy(desc(lostFound.createdAt))
      .limit(5);
    if (items.length === 0) {
      answer = "No open lost & found reports. Report an item if you've lost something!";
    } else {
      const lines = items.map((i) => `• [${i.type.toUpperCase()}] ${i.title} — ${i.category}${i.location ? ` @ ${i.location}` : ""}`);
      answer = `Open lost & found reports:\n${lines.join("\n")}\n\nUse the contact button on an item to reach out securely.`;
    }
    suggestions = ["Find teammates for a project", "What events are coming up?", "How much can I spend this week?"];
  }
  // --- Resources ---
  else if (question.includes("resource") || question.includes("notes") || question.includes("material") || question.includes("dsa") || question.includes("algorithm")) {
    const rows = await db.select().from(resources).orderBy(desc(resources.createdAt)).limit(5);
    if (rows.length === 0) {
      answer = "No study resources shared yet. Share your notes on the Community page!";
    } else {
      const lines = rows.map((r) => `• ${r.title} by ${r.authorName}${r.subject ? ` (${r.subject})` : ""}${r.url ? ` — ${r.url}` : ""}`);
      answer = `Shared study resources:\n${lines.join("\n")}`;
    }
    suggestions = ["Find teammates for a project", "What assignments are due this week?", "Show me student clubs"];
  }
  // --- Clubs ---
  else if (question.includes("club") || question.includes("society")) {
    const rows = await db.select().from(clubs).orderBy(desc(clubs.createdAt)).limit(5);
    if (rows.length === 0) {
      answer = "No clubs registered yet. Create one on the Community page!";
    } else {
      const lines = rows.map((c) => `• ${c.name} — ${c.description ?? "No description"} (${c.category})`);
      answer = `Student clubs on campus:\n${lines.join("\n")}`;
    }
    suggestions = ["Find teammates for a project", "What events are coming up?", "Find study resources"];
  }
  // --- Today's classes ---
  else if (question.includes("class") || question.includes("timetable") || question.includes("schedule") || question.includes("lecture")) {
    const { classes } = await import("@/db/schema");
    const day = now.getDay();
    const todayClasses = await db.select().from(classes).where(eq(classes.userId, user.id));
    const todays = todayClasses.filter((c) => c.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    if (todays.length === 0) {
      answer = `No classes today (${day === 0 ? "Sunday" : day === 6 ? "Saturday" : ["Monday","Tuesday","Wednesday","Thursday","Friday"][day - 1]}). Enjoy your day off!`;
    } else {
      const lines = todays.map((c) => `• ${c.startTime}–${c.endTime} ${c.title}${c.room ? ` @ ${c.room}` : ""}`);
      answer = `Your classes today:\n${lines.join("\n")}`;
    }
    suggestions = ["What assignments are due this week?", "What exams are coming up?", "How much can I spend this week?"];
  }
  // --- Fallback ---
  else {
    answer = `I'm your CampusSathi assistant! I can help with:\n• "What assignments are due this week?"\n• "What events are coming up?"\n• "Find teammates for a Python project"\n• "How much can I spend this week?"\n• "What exams are coming up?"\n• "Show my subject progress"\n• "Show me lost & found items"\n• "Find study resources"\n• "Show me student clubs"\n• "What classes do I have today?"\n\nJust ask me in plain language!`;
  }

  return NextResponse.json({ answer, suggestions });
}
