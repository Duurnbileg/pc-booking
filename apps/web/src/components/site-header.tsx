"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useT } from "@/components/locale-provider";
import { LocaleMenu } from "@/components/locale-menu";
import { BrandLogo } from "@/components/brand-logo";

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const t = useT();

  return (
    <header className="border-b border-ink-800/80 bg-ink-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" aria-label="PickPC">
          <BrandLogo />
        </Link>
        <nav className="flex items-center gap-3 text-sm text-ink-300">
          {user ? (
            <Link href="/bookings" className="hover:text-ink-100 transition">
              {t("nav.myBookings")}
            </Link>
          ) : null}
          {user?.role === "CAFE_OWNER" || user?.role === "ADMIN" ? (
            <Link
              href="/owner/cafes/new"
              className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 font-medium text-ink-950 transition hover:bg-accent-dim"
            >
              <Plus className="h-4 w-4" />
              {t("nav.addPc")}
            </Link>
          ) : null}
          {user?.role === "CAFE_OWNER" || user?.role === "ADMIN" ? (
            <Link href="/owner" className="hover:text-ink-100 transition">
              {t("nav.myCafes")}
            </Link>
          ) : null}
          {user?.role === "ADMIN" ? (
            <Link href="/admin" className="hover:text-ink-100 transition">
              {t("nav.admin")}
            </Link>
          ) : null}

          <div className="ml-1 flex items-center border-l border-ink-800 pl-3">
            <LocaleMenu />
          </div>

          {loading ? (
            <span className="text-ink-500">…</span>
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-ink-500">{user.name}</span>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-md border border-ink-700 px-3 py-1.5 text-ink-100 hover:border-ink-500 transition"
              >
                {t("nav.logout")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 hover:text-ink-100 transition"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-accent px-3 py-1.5 font-medium text-ink-950 hover:bg-accent-dim transition"
              >
                {t("nav.register")}
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
