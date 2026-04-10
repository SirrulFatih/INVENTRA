"use client";

import { useState } from "react";

interface ItemFormValues {
  name: string;
  stock: number;
  description: string;
}

interface ItemFormModalProps {
  open: boolean;
  title: string;
  submitting: boolean;
  initialValues?: ItemFormValues;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => Promise<void>;
}

const DEFAULT_VALUES: ItemFormValues = {
  name: "",
  stock: 0,
  description: ""
};

export function ItemFormModal({
  open,
  title,
  submitting,
  initialValues,
  onClose,
  onSubmit
}: ItemFormModalProps) {
  const [values, setValues] = useState<ItemFormValues>(initialValues ?? DEFAULT_VALUES);
  const [formError, setFormError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!values.name.trim()) {
      setFormError("Nama item wajib diisi.");
      return;
    }

    if (!Number.isInteger(values.stock) || values.stock < 0) {
      setFormError("Stock harus angka 0 atau lebih.");
      return;
    }

    await onSubmit({
      name: values.name.trim(),
      stock: values.stock,
      description: values.description.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="card-surface w-full max-w-lg p-6">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="font-display text-lg font-semibold text-slate-800">{title}</h3>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Nama Item
            <input
              value={values.name}
              onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Stock
            <input
              type="number"
              min={0}
              value={values.stock}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  stock: Number(event.target.value)
                }))
              }
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Deskripsi
            <textarea
              rows={3}
              value={values.description}
              onChange={(event) => setValues((prev) => ({ ...prev, description: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          {formError ? <p className="text-xs font-medium text-red-600">{formError}</p> : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
