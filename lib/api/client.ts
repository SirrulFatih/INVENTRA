import axios, { AxiosError } from "axios";

import { clearAuthSession, getAuthToken } from "@/lib/auth/storage";

type ApiErrorPayload = {
  message?: string;
};

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

if (!API_ORIGIN) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined. Please set it in your environment variables.");
}

const API_BASE_URL = `${API_ORIGIN}/api/inventra`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    const isUnauthorized = error.response?.status === 401;
    const isLoginRequest = String(error.config?.url ?? "").includes("/users/login");

    if (typeof window !== "undefined" && isUnauthorized && !isLoginRequest) {
      clearAuthSession();

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    const message = error.response?.data?.message || error.message || "Something went wrong";
    return Promise.reject(new Error(message));
  }
);
