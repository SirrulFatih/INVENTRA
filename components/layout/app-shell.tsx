"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { clearAuthSession, getAuthToken, getAuthUser } from "@/lib/auth/storage";
import { LoadingState } from "@/components/common/loading-state";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { User } from "@/types/entities";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setUser(getAuthUser());
    setToken(getAuthToken());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && (!token || !user)) {
      router.replace("/login");
    }
  }, [isHydrated, router, token, user]);

  const handleLogout = () => {
    clearAuthSession();
    setToken(null);
    setUser(null);
    router.replace("/login");
  };

  if (!isHydrated || !token || !user) {
    return (
      <div className="mx-auto w-full max-w-5xl p-8">
        <LoadingState label="Preparing your workspace..." />
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <Sidebar
        pathname={pathname}
        role={user.role}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="md:ml-72">
        <Topbar user={user} onToggleMobileSidebar={() => setMobileSidebarOpen(true)} onLogout={handleLogout} />

        <main className="px-4 py-5 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
