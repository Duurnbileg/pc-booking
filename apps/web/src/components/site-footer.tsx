"use client";

import Link from "next/link";
import { useT } from "@/components/locale-provider";
import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  const t = useT();
  const links = [
    { href: "/search", label: t("footer.browse") },
    { href: "/register", label: t("footer.listCafe") },
  ];

  return (
    <footer className="mt-8 border-t border-ink-800/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Link href="/" aria-label="PickPC" className="inline-block">
            <BrandLogo size={26} />
          </Link>
          <p className="max-w-sm text-sm text-ink-500">{t("footer.tagline")}</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-300">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-ink-100">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-ink-800/80">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-ink-500">
          {t("footer.copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
