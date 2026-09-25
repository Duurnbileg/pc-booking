export function FlagMn({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 24"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="36" height="24" fill="#C4272F" />
      <rect x="12" width="12" height="24" fill="#015197" />
      <g fill="#FFD800">
        <circle cx="6" cy="5" r="1.4" />
        <rect x="5.2" y="7.5" width="1.6" height="9" rx="0.3" />
        <rect x="3.2" y="10" width="5.6" height="1.4" rx="0.2" />
        <rect x="3.8" y="13" width="4.4" height="1.2" rx="0.2" />
        <path d="M6 16.5 L4.2 19.5 H7.8 Z" />
      </g>
    </svg>
  );
}

export function FlagEn({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 24"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="36" height="24" fill="#012169" />
      <path d="M0 0 L36 24 M36 0 L0 24" stroke="#fff" strokeWidth="4" />
      <path d="M0 0 L36 24 M36 0 L0 24" stroke="#C8102E" strokeWidth="2" />
      <path d="M18 0 V24 M0 12 H36" stroke="#fff" strokeWidth="7" />
      <path d="M18 0 V24 M0 12 H36" stroke="#C8102E" strokeWidth="4" />
    </svg>
  );
}
