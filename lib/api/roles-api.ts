import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type { Permission, RoleWithPermissions } from "@/types/entities";

interface UpsertRolePayload {
  name: string;
  permissionIds: number[];
}

export const rolesApi = {
  async getRoles() {
    const response = await apiClient.get<ApiResponse<RoleWithPermissions[]>>("/roles");
    return response.data.data;
  },

  async getPermissions() {
    const response = await apiClient.get<ApiResponse<Permission[]>>("/permissions");
    return response.data.data;
  },

  async createRole(payload: UpsertRolePayload) {
    const response = await apiClient.post<ApiResponse<RoleWithPermissions>>("/roles", payload);
    return response.data.data;
  },

  async updateRole(roleId: number, payload: UpsertRolePayload) {
    const response = await apiClient.put<ApiResponse<RoleWithPermissions>>(`/roles/${roleId}`, payload);
    return response.data.data;
  },

  async deleteRole(roleId: number) {
    const response = await apiClient.delete<ApiResponse<RoleWithPermissions>>(`/roles/${roleId}`);
    return response.data.data;
  }
};
