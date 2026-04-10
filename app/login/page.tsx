"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { authApi } from "@/lib/api/auth-api";
import { getAuthToken, setAuthSession } from "@/lib/auth/storage";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("admin@inventra.com");
  const [password, setPassword] = useState("admin123");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getAuthToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = await authApi.login({
        email: email.trim(),
        password
      });

      setAuthSession(payload);
      const redirectTarget = (() => {
        if (typeof window === "undefined") {
          return "/dashboard";
        }

        const from = new URLSearchParams(window.location.search).get("from");
        return from && from.startsWith("/") ? from : "/dashboard";
      })();

      router.replace(redirectTarget);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login gagal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_15%_15%,rgba(11,106,117,0.18),transparent_30%),radial-gradient(circle_at_85%_85%,rgba(245,159,11,0.20),transparent_35%),#f1f5f9] px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,40,0.15)] md:grid-cols-2">
        <section className="hidden bg-gradient-to-br from-[var(--primary-strong)] via-[var(--primary)] to-[#0a8f9d] p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-100">Inventra</p>
            <h1 className="font-display mt-4 text-4xl font-semibold leading-tight">Inventory Intelligence Platform</h1>
            <p className="mt-4 text-sm text-teal-100">
              Pantau stok, transaksi, dan aktivitas audit dalam satu dashboard modern untuk operasi harian tim Anda.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-teal-50">
            <p className="font-semibold">Demo Account</p>
            <p className="mt-1">Email: admin@inventra.com</p>
            <p>Password: admin123</p>
          </div>
        </section>

        <section className="p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Welcome Back</p>
          <h2 className="font-display mt-2 text-3xl font-semibold text-slate-800">Sign in to Inventra</h2>
          <p className="mt-2 text-sm text-slate-500">Gunakan akun Anda untuk mengakses panel operasi inventori.</p>

          <form className="mt-8 space-y-4" onSubmit={handleLogin}>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </label>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
