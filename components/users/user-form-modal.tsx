"use client";

import { useState } from "react";

import type { RoleWithPermissions } from "@/types/entities";

type UserFormMode = "create" | "edit";

export interface UserFormValues {
  name: string;
  email: string;
  password: string;
  roleId: number | null;
}

interface UserFormModalProps {
  open: boolean;
  mode: UserFormMode;
  title: string;
  roles: RoleWithPermissions[];
  submitting: boolean;
  initialValues?: UserFormValues;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
}

const DEFAULT_VALUES: UserFormValues = {
  name: "",
  email: "",
  password: "",
  roleId: null
};

const isValidEmail = (value: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

export function UserFormModal({
  open,
  mode,
  title,
  roles,
  submitting,
  initialValues,
  onClose,
  onSubmit
}: UserFormModalProps) {
  const [values, setValues] = useState<UserFormValues>(() => initialValues ?? DEFAULT_VALUES);
  const [formError, setFormError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const normalizedName = values.name.trim();
    const normalizedEmail = values.email.trim().toLowerCase();

    if (!normalizedName) {
      setFormError("Nama user wajib diisi.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setFormError("Email tidak valid.");
      return;
    }

    if (mode === "create" && values.password.length < 6) {
      setFormError("Password minimal 6 karakter.");
      return;
    }

    if (!values.roleId) {
      setFormError("Role wajib dipilih.");
      return;
    }

    await onSubmit({
      name: normalizedName,
      email: normalizedEmail,
      password: values.password,
      roleId: values.roleId
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
            Nama
            <input
              value={values.name}
              onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={values.email}
              onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
              disabled={mode === "edit"}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)] disabled:bg-slate-100 disabled:text-slate-500"
            />
          </label>

          {mode === "create" ? (
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                value={values.password}
                onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </label>
          ) : null}

          <label className="block text-sm font-medium text-slate-700">
            Role
            <select
              value={values.roleId === null ? "" : String(values.roleId)}
              onChange={(event) => {
                const selectedRoleId = event.target.value ? Number(event.target.value) : null;
                setValues((prev) => ({ ...prev, roleId: selectedRoleId }));
              }}
              disabled={roles.length === 0}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)] disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="">Pilih role</option>
              {roles.map((role) => (
                <option key={role.id} value={String(role.id)}>
                  {role.name}
                </option>
              ))}
            </select>
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