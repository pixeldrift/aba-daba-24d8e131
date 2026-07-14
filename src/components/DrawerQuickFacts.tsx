import type { ReactNode } from "react";
import { PHASE_ICONS } from "@/lib/phaseIcons";

export interface DrawerStat {
  label: string;
  value: ReactNode;
}

/** Compact replacement for the old one-column Phase/Data-type/... dl — data
 *  type and phase are just two more entries in the same 2-column stats
 *  grid (each keeping its own icon next to the value), rather than a
 *  separately-styled block above it, so every fact in the drawer reads off
 *  the same label/value rhythm. */
export function DrawerQuickFacts({
  icon,
  dataTypeLabel,
  phase,
  stats,
}: {
  icon: ReactNode;
  dataTypeLabel: string;
  phase: string;
  stats: DrawerStat[];
}) {
  const PhaseIcon = PHASE_ICONS[phase];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      <div>
        <dt className="text-xs text-muted-foreground">Data type</dt>
        <dd className="font-medium flex items-center gap-1 min-w-0">
          <span className="shrink-0 [&>svg]:size-3.5" aria-hidden>
            {icon}
          </span>
          <span className="truncate">{dataTypeLabel}</span>
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Phase</dt>
        <dd className="font-medium flex items-center gap-1 min-w-0">
          {PhaseIcon && (
            <span className="shrink-0 [&>svg]:size-3.5" aria-hidden>
              <PhaseIcon />
            </span>
          )}
          <span className="truncate">{phase}</span>
        </dd>
      </div>
      {stats.map((stat) => (
        <div key={stat.label}>
          <dt className="text-xs text-muted-foreground">{stat.label}</dt>
          <dd className="font-medium tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
