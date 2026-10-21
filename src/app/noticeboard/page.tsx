"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, Badge, Button, Input, Select, Modal, EmptyState } from "@/components/ui";

const CATEGORIES = ["all", "announcement", "event", "hackathon", "internship", "competition", "deadline"];

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  announcement: { icon: "📢", color: "slate" },
  event: { icon: "🎉", color: "blue" },
  hackathon: { icon: "🤖", color: "purple" },
  internship: { icon: "💼", color: "green" },
  competition: { icon: "🏆", color: "orange" },
  deadline: { icon: "⏰", color: "red" },
};

export default function NoticeboardPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", category: "announcement", eventDate: "", location: "" });

  const load = async () => {
    const data = await fetch("/api/notices").then((r) => r.json());
    setNotices(data.notices || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? notices : notices.filter((n) => n.category === filter);

  const handleSave = async () => {
    if (!form.title || !form.body) return;
    const res = await fetch("/api/notices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setModalOpen(false);
      setForm({ title: "", body: "", category: "announcement", eventDate: "", location: "" });
      load();
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/notices/${id}`, { method: "DELETE" });
    load();
  };

  if (loading) return <div className="animate-pulse text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">College Noticeboard</h1>
          <p className="text-slate-500">Stay updated with campus events & announcements</p>
        </div>
        <Button onClick={() => setModalOpen(true)} size="sm">+ Post Notice</Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${filter === cat ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {cat === "all" ? "📋 All" : `${CATEGORY_META[cat]?.icon || "📋"} ${cat}`}
          </button>
        ))}
      </div>

      {/* Notices */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><EmptyState icon="📭" title="No notices" message="No notices in this category" /></Card>
        ) : (
          filtered.map((n) => {
            const meta = CATEGORY_META[n.category] || { icon: "📋", color: "slate" };
            const upcoming = n.eventDate && new Date(n.eventDate) > new Date();
            return (
              <Card key={n.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{meta.icon}</span>
                      <Badge color={meta.color as any}>{n.category}</Badge>
                      {upcoming && <Badge color="green">Upcoming</Badge>}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">{n.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{n.body}</p>
                    {n.eventDate && (
                      <p className="text-xs text-slate-400 mt-2">📅 {new Date(n.eventDate).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                    )}
                    {n.location && <p className="text-xs text-slate-400">📍 {n.location}</p>}
                    <p className="text-xs text-slate-300 mt-2">Posted by {n.authorName} · {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  </div>
                  <button onClick={() => handleDelete(n.id)} className="text-slate-300 hover:text-red-500 ml-2">🗑</button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Post a Notice"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Post</Button></>}
      >
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <Select label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATEGORIES.filter((c) => c !== "all").map((c) => ({ value: c, label: c }))} />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Details</label>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Event Date (optional)" value={form.eventDate ? form.eventDate.slice(0, 10) : ""} onChange={(v) => setForm({ ...form, eventDate: v })} type="date" />
            <Input label="Location (optional)" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
