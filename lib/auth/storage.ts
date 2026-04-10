import type { User } from "@/types/entities";

const AUTH_STORAGE_KEY = "inventra_auth_session";
const AUTH_COOKIE_KEY = "inventra_token";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;

export interface AuthSession {
  token: string;
  user: User;
}

const isBrowser = () => typeof window !== "undefined";

const safeParse = <T>(rawValue: string | null): T | null => {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
};

export const setAuthSession = (session: AuthSession) => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  document.cookie = `${AUTH_COOKIE_KEY}=${encodeURIComponent(session.token)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
};

export const getAuthSession = (): AuthSession | null => {
  if (!isBrowser()) {
    return null;
  }

  const serializedSession = localStorage.getItem(AUTH_STORAGE_KEY);
  return safeParse<AuthSession>(serializedSession);
};

export const getAuthToken = (): string | null => {
  return getAuthSession()?.token ?? null;
};

export const getAuthUser = (): User | null => {
  return getAuthSession()?.user ?? null;
};

export const clearAuthSession = () => {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
  document.cookie = `${AUTH_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
};

export const isAdminUser = (user: User | null) => {
  return user?.role === "admin";
};
