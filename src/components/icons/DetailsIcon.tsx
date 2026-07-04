import type { SVGProps } from "react";

/**
 * Small side-panel glyph — used to invoke the card-detail drawer. Distinct
 * from InfoIcon (which is now reserved for the main-menu Info tab): a
 * rounded card outline split evenly in half, with the divider drawn as a
 * triangular point jutting from the right pane into the left one — hinting
 * that the right pane is the part sliding in.
 */
export function DetailsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M12,5 L12,9.2 L8.7,12 L12,14.8 L12,19" />
    </svg>
  );
}
