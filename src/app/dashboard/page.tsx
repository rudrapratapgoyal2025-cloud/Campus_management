"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, Badge, StatCard, EmptyState } from "@/components/ui";

export default function DashboardPage() {
  const [data, setData] = useState<{
    assignments: any[];
    exams: any[];
    expenses: any[];
    budget: any;
    notices: any[];
    todayClasses: any[];
    progress: any[];
    subjects: any[];
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/planner/assignments").then((r) => r.json()),
      fetch("/api/planner/exams").then((r) => r.json()),
      fetch("/api/budget/expenses").then((r) => r.json()),
      fetch("/api/budget").then((r) => r.json()),
      fetch("/api/notices").then((r) => r.json()),
      fetch("/api/planner/classes").then((r) => r.json()),
      fetch("/api/planner/progress").then((r) => r.json()),
      fetch("/api/planner/subjects").then((r) => r.json()),
    ]).then(([a, e, ex, b, n, c, p, s]) => {
      const now = new Date();
      const today = now.getDay();
      const todayClasses = (c.classes || []).filter((cl: any) => cl.dayOfWeek === today).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
      setData({
        assignments: a.assignments || [],
        exams: e.exams || [],
        expenses: ex.expenses || [],
        budget: b.budget,
        notices: n.notices || [],
        todayClasses,
        progress: p.progress || [],
        subjects: s.subjects || [],
      });
    });
  }, []);

  if (!data) return <div className="animate-pulse text-slate-400">Loading…</div>;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthExpenses = data.expenses.filter((e) => new Date(e.spentAt) >= monthStart);
  const spent = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const remaining = (data.budget?.monthlyLimit || 8000) - spent;
  const pendingAssignments = data.assignments.filter((a) => a.status === "pending");
  const upcomingExams = data.exams.filter((e) => new Date(e.examDate) > now).sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
  const upcomingAssignments = pendingAssignments.filter((a) => new Date(a.dueDate) > now).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Here's your campus life at a glance 👋</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📋" label="Pending Assignments" value={pendingAssignments.length} color="orange" />
        <StatCard icon="📝" label="Upcoming Exams" value={upcomingExams.length} color="purple" />
        <StatCard icon="💰" label="Budget Remaining" value={`₹${Math.max(0, remaining).toLocaleString("en-IN")}`} color="green" sublabel={`of ₹${(data.budget?.monthlyLimit || 8000).toLocaleString("en-IN")}`} />
        <StatCard icon="📚" label="Subjects Tracked" value={data.progress.length || 0} color="blue" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <Card>
          <CardHeader title="Today's Classes" icon="📅" />
          <div className="p-4">
            {data.todayClasses.length === 0 ? (
              <EmptyState icon="☕" title="No classes today" message="Enjoy your free day!" />
            ) : (
              <div className="space-y-2">
                {data.todayClasses.map((c: any) => {
                  const subj = data.subjects.find((s: any) => s.id === c.subjectId);
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                      <div className="w-12 text-center">
                        <div className="text-sm font-bold text-slate-700">{c.startTime}</div>
                        <div className="text-xs text-slate-400">{c.endTime}</div>
                      </div>
                      <div className="border-l-4 rounded-r-lg py-2 px-3 flex-1" style={{ borderColor: subj?.color || "#6366f1" }}>
                        <p className="font-medium text-slate-800">{c.title}</p>
                        <p className="text-xs text-slate-400">{c.room} {subj ? `· ${subj.name}` : ""}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader title="Upcoming Assignments" icon="📋" action={<Link href="/planner" className="text-sm text-indigo-600 hover:underline">View all</Link>} />
          <div className="p-4">
            {upcomingAssignments.length === 0 ? (
              <EmptyState icon="🎉" title="No assignments due" message="You're all caught up!" />
            ) : (
              <div className="space-y-2">
                {upcomingAssignments.map((a: any) => {
                  const days = Math.ceil((new Date(a.dueDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
                  const subj = data.subjects.find((s: any) => s.id === a.subjectId);
                  return (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{a.title}</p>
                        <p className="text-xs text-slate-400">{subj?.name || "General"}</p>
                      </div>
                      <Badge color={days <= 2 ? "red" : days <= 5 ? "orange" : "slate"}>{days}d left</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <Card>
          <CardHeader title="Upcoming Exams" icon="📝" action={<Link href="/planner" className="text-sm text-indigo-600 hover:underline">View all</Link>} />
          <div className="p-4">
            {upcomingExams.length === 0 ? (
              <EmptyState icon="🎯" title="No exams scheduled" message="Add exams on the Planner page" />
            ) : (
              <div className="space-y-2">
                {upcomingExams.slice(0, 5).map((e: any) => {
                  const days = Math.ceil((new Date(e.examDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
                  const subj = data.subjects.find((s: any) => s.id === e.subjectId);
                  return (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{e.title}</p>
                        <p className="text-xs text-slate-400">{subj?.name || "General"} · {new Date(e.examDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                      </div>
                      <Badge color={days <= 7 ? "red" : days <= 14 ? "orange" : "slate"}>{days}d</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Latest Notices */}
        <Card>
          <CardHeader title="Latest Notices" icon="📢" action={<Link href="/noticeboard" className="text-sm text-indigo-600 hover:underline">View all</Link>} />
          <div className="p-4">
            {data.notices.length === 0 ? (
              <EmptyState icon="📭" title="No notices" message="Check the noticeboard for updates" />
            ) : (
              <div className="space-y-2">
                {data.notices.slice(0, 5).map((n: any) => (
                  <div key={n.id} className="p-3 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between mb-1">
                      <Badge color={n.category === "hackathon" ? "purple" : n.category === "event" ? "blue" : n.category === "internship" ? "green" : n.category === "deadline" ? "red" : "slate"}>
                        {n.category}
                      </Badge>
                      <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 truncate">{n.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: "/planner", icon: "📅", label: "Plan Classes" },
          { href: "/budget", icon: "💰", label: "Track Spending" },
          { href: "/lost-found", icon: "🔍", label: "Find Items" },
          { href: "/assistant", icon: "🤖", label: "Ask Assistant" },
        ].map((q) => (
          <Link key={q.href} href={q.href} className="card-link">
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-3xl mb-2">{q.icon}</div>
              <p className="font-medium text-slate-800 text-sm">{q.label}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
