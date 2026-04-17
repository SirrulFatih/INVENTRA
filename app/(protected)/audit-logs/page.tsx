"use client";

import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { Pagination } from "@/components/common/pagination";
import { useAuthUser } from "@/hooks/use-auth-user";
import { auditLogsApi } from "@/lib/api/audit-logs-api";
import { formatDateTime } from "@/lib/utils/format";
import type { AuditAction, AuditLog, AuditTableName } from "@/types/entities";

export default function AuditLogsPage() {
  const user = useAuthUser();
  const canReadAuditLogs = Boolean(user?.permissions?.includes("read_audit_logs"));

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [userIdFilter, setUserIdFilter] = useState("");
  const [actionFilter, setActionFilter] = useState<"" | AuditAction>("");
  const [tableFilter, setTableFilter] = useState<"" | AuditTableName>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditLogs = useCallback(async () => {
    if (!canReadAuditLogs) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await auditLogsApi.getAuditLogs({
        page,
        limit: 10,
        userId: userIdFilter ? Number(userIdFilter) : undefined,
        action: actionFilter || undefined,
        tableName: tableFilter || undefined
      });

      setLogs(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gagal memuat audit logs.");
    } finally {
      setLoading(false);
    }
  }, [actionFilter, canReadAuditLogs, page, tableFilter, userIdFilter]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadAuditLogs();
  }, [loadAuditLogs, user]);

  const handleFilterChange = <T,>(setter: (value: T) => void, value: T) => {
    setPage(1);
    setter(value);
  };

  if (user && !canReadAuditLogs) {
    return <ErrorState message="Anda tidak memiliki permission read_audit_logs untuk mengakses halaman audit logs." />;
  }

  return (
    <div className="space-y-5">
      <div className="card-surface p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Governance</p>
        <h1 className="font-display mt-1 text-2xl font-semibold text-slate-800">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-500">Lacak aktivitas penting sistem untuk kebutuhan audit dan investigasi.</p>
      </div>

      <div className="card-surface p-5">
        <div className="grid gap-3 md:grid-cols-5">
          <label className="text-sm font-medium text-slate-700">
            User ID
            <input
              value={userIdFilter}
              onChange={(event) => handleFilterChange(setUserIdFilter, event.target.value)}
              placeholder="contoh: 1"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Action
            <select
              value={actionFilter}
              onChange={(event) => handleFilterChange(setActionFilter, event.target.value as "" | AuditAction)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            >
              <option value="">All</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Table
            <select
              value={tableFilter}
              onChange={(event) => handleFilterChange(setTableFilter, event.target.value as "" | AuditTableName)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            >
              <option value="">All</option>
              <option value="User">User</option>
              <option value="Item">Item</option>
              <option value="Transaction">Transaction</option>
            </select>
          </label>

          <button
            type="button"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 md:self-end"
            onClick={() => {
              setUserIdFilter("");
              setActionFilter("");
              setTableFilter("");
              setPage(1);
            }}
          >
            Reset Filter
          </button>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 md:self-end">Total: {total}</div>
        </div>
      </div>

      {loading ? <LoadingState label="Memuat audit logs..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={loadAuditLogs} /> : null}

      {!loading && !error ? (
        logs.length === 0 ? (
          <EmptyState title="Audit log tidak ditemukan" description="Coba ubah filter atau lakukan aktivitas baru di sistem." />
        ) : (
          <div className="card-surface p-4">
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Table</th>
                    <th>Record ID</th>
                    <th>Description</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>#{log.id}</td>
                      <td>{log.user?.name ?? `User ${log.userId}`}</td>
                      <td>{log.action}</td>
                      <td>{log.tableName}</td>
                      <td>{log.recordId}</td>
                      <td>{log.description || "-"}</td>
                      <td>{formatDateTime(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )
      ) : null}
    </div>
  );
}
