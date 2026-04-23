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

const setAuthorizationHeader = (token: string | null) => {
  if (token) {
    const headerValue = `Bearer ${token}`;
    axios.defaults.headers.common.Authorization = headerValue;
    apiClient.defaults.headers.common.Authorization = headerValue;
    return;
  }

  delete axios.defaults.headers.common.Authorization;
  delete apiClient.defaults.headers.common.Authorization;
};

if (typeof window !== "undefined") {
  const persistedToken = localStorage.getItem("token") || getAuthToken();
  setAuthorizationHeader(persistedToken);
}

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();

  setAuthorizationHeader(token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    const isUnauthorized = error.response?.status === 401;
    const isLoginRequest = String(error.config?.url ?? "").includes("/users/login");

    if (typeof window !== "undefined" && isUnauthorized && !isLoginRequest) {
      setAuthorizationHeader(null);
      clearAuthSession();

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    const message = error.response?.data?.message || error.message || "Something went wrong";
    return Promise.reject(new Error(message));
  }
);
