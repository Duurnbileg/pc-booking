"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

type DrawerProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: "md" | "lg";
  bodyClassName?: string;
};

export function Drawer({
  open,
  title,
  onClose,
  children,
  footer,
  width = "md",
  bodyClassName,
}: DrawerProps) {
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 !m-0">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full flex-col border-l border-slate-200 bg-white shadow-xl",
          width === "lg" ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <h2 className="truncate text-base font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("dash.close")}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className={cn("flex-1 overflow-y-auto px-5 py-5", bodyClassName)}>{children}</div>
        {footer ? (
          <footer className="border-t border-slate-200 px-5 py-3">{footer}</footer>
        ) : null}
      </aside>
    </div>
  );
}
