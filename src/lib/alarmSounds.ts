import type { AlarmSoundStyle } from "@/components/SettingsContext";

// One shared AudioContext, created lazily on first use (creating one
// up front would violate the "no audio before a user gesture" rule most
// browsers enforce) and reused after — a fresh context per preview would
// leak and, on some browsers, silently refuse to start a second time.
let ctx: AudioContext | null = null;
function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

interface Beep {
  /** Seconds after the preview starts. */
  at: number;
  /** Seconds. */
  duration: number;
  frequency: number;
  type: OscillatorType;
  /** Peak gain, 0–1. */
  gain: number;
}

// Three distinct shapes rather than just "the same beep, louder" — pitch,
// wave shape, and rhythm all shift together so "Heavy" reads as urgent even
// with the device on silent-adjacent low volume, not just louder.
const PATTERNS: Record<AlarmSoundStyle, Beep[]> = {
  gentle: [
    { at: 0, duration: 0.22, frequency: 587, type: "sine", gain: 0.22 },
    { at: 0.26, duration: 0.28, frequency: 784, type: "sine", gain: 0.2 },
  ],
  normal: [
    { at: 0, duration: 0.14, frequency: 880, type: "triangle", gain: 0.3 },
    { at: 0.18, duration: 0.14, frequency: 880, type: "triangle", gain: 0.3 },
  ],
  heavy: [
    { at: 0, duration: 0.11, frequency: 1046, type: "square", gain: 0.32 },
    { at: 0.14, duration: 0.11, frequency: 1046, type: "square", gain: 0.32 },
    { at: 0.28, duration: 0.11, frequency: 1046, type: "square", gain: 0.32 },
    { at: 0.42, duration: 0.16, frequency: 1318, type: "square", gain: 0.34 },
  ],
};

/** Plays a short preview of the given alarm style — used by the Settings
 *  pane so picking a style is an audible choice, not a guess from its
 *  label alone. */
export function playAlarmPreview(style: AlarmSoundStyle) {
  const audio = getContext();
  if (audio.state === "suspended") audio.resume();
  const now = audio.currentTime;

  for (const beep of PATTERNS[style]) {
    const osc = audio.createOscillator();
    const gainNode = audio.createGain();
    osc.type = beep.type;
    osc.frequency.value = beep.frequency;

    const start = now + beep.at;
    const end = start + beep.duration;
    // Quick linear fade in/out (rather than a hard on/off) avoids the
    // audible click a square wave especially would otherwise produce at
    // the start/end of each beep.
    const attack = Math.min(0.015, beep.duration / 4);
    gainNode.gain.setValueAtTime(0, start);
    gainNode.gain.linearRampToValueAtTime(beep.gain, start + attack);
    gainNode.gain.linearRampToValueAtTime(0, end);

    osc.connect(gainNode);
    gainNode.connect(audio.destination);
    osc.start(start);
    osc.stop(end + 0.01);
  }
}
