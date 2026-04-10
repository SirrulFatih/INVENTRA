"use client";

import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { Pagination } from "@/components/common/pagination";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { itemsApi } from "@/lib/api/items-api";
import { transactionsApi } from "@/lib/api/transactions-api";
import { formatDateTime } from "@/lib/utils/format";
import type { Item, InventoryTransaction, TransactionType } from "@/types/entities";

type SortBy = "createdAt" | "quantity";
type SortOrder = "asc" | "desc";

export default function TransactionsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState<"" | TransactionType>("");
  const [itemFilter, setItemFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [order, setOrder] = useState<SortOrder>("desc");

  const [loadingList, setLoadingList] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoadingItems(true);

    try {
      const response = await itemsApi.getItems({ page: 1, limit: 100 });
      setItems(response.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gagal memuat daftar item.");
    } finally {
      setLoadingItems(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoadingList(true);
    setError(null);

    try {
      const response = await transactionsApi.getTransactions({
        page,
        limit: 10,
        type: typeFilter || undefined,
        itemId: itemFilter ? Number(itemFilter) : undefined,
        sortBy,
        order
      });

      setTransactions(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gagal memuat transaksi.");
    } finally {
      setLoadingList(false);
    }
  }, [itemFilter, order, page, sortBy, typeFilter]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const handleCreateTransaction = async (payload: {
    itemId: number;
    type: TransactionType;
    quantity: number;
  }) => {
    setCreating(true);
    setError(null);
    setNotice(null);

    try {
      await transactionsApi.createTransaction(payload);
      setNotice("Transaksi berhasil dibuat.");
      await Promise.all([loadTransactions(), loadItems()]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gagal membuat transaksi.");
    } finally {
      setCreating(false);
    }
  };

  const handleFilterChange = <T,>(setter: (value: T) => void, value: T) => {
    setPage(1);
    setter(value);
  };

  return (
    <div className="space-y-5">
      <div className="card-surface p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Stock Movement</p>
        <h1 className="font-display mt-1 text-2xl font-semibold text-slate-800">Transactions</h1>
        <p className="mt-1 text-sm text-slate-500">Catat transaksi IN dan OUT untuk menjaga akurasi stok harian.</p>
      </div>

      {loadingItems ? (
        <LoadingState label="Memuat data item untuk transaksi..." />
      ) : (
        <TransactionForm items={items} submitting={creating} onSubmit={handleCreateTransaction} />
      )}

      <div className="card-surface p-5">
        <div className="grid gap-3 md:grid-cols-5">
          <label className="text-sm font-medium text-slate-700">
            Filter Type
            <select
              value={typeFilter}
              onChange={(event) => handleFilterChange(setTypeFilter, event.target.value as "" | TransactionType)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            >
              <option value="">All</option>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Filter Item
            <select
              value={itemFilter}
              onChange={(event) => handleFilterChange(setItemFilter, event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            >
              <option value="">All Items</option>
              {items.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Sort By
            <select
              value={sortBy}
              onChange={(event) => handleFilterChange(setSortBy, event.target.value as SortBy)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            >
              <option value="createdAt">Created At</option>
              <option value="quantity">Quantity</option>
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Order
            <select
              value={order}
              onChange={(event) => handleFilterChange(setOrder, event.target.value as SortOrder)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 md:self-end">Total: {total}</div>
        </div>

        {notice ? <p className="mt-3 text-xs font-medium text-emerald-700">{notice}</p> : null}
      </div>

      {loadingList ? <LoadingState label="Memuat daftar transaksi..." /> : null}
      {!loadingList && error ? <ErrorState message={error} onRetry={loadTransactions} /> : null}

      {!loadingList && !error ? (
        transactions.length === 0 ? (
          <EmptyState title="Transaksi belum tersedia" description="Buat transaksi pertama untuk mulai melacak arus stok." />
        ) : (
          <div className="card-surface p-4">
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
                  {transactions.map((transaction) => (
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

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )
      ) : null}
    </div>
  );
}
