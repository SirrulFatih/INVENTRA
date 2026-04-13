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
  const [user] = useState<User | null>(() => getAuthUser());
  const [token] = useState<string | null>(() => getAuthToken());

  useEffect(() => {
    if (!token || !user) {
      router.replace("/login");
    }
  }, [router, token, user]);

  const handleLogout = () => {
    clearAuthSession();
    router.replace("/login");
  };

  if (!token || !user) {
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
