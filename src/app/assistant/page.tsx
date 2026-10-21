"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, Button, Badge } from "@/components/ui";

interface Message {
  role: "user" | "assistant";
  text: string;
  suggestions?: string[];
}

const SUGGESTIONS = [
  "What assignments are due this week?",
  "Which college events are coming up?",
  "Find teammates for a Python project",
  "How much can I spend this week within my budget?",
  "What exams are coming up?",
  "Show me my subject progress",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hi! I'm your CampusSathi Smart Assistant 🤖. I can help you with assignments, events, budget, teammates, exams, and more! Ask me anything about your campus life." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const ask = async (question: string) => {
    const q = question || input;
    if (!q || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer, suggestions: data.suggestions }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Smart Campus Assistant</h1>
        <p className="text-slate-500">Ask me anything about your campus life</p>
      </div>

      <Card className="h-[70vh] flex flex-col">
        {/* Chat area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${m.role === "user" ? "order-2" : ""}`}>
                <div
                  className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                    m.role === "user" ? "bg-indigo-600 text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {m.suggestions.map((s, j) => (
                      <button
                        key={j}
                        onClick={() => ask(s)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:bg-slate-50 hover:border-indigo-300 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="p-3 rounded-2xl bg-slate-100 rounded-bl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full text-xs text-indigo-700 hover:bg-indigo-100 transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-slate-100 p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask("")}
            placeholder="Ask about your assignments, budget, events…"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button onClick={() => ask("")} disabled={loading || !input}>Send</Button>
        </div>
      </Card>

      {/* Capabilities */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { icon: "📋", label: "Assignment Deadlines" },
          { icon: "🎉", label: "Upcoming Events" },
          { icon: "🤝", label: "Find Teammates" },
          { icon: "💰", label: "Budget Advice" },
          { icon: "📝", label: "Exam Schedule" },
          { icon: "📊", label: "Progress Tracking" },
        ].map((c) => (
          <Card key={c.label} className="p-4 flex items-center gap-3">
            <span className="text-2xl">{c.icon}</span>
            <p className="text-sm font-medium text-slate-700">{c.label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
