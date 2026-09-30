"use client";

import { Check, X } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

type ButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
  variant?: "solid" | "outline";
};

const SIZES = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3.5 py-2 text-sm",
};

export function ApproveButton({ onClick, disabled, size = "sm", variant = "solid" }: ButtonProps) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md font-medium transition disabled:opacity-50",
        SIZES[size],
        variant === "solid"
          ? "bg-emerald-600 text-white hover:bg-emerald-700"
          : "border border-emerald-300 text-emerald-700 hover:bg-emerald-50",
      )}
    >
      <Check className="h-3.5 w-3.5" />
      {t("dash.approve")}
    </button>
  );
}

export function RejectButton({ onClick, disabled, size = "sm" }: Omit<ButtonProps, "variant">) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-red-200 font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50",
        SIZES[size],
      )}
    >
      <X className="h-3.5 w-3.5" />
      {t("dash.reject")}
    </button>
  );
}
