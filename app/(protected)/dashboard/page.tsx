"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { ErrorState } from "@/components/common/error-state";
import { auditLogsApi } from "@/lib/api/audit-logs-api";
import { itemsApi } from "@/lib/api/items-api";
import { transactionsApi } from "@/lib/api/transactions-api";
import { formatDateTime } from "@/lib/utils/format";
import type { AuditLog, InventoryTransaction, Item } from "@/types/entities";

interface DashboardState {
  totalItems: number;
  totalTransactions: number;
  recentActivity: AuditLog[];
  recentItems: Item[];
  recentTransactions: InventoryTransaction[];
  analyticsTransactions: InventoryTransaction[];
}

const INITIAL_STATE: DashboardState = {
  totalItems: 0,
  totalTransactions: 0,
  recentActivity: [],
  recentItems: [],
  recentTransactions: [],
  analyticsTransactions: []
};

const ACTION_BADGE_STYLES: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-yellow-100 text-yellow-700",
  delete: "bg-red-100 text-red-700",
  approve: "bg-blue-100 text-blue-700",
  reject: "bg-red-200 font-semibold text-red-800",
  login: "bg-gray-100 text-gray-700"
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

const getActionLabel = (log: AuditLog) => {
  return getActivityKey(log).toUpperCase();
};

const getActionBadgeStyle = (log: AuditLog) => {
  const activityKey = getActivityKey(log);
  return ACTION_BADGE_STYLES[activityKey] ?? ACTION_BADGE_STYLES.update;
};

const getEntityLabel = (log: AuditLog) => {
  const entityName = log.entity ?? log.tableName ?? "System";
  return String(entityName);
};

const getUserLabel = (log: AuditLog) => {
  return log.user?.name ?? `User ${log.userId}`;
};

const getActivityDetail = (
  log: AuditLog,
  transactionById: Map<number, InventoryTransaction>,
  itemById: Map<number, Item>
) => {
  const entityName = String(log.entity ?? log.tableName ?? "").toLowerCase();

  if (entityName.includes("transaction")) {
    const transaction = transactionById.get(log.recordId);

    if (transaction) {
      const itemName = transaction.item?.name ?? `Item ${transaction.itemId}`;
      return `${transaction.type} • ${itemName} × ${transaction.quantity}`;
    }

    return log.description || `Transaction #${log.recordId}`;
  }

  if (entityName.includes("item")) {
    const item = itemById.get(log.recordId);

    if (item) {
      return item.name;
    }

    return log.description || `Item #${log.recordId}`;
  }

  return log.description || "-";
};

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
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Search/filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [entityFilter, setEntityFilter] = useState("All");

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const transactionById = useMemo(() => {
    return new Map(state.recentTransactions.map((transaction) => [transaction.id, transaction]));
  }, [state.recentTransactions]);

  const itemById = useMemo(() => {
    return new Map(state.recentItems.map((item) => [item.id, item]));
  }, [state.recentItems]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setAnalyticsLoading(true);
    setError(null);

    try {
      const [itemsSummary, transactionsSummary, activitySummary, analyticsSummary] = await Promise.all([
        itemsApi.getItems({ page: 1, limit: 100 }),
        transactionsApi.getTransactions({ page: 1, limit: 20, sortBy: "createdAt", order: "desc" }),
        auditLogsApi.getAuditLogs({ page: 1, limit: 10 }),
        transactionsApi.getTransactions({ page: 1, limit: 100, sortBy: "createdAt", order: "desc" })
      ]);

      setState({
        totalItems: itemsSummary.total,
        totalTransactions: transactionsSummary.total,
        recentActivity: activitySummary.data,
        recentItems: itemsSummary.data,
        recentTransactions: transactionsSummary.data,
        analyticsTransactions: analyticsSummary.data
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gagal memuat dashboard.");
    } finally {
      setLoading(false);
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  // Filter logic
  const filteredLogs = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return state.recentActivity.filter((log) => {
      // Search: user name, entity, detail
      const user = getUserLabel(log).toLowerCase();
      const entity = getEntityLabel(log).toLowerCase();
      const detail = getActivityDetail(log, transactionById, itemById).toLowerCase();
      const matchesSearch = !q || user.includes(q) || entity.includes(q) || detail.includes(q);
      // Action filter
      const action = getActionLabel(log);
      const matchesAction = actionFilter === "All" || action === actionFilter;
      // Entity filter
      const matchesEntity = entityFilter === "All" || entity === entityFilter.toLowerCase();
      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [state.recentActivity, debouncedSearch, actionFilter, entityFilter, transactionById, itemById]);

  const recentAnalyticsTransactions = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;

    return state.analyticsTransactions.filter((transaction) => {
      const createdAtMs = new Date(transaction.createdAt).getTime();

      if (Number.isNaN(createdAtMs)) {
        return false;
      }

      return createdAtMs >= cutoff;
    });
  }, [state.analyticsTransactions]);

  const transactionsPerDay = useMemo(() => {
    const dailyTotals = new Map<string, number>();

    recentAnalyticsTransactions.forEach((transaction) => {
      const dateKey = transaction.createdAt.slice(0, 10);
      dailyTotals.set(dateKey, (dailyTotals.get(dateKey) ?? 0) + 1);
    });

    return Array.from(dailyTotals.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [recentAnalyticsTransactions]);

  const inOutBreakdown = useMemo(() => {
    let inTotal = 0;
    let outTotal = 0;

    recentAnalyticsTransactions.forEach((transaction) => {
      if (transaction.type === "IN") {
        inTotal += 1;
      }

      if (transaction.type === "OUT") {
        outTotal += 1;
      }
    });

    return [
      { type: "IN", total: inTotal },
      { type: "OUT", total: outTotal }
    ];
  }, [recentAnalyticsTransactions]);

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
        <h2 className="font-display text-lg font-semibold text-slate-800">Transaction Analytics</h2>
        <p className="mt-1 text-sm text-slate-500">Overview of transaction trends and stock movement</p>

        {analyticsLoading ? (
          <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Loading analytics...</p>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-800">Transactions per Day</h3>
              <p className="mt-1 text-xs text-slate-500">Daily transaction volume in the last 30 days</p>
              {transactionsPerDay.length === 0 ? (
                <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No transaction data available
                </div>
              ) : (
                <div className="mt-3 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={transactionsPerDay} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "0.5rem",
                          borderColor: "#e2e8f0",
                          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.18)"
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={false}
                        isAnimationActive
                        animationDuration={700}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-800">IN vs OUT</h3>
              <p className="mt-1 text-xs text-slate-500">Inbound and outbound movement breakdown</p>
              {inOutBreakdown.every((entry) => entry.total === 0) ? (
                <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No transaction data available
                </div>
              ) : (
                <div className="mt-3 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inOutBreakdown} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="type" tick={{ fontSize: 11, fill: "#64748b" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "0.5rem",
                          borderColor: "#e2e8f0",
                          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.18)"
                        }}
                      />
                      <Bar dataKey="total" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={700}>
                        {inOutBreakdown.map((entry) => (
                          <Cell key={entry.type} fill={entry.type === "IN" ? "#22c55e" : "#ef4444"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="card-surface p-5">
        <h2 className="font-display mb-4 text-lg font-semibold text-slate-800">Recent Activity</h2>

        {/* Controls row */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-sm">
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              placeholder="Search activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:justify-end">
            <select
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 sm:w-44"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="All">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="APPROVE">APPROVE</option>
              <option value="REJECT">REJECT</option>
            </select>
            <select
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 sm:w-44"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
            >
              <option value="All">All Entities</option>
              <option value="transaction">transaction</option>
              <option value="item">item</option>
              <option value="user">user</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Loading activity...</p>
        ) : filteredLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5">
            <p className="text-sm font-semibold text-slate-700">No matching activity found 🔍</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Entity</th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredLogs.map((log) => {
                  const detail = getActivityDetail(log, transactionById, itemById);
                  return (
                    <tr key={log.id} className="transition-colors duration-150 hover:bg-gray-50">
                      <td
                        title={formatDateTime(log.createdAt)}
                        className="whitespace-nowrap px-4 py-3 text-sm text-gray-600"
                      >
                        {formatRelativeTime(log.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-800">{getUserLabel(log)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium uppercase tracking-wide ${getActionBadgeStyle(log)}`}
                        >
                          {getActionLabel(log)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="inline-flex rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{getEntityLabel(log)}</span>
                        <p className="mt-1 text-xs text-gray-500 lg:hidden">{detail}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-sm text-gray-600 lg:table-cell">{detail}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
