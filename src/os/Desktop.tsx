import { useEffect } from "react";
import { useStore } from "../store";
import { openApp } from "../game/engine";
import { Window } from "./Window";
import { TopBar } from "./TopBar";
import { APPS, DOCK_ORDER } from "./apps";

export function Desktop() {
  const windows = useStore((s) => s.windows);
  const theme = useStore((s) => s.theme);

  // keyboard shortcuts: alt+1..9 launch dock apps
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey && e.key >= "1" && e.key <= "9") {
        const app = DOCK_ORDER[Number(e.key) - 1];
        if (app) { e.preventDefault(); openApp(app); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={"desktop theme-" + theme}>
      <TopBar />
      <div className="wallpaper" />
      {windows.map((w) => (
        <Window key={w.id} win={w}>{APPS[w.app].render()}</Window>
      ))}
      <div className="dock">
        {DOCK_ORDER.map((app, i) => (
          <button key={app} className="dock-btn" title={`${APPS[app].label} (alt+${i + 1})`} onClick={() => openApp(app)}>
            <span className="dock-ico">{APPS[app].icon}</span>
            <span className="dock-lbl">{APPS[app].label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
