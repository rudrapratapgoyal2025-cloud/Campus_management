import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusSathi — All-in-One College Companion",
  description: "Your smart campus companion: planner, budget, notices, lost & found, community, and AI assistant.",
};

import { AppShell } from "@/components/AppShell";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
