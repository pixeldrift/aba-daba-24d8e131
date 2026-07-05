import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { TimeChevronIcon } from "./icons/TimeChevronIcon";
import { cn } from "@/lib/utils";

export interface DataDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  details?: ReactNode;
  /** Viewport-relative pixel offset where the Data pane begins (below the
   *  sticky toolbar) — the drawer is bounded to below this, not the full
   *  viewport, since it only applies within that one pane. */
  top: number;
  /** The card this drawer's contents describe — its on-screen position
   *  drives the arrow pointing back at it. */
  cardRef: RefObject<HTMLElement | null>;
}

/** A single shared, non-modal details panel — mounted only by whichever card
 *  is currently active (see CardShell) — rendered via portal so its `fixed`
 *  positioning isn't trapped by a transformed ancestor (Reorder.Item/motion
 *  layout tracking elsewhere in the card list). The pull tab and arrow are
 *  children of the same animated element, so they slide and reposition
 *  together with the panel instead of living separately in the toolbar. */
export function DataDetailsDrawer({ open, onOpenChange, title, description, details, top, cardRef }: DataDetailsDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [arrowTop, setArrowTop] = useState(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setArrowTop(rect.top + rect.height / 2 - top);
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const ro = new ResizeObserver(update);
    if (cardRef.current) ro.observe(cardRef.current);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, [open, top, cardRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!mounted) return null;

  const maxArrowTop = Math.max(24, window.innerHeight - top - 24);
  const clampedArrowTop = Math.min(Math.max(arrowTop, 24), maxArrowTop);

  return createPortal(
    <motion.div
      className="fixed right-0 z-40 w-[88%] sm:max-w-md bg-background border-l border-stone-200/70 shadow-[-8px_0_30px_-8px_rgba(0,0,0,0.25)]"
      style={{ top, bottom: 0 }}
      initial={false}
      animate={{ x: open ? 0 : "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 34 }}
      aria-hidden={!open}
    >
      {/* Pull tab — attached to the panel's own left edge (a child of the
          same animated element) so it rides along with the slide instead of
          staying fixed in the toolbar while the panel moves out from under
          it. Pinned to the panel's own top edge (straddling the seam with
          the sticky toolbar above, the same idiom as the filter popover's
          arrow) rather than mid-height, and raised above the toolbar's own
          z-[60] so it isn't painted over where it overlaps that row. */}
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label={open ? "Close details drawer" : "Open details drawer"}
        aria-expanded={open}
        className="absolute -left-7 top-0 -translate-y-1/2 z-[65] grid place-items-center h-10 w-7 rounded-l-lg border border-r-0 border-stone-200/70 bg-background text-stone-500 hover:text-stone-800 transition-colors"
      >
        {/* Base orientation points right; always faces the direction the
            drawer will slide if pressed again — left (toward opening) while
            closed, right (toward closing) while open — and animates between
            the two as the drawer itself slides. */}
        <TimeChevronIcon className={cn("size-3.5 transition-transform duration-300", !open && "rotate-180")} />
      </button>

      {/* Arrow — points at the card this drawer's contents belong to. */}
      <div
        className="absolute -left-[9px] size-4 -translate-y-1/2 rotate-45 border-l-2 border-b-2 border-blue-400/80 bg-background shadow-[-2px_2px_3px_-1px_rgba(0,0,0,0.15)]"
        style={{ top: clampedArrowTop }}
        aria-hidden
      />

      <button
        type="button"
        onClick={() => onOpenChange(false)}
        aria-label="Close"
        className="absolute right-3 top-3 grid place-items-center size-7 rounded-full text-muted-foreground transition-colors hover:bg-stone-100 hover:text-foreground"
      >
        <X className="size-4" />
      </button>

      <div className="h-full overflow-y-auto p-6">
        <h2 className="font-display text-lg pr-8">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        {details && <div className="mt-6 text-sm">{details}</div>}
      </div>
    </motion.div>,
    document.body,
  );
}
