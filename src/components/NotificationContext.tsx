import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSettings, type AlarmSoundStyle } from "./SettingsContext";
import { playAlarmSound } from "@/lib/alarmSounds";



export type NotificationKind =
  | "alert-now"
  | "alert-priming"
  | "goal-change"
  | "message"
  | "announcement";

export type NotificationState = "live" | "snoozed" | "silenced" | "dismissed" | "archived";

export type NotificationIcon =
  | "bell"
  | "bell-chime"
  | "bell-muted"
  | "target"
  | "message"
  | "megaphone";

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  icon: NotificationIcon;
  createdAt: number;
  autofadeMs?: number;        // undefined = persist until acted on
  allowSnooze?: boolean;      // alerts only
  sourceRef?: { type: "activity" | "goal" | "thread"; id: string };
  state: NotificationState;
  // internal — when in 'snoozed' state, time at which it should re-fire as live
  snoozeUntil?: number;
}

interface PushInput {
  // de-duplication key (per day). If a notification with same dedupeKey already
  // exists in non-archived state, push is a no-op. Falls back to id if omitted.
  dedupeKey?: string;
  id?: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  icon: NotificationIcon;
  autofadeMs?: number;
  allowSnooze?: boolean;
  sourceRef?: Notification["sourceRef"];
}

interface NotificationContextValue {
  notifications: Notification[];
  live: Notification[];
  push: (n: PushInput) => string | null;
  dismiss: (id: string) => void;
  snooze: (id: string, ms?: number) => void;
  silence: (id: string) => void;
  archive: (id: string) => void;
  // Distinct from dismiss/archive: those just stop a notification from
  // showing in the transient top banner (see NotificationBar) — it still
  // persists in the Notifications tab's own list either way. clear/clearAll
  // are the only things that actually remove it from that list for good.
  clear: (id: string) => void;
  clearAll: () => void;
  activate: (n: Notification) => void;
  prefs: UserPrefs;
}

export function isAlert(kind: NotificationKind) {
  return kind === "alert-now" || kind === "alert-priming";
}

export function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* noop */
  }
}

// Reads the user-configurable Settings-tab values (snooze time, notification
// duration, alarm sound) plus a couple of constants not yet worth exposing.
export interface UserPrefs {
  snoozeMs: number;
  notificationDurationMs: number;
  maxStackVisible: number;
  alarmSound: AlarmSoundStyle;
}

export function useUserPrefs(): UserPrefs {
  const { values, alarmSound } = useSettings();
  return {
    snoozeMs: (values.snoozeMinutes ?? 1) * 60_000,
    notificationDurationMs: (values.notificationDurationSeconds ?? 7) * 1000,
    maxStackVisible: 3,
    alarmSound,
  };
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}

const MAX_RETAINED = 50;

export function NotificationProvider({ children, onActivate }: { children: ReactNode; onActivate?: (n: Notification) => void }) {
  const prefs = useUserPrefs();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dedupeRef = useRef<Map<string, string>>(new Map()); // dedupeKey -> id
  const onActivateRef = useRef(onActivate);
  useEffect(() => { onActivateRef.current = onActivate; }, [onActivate]);

  const activate = useCallback((n: Notification) => {
    onActivateRef.current?.(n);
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, state: "archived" } : x)));
  }, []);


  const archive = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, state: "archived" } : n)));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, state: "archived" } : n)));
  }, []);

  // Distinct from dismiss: the notification stays visible (so it's still
  // there to reference or dismiss later), it just stops chiming/vibrating.
  const silence = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, state: "silenced" } : n)),
    );
  }, []);

  const snooze = useCallback(
    (id: string, ms?: number) => {
      const until = Date.now() + (ms ?? prefs.snoozeMs);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, state: "snoozed", snoozeUntil: until } : n)),
      );
    },
    [prefs.snoozeMs],
  );

  // clear/clearAll actually remove from the list — unlike dismiss/archive,
  // which only affect the transient top banner (see that comment on the
  // context value interface above).
  const clear = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    dedupeRef.current.clear();
  }, []);

  const push = useCallback((input: PushInput): string | null => {
    const dedupeKey = input.dedupeKey ?? input.id;
    if (dedupeKey) {
      const existingId = dedupeRef.current.get(dedupeKey);
      if (existingId) {
        let stillLive = false;
        setNotifications((prev) => {
          const found = prev.find((n) => n.id === existingId);
          if (found && found.state !== "archived") stillLive = true;
          return prev;
        });
        if (stillLive) return null;
      }
    }
    const id = input.id ?? `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const next: Notification = {
      id,
      kind: input.kind,
      title: input.title,
      body: input.body,
      icon: input.icon,
      createdAt: Date.now(),
      autofadeMs: input.autofadeMs,
      allowSnooze: input.allowSnooze,
      sourceRef: input.sourceRef,
      state: "live",
    };
    if (dedupeKey) dedupeRef.current.set(dedupeKey, id);
    setNotifications((prev) => {
      const trimmed = prev.length >= MAX_RETAINED ? prev.slice(prev.length - MAX_RETAINED + 1) : prev;
      return [...trimmed, next];
    });
    // Alert kinds get their own repeating chime for as long as they're
    // visible in the banner (see NotificationBar's own effect, keyed to
    // that row actually being on screen) — this is everything else's only
    // sound, a single chime the moment it's created, using the same
    // Settings-configured alarm style so all notifications share one
    // consistent alarm system rather than some being silent.
    if (!isAlert(input.kind)) {
      playAlarmSound(prefs.alarmSound);
      vibrate(40);
    }
    return id;
  }, [prefs.alarmSound]);

  // Tick: handle autofade expiration + snooze re-fire.
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      setNotifications((prev) => {
        let changed = false;
        const next = prev.map((n) => {
          if (n.state === "live" && n.autofadeMs) {
            if (now - n.createdAt >= n.autofadeMs) {
              changed = true;
              return { ...n, state: "archived" as NotificationState };
            }
          }
          if (n.state === "snoozed" && n.snoozeUntil && now >= n.snoozeUntil) {
            changed = true;
            return { ...n, state: "live" as NotificationState, createdAt: now, snoozeUntil: undefined };
          }
          return n;
        });
        return changed ? next : prev;
      });
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  const live = useMemo(
    () => notifications.filter((n) => n.state === "live" || n.state === "silenced"),
    [notifications],
  );

  const value = useMemo<NotificationContextValue>(
    () => ({ notifications, live, push, dismiss, snooze, silence, archive, clear, clearAll, activate, prefs }),
    [notifications, live, push, dismiss, snooze, silence, archive, clear, clearAll, activate, prefs],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;

}
