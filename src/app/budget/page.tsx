"use client";

import React, { useState, useEffect } from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import { Card, CardHeader, Badge, Button, Input, Select, Modal, EmptyState, StatCard } from "@/components/ui";

const CATEGORIES = [
  { value: "food", label: "🍽 Food", color: "#f97316" },
  { value: "travel", label: "🚌 Travel", color: "#3b82f6" },
  { value: "stationery", label: "✏️ Stationery", color: "#8b5cf6" },
  { value: "other", label: "📦 Other", color: "#64748b" },
];

export default function BudgetPage() {
  const [budget, setBudget] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ category: "food", amount: "", description: "", date: "" });
  const [editId, setEditId] = useState<number | null>(null);

  const loadAll = async () => {
    const [b, e] = await Promise.all([
      fetch("/api/budget").then((r) => r.json()),
      fetch("/api/budget/expenses").then((r) => r.json()),
    ]);
    setBudget(b.budget);
    setExpenses(e.expenses || []);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const monthExpenses = expenses.filter((e) => new Date(e.spentAt) >= monthStart && new Date(e.spentAt) <= monthEnd);
  const spent = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const limit = budget?.monthlyLimit || 8000;
  const remaining = limit - spent;
  const daysLeft = monthEnd.getDate() - now.getDate();
  const dailyAvg = daysLeft > 0 ? Math.round(remaining / daysLeft) : 0;

  const byCategory = CATEGORIES.map((c) => ({
    ...c,
    total: monthExpenses.filter((e) => e.category === c.value).reduce((sum, e) => sum + Number(e.amount), 0),
  }));

  // Last 7 days spending
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const dailyData = last7Days.map((d) => {
    const dayExpenses = expenses.filter((e) => {
      const ed = new Date(e.spentAt);
      return ed.toDateString() === d.toDateString();
    });
    return { date: d, total: dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0) };
  });

  const handleSave = async () => {
    if (!form.amount) return;
    if (editId) {
      await fetch(`/api/budget/expenses/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/budget/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setModalOpen(false);
    setEditId(null);
    setForm({ category: "food", amount: "", description: "", date: "" });
    loadAll();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/budget/expenses/${id}`, { method: "DELETE" });
    loadAll();
  };

  const handleBudgetSave = async () => {
    const res = await fetch("/api/budget", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ monthlyLimit: Number(budget?.monthlyLimit) }) });
    if (res.ok) loadAll();
  };

  if (loading) return <div className="animate-pulse text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Budget Manager</h1>
        <p className="text-slate-500">Track spending, set budgets, split with friends</p>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💵" label="Monthly Budget" value={`₹${limit.toLocaleString("en-IN")}`} color="indigo" />
        <StatCard icon="💸" label="Spent This Month" value={`₹${spent.toLocaleString("en-IN")}`} color="red" sublabel={`${monthExpenses.length} expenses`} />
        <StatCard icon="✅" label="Remaining" value={`₹${Math.max(0, remaining).toLocaleString("en-IN")}`} color="green" />
        <StatCard icon="📅" label="Daily Limit" value={`₹${dailyAvg.toLocaleString("en-IN")}`} color="orange" sublabel={`${daysLeft} days left`} />
      </div>

      {/* Budget bar */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-700">Monthly Budget Progress</p>
          <p className="text-sm text-slate-500">{Math.round((spent / limit) * 100)}% used</p>
        </div>
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full transition-all" style={{ width: `${Math.min(100, (spent / limit) * 100)}%` }} />
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Spending by Category Chart */}
        <Card>
          <CardHeader title="Spending by Category" icon="📊" />
          <div className="p-4">
            <Doughnut
              data={{
                labels: byCategory.map((c) => c.label),
                datasets: [{ data: byCategory.map((c) => c.total), backgroundColor: byCategory.map((c) => c.color), borderWidth: 2, borderColor: "#fff" }],
              }}
              options={{ responsive: true, plugins: { legend: { position: "bottom" } } }}
            />
          </div>
        </Card>

        {/* Daily Spending Chart */}
        <Card>
          <CardHeader title="Last 7 Days Spending" icon="📈" />
          <div className="p-4">
            <Bar
              data={{
                labels: dailyData.map((d) => d.date.toLocaleDateString("en-US", { weekday: "short" })),
                datasets: [{ label: "Amount (₹)", data: dailyData.map((d) => d.total), backgroundColor: "#6366f1", borderRadius: 4 }],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </div>
        </Card>
      </div>

      {/* Budget Editor + Add Expense */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Set Monthly Budget" icon="🎯" />
          <div className="p-4 space-y-3">
            <Input label="Monthly Budget (₹)" value={String(budget?.monthlyLimit || 8000)} onChange={(v) => setBudget({ ...budget, monthlyLimit: v })} type="number" />
            <Button onClick={handleBudgetSave}>Save Budget</Button>
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg text-sm text-indigo-700">
              💡 Tip: Set a realistic budget based on your monthly expenses. Track daily spending to stay on budget.
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Add Expense" icon="➕" />
          <div className="p-4 space-y-3">
            <Select label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} />
            <Input label="Amount (₹)" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} type="number" placeholder="250" />
            <Input label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="What did you spend on?" />
            <Input label="Date" value={form.date ? form.date.slice(0, 10) : ""} onChange={(v) => setForm({ ...form, date: v })} type="date" />
            <Button onClick={handleSave} className="w-full">Add Expense</Button>
          </div>
        </Card>
      </div>

      {/* Expense List */}
      <Card>
        <CardHeader title="Expense History" icon="📋" />
        <div className="p-4">
          {expenses.length === 0 ? (
            <EmptyState icon="💰" title="No expenses yet" message="Add your first expense to start tracking" />
          ) : (
            <div className="space-y-2">
              {expenses.sort((a, b) => new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime()).map((e) => {
                const cat = CATEGORIES.find((c) => c.value === e.category);
                return (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: (cat?.color || "#64748b") + "20" }}>{cat?.label.split(" ")[0] || "📦"}</div>
                      <div>
                        <p className="font-medium text-slate-800">{e.description || cat?.label || "Expense"}</p>
                        <p className="text-xs text-slate-400">{new Date(e.spentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {cat?.label || e.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">₹{Number(e.amount).toLocaleString("en-IN")}</span>
                      <button onClick={() => handleDelete(e.id)} className="text-slate-300 hover:text-red-500">🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
