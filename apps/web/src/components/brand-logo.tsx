import { useId } from "react";
import { cn } from "@/lib/utils";

export function BrandMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const gradientId = useId();

  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5ef0b0" />
          <stop offset="1" stopColor="#2bb87a" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <rect x="7" y="8" width="18" height="12.5" rx="2.5" stroke="#0b0f14" strokeWidth="2" />
      <path d="M16 20.5V24M12.5 24h7" stroke="#0b0f14" strokeWidth="2" strokeLinecap="round" />
      <path
        d="m12.5 14.5 2.5 2.5 4.5-5"
        stroke="#0b0f14"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLogo({
  size = 30,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark size={size} />
      <span className="font-display text-xl font-semibold tracking-tight text-ink-100">
        Pick<span className="text-accent">PC</span>
      </span>
    </span>
  );
}
