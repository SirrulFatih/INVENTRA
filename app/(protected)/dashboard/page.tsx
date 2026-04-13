"use client";

import { useCallback, useEffect, useState } from "react";

import { ErrorState } from "@/components/common/error-state";
import { auditLogsApi } from "@/lib/api/audit-logs-api";
import { itemsApi } from "@/lib/api/items-api";
import { transactionsApi } from "@/lib/api/transactions-api";
import { formatDateTime } from "@/lib/utils/format";
import type { AuditLog } from "@/types/entities";

interface DashboardState {
  totalItems: number;
  totalTransactions: number;
  recentActivity: AuditLog[];
}

const INITIAL_STATE: DashboardState = {
  totalItems: 0,
  totalTransactions: 0,
  recentActivity: []
};

const ACTIVITY_ICON_MAP: Record<string, string> = {
  create: "🟢",
  update: "🟡",
  delete: "🔴",
  approve: "✅",
  reject: "❌",
  login: "🔐"
};

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const getActivityKey = (log: AuditLog) => {
  const action = String(log.action || "").toLowerCase();
  const description = String(log.description || "").toLowerCase();

  if (description.includes("reject")) {
    return "reject";
  }

  if (description.includes("approve")) {
    return "approve";
  }

  if (action.includes("delete")) {
    return "delete";
  }

  if (action.includes("create")) {
    return "create";
  }

  if (action.includes("update")) {
    return "update";
  }

  if (action.includes("reject")) {
    return "reject";
  }

  if (action.includes("approve")) {
    return "approve";
  }

  if (action.includes("login")) {
    return "login";
  }

  return "update";
};

const getActivityIcon = (log: AuditLog) => {
  const activityKey = getActivityKey(log);
  return ACTIVITY_ICON_MAP[activityKey] ?? "🟡";
};

function formatActivity(log: AuditLog) {
  const actorName = log.user?.name ?? `User ${log.userId}`;
  const activityKey = getActivityKey(log);
  const entityName = String(log.tableName || "record").toLowerCase();

  if (activityKey === "login") {
    return `${actorName} logged in`;
  }

  const actionWord =
    activityKey === "create"
      ? "created"
      : activityKey === "delete"
        ? "deleted"
        : activityKey === "approve"
          ? "approved"
          : activityKey === "reject"
            ? "rejected"
            : "updated";

  return `${actorName} ${actionWord} ${entityName} #${log.recordId}`;
}

const formatRelativeTime = (dateValue: string) => {
  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  const diffInSeconds = Math.floor((parsedDate.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(diffInSeconds);

  if (absSeconds < 60) {
    return RELATIVE_TIME_FORMATTER.format(diffInSeconds, "second");
  }

  if (absSeconds < 3600) {
    return RELATIVE_TIME_FORMATTER.format(Math.floor(diffInSeconds / 60), "minute");
  }

  if (absSeconds < 86400) {
    return RELATIVE_TIME_FORMATTER.format(Math.floor(diffInSeconds / 3600), "hour");
  }

  if (absSeconds < 604800) {
    return RELATIVE_TIME_FORMATTER.format(Math.floor(diffInSeconds / 86400), "day");
  }

  return formatDateTime(dateValue);
};

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [itemsSummary, transactionsSummary, activitySummary] = await Promise.all([
        itemsApi.getItems({ page: 1, limit: 1 }),
        transactionsApi.getTransactions({ page: 1, limit: 1, sortBy: "createdAt", order: "desc" }),
        auditLogsApi.getAuditLogs({ page: 1, limit: 5 })
      ]);

      setState({
        totalItems: itemsSummary.total,
        totalTransactions: transactionsSummary.total,
        recentActivity: activitySummary.data
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gagal memuat dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  return (
    <div className="space-y-6">
      <div className="card-surface p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Executive Summary</p>
        <h1 className="font-display mt-2 text-2xl font-semibold text-slate-800">Operational Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">
          Monitor kondisi item, pergerakan stok, dan aktivitas terbaru sistem Inventra.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card-surface p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Total Items</p>
          <p className="font-display mt-3 text-4xl font-semibold text-slate-800">{state.totalItems}</p>
          <p className="mt-1 text-xs text-slate-500">Jumlah item terdaftar di inventori</p>
        </div>

        <div className="card-surface p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Total Transactions</p>
          <p className="font-display mt-3 text-4xl font-semibold text-slate-800">{state.totalTransactions}</p>
          <p className="mt-1 text-xs text-slate-500">Riwayat pergerakan stok tercatat</p>
        </div>
      </div>

      <div className="card-surface p-5">
        <h2 className="font-display mb-4 text-lg font-semibold text-slate-800">Recent Activity</h2>

        {loading ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Loading activity...</p>
        ) : state.recentActivity.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5">
            <p className="text-sm font-semibold text-slate-700">No activity yet 📭</p>
            <p className="mt-1 text-sm text-slate-500">
              System activity will appear here once users start using the system.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {state.recentActivity.map((log) => (
              <li key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="pt-0.5 text-base leading-none">{getActivityIcon(log)}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{formatActivity(log)}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatRelativeTime(log.createdAt)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
