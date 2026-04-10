import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/entities";

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

export const authApi = {
  async login(payload: LoginPayload) {
    const response = await apiClient.post<ApiResponse<LoginResponse>>("/users/login", payload);
    return response.data.data;
  }
};
