"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) router.replace("/dashboard");
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      router.replace("/dashboard");
    } else {
      setError(data.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🎓</div>
          <h1 className="text-3xl font-bold text-slate-900">CampusSathi</h1>
          <p className="text-slate-500 mt-1">All-in-One College Companion</p>
        </div>

        <div className="rounded-2xl bg-white shadow-lg border border-slate-200 p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Create your account 🚀</h2>

          {error && <div className="mb-4 px-3 py-2 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" value={name} onChange={setName} placeholder="Your name" />
            <Input label="Email" value={email} onChange={setEmail} type="email" placeholder="you@campus.edu" />
            <Input label="Password" value={password} onChange={setPassword} type="password" placeholder="At least 6 characters" />
            <Button type="submit" className="w-full" size="lg">
              {loading ? "Creating…" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
