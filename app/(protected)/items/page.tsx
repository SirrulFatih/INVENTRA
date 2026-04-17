"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { Pagination } from "@/components/common/pagination";
import { ItemFormModal } from "./_components/item-form-modal";
import { useAuthUser } from "@/hooks/use-auth-user";
import { itemsApi } from "@/lib/api/items-api";
import { formatDateTime } from "@/lib/utils/format";
import type { Item } from "@/types/entities";

interface ItemFormValues {
  name: string;
  stock: number;
  description: string;
}

export default function ItemsPage() {
  const user = useAuthUser();
  const canReadItems = Boolean(user?.permissions?.includes("read_items") || user?.permissions?.includes("manage_items"));
  const canManageItems = Boolean(user?.permissions?.includes("manage_items"));

  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadItems = useCallback(async () => {
    if (!canReadItems) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await itemsApi.getItems({
        page,
        limit: 10,
        search: searchQuery || undefined
      });

      setItems(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gagal memuat item.");
    } finally {
      setLoading(false);
    }
  }, [canReadItems, page, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const modalTitle = useMemo(() => {
    return editingItem ? `Update Item #${editingItem.id}` : "Create New Item";
  }, [editingItem]);

  const openCreateModal = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSubmitItem = async (values: ItemFormValues) => {
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      if (editingItem) {
        await itemsApi.updateItem(editingItem.id, values);
        setNotice("Item berhasil diperbarui.");
      } else {
        await itemsApi.createItem(values);
        setNotice("Item baru berhasil dibuat.");
      }

      setModalOpen(false);
      setEditingItem(null);
      await loadItems();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Operasi item gagal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    const confirmed = window.confirm("Hapus item ini?");

    if (!confirmed) {
      return;
    }

    setError(null);
    setNotice(null);

    try {
      await itemsApi.deleteItem(itemId);
      setNotice("Item berhasil dihapus.");
      await loadItems();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gagal menghapus item.");
    }
  };

  if (user && !canReadItems) {
    return <ErrorState message="Anda tidak memiliki permission read_items untuk mengakses halaman item." />;
  }

  return (
    <div className="space-y-5">
      <div className="card-surface p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Inventory</p>
            <h1 className="font-display mt-1 text-2xl font-semibold text-slate-800">Items Management</h1>
            <p className="mt-1 text-sm text-slate-500">Kelola data item, stok, dan detail produk di gudang.</p>
          </div>

          {canManageItems ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]"
            >
              + Create Item
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            placeholder="Search by item name..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">Total: {total}</div>
        </div>

        {notice ? <p className="mt-3 text-xs font-medium text-emerald-700">{notice}</p> : null}
      </div>

      {loading ? <LoadingState label="Memuat daftar item..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={loadItems} /> : null}

      {!loading && !error ? (
        items.length === 0 ? (
          <EmptyState title="Item belum tersedia" description="Tambahkan item pertama untuk mulai mengelola inventori." />
        ) : (
          <div className="card-surface p-4">
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Stock</th>
                    <th>Description</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td className="font-semibold text-slate-800">{item.name}</td>
                      <td>{item.stock}</td>
                      <td>{item.description || "-"}</td>
                      <td>{formatDateTime(item.updatedAt)}</td>
                      <td>
                        {canManageItems ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              onClick={() => openEditModal(item)}
                            >
                              Update
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                              onClick={() => void handleDeleteItem(item.id)}
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
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

      {canManageItems ? (
        <ItemFormModal
          key={editingItem ? `edit-${editingItem.id}-${modalOpen}` : `create-${modalOpen}`}
          open={modalOpen}
          title={modalTitle}
          submitting={submitting}
          onClose={() => setModalOpen(false)}
          initialValues={
            editingItem
              ? {
                  name: editingItem.name,
                  stock: editingItem.stock,
                  description: editingItem.description ?? ""
                }
              : undefined
          }
          onSubmit={handleSubmitItem}
        />
      ) : null}
    </div>
  );
}
