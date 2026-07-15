import type { AlarmSoundStyle } from "@/components/SettingsContext";
import chime01 from "@/assets/audio/chime01.wav";
import alert01 from "@/assets/audio/alert01.wav";
import alarm01 from "@/assets/audio/alarm01.wav";

const ALARM_SOUND_FILES: Record<AlarmSoundStyle, string> = {
  chime: chime01,
  alert: alert01,
  alarm: alarm01,
};

// One persistent <audio> element per style, reused on every play — rather
// than a fresh `new Audio()` per call. Browsers' autoplay policies (mobile
// Safari especially) are far more willing to keep playing an element that's
// already successfully played once than to grant that same permission to a
// brand-new element on every repeat — which is what made a live alert's
// repeating alarm loop (see NotificationBar's own activeAlarm effect)
// silently die out after its first tick or two instead of actually
// continuing until silenced/dismissed. Calling two DIFFERENT styles in
// close succession (e.g. previewing options in Settings) still doesn't cut
// either off, since each style owns its own independent element; only
// re-triggering the SAME style restarts it from the top.
const audioElements = new Map<AlarmSoundStyle, HTMLAudioElement>();
function getAudioElement(style: AlarmSoundStyle): HTMLAudioElement {
  let el = audioElements.get(style);
  if (!el) {
    el = new Audio(ALARM_SOUND_FILES[style]);
    audioElements.set(style, el);
  }
  return el;
}

/** Plays the given alarm style's audio file — used both by the Settings
 *  pane (so picking a style is an audible choice, not a guess from its
 *  label alone) and by live in-app alerts. */
export function playAlarmSound(style: AlarmSoundStyle) {
  const audio = getAudioElement(style);
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

/** Unlocks every alarm style up front, the moment the user makes their
 *  very first gesture anywhere on the page (see NotificationContext, which
 *  wires this to a one-time pointerdown listener). Without this, the first
 *  real alarm tick — fired from a timer, not a click — is silently blocked
 *  by the browser's autoplay policy until the user happens to press
 *  something, and on stricter browsers (mobile Safari in particular) even a
 *  successful play from inside a click handler doesn't reliably keep LATER
 *  timer-driven repeats unblocked. Priming each element directly inside a
 *  genuine gesture's own call stack — muted, then immediately paused and
 *  rewound — is what actually earns each one the browser's ongoing
 *  playback permission, before any alarm has a real reason to fire. */
export function primeAlarmAudio() {
  for (const style of Object.keys(ALARM_SOUND_FILES) as AlarmSoundStyle[]) {
    const el = getAudioElement(style);
    el.muted = true;
    el.play()
      .then(() => {
        el.pause();
        el.currentTime = 0;
        el.muted = false;
      })
      .catch(() => {
        el.muted = false;
      });
  }
}
