"use client";

import React from "react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white shadow-sm border border-slate-200 ${className}`}>{children}</div>;
}

export function CardHeader({ title, icon, action }: { title: string; icon?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-5 border-b border-slate-100">
      <div className="flex items-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Badge({ children, color = "slate" }: { children: React.ReactNode; color?: "slate" | "green" | "blue" | "orange" | "red" | "purple" | "amber" }) {
  const colors: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    orange: "bg-orange-100 text-orange-800",
    red: "bg-red-100 text-red-800",
    purple: "bg-purple-100 text-purple-800",
    amber: "bg-amber-100 text-amber-800",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>{children}</span>;
}

export function Button({ children, onClick, variant = "primary", size = "md", className = "", type = "button", disabled }: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success";
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const variants: Record<string, string> = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-red-500 text-white hover:bg-red-600",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    success: "bg-green-600 text-white hover:bg-green-700",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`rounded-lg font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}>
      {children}
    </button>
  );
}

export function Input({ label, value, onChange, type = "text", placeholder, className = "" }: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${className}`} />
    </label>
  );
}

export function Select({ label, value, onChange, options, className = "" }: {
  label?: string;
  value: string | number;
  onChange: (v: string) => void;
  options: { value: string; label: string }[] | string[];
  className?: string;
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${className}`}>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Modal({ open, onClose, title, children, footer }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 p-5 border-t border-slate-100">{footer}</div>}
      </div>
    </div>
  );
}

export function StatCard({ icon, label, value, color = "indigo", sublabel }: {
  icon: string;
  label: string;
  value: string | number;
  color?: "indigo" | "green" | "orange" | "purple" | "blue" | "red";
  sublabel?: string;
}) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors[color]}`}>{icon}</div>
      </div>
    </Card>
  );
}

export function EmptyState({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="font-medium text-slate-700">{title}</p>
      <p className="text-sm text-slate-400 mt-1">{message}</p>
    </div>
  );
}
