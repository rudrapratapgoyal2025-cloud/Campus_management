"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, Badge, Button, Input, Select, Modal, EmptyState } from "@/components/ui";

const CATEGORIES = ["id_card", "book", "keys", "electronics", "other"];
const TYPES = ["lost", "found"];

export default function LostFoundPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ type: "lost", title: "", description: "", category: "id_card", location: "" });
  const [contactItem, setContactItem] = useState<any | null>(null);
  const [message, setMessage] = useState("");
  const [myMessages, setMyMessages] = useState<Record<number, any[]>>({});

  const load = async () => {
    const data = await fetch("/api/lost-found").then((r) => r.json());
    setItems(data.items || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

  const handleSave = async () => {
    if (!form.title) return;
    const res = await fetch("/api/lost-found", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setModalOpen(false);
      setForm({ type: "lost", title: "", description: "", category: "id_card", location: "" });
      load();
    }
  };

  const handleResolve = async (id: number) => {
    await fetch(`/api/lost-found/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "resolved" }) });
    load();
  };

  const handleContact = async () => {
    if (!contactItem || !message) return;
    const res = await fetch(`/api/lost-found/${contactItem.id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: message }) });
    if (res.ok) {
      const m = await res.json();
      setMyMessages((prev) => ({ ...prev, [contactItem.id]: [...(prev[contactItem.id] || []), m.message] }));
      setMessage("");
    }
  };

  if (loading) return <div className="animate-pulse text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campus Lost & Found</h1>
          <p className="text-slate-500">Report and find lost items securely</p>
        </div>
        <Button onClick={() => setModalOpen(true)} size="sm">+ Report Item</Button>
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200">
        {["all", "lost", "found"].map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === t ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
            {t === "all" ? "📋 All" : t === "lost" ? "❌ Lost" : "✅ Found"}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full"><Card><EmptyState icon="🔍" title="No items" message="Nothing here yet" /></Card></div>
        ) : (
          filtered.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{item.type === "lost" ? "❌" : "✅"}</span>
                  <Badge color={item.type === "lost" ? "red" : "green"}>{item.type}</Badge>
                  {item.status === "resolved" && <Badge color="slate">resolved</Badge>}
                </div>
              </div>
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{item.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge color="blue">{item.category}</Badge>
                {item.location && <Badge color="purple">📍 {item.location}</Badge>}
              </div>
              <p className="text-xs text-slate-400 mt-3">{new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>

              {item.status === "open" && (
                <div className="mt-3 space-y-2">
                  {item.userId !== undefined && (
                    <Button size="sm" variant="secondary" onClick={() => setContactItem(item)} className="w-full">📩 Contact Owner</Button>
                  )}
                  {/* Show messages if any */}
                  {myMessages[item.id] && myMessages[item.id].length > 0 && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
                      <p className="font-medium text-blue-800">Your message sent!</p>
                      <p className="text-blue-600 mt-1">"{myMessages[item.id][0].content}"</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Report Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Report an Item"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Submit</Button></>}
      >
        <div className="space-y-4">
          <Select label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={TYPES.map((t) => ({ value: t, label: t === "lost" ? "❌ I Lost Something" : "✅ I Found Something" }))} />
          <Input label="Item Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="e.g. Student ID Card" />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
            <Input label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="Where?" />
          </div>
        </div>
      </Modal>

      {/* Contact Modal */}
      <Modal
        open={!!contactItem}
        onClose={() => { setContactItem(null); setMessage(""); }}
        title="Secure Contact"
        footer={<><Button variant="secondary" onClick={() => { setContactItem(null); setMessage(""); }}>Close</Button><Button onClick={handleContact}>Send Message</Button></>}
      >
        <div className="space-y-4">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-700">📧 Messages are sent securely through CampusSathi. The recipient will receive your message without seeing your email address directly.</p>
          </div>
          <p className="text-sm font-medium text-slate-700">Regarding: {contactItem?.title}</p>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Your Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Write your message here…" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
