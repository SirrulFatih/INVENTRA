"use client";

import type { User } from "@/types/entities";

interface TopbarProps {
  user: User;
  onToggleMobileSidebar: () => void;
  onLogout: () => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export function Topbar({ user, onToggleMobileSidebar, onLogout }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 md:hidden"
            onClick={onToggleMobileSidebar}
          >
            <span className="text-lg">≡</span>
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Inventory Platform</p>
            <h2 className="font-display text-lg font-semibold text-slate-800">Inventra Operations</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-800">{user.name}</p>
            <p className="text-xs text-slate-500">{user.role}</p>
          </div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-white">
            {getInitials(user.name)}
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
