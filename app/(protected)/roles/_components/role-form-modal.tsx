"use client";

import { useMemo, useState } from "react";

import type { Permission } from "@/types/entities";

type RoleFormMode = "create" | "edit";

export interface RoleFormValues {
  name: string;
  permissionIds: number[];
}

interface RoleFormModalProps {
  open: boolean;
  mode: RoleFormMode;
  title: string;
  permissions: Permission[];
  submitting: boolean;
  initialValues?: RoleFormValues;
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => Promise<void>;
}

export function RoleFormModal({
  open,
  mode,
  title,
  permissions,
  submitting,
  initialValues,
  onClose,
  onSubmit
}: RoleFormModalProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
    initialValues?.permissionIds ?? []
  );
  const [formError, setFormError] = useState<string | null>(null);

  const sortedPermissions = useMemo(() => {
    return [...permissions].sort((left, right) => left.name.localeCompare(right.name));
  }, [permissions]);

  if (!open) {
    return null;
  }

  const handleTogglePermission = (permissionId: number) => {
    setSelectedPermissionIds((previous) => {
      if (previous.includes(permissionId)) {
        return previous.filter((id) => id !== permissionId);
      }

      return [...previous, permissionId];
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const normalizedName = name.trim();

    if (!normalizedName) {
      setFormError("Role name wajib diisi.");
      return;
    }

    const permissionIds = [...new Set(selectedPermissionIds)].sort((left, right) => left - right);

    await onSubmit({
      name: normalizedName,
      permissionIds
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="card-surface w-full max-w-2xl p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-800">{title}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {mode === "create"
                ? "Tambahkan role baru dan pilih permission yang dibutuhkan."
                : "Perbarui nama role dan permission yang diizinkan."}
            </p>
          </div>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600"
            onClick={onClose}
            disabled={submitting}
          >
            Close
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Role Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={submitting}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)] disabled:bg-slate-100 disabled:text-slate-500"
              placeholder="contoh: supervisor"
            />
          </label>

          <div>
            <p className="text-sm font-medium text-slate-700">Permissions</p>
            <div className="mt-2 max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
              {sortedPermissions.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada permission yang tersedia.</p>
              ) : (
                sortedPermissions.map((permission) => {
                  const checked = selectedPermissionIds.includes(permission.id);

                  return (
                    <label
                      key={permission.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleTogglePermission(permission.id)}
                        disabled={submitting}
                      />
                      <span className="font-mono text-xs text-slate-700">{permission.name}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {formError ? <p className="text-xs font-medium text-red-600">{formError}</p> : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
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
