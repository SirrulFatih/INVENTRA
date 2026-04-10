import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type { User, UserRole } from "@/types/entities";

interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface RegisterUserResponse {
  user: User;
  token: string;
}

interface UpdateUserPayload {
  name: string;
  role: UserRole;
}

export const usersApi = {
  async getUsers() {
    const response = await apiClient.get<ApiResponse<User[]>>("/users");
    return response.data.data;
  },

  async createUser(payload: RegisterUserPayload) {
    const response = await apiClient.post<ApiResponse<RegisterUserResponse>>("/users/register", payload);
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