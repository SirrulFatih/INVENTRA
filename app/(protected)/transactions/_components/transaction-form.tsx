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
  disabled?: boolean;
  disabledMessage?: string;
  onSubmit: (payload: TransactionFormValues) => Promise<void>;
}

const getAvailableStock = (item: Item) => {
  if (typeof item.availableStock === "number") {
    return Math.max(0, item.availableStock);
  }

  return Math.max(0, item.stock - item.reservedStock);
};

export function TransactionForm({ items, submitting, disabled = false, disabledMessage, onSubmit }: TransactionFormProps) {
  const [itemId, setItemId] = useState<number>(0);
  const [type, setType] = useState<TransactionType>("IN");
  const [quantity, setQuantity] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);

  const sortedItems = useMemo(() => {
    return [...items].sort((left, right) => left.name.localeCompare(right.name));
  }, [items]);

  const selectedItem = useMemo(() => {
    return sortedItems.find((item) => item.id === itemId) ?? null;
  }, [itemId, sortedItems]);

  const availableStock = selectedItem ? getAvailableStock(selectedItem) : 0;
  const isOutTransaction = type === "OUT";

  const quantityOverAvailable = Boolean(itemId && isOutTransaction && quantity > availableStock);
  const quantityInvalid = !Number.isInteger(quantity) || quantity <= 0;
  const submitDisabled = disabled || submitting || itemId === 0 || quantityInvalid || quantityOverAvailable;

  const helperMessage = isOutTransaction && itemId !== 0 ? `Max available: ${availableStock}` : null;
  const stockErrorMessage = quantityOverAvailable ? "Insufficient available stock" : null;

  const handleItemChange = (nextItemId: number) => {
    setItemId(nextItemId);

    if (type === "OUT" && nextItemId !== 0) {
      const nextItem = sortedItems.find((item) => item.id === nextItemId);
      const nextAvailableStock = nextItem ? getAvailableStock(nextItem) : 0;

      setQuantity((previousQuantity) => Math.min(previousQuantity, nextAvailableStock));
    }
  };

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);

    if (nextType === "OUT" && itemId !== 0) {
      setQuantity((previousQuantity) => Math.min(previousQuantity, availableStock));
    }
  };

  const handleQuantityChange = (nextRawValue: string) => {
    const parsedQuantity = Number(nextRawValue);

    if (!Number.isFinite(parsedQuantity)) {
      setQuantity(0);
      return;
    }

    let nextQuantity = Math.floor(parsedQuantity);

    if (nextQuantity < 0) {
      nextQuantity = 0;
    }

    if (isOutTransaction && itemId !== 0 && nextQuantity > availableStock) {
      nextQuantity = availableStock;
    }

    setQuantity(nextQuantity);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (disabled || submitting) {
      return;
    }

    if (!itemId) {
      setFormError("Pilih item terlebih dahulu.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setFormError("Quantity harus lebih dari 0.");
      return;
    }

    if (type === "OUT" && quantity > availableStock) {
      setFormError("Insufficient available stock");
      return;
    }

    await onSubmit({ itemId, type, quantity });
    setQuantity(1);
  };

  return (
    <form className="card-surface grid gap-3 p-4 md:grid-cols-6 md:items-start" onSubmit={handleSubmit}>
      <label className="text-sm font-medium text-slate-700 md:col-span-2">
        Item
        <select
          value={itemId}
          onChange={(event) => handleItemChange(Number(event.target.value))}
          disabled={disabled || submitting}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value={0}>Pilih item...</option>
          {sortedItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        {selectedItem ? (
          <p className="mt-2 text-xs" title="Available = Stock - Reserved">
            <span className="text-slate-500">Stock: {selectedItem.stock}</span>
            <span className="px-1 text-slate-300">|</span>
            <span className="text-amber-700">Reserved: {selectedItem.reservedStock}</span>
            <span className="px-1 text-slate-300">|</span>
            <span className="font-semibold text-emerald-700">Available: {availableStock}</span>
          </p>
        ) : null}
      </label>

      <label className="text-sm font-medium text-slate-700 md:col-span-1">
        Type
        <select
          value={type}
          onChange={(event) => handleTypeChange(event.target.value as TransactionType)}
          disabled={disabled || submitting}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="IN">IN</option>
          <option value="OUT">OUT</option>
        </select>
      </label>

      <label className="text-sm font-medium text-slate-700 md:col-span-1">
        Quantity
        <input
          type="number"
          min={0}
          max={isOutTransaction && itemId !== 0 ? availableStock : undefined}
          value={quantity}
          onChange={(event) => handleQuantityChange(event.target.value)}
          disabled={disabled || submitting}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
        />

        {helperMessage ? <p className="mt-2 text-xs text-slate-500">{helperMessage}</p> : null}
      </label>

      <div className="md:col-span-2">
        <p className="select-none text-sm font-medium text-transparent" aria-hidden="true">
          Action
        </p>
        <div className="mt-1 flex items-start">
          <button
            type="submit"
            disabled={submitDisabled}
            className="w-full rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Processing..." : "Buat Transaksi"}
          </button>
        </div>
      </div>

      {disabled && disabledMessage ? <p className="text-xs font-medium text-amber-700 md:col-span-6">{disabledMessage}</p> : null}
      {stockErrorMessage ? <p className="text-xs font-medium text-red-600 md:col-span-6">{stockErrorMessage}</p> : null}
      {formError ? <p className="text-xs font-medium text-red-600 md:col-span-6">{formError}</p> : null}
    </form>
  );
}
