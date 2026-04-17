"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { RoleFormModal, type RoleFormValues } from "./_components/role-form-modal";
import { useAuthUser } from "@/hooks/use-auth-user";
import { rolesApi } from "@/lib/api/roles-api";
import type { Permission, RoleWithPermissions } from "@/types/entities";

export default function RolesPage() {
  const user = useAuthUser();
  const canManageRoles = Boolean(user?.permissions?.includes("manage_roles"));

  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);

  const loadRoleData = useCallback(async () => {
    if (!canManageRoles) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [rolesResult, permissionsResult] = await Promise.all([rolesApi.getRoles(), rolesApi.getPermissions()]);
      setRoles(rolesResult);
      setPermissions(permissionsResult);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gagal memuat role management.");
    } finally {
      setLoading(false);
    }
  }, [canManageRoles]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadRoleData();
  }, [loadRoleData, user]);

  const modalTitle = useMemo(() => {
    return editingRole ? `Update Role #${editingRole.id}` : "Add Role";
  }, [editingRole]);

  const openCreateModal = () => {
    setEditingRole(null);
    setModalOpen(true);
  };

  const openEditModal = (role: RoleWithPermissions) => {
    setEditingRole(role);
    setModalOpen(true);
  };

  const handleSubmitRole = async (values: RoleFormValues) => {
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      if (editingRole) {
        await rolesApi.updateRole(editingRole.id, values);
        setNotice("Role berhasil diperbarui.");
      } else {
        await rolesApi.createRole(values);
        setNotice("Role baru berhasil dibuat.");
      }

      setModalOpen(false);
      setEditingRole(null);
      await loadRoleData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Operasi role gagal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: RoleWithPermissions) => {
    const confirmed = window.confirm(`Hapus role '${role.name}'?`);

    if (!confirmed) {
      return;
    }

    setDeletingRoleId(role.id);
    setError(null);
    setNotice(null);

    try {
      await rolesApi.deleteRole(role.id);
      setNotice("Role berhasil dihapus.");
      await loadRoleData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gagal menghapus role.");
    } finally {
      setDeletingRoleId(null);
    }
  };

  if (user && !canManageRoles) {
    return <ErrorState message="Anda tidak memiliki permission manage_roles untuk mengakses halaman ini." />;
  }

  return (
    <div className="space-y-5">
      <div className="card-surface p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Administration</p>
            <h1 className="font-display mt-1 text-2xl font-semibold text-slate-800">Role Management</h1>
            <p className="mt-1 text-sm text-slate-500">Kelola role dinamis dan permission untuk akses fitur berbasis RBAC.</p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]"
          >
            + Add Role
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">Total Roles: {roles.length}</div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Total Permissions: {permissions.length}
          </div>
        </div>

        {notice ? <p className="mt-3 text-xs font-medium text-emerald-700">{notice}</p> : null}
      </div>

      {loading ? <LoadingState label="Memuat role dan permission..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={loadRoleData} /> : null}

      {!loading && !error ? (
        roles.length === 0 ? (
          <EmptyState title="Role belum tersedia" description="Tambahkan role pertama untuk mulai mengatur permission pengguna." />
        ) : (
          <div className="card-surface p-4">
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Permissions</th>
                    <th>Count</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id}>
                      <td>
                        <span className="badge bg-slate-100 text-slate-700">{role.name}</span>
                      </td>
                      <td>
                        {role.permissions.length === 0 ? (
                          <span className="text-xs text-slate-400">No permissions</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {role.permissions.map((permission) => (
                              <span
                                key={permission.id}
                                className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-600"
                              >
                                {permission.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>{role.permissions.length}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(role)}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteRole(role)}
                            disabled={deletingRoleId === role.id}
                            className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingRoleId === role.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : null}

      <RoleFormModal
        key={editingRole ? `edit-${editingRole.id}-${modalOpen}` : `create-${modalOpen}`}
        open={modalOpen}
        mode={editingRole ? "edit" : "create"}
        title={modalTitle}
        permissions={permissions}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        initialValues={
          editingRole
            ? {
                name: editingRole.name,
                permissionIds: editingRole.permissions.map((permission) => permission.id)
              }
            : undefined
        }
        onSubmit={handleSubmitRole}
      />
    </div>
  );
}
