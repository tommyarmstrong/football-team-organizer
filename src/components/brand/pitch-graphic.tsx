import { cn } from "@/lib/utils";

/** Stylised pitch markings for heroes, empty states, and decorative panels. */
export function PitchGraphic({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 220"
      fill="none"
      aria-hidden="true"
      className={cn("text-current", className)}
    >
      <rect
        x="12"
        y="12"
        width="336"
        height="196"
        rx="10"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <line
        x1="180"
        y1="12"
        x2="180"
        y2="208"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="180" cy="110" r="32" stroke="currentColor" strokeWidth="2" />
      <circle cx="180" cy="110" r="3.5" fill="currentColor" />
      <rect
        x="12"
        y="58"
        width="52"
        height="104"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="12"
        y="82"
        width="22"
        height="56"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="296"
        y="58"
        width="52"
        height="104"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="326"
        y="82"
        width="22"
        height="56"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M64 86a36 36 0 0 1 0 48" stroke="currentColor" strokeWidth="2" />
      <path
        d="M296 86a36 36 0 0 0 0 48"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
