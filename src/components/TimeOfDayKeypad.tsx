import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Delete, Check, X } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface TimeOfDayKeypadProps {
  /** Current committed value as 24h "HH:MM". */
  value: string;
  /** Called when user commits. Receives 24h "HH:MM". */
  onChange: (next: string) => void;
  children: (state: { isEditing: boolean; open: () => void }) => React.ReactNode;
}

const MAX_DIGITS = 4;

function to24h(hour12: number, minute: number, isPM: boolean) {
  let h = hour12 % 12;
  if (isPM) h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function from24h(value: string): { hour12: number; minute: number; isPM: boolean } {
  const [hStr, mStr] = (value || "00:00").split(":");
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  const isPM = h >= 12;
  const hour12 = ((h + 11) % 12) + 1;
  return { hour12, minute: m, isPM };
}

export function TimeOfDayKeypad({ value, onChange, children }: TimeOfDayKeypadProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState("");
  const [isPM, setIsPM] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const init = from24h(value);
      setPending(
        String(init.hour12).padStart(2, "0") + String(init.minute).padStart(2, "0"),
      );
      setIsPM(init.isPM);
      const id = window.setTimeout(() => hiddenInputRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
  }, [open, value]);

  const setOpenWithReset = useCallback((next: boolean) => {
    setOpen(next);
  }, []);

  const applyDigit = useCallback((digit: string) => {
    setPending((prev) => {
      const next = (prev + digit).slice(-MAX_DIGITS);
      // Auto-detect military time on hours digits → switch to PM and convert.
      const padded = next.padStart(MAX_DIGITS, "0");
      const h = parseInt(padded.slice(0, 2), 10);
      if (h >= 13 && h <= 23) {
        setIsPM(true);
        const newH = h - 12;
        return String(newH).padStart(2, "0") + padded.slice(2);
      }
      if (h === 0 && next.length >= 2) {
        setIsPM(false);
        return "12" + padded.slice(2);
      }
      return next;
    });
  }, []);

  const backspace = useCallback(() => setPending((p) => p.slice(0, -1)), []);
  const clear = useCallback(() => setPending(""), []);

  const padded = pending.padStart(MAX_DIGITS, "0");
  const entered = pending.length;
  const hh = parseInt(padded.slice(0, 2), 10) || 0;
  const mm = parseInt(padded.slice(2, 4), 10) || 0;
  const valid = hh >= 1 && hh <= 12 && mm >= 0 && mm <= 59 && entered > 0;

  const commit = () => {
    if (!valid) return;
    onChange(to24h(hh, mm, isPM));
    setOpenWithReset(false);
  };

  const charNodes: React.ReactNode[] = [];
  for (let i = 0; i < MAX_DIGITS; i++) {
    if (i === 2) {
      charNodes.push(
        <span key="sep" className="text-muted-foreground/40">:</span>,
      );
    }
    const isReal = i >= MAX_DIGITS - entered;
    charNodes.push(
      <span
        key={`d-${i}`}
        className={isReal ? "text-blue-600" : "text-muted-foreground/40"}
      >
        {padded[i]}
      </span>,
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpenWithReset}>
      <PopoverAnchor asChild>
        <span>{children({ isEditing: open, open: () => setOpen(true) })}</span>
      </PopoverAnchor>
      <PopoverContent
        side="top"
        sideOffset={8}
        align="center"
        className="w-auto border-none bg-transparent p-0 shadow-none"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="relative w-[240px] rounded-2xl border-2 border-blue-400/80 bg-card p-2.5 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.25)]">
          <input
            ref={hiddenInputRef}
            type="text"
            inputMode="numeric"
            value=""
            onChange={(e) => {
              const chars = e.target.value.replace(/\D/g, "");
              for (const ch of chars) applyDigit(ch);
              e.target.value = "";
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace") { e.preventDefault(); backspace(); }
              else if (e.key === "Enter") { e.preventDefault(); commit(); }
              else if (e.key === "Escape") { e.preventDefault(); setOpenWithReset(false); }
            }}
            className="absolute size-px opacity-0 pointer-events-none -z-10"
            aria-hidden="true"
            tabIndex={-1}
          />

          <div className="mb-2 flex h-8 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-muted/60 px-3 py-1">
            <span className="font-display text-2xl leading-none tabular-nums">
              {charNodes}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {["1","2","3","4","5","6","7","8","9"].map((d) => (
              <KeyButton key={d} onClick={() => applyDigit(d)}>{d}</KeyButton>
            ))}
            <KeyButton onClick={clear} variant="muted">C</KeyButton>
            <KeyButton onClick={() => applyDigit("0")}>0</KeyButton>
            <KeyButton onClick={backspace} variant="muted">
              <Delete className="size-4" />
            </KeyButton>
          </div>

          {/* AM / PM toggle (replaces seconds digits) */}
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <ToggleButton active={!isPM} onClick={() => setIsPM(false)}>AM</ToggleButton>
            <ToggleButton active={isPM} onClick={() => setIsPM(true)}>PM</ToggleButton>
          </div>

          <div className="mt-2 flex items-center justify-between gap-1.5">
            <motion.button
              type="button"
              onClick={() => setOpenWithReset(false)}
              whileTap={{ scale: 0.92 }}
              className="grid size-8 place-items-center rounded-full border border-stone-200 text-muted-foreground transition-colors hover:bg-stone-100 hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </motion.button>
            <motion.button
              type="button"
              onClick={commit}
              disabled={!valid}
              whileTap={valid ? { scale: 0.92 } : undefined}
              aria-label="Set time"
              className={cn(
                "grid size-8 place-items-center rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none",
                "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700",
              )}
            >
              <Check className="size-4" strokeWidth={3} />
            </motion.button>
          </div>

          <div className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-blue-400/80 bg-card" />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function KeyButton({
  children, onClick, variant = "default",
}: { children: React.ReactNode; onClick: () => void; variant?: "default" | "muted" }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={cn(
        "h-9 select-none rounded-lg border text-lg font-semibold font-display transition-colors",
        variant === "default"
          ? "bg-stone-100 text-foreground border-stone-200 hover:bg-stone-200 active:bg-stone-300"
          : "bg-muted/70 text-muted-foreground border-stone-200 hover:bg-muted active:bg-stone-200",
      )}
    >
      <span className="flex items-center justify-center">{children}</span>
    </motion.button>
  );
}

function ToggleButton({
  children, active, onClick,
}: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={cn(
        "h-9 select-none rounded-lg border-2 text-sm font-semibold font-display transition-colors",
        active
          ? "bg-blue-500 text-white border-blue-500"
          : "bg-white text-stone-500 border-stone-200 hover:border-blue-200",
      )}
    >
      <span className="flex items-center justify-center">{children}</span>
    </motion.button>
  );
}

export function formatTimeOfDay(value: string): string {
  const { hour12, minute, isPM } = from24h(value);
  return `${hour12}:${String(minute).padStart(2, "0")} ${isPM ? "PM" : "AM"}`;
}
