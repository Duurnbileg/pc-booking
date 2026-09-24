"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export function SiteHeader() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="border-b border-ink-800/80 bg-ink-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="font-display text-xl tracking-tight text-ink-100">
          PC<span className="text-accent">Book</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm text-ink-300">
          <Link href="/" className="hover:text-ink-100 transition">
            Discover
          </Link>
          {user?.role === "CAFE_OWNER" || user?.role === "ADMIN" ? (
            <Link href="/owner/cafes/new" className="hover:text-ink-100 transition">
              Add cafe
            </Link>
          ) : null}
          {user?.role === "CAFE_OWNER" || user?.role === "ADMIN" ? (
            <Link href="/owner" className="hover:text-ink-100 transition">
              My cafes
            </Link>
          ) : null}
          {user?.role === "ADMIN" ? (
            <Link href="/admin/cafes" className="hover:text-ink-100 transition">
              Admin
            </Link>
          ) : null}
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
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 hover:text-ink-100 transition"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-accent px-3 py-1.5 font-medium text-ink-950 hover:bg-accent-dim transition"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
