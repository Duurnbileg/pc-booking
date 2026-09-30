"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useT } from "@/components/locale-provider";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ToastProvider } from "@/components/admin/toast";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.role !== "ADMIN") router.replace("/");
  }, [user, loading, router]);

  return (
    <div className="fixed inset-0 overflow-y-auto bg-slate-50 text-slate-900 antialiased">
      {!isAdmin ? (
        <div className="flex min-h-full items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
        </div>
      ) : (
        <ToastProvider>
          <AdminSidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
          <div className="md:pl-16 lg:pl-60">
            <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 md:hidden">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label={t("dash.menu")}
                className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="text-sm font-semibold">{t("dash.adminPanel")}</span>
            </header>
            <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </main>
          </div>
        </ToastProvider>
      )}
    </div>
  );
}
