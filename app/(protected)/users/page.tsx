"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { UserFormModal, type UserFormValues } from "@/components/users/user-form-modal";
import { useAuthUser } from "@/hooks/use-auth-user";
import { rolesApi } from "@/lib/api/roles-api";
import { usersApi } from "@/lib/api/users-api";
import { formatDateTime } from "@/lib/utils/format";
import type { RoleWithPermissions, User } from "@/types/entities";

export default function UsersPage() {
  const user = useAuthUser();
  const canManageUsers = Boolean(user?.permissions?.includes("manage_users") || user?.role === "admin");

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!canManageUsers) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [usersResult, rolesResult] = await Promise.all([usersApi.getUsers(), rolesApi.getRoles()]);
      setUsers(usersResult);
      setRoles(rolesResult);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gagal memuat data user.");
    } finally {
      setLoading(false);
    }
  }, [canManageUsers]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadUsers();
  }, [loadUsers, user]);

  const modalTitle = useMemo(() => {
    return editingUser ? `Update User #${editingUser.id}` : "Add User";
  }, [editingUser]);

  const openCreateModal = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEditModal = (targetUser: User) => {
    setEditingUser(targetUser);
    setModalOpen(true);
  };

  const handleSubmitUser = async (values: UserFormValues) => {
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      if (editingUser) {
        if (!values.roleId) {
          throw new Error("Role wajib dipilih.");
        }

        await usersApi.updateUser(editingUser.id, {
          name: values.name,
          roleId: values.roleId
        });

        setNotice("User berhasil diperbarui.");
      } else {
        if (!values.roleId) {
          throw new Error("Role wajib dipilih.");
        }

        await usersApi.createUser({
          name: values.name,
          email: values.email,
          password: values.password,
          roleId: values.roleId
        });

        setNotice("User baru berhasil dibuat.");
      }

      setModalOpen(false);
      setEditingUser(null);
      await loadUsers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Operasi user gagal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    const confirmed = window.confirm("Hapus user ini?");

    if (!confirmed) {
      return;
    }

    setError(null);
    setNotice(null);

    try {
      await usersApi.deleteUser(userId);
      setNotice("User berhasil dihapus.");
      await loadUsers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gagal menghapus user.");
    }
  };

  if (user && !canManageUsers) {
    return <ErrorState message="Anda tidak memiliki permission manage_users untuk mengakses halaman user management." />;
  }

  return (
    <div className="space-y-5">
      <div className="card-surface p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Administration</p>
            <h1 className="font-display mt-1 text-2xl font-semibold text-slate-800">User Management</h1>
            <p className="mt-1 text-sm text-slate-500">Kelola akun pengguna internal beserta peran aksesnya di sistem Inventra.</p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={loading || roles.length === 0}
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]"
          >
            + Add User
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">Total: {users.length}</div>

        {notice ? <p className="mt-3 text-xs font-medium text-emerald-700">{notice}</p> : null}
      </div>

      {loading ? <LoadingState label="Memuat daftar user..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={loadUsers} /> : null}

      {!loading && !error ? (
        users.length === 0 ? (
          <EmptyState title="User belum tersedia" description="Tambahkan user pertama untuk mulai mengelola akses sistem." />
        ) : (
          <div className="card-surface p-4">
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((listedUser) => (
                    <tr key={listedUser.id}>
                      <td className="font-semibold text-slate-800">{listedUser.name}</td>
                      <td>{listedUser.email}</td>
                      <td>
                        <span className="badge bg-slate-100 text-slate-700">{listedUser.role}</span>
                      </td>
                      <td>{formatDateTime(listedUser.createdAt)}</td>
                      <td>
                        {canManageUsers ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              onClick={() => openEditModal(listedUser)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                              onClick={() => void handleDeleteUser(listedUser.id)}
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : null}

      <UserFormModal
        key={editingUser ? `edit-${editingUser.id}-${modalOpen}` : `create-${modalOpen}-${roles.length}`}
        open={modalOpen}
        mode={editingUser ? "edit" : "create"}
        title={modalTitle}
        roles={roles}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        initialValues={
          editingUser
            ? {
                name: editingUser.name,
                email: editingUser.email,
                password: "",
                roleId: roles.find((role) => role.name === editingUser.role)?.id ?? null
              }
            : {
                name: "",
                email: "",
                password: "",
                roleId: roles[0]?.id ?? null
              }
        }
        onSubmit={handleSubmitUser}
      />
    </div>
  );
}