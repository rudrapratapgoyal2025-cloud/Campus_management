"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/planner", label: "Planner", icon: "📅" },
  { href: "/budget", label: "Budget", icon: "💰" },
  { href: "/noticeboard", label: "Noticeboard", icon: "📢" },
  { href: "/lost-found", label: "Lost & Found", icon: "🔍" },
  { href: "/community", label: "Community", icon: "👥" },
  { href: "/assistant", label: "Assistant", icon: "🤖" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/login" || pathname === "/register") {
      setLoading(false);
      return;
    }
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          router.replace("/login");
        }
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-pulse text-slate-400">Loading CampusSathi…</div>
      </div>
    );
  }
  
  if (pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

  if (!user) return null;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <Link href="/dashboard" className="flex items-center gap-2 p-5 border-b border-slate-100">
          <span className="text-3xl">🎓</span>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">CampusSathi</h1>
            <p className="text-xs text-slate-400">College Companion</p>
          </div>
        </Link>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 flex items-center justify-between p-3">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-slate-100">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
          </button>
          <div className="flex items-center gap-1">
            <span className="text-xl">🎓</span>
            <span className="font-bold text-slate-900">CampusSathi</span>
          </div>
          <div className="w-8" />
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
