"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, Badge, Button, Input, Select, Modal, EmptyState } from "@/components/ui";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = ["08", "09", "10", "11", "12", "13", "14", "15", "16", "17"];

type Tab = "timetable" | "exams" | "assignments" | "progress";

export default function PlannerPage() {
  const [tab, setTab] = useState<Tab>("timetable");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"class" | "exam" | "assignment" | "subject">("class");
  const [editId, setEditId] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState<Record<string, string>>({});

  const loadAll = async () => {
    const [s, c, e, a, p] = await Promise.all([
      fetch("/api/planner/subjects").then((r) => r.json()),
      fetch("/api/planner/classes").then((r) => r.json()),
      fetch("/api/planner/exams").then((r) => r.json()),
      fetch("/api/planner/assignments").then((r) => r.json()),
      fetch("/api/planner/progress").then((r) => r.json()),
    ]);
    setSubjects(s.subjects || []);
    setClasses(c.classes || []);
    setExams(e.exams || []);
    setAssignments(a.assignments || []);
    setProgress(p.progress || []);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const openModal = (type: typeof modalType, editItem?: any) => {
    setModalType(type);
    setEditId(editItem?.id ?? null);
    setForm(editItem ? { ...editItem, subjectId: String(editItem.subjectId ?? ""), dayOfWeek: String(editItem.dayOfWeek ?? "1"), marks: String(editItem.marks ?? "100"), status: editItem.status || "pending", marksObtained: editItem.marksObtained ?? "" } : { subjectId: "", dayOfWeek: "1", startTime: "09:00", endTime: "10:00", marks: "100" });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const subjectId = form.subjectId ? Number(form.subjectId) : null;
    const url = editId ? `/api/planner/${modalType === "class" ? "classes" : modalType}/${editId}` : `/api/planner/${modalType === "class" ? "classes" : modalType}`;
    const method = editId ? "PUT" : "POST";
    const body: Record<string, any> = { ...form, subjectId };

    if (modalType === "class") {
      body.dayOfWeek = Number(form.dayOfWeek);
    }
    if (modalType === "exam" || modalType === "assignment") {
      body.marks = Number(form.marks || 100);
    }

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      setModalOpen(false);
      loadAll();
    }
  };

  const handleDelete = async (type: string, id: number) => {
    const url = type === "class" ? `/api/planner/classes/${id}` : `/api/planner/${type}/${id}`;
    await fetch(url, { method: "DELETE" });
    loadAll();
  };

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`/api/planner/assignments/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    loadAll();
  };

  const updateProgress = async (subjectId: number) => {
    const total = Number(prompt("Total chapters:", form.chaptersTotal || "10"));
    const done = Number(prompt("Chapters completed:", form.chaptersDone || "0"));
    if (!isNaN(total) && !isNaN(done)) {
      await fetch("/api/planner/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId, chaptersTotal: total, chaptersDone: done }) });
      loadAll();
    }
  };

  if (loading) return <div className="animate-pulse text-slate-400">Loading…</div>;

  const getSubjectName = (id: number) => subjects.find((s) => s.id === id)?.name || "General";
  const getSubjectColor = (id: number) => subjects.find((s) => s.id === id)?.color || "#6366f1";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Smart Student Planner</h1>
          <p className="text-slate-500">Timetable, exams, assignments & progress</p>
        </div>
        <Button onClick={() => openModal("subject")} size="sm">+ Subject</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 overflow-x-auto">
        {([
          { key: "timetable", label: "📅 Timetable", add: () => openModal("class") },
          { key: "exams", label: "📝 Exams", add: () => openModal("exam") },
          { key: "assignments", label: "📋 Assignments", add: () => openModal("assignment") },
          { key: "progress", label: "📊 Progress", add: null },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key as Tab); if (t.add) t.add(); }}
            className={`flex-1 min-w-[120px] py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Timetable */}
      {tab === "timetable" && (
        <Card>
          <CardHeader title="Weekly Timetable" icon="📅" action={<Button onClick={() => openModal("class")} size="sm">+ Add Class</Button>} />
          <div className="p-4 overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header row */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
                <div className="text-xs font-semibold text-slate-500 flex items-center justify-center">Time</div>
                {DAYS.map((d) => (
                  <div key={d} className="text-xs font-semibold text-slate-700 text-center py-2">{d}</div>
                ))}
              </div>
              {/* Hour rows */}
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
                  <div className="text-xs text-slate-400 flex items-center justify-center">{hour}:00</div>
                  {DAYS.map((_, dayIdx) => {
                    const dayClasses = classes.filter((c) => c.dayOfWeek === dayIdx && c.startTime <= `${hour}:59` && c.endTime > `${hour}:00`);
                    if (dayClasses.length === 0) return <div key={dayIdx} className="min-h-[56px] rounded-lg bg-slate-50" />;
                    return (
                      <div key={dayIdx} className="min-h-[56px] space-y-1">
                        {dayClasses.map((c) => (
                          <div
                            key={c.id}
                            className="rounded-lg p-2 text-xs text-white"
                            style={{ backgroundColor: getSubjectColor(c.subjectId) }}
                          >
                            <p className="font-semibold leading-tight">{c.title}</p>
                            <p className="opacity-80">{c.startTime}–{c.endTime}</p>
                            {c.room && <p className="opacity-60 text-[10px]">📍 {c.room}</p>}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Exams */}
      {tab === "exams" && (
        <Card>
          <CardHeader title="Exam Schedule" icon="📝" action={<Button onClick={() => openModal("exam")} size="sm">+ Add Exam</Button>} />
          <div className="p-4">
            {exams.length === 0 ? (
              <EmptyState icon="📝" title="No exams yet" message="Add your exams to get reminders" />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {exams.sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()).map((e) => {
                  const days = Math.ceil((new Date(e.examDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                  return (
                    <div key={e.id} className="flex items-center justify-between p-4 rounded-xl border-l-4 bg-slate-50" style={{ borderColor: getSubjectColor(e.subjectId) }}>
                      <div>
                        <p className="font-semibold text-slate-800">{e.title}</p>
                        <p className="text-sm text-slate-500">{getSubjectName(e.subjectId)} · {new Date(e.examDate).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                        {e.room && <p className="text-xs text-slate-400">📍 {e.room} · {e.marks} marks</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge color={days <= 3 ? "red" : days <= 7 ? "orange" : "slate"}>{days > 0 ? `${days}d left` : "Today"}</Badge>
                        <button onClick={() => handleDelete("exams", e.id)} className="text-slate-300 hover:text-red-500">🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Assignments */}
      {tab === "assignments" && (
        <Card>
          <CardHeader title="Assignment Deadlines" icon="📋" action={<Button onClick={() => openModal("assignment")} size="sm">+ Add Assignment</Button>} />
          <div className="p-4">
            {assignments.length === 0 ? (
              <EmptyState icon="📋" title="No assignments" message="Add your assignments to track deadlines" />
            ) : (
              <div className="space-y-2">
                {assignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((a) => {
                  const days = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                  const overdue = days < 0 && a.status === "pending";
                  return (
                    <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800">{a.title}</p>
                          <Badge color={a.status === "submitted" ? "green" : a.status === "graded" ? "blue" : overdue ? "red" : "orange"}>{a.status}</Badge>
                        </div>
                        <p className="text-sm text-slate-500">{getSubjectName(a.subjectId)} · Due {new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                        {a.description && <p className="text-xs text-slate-400 mt-1">{a.description}</p>}
                        {a.status === "graded" && a.marksObtained !== null && <p className="text-xs text-slate-500 mt-1">Marks: {a.marksObtained}/{a.marksTotal}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {a.status === "pending" && (
                          <Button size="sm" variant="success" onClick={() => handleStatusChange(a.id, "submitted")}>Mark Done</Button>
                        )}
                        <button onClick={() => handleDelete("assignments", a.id)} className="text-slate-300 hover:text-red-500">🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Progress */}
      {tab === "progress" && (
        <Card>
          <CardHeader title="Subject-wise Progress" icon="📊" />
          <div className="p-4">
            {subjects.length === 0 ? (
              <EmptyState icon="📚" title="No subjects yet" message="Add subjects first to track progress" />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {subjects.map((s) => {
                  const prog = progress.find((p) => p.subjectId === s.id);
                  const total = prog?.chaptersTotal || 0;
                  const done = prog?.chaptersDone || 0;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <div key={s.id} className="p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                          <p className="font-semibold text-slate-800">{s.name}</p>
                        </div>
                        <button onClick={() => { setForm({ subjectId: String(s.id), chaptersTotal: String(total || 10), chaptersDone: String(done || 0) }); openModal("subject", { id: s.id, name: s.name, color: s.color, description: s.description, subjectId: String(s.id) }); }} className="text-xs text-indigo-600 hover:underline">Update</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                        </div>
                        <span className="text-sm font-medium text-slate-700 min-w-[40px] text-right">{pct}%</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{done}/{total} chapters</p>
                      <button onClick={() => { const total2 = prompt("Total chapters:", String(total || 10)); const done2 = prompt("Chapters completed:", String(done || 0)); if (total2 && done2) fetch("/api/planner/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId: s.id, chaptersTotal: Number(total2), chaptersDone: Number(done2) }) }).then(loadAll); }} className="text-xs text-indigo-600 hover:underline mt-1">✏️ Edit chapters</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${modalType === "class" ? "Add" : "Edit"} ${modalType === "class" ? "Class" : modalType}`}
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}
      >
        <div className="space-y-4">
          {modalType === "subject" ? (
            <>
              <Input label="Subject Name" value={form.name || ""} onChange={(v) => setForm({ ...form, name: v })} />
              <Input label="Color (hex)" value={form.color || "#6366f1"} onChange={(v) => setForm({ ...form, color: v })} />
              <Input label="Description" value={form.description || ""} onChange={(v) => setForm({ ...form, description: v })} />
            </>
          ) : (
            <>
              <Select label="Subject" value={form.subjectId || ""} onChange={(v) => setForm({ ...form, subjectId: v })} options={subjects.map((s) => ({ value: String(s.id), label: s.name }))} />
              {modalType === "class" && (
                <>
                  <Input label="Class Title" value={form.title || ""} onChange={(v) => setForm({ ...form, title: v })} placeholder="e.g. DSA Lecture" />
                  <Select label="Day" value={form.dayOfWeek || "1"} onChange={(v) => setForm({ ...form, dayOfWeek: v })} options={DAYS.map((d, i) => ({ value: String(i), label: d }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Start Time" value={form.startTime || "09:00"} onChange={(v) => setForm({ ...form, startTime: v })} />
                    <Input label="End Time" value={form.endTime || "10:00"} onChange={(v) => setForm({ ...form, endTime: v })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Room" value={form.room || ""} onChange={(v) => setForm({ ...form, room: v })} />
                    <Input label="Teacher" value={form.teacher || ""} onChange={(v) => setForm({ ...form, teacher: v })} />
                  </div>
                </>
              )}
              {modalType === "exam" && (
                <>
                  <Input label="Exam Title" value={form.title || ""} onChange={(v) => setForm({ ...form, title: v })} placeholder="e.g. Mid-Term Exam" />
                  <Input label="Exam Date" value={form.examDate || ""} onChange={(v) => setForm({ ...form, examDate: v })} type="datetime-local" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Room" value={form.room || ""} onChange={(v) => setForm({ ...form, room: v })} />
                    <Input label="Marks" value={form.marks || "100"} onChange={(v) => setForm({ ...form, marks: v })} />
                  </div>
                </>
              )}
              {modalType === "assignment" && (
                <>
                  <Input label="Assignment Title" value={form.title || ""} onChange={(v) => setForm({ ...form, title: v })} />
                  <Input label="Description" value={form.description || ""} onChange={(v) => setForm({ ...form, description: v })} />
                  <Input label="Due Date" value={form.dueDate || ""} onChange={(v) => setForm({ ...form, dueDate: v })} type="datetime-local" />
                  <Input label="Marks" value={form.marks || "100"} onChange={(v) => setForm({ ...form, marks: v })} />
                </>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
