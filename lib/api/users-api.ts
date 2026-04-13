import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/entities";

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  roleId: number;
}

interface UpdateUserPayload {
  name: string;
  roleId: number;
}

export const usersApi = {
  async getUsers() {
    const response = await apiClient.get<ApiResponse<User[]>>("/users");
    return response.data.data;
  },

  async createUser(payload: CreateUserPayload) {
    const response = await apiClient.post<ApiResponse<User>>("/users", payload);
    return response.data.data;
  },

  async updateUser(userId: number, payload: UpdateUserPayload) {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${userId}`, payload);
    return response.data.data;
  },

  async deleteUser(userId: number) {
    await apiClient.delete(`/users/${userId}`);
  }
};