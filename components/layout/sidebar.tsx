"use client";

import Link from "next/link";

import { capitalize } from "@/lib/utils/format";
import type { UserRole } from "@/types/entities";

interface SidebarProps {
  pathname: string;
  role: UserRole;
  permissions?: string[];
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface SidebarItem {
  href: string;
  label: string;
  code: string;
  adminOnly: boolean;
  requiredPermission?: string;
}

const sidebarItems: SidebarItem[] = [
  { href: "/dashboard", label: "Dashboard", code: "DB", adminOnly: false },
  { href: "/items", label: "Items", code: "IT", adminOnly: false },
  { href: "/transactions", label: "Transactions", code: "TX", adminOnly: false },
  { href: "/roles", label: "Roles", code: "RL", adminOnly: false, requiredPermission: "manage_users" },
  { href: "/users", label: "Users", code: "US", adminOnly: true },
  { href: "/audit-logs", label: "Audit Logs", code: "AL", adminOnly: true }
];

export function Sidebar({ pathname, role, permissions, mobileOpen, onCloseMobile }: SidebarProps) {
  const grantedPermissions = new Set(permissions ?? []);
  const visibleItems = sidebarItems.filter((item) => {
    const passesRoleCheck = !item.adminOnly || role === "admin";
    const passesPermissionCheck = !item.requiredPermission || grantedPermissions.has(item.requiredPermission) || role === "admin";

    return passesRoleCheck && passesPermissionCheck;
  });

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/50 transition md:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onCloseMobile}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white/95 px-5 py-6 backdrop-blur transition-transform md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-strong)] p-4 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-teal-100">Inventra</p>
          <h1 className="font-display text-2xl font-semibold">Control Hub</h1>
          <p className="mt-1 text-xs text-teal-100">Inventory Management Suite</p>
        </div>

        <nav className="mt-6 space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 transition ${
                  isActive ? "bg-teal-50 text-[var(--primary-strong)]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
                onClick={onCloseMobile}
              >
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-[0.72rem] font-bold ${
                    isActive ? "bg-[var(--primary)] text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {item.code}
                </span>
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
          <p className="font-semibold text-slate-700">Current Role</p>
          <p className="mt-1">{capitalize(role)}</p>
        </div>
      </aside>
    </>
  );
}
