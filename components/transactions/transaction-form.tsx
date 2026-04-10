"use client";

import { useMemo, useState } from "react";

import type { Item, TransactionType } from "@/types/entities";

interface TransactionFormValues {
  itemId: number;
  type: TransactionType;
  quantity: number;
}

interface TransactionFormProps {
  items: Item[];
  submitting: boolean;
  onSubmit: (payload: TransactionFormValues) => Promise<void>;
}

export function TransactionForm({ items, submitting, onSubmit }: TransactionFormProps) {
  const [itemId, setItemId] = useState<number>(0);
  const [type, setType] = useState<TransactionType>("IN");
  const [quantity, setQuantity] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);

  const sortedItems = useMemo(() => {
    return [...items].sort((left, right) => left.name.localeCompare(right.name));
  }, [items]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!itemId) {
      setFormError("Pilih item terlebih dahulu.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setFormError("Quantity harus lebih dari 0.");
      return;
    }

    await onSubmit({ itemId, type, quantity });
    setQuantity(1);
  };

  return (
    <form className="card-surface grid gap-3 p-4 md:grid-cols-6" onSubmit={handleSubmit}>
      <label className="text-sm font-medium text-slate-700 md:col-span-2">
        Item
        <select
          value={itemId}
          onChange={(event) => setItemId(Number(event.target.value))}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
        >
          <option value={0}>Pilih item...</option>
          {sortedItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} (Stock: {item.stock})
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium text-slate-700 md:col-span-1">
        Type
        <select
          value={type}
          onChange={(event) => setType(event.target.value as TransactionType)}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
        >
          <option value="IN">IN</option>
          <option value="OUT">OUT</option>
        </select>
      </label>

      <label className="text-sm font-medium text-slate-700 md:col-span-1">
        Quantity
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
        />
      </label>

      <div className="flex items-end md:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Menyimpan..." : "Buat Transaksi"}
        </button>
      </div>

      {formError ? <p className="text-xs font-medium text-red-600 md:col-span-6">{formError}</p> : null}
    </form>
  );
}
