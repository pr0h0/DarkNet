import { useState } from "react";
import { useStore } from "../store";
import { setTheme, setMode } from "../game/engine";
import { resetSave } from "../store";
import { soundOn, setSoundOn, sfx } from "../os/sound";

const THEMES = ["midnight", "amber", "ice", "hazard"];
const MODES: { id: "story" | "operator" | "blackout"; label: string; desc: string }[] = [
  { id: "story", label: "Story", desc: "more hints, forgiving trace — for non-technical players" },
  { id: "operator", label: "Operator", desc: "default. subtle hints, moderate trace" },
  { id: "blackout", label: "Blackout", desc: "minimal hints, fast trace, strict grading" },
];

export function SettingsApp() {
  const theme = useStore((s) => s.theme);
  const mode = useStore((s) => s.mode);
  const [snd, setSnd] = useState(soundOn());
  return (
    <div className="pad scroll settings">
      <div className="board-head">SETTINGS</div>
      <h4>Theme</h4>
      <div className="row">
        {THEMES.map((t) => (
          <button key={t} className={"chip theme-" + t + (theme === t ? " on" : "")} onClick={() => setTheme(t)}>{t}</button>
        ))}
      </div>
      <h4>Difficulty</h4>
      {MODES.map((m) => (
        <label key={m.id} className={"mode-row" + (mode === m.id ? " on" : "")} onClick={() => setMode(m.id)}>
          <b>{m.label}</b> <span className="muted small">{m.desc}</span>
        </label>
      ))}
      <h4>Sound</h4>
      <label className={"mode-row" + (snd ? " on" : "")}
        onClick={() => { const n = !snd; setSoundOn(n); setSnd(n); if (n) sfx.reward(); }}>
        <b>{snd ? "On" : "Off"}</b> <span className="muted small">mail pings, trace alerts, and cues</span>
      </label>

      <h4>Save</h4>
      <p className="muted small">progress autosaves to this browser (IndexedDB).</p>
      <button className="danger" onClick={() => { if (confirm("Wipe all progress and restart?")) resetSave(); }}>reset game</button>
    </div>
  );
}
