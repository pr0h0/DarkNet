import { useEffect, useState } from "react";
import { store, loadSave } from "./store";
import { initBash } from "./term/bash";
import { openApp } from "./game/engine";
import { startAmbient, stopAmbient } from "./game/ambient";
import { Desktop } from "./os/Desktop";

const BOOT = [
  "darknet-os v0.1 — operator build",
  "mounting virtual filesystem ............ ok",
  "loading just-bash runtime .............. ok",
  "establishing dead-drop relay ........... ok",
  "decrypting workstation identity ........ ok",
  "",
  "welcome, operator.",
];

export function App() {
  const [ready, setReady] = useState(false);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { state, fs } = await loadSave();
      await initBash(fs);
      if (!alive) return;
      const fresh = !state;
      if (state) {
        const init = store.state; // freshly-constructed defaults (has all current content)
        // additive merge: keep saved progress, but fold in any content/fields
        // added since the save was written (new missions, hosts, tools).
        // Contracts merge per-key so saved status wins but new fields (briefs,
        // `unlocks`) come from current content.
        const contracts: typeof init.contracts = {};
        for (const k of new Set([...Object.keys(init.contracts), ...Object.keys(state.contracts ?? {})])) {
          const merged = { ...init.contracts[k], ...(state.contracts?.[k] ?? {}) } as (typeof init.contracts)[string];
          // gating is now declarative (dependsOn/reqRep/reqTool); old saves used a
          // "locked" status — normalize it so the gate logic takes over.
          if ((merged.status as string) === "locked") merged.status = "available";
          contracts[k] = merged;
        }
        store.set({
          ...init,
          ...state,
          contracts,
          hosts: { ...init.hosts, ...state.hosts },
          tools: { ...init.tools, ...state.tools },
          browserTabs: state.browserTabs ?? init.browserTabs,
          activeTab: state.activeTab ?? init.activeTab,
          lastLogclean: state.lastLogclean ?? 0,
          bookmarks: init.bookmarks, // canonical set — drops removed/renamed sites
          identity: state.identity ?? init.identity,
        });
      }
      // boot animation
      for (let i = 0; i < BOOT.length; i++) {
        await new Promise((r) => setTimeout(r, 180));
        if (!alive) return;
        setLines((l) => [...l, BOOT[i]]);
      }
      await new Promise((r) => setTimeout(r, 500));
      if (!alive) return;
      store.set({ booted: true });
      if (fresh || store.state.windows.length === 0) {
        openApp("terminal");
        openApp("contracts");
      }
      setReady(true);
      startAmbient();
    })();
    return () => { alive = false; stopAmbient(); };
  }, []);

  if (!ready) {
    return (
      <div className="boot">
        <pre>{lines.join("\n")}{lines.length < BOOT.length ? "\n_" : ""}</pre>
      </div>
    );
  }
  return <Desktop />;
}
