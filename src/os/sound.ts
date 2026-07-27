// Tiny Web Audio blip synth — no asset files. No-ops in headless/tests (no AudioContext)
// or when muted. Sounds are short and quiet by design (atmosphere, not annoyance).
// ponytail: synthesized tones, swap for sample files only if someone wants richer audio.

let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  const AC = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

export function soundOn(): boolean {
  try { return localStorage.getItem("dn-muted") !== "1"; } catch { return true; }
}
export function setSoundOn(on: boolean) {
  try { localStorage.setItem("dn-muted", on ? "0" : "1"); } catch { /* ignore */ }
}

// one short tone
function tone(freq: number, dur = 0.12, type: OscillatorType = "sine", gain = 0.05, when = 0) {
  const a = ac();
  if (!a || !soundOn()) return;
  const t0 = a.currentTime + when;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur);
}

export const sfx = {
  mail: () => { tone(880, 0.08, "sine", 0.04); tone(1320, 0.1, "sine", 0.035, 0.08); }, // two-note ping
  alert: () => { tone(440, 0.14, "square", 0.04); tone(370, 0.18, "square", 0.04, 0.12); }, // descending warning
  alarm: () => { for (let i = 0; i < 3; i++) tone(220, 0.16, "sawtooth", 0.06, i * 0.2); }, // trace-complete klaxon
  reward: () => { tone(660, 0.09, "triangle", 0.04); tone(990, 0.12, "triangle", 0.04, 0.09); }, // positive chime
};
