"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Monitor,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useT } from "@/components/locale-provider";
import { useAdminStats } from "@/hooks/use-admin-queries";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: TranslationKey; icon: LucideIcon };

const NAV: NavItem[] = [
  { href: "/admin", label: "dash.overview", icon: LayoutDashboard },
  { href: "/admin/pcs", label: "dash.pcs", icon: Monitor },
  { href: "/admin/customers", label: "dash.customers", icon: Users },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminSidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col border-r border-slate-200 bg-white md:flex lg:w-60">
        <SidebarContent compact onNavigate={() => undefined} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-slate-200 bg-white shadow-xl">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-md p-1 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent onNavigate={onClose} />
          </aside>
        </div>
      ) : null}
    </>
  );
}

/** `compact` collapses labels to an icon rail below the lg breakpoint. */
function SidebarContent({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const { user, logout } = useAuth();
  const pendingCount = useAdminStats().data?.pendingPCs ?? 0;
  const labelClass = compact ? "hidden lg:inline" : "";

  return (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
          PC
        </span>
        <div className={cn("leading-tight", labelClass)}>
          <p className="text-sm font-semibold text-slate-900">PCBook</p>
          <p className="text-xs text-slate-500">{t("dash.adminPanel")}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              title={t(label)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition",
                compact && "justify-center lg:justify-start",
                active
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <span className="relative">
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-slate-900" : "text-slate-400")} />
                {href === "/admin/pcs" && pendingCount > 0 && compact ? (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white lg:hidden" />
                ) : null}
              </span>
              <span className={labelClass}>{t(label)}</span>
              {href === "/admin/pcs" && pendingCount > 0 ? (
                <span
                  className={cn(
                    "ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-amber-700",
                    labelClass,
                  )}
                >
                  {pendingCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-slate-200 p-3">
        {user ? (
          <p className={cn("truncate px-2.5 pb-1 text-xs text-slate-500", labelClass)}>
            {user.email}
          </p>
        ) : null}
        <button
          type="button"
          title={t("dash.logout")}
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            compact && "justify-center lg:justify-start",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0 text-slate-400" />
          <span className={labelClass}>{t("dash.logout")}</span>
        </button>
      </div>
    </>
  );
}
