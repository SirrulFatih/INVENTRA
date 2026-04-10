"use client";

import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { itemsApi } from "@/lib/api/items-api";
import { transactionsApi } from "@/lib/api/transactions-api";
import { formatDateTime } from "@/lib/utils/format";
import type { InventoryTransaction } from "@/types/entities";

interface DashboardState {
  totalItems: number;
  totalTransactions: number;
  recentTransactions: InventoryTransaction[];
}

const INITIAL_STATE: DashboardState = {
  totalItems: 0,
  totalTransactions: 0,
  recentTransactions: []
};

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [itemsSummary, transactionsSummary] = await Promise.all([
        itemsApi.getItems({ page: 1, limit: 1 }),
        transactionsApi.getTransactions({ page: 1, limit: 5, sortBy: "createdAt", order: "desc" })
      ]);

      setState({
        totalItems: itemsSummary.total,
        totalTransactions: transactionsSummary.total,
        recentTransactions: transactionsSummary.data
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

  if (loading) {
    return <LoadingState label="Memuat ringkasan dashboard..." />;
  }

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
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-800">Recent Transactions</h2>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            onClick={() => void fetchDashboard()}
          >
            Refresh
          </button>
        </div>

        {state.recentTransactions.length === 0 ? (
          <EmptyState title="Belum ada transaksi" description="Aktivitas transaksi akan muncul setelah tim mulai membuat pergerakan stok." />
        ) : (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>User</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {state.recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>#{transaction.id}</td>
                    <td>{transaction.item?.name ?? `Item ${transaction.itemId}`}</td>
                    <td>
                      <span className={`badge ${transaction.type === "IN" ? "badge-in" : "badge-out"}`}>{transaction.type}</span>
                    </td>
                    <td>{transaction.quantity}</td>
                    <td>{transaction.user?.name ?? `User ${transaction.userId}`}</td>
                    <td>{formatDateTime(transaction.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
