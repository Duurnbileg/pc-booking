"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useT } from "@/components/locale-provider";
import { BrandMark } from "@/components/brand-logo";

export function OwnerCta() {
  const t = useT();
  const { user } = useAuth();
  const canList = user?.role === "CAFE_OWNER" || user?.role === "ADMIN";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/15 via-ink-900 to-ink-900 p-6 sm:p-10">
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-start gap-4">
          <BrandMark size={48} className="hidden sm:block" />
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl text-ink-100 sm:text-3xl">{t("home.ctaTitle")}</h2>
            <p className="max-w-lg text-ink-300">{t("home.ctaBody")}</p>
          </div>
        </div>
        <Link
          href={canList ? "/owner/cafes/new" : "/register"}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-accent px-5 py-3 font-medium text-ink-950 transition hover:bg-accent-dim"
        >
          {t("home.ctaButton")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
