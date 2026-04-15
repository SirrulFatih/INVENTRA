"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";

import { clearAuthSession, getAuthSession } from "@/lib/auth/storage";
import { LoadingState } from "@/components/common/loading-state";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

interface AppShellProps {
  children: React.ReactNode;
}

const subscribeToHydration = () => {
  return () => {};
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const session = isHydrated ? getAuthSession() : null;
  const user = session?.user ?? null;
  const token = session?.token ?? null;

  useEffect(() => {
    if (isHydrated && (!token || !user)) {
      router.replace("/login");
    }
  }, [isHydrated, router, token, user]);

  const handleLogout = () => {
    clearAuthSession();
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
        permissions={user.permissions}
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
