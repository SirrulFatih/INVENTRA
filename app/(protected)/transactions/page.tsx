"use client";

import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { Pagination } from "@/components/common/pagination";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { useAuthUser } from "@/hooks/use-auth-user";
import { itemsApi } from "@/lib/api/items-api";
import { transactionsApi } from "@/lib/api/transactions-api";
import { formatDateTime } from "@/lib/utils/format";
import type { Item, InventoryTransaction, TransactionStatus, TransactionType } from "@/types/entities";

type SortBy = "createdAt" | "quantity";
type SortOrder = "asc" | "desc";
type ApprovalAction = "approve" | "reject";

interface ApprovalConfirmationState {
  transactionId: number;
  action: ApprovalAction;
}

const STATUS_STYLES: Record<TransactionStatus, string> = {
  PENDING: "border border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border border-red-200 bg-red-50 text-red-700"
};

const STATUS_LABELS: Record<TransactionStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected"
};

export default function TransactionsPage() {
  const user = useAuthUser();

  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState<"" | TransactionType>("");
  const [statusFilter, setStatusFilter] = useState<"" | TransactionStatus>("");
  const [itemFilter, setItemFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [order, setOrder] = useState<SortOrder>("desc");

  const [loadingList, setLoadingList] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [creating, setCreating] = useState(false);
  const [actioningTransactionId, setActioningTransactionId] = useState<number | null>(null);
  const [actioningType, setActioningType] = useState<ApprovalAction | null>(null);
  const [approvalConfirmation, setApprovalConfirmation] = useState<ApprovalConfirmationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canApproveTransaction = Boolean(user?.permissions?.includes("approve_transaction"));
  const hasActiveFilters =
    typeFilter !== "" || statusFilter !== "" || itemFilter !== "" || sortBy !== "createdAt" || order !== "desc";

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
        status: statusFilter || undefined,
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
  }, [itemFilter, order, page, sortBy, statusFilter, typeFilter]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    if (!approvalConfirmation) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && actioningTransactionId === null) {
        setApprovalConfirmation(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [actioningTransactionId, approvalConfirmation]);

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

  const handleResetFilters = () => {
    setTypeFilter("");
    setStatusFilter("");
    setItemFilter("");
    setSortBy("createdAt");
    setOrder("desc");
    setPage(1);
  };

  const handleApprovalAction = async (transactionId: number, action: ApprovalAction) => {
    setActioningTransactionId(transactionId);
    setActioningType(action);
    setError(null);
    setNotice(null);

    try {
      if (action === "approve") {
        await transactionsApi.approveTransaction(transactionId);
        setNotice(`Transaksi #${transactionId} berhasil di-approve.`);
      } else {
        await transactionsApi.rejectTransaction(transactionId);
        setNotice(`Transaksi #${transactionId} berhasil di-reject.`);
      }

      await Promise.all([loadTransactions(), loadItems()]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gagal memproses approval transaksi.");
    } finally {
      setActioningTransactionId(null);
      setActioningType(null);
    }
  };

  const requestApprovalAction = (transactionId: number, action: ApprovalAction) => {
    setApprovalConfirmation({ transactionId, action });
  };

  const handleConfirmApprovalAction = async () => {
    if (!approvalConfirmation) {
      return;
    }

    const { transactionId, action } = approvalConfirmation;
    setApprovalConfirmation(null);
    await handleApprovalAction(transactionId, action);
  };

  const handleCancelApprovalAction = () => {
    setApprovalConfirmation(null);
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
        <div className="grid gap-3 md:grid-cols-6">
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
            Filter Status
            <select
              value={statusFilter}
              onChange={(event) => handleFilterChange(setStatusFilter, event.target.value as "" | TransactionStatus)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            >
              <option value="">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
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

          <button
            type="button"
            onClick={handleResetFilters}
            disabled={!hasActiveFilters || loadingList}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 md:self-end"
          >
            Reset
          </button>

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
                    <th>Status</th>
                    <th>Approval</th>
                    <th>User</th>
                    <th>Created</th>
                    <th>Actions</th>
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
                      <td>
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${STATUS_STYLES[transaction.status]}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td>
                        {transaction.status === "APPROVED" && transaction.approvedBy ? (
                          <div className="text-xs leading-relaxed text-slate-600">
                            <p className="font-semibold text-slate-700">{transaction.approvedBy}</p>
                            <p>{transaction.approvedAt ? formatDateTime(transaction.approvedAt) : "-"}</p>
                          </div>
                        ) : transaction.status === "REJECTED" ? (
                          <span className="text-xs font-medium text-red-600">Rejected</span>
                        ) : transaction.status === "PENDING" ? (
                          <span className="text-xs font-medium text-amber-700">Waiting approval</span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td>{transaction.user?.name ?? `User ${transaction.userId}`}</td>
                      <td>{formatDateTime(transaction.createdAt)}</td>
                      <td>
                        {transaction.status === "PENDING" && canApproveTransaction ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => requestApprovalAction(transaction.id, "approve")}
                              disabled={actioningTransactionId === transaction.id}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {actioningTransactionId === transaction.id && actioningType === "approve" ? "Approving..." : "Approve"}
                            </button>
                            <button
                              type="button"
                              onClick={() => requestApprovalAction(transaction.id, "reject")}
                              disabled={actioningTransactionId === transaction.id}
                              className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {actioningTransactionId === transaction.id && actioningType === "reject" ? "Rejecting..." : "Reject"}
                            </button>
                          </div>
                        ) : transaction.status === "PENDING" ? (
                          <span className="text-xs text-slate-400">No permission</span>
                        ) : (
                          <span className="text-xs text-slate-400">{STATUS_LABELS[transaction.status]}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )
      ) : null}

      {approvalConfirmation ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={actioningTransactionId === null ? handleCancelApprovalAction : undefined}
        >
          <div className="card-surface w-full max-w-md p-6" onClick={(event) => event.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold text-slate-800">Konfirmasi Aksi</h3>
            <p className="mt-2 text-sm text-slate-600">
              {approvalConfirmation.action === "approve"
                ? `Approve transaksi #${approvalConfirmation.transactionId}?`
                : `Reject transaksi #${approvalConfirmation.transactionId}?`}
            </p>
            <p className="mt-1 text-xs text-slate-500">Aksi ini tidak dapat dibatalkan.</p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelApprovalAction}
                disabled={actioningTransactionId !== null}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmApprovalAction()}
                disabled={actioningTransactionId !== null}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  approvalConfirmation.action === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {approvalConfirmation.action === "approve" ? "Ya, Approve" : "Ya, Reject"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
