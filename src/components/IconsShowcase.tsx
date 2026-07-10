import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { ICON_GROUPS } from "./icons/iconRegistry";
import { cn } from "@/lib/utils";

/** Reference list of every icon used across the app, grouped by function —
 *  a twirl-down so it doesn't compete for space with the rest of Settings
 *  until someone actually wants to browse it. */
export function IconsShowcase() {
  const [open, setOpen] = useState(false);
  const totalIcons = ICON_GROUPS.reduce((n, g) => n + g.icons.length, 0);

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Icons
          </h3>
          <p className="text-xs text-muted-foreground/80 mt-0.5">
            Every icon used across the app ({totalIcons}), for reference.
          </p>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown className="size-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block size-1.5 rounded-full bg-blue-500" />
                  Custom SVG (in-house)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block size-1.5 rounded-full border border-stone-400" />
                  <a
                    href="https://lucide.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-dotted underline-offset-2 hover:text-foreground"
                  >
                    Lucide
                  </a>{" "}
                  icon set
                </span>
              </div>

              {ICON_GROUPS.map(({ group, icons }) => (
                <div key={group}>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                    {group}
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {icons.map((icon) => (
                      <div
                        key={icon.name}
                        title={icon.usage}
                        className="flex flex-col items-center gap-1 rounded-lg border border-stone-200/70 bg-stone-50/60 px-2 py-2.5 text-center"
                      >
                        <div className="grid place-items-center size-8 rounded-full bg-white border border-stone-200 text-stone-700">
                          <icon.Icon className="size-4" />
                        </div>
                        <span className="flex items-center gap-1 text-[11px] leading-tight text-muted-foreground">
                          <span
                            className={cn(
                              "inline-block size-1.5 rounded-full shrink-0",
                              icon.source === "custom" ? "bg-blue-500" : "border border-stone-400",
                            )}
                          />
                          {icon.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
