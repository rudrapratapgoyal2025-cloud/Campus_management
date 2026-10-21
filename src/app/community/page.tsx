"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, Badge, Button, Input, Select, Modal, EmptyState } from "@/components/ui";

type Tab = "projects" | "resources" | "clubs";

export default function CommunityPage() {
  const [tab, setTab] = useState<Tab>("projects");
  const [projects, setProjects] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<Tab>("projects");
  const [contactTarget, setContactTarget] = useState<{ userId: number; name: string } | null>(null);
  const [message, setMessage] = useState("");

  const [projForm, setProjForm] = useState({ title: "", description: "", skills: "" });
  const [resForm, setResForm] = useState({ title: "", description: "", subject: "", url: "" });
  const [clubForm, setClubForm] = useState({ name: "", description: "", category: "tech", leaderName: "", contactEmail: "" });

  const loadAll = async () => {
    const [p, r, c] = await Promise.all([
      fetch("/api/community/projects").then((r) => r.json()),
      fetch("/api/community/resources").then((r) => r.json()),
      fetch("/api/community/clubs").then((r) => r.json()),
    ]);
    setProjects(p.projects || []);
    setResources(r.resources || []);
    setClubs(c.clubs || []);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const openModal = (type: Tab) => {
    setModalType(type);
    setModalOpen(true);
    setProjForm({ title: "", description: "", skills: "" });
    setResForm({ title: "", description: "", subject: "", url: "" });
    setClubForm({ name: "", description: "", category: "tech", leaderName: "", contactEmail: "" });
  };

  const handleSave = async () => {
    let res;
    if (modalType === "projects") {
      res = await fetch("/api/community/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(projForm) });
    } else if (modalType === "resources") {
      res = await fetch("/api/community/resources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resForm) });
    } else {
      res = await fetch("/api/community/clubs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(clubForm) });
    }
    if (res.ok) {
      setModalOpen(false);
      loadAll();
    }
  };

  const handleDelete = async (type: string, id: number) => {
    await fetch(`/api/community/${type}/${id}`, { method: "DELETE" });
    loadAll();
  };

  const handleContact = async () => {
    if (!contactTarget || !message) return;
    const res = await fetch("/api/community/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toUserId: contactTarget.userId, content: message }) });
    if (res.ok) {
      setContactTarget(null);
      setMessage("");
    }
  };

  if (loading) return <div className="animate-pulse text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Campus Community</h1>
        <p className="text-slate-500">Find teammates, share resources, discover clubs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 overflow-x-auto">
        {([
          { key: "projects", label: "🤝 Find Teammates" },
          { key: "resources", label: "📚 Study Resources" },
          { key: "clubs", label: "🏛 Student Clubs" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className={`flex-1 min-w-[150px] py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Projects */}
      {tab === "projects" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => openModal("projects")} size="sm">+ Post Project</Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {projects.length === 0 ? (
              <div className="col-span-full"><Card><EmptyState icon="🤝" title="No projects" message="Post your first project to find teammates" /></Card></div>
            ) : (
              projects.map((p) => (
                <Card key={p.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge color="purple">Recruiting</Badge>
                      </div>
                      <h3 className="font-semibold text-slate-900">{p.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">{p.description}</p>
                      {p.skills && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {p.skills.split(",").map((s: string) => <Badge key={s} color="blue">{s.trim()}</Badge>)}
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mt-3">by {p.authorName} · {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                    <div className="flex flex-col gap-1 ml-2">
                      <Button size="sm" variant="secondary" onClick={() => setContactTarget({ userId: p.postedById, name: p.authorName })}>💬</Button>
                      <button onClick={() => handleDelete("projects", p.id)} className="text-slate-300 hover:text-red-500 text-sm">🗑</button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* Resources */}
      {tab === "resources" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => openModal("resources")} size="sm">+ Share Resource</Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {resources.length === 0 ? (
              <div className="col-span-full"><Card><EmptyState icon="📚" title="No resources" message="Share your first study resource" /></Card></div>
            ) : (
              resources.map((r) => (
                <Card key={r.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{r.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">{r.description}</p>
                      {r.subject && <Badge color="blue" >{r.subject}</Badge>}
                      {r.url && <p className="text-xs text-indigo-600 mt-2 break-all">🔗 {r.url}</p>}
                      <p className="text-xs text-slate-400 mt-3">by {r.authorName} · {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                    <button onClick={() => handleDelete("resources", r.id)} className="text-slate-300 hover:text-red-500 ml-2">🗑</button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* Clubs */}
      {tab === "clubs" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => openModal("clubs")} size="sm">+ Register Club</Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubs.length === 0 ? (
              <div className="col-span-full"><Card><EmptyState icon="🏛" title="No clubs" message="Register your first club" /></Card></div>
            ) : (
              clubs.map((c) => (
                <Card key={c.id} className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🏛</span>
                    <Badge color="blue">{c.category}</Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900">{c.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{c.description}</p>
                  <p className="text-xs text-slate-400 mt-3">Leader: {c.leaderName}</p>
                  {c.contactEmail && <p className="text-xs text-slate-400">📧 {c.contactEmail}</p>}
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalType === "projects" ? "Post a Project" : modalType === "resources" ? "Share a Resource" : "Register a Club"}
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}
      >
        <div className="space-y-4">
          {modalType === "projects" && (
            <>
              <Input label="Project Title" value={projForm.title} onChange={(v) => setProjForm({ ...projForm, title: v })} />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea value={projForm.description} onChange={(e) => setProjForm({ ...projForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <Input label="Skills (comma separated)" value={projForm.skills} onChange={(v) => setProjForm({ ...projForm, skills: v })} placeholder="React, Node, Python" />
            </>
          )}
          {modalType === "resources" && (
            <>
              <Input label="Resource Title" value={resForm.title} onChange={(v) => setResForm({ ...resForm, title: v })} />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea value={resForm.description} onChange={(e) => setResForm({ ...resForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Subject" value={resForm.subject} onChange={(v) => setResForm({ ...resForm, subject: v })} placeholder="DSA, OS, etc." />
                <Input label="URL (optional)" value={resForm.url} onChange={(v) => setResForm({ ...resForm, url: v })} />
              </div>
            </>
          )}
          {modalType === "clubs" && (
            <>
              <Input label="Club Name" value={clubForm.name} onChange={(v) => setClubForm({ ...clubForm, name: v })} />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea value={clubForm.description} onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <Select label="Category" value={clubForm.category} onChange={(v) => setClubForm({ ...clubForm, category: v })} options={["tech", "arts", "service", "sports", "other"].map((c) => ({ value: c, label: c }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Leader Name" value={clubForm.leaderName} onChange={(v) => setClubForm({ ...clubForm, leaderName: v })} />
                <Input label="Contact Email" value={clubForm.contactEmail} onChange={(v) => setClubForm({ ...clubForm, contactEmail: v })} />
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Contact Modal */}
      <Modal
        open={!!contactTarget}
        onClose={() => { setContactTarget(null); setMessage(""); }}
        title={`Message ${contactTarget?.name || ""}`}
        footer={<><Button variant="secondary" onClick={() => { setContactTarget(null); setMessage(""); }}>Close</Button><Button onClick={handleContact}>Send</Button></>}
      >
        <div className="space-y-4">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-700">📧 Messages are sent securely through CampusSathi.</p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Your Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Write your message…" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
