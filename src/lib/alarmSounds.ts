import type { AlarmSoundStyle } from "@/components/SettingsContext";
import alarmGentle from "@/assets/audio/alarm_gentle.wav";
import alarmNormal from "@/assets/audio/alarm_normal.wav";
import alarmHeavy from "@/assets/audio/alarm_heavy.wav";

const ALARM_SOUND_FILES: Record<AlarmSoundStyle, string> = {
  gentle: alarmGentle,
  normal: alarmNormal,
  heavy: alarmHeavy,
};

/** Plays the given alarm style's audio file — used both by the Settings
 *  pane (so picking a style is an audible choice, not a guess from its
 *  label alone) and by live in-app alerts. A fresh Audio() per call rather
 *  than one reused element, so overlapping triggers (e.g. picking two
 *  styles quickly) don't cut each other off. */
export function playAlarmSound(style: AlarmSoundStyle) {
  const audio = new Audio(ALARM_SOUND_FILES[style]);
  audio.play().catch(() => {});
}
