import { store } from "../store";
import { pushEmail } from "./engine";

// Flavor-only chatter so the world feels like it moves without you. These never
// gate anything and never appear during an active connection (don't distract mid-op).
// ponytail: sequential drip from a fixed pool; add weighting/branches only if it feels flat.
const AMBIENT: { id: string; from: string; subject: string; body: string }[] = [
  { id: "amb-1", from: "board@dead-drop.exchange", subject: "board digest", body: "chatter is up on the exchange. three new handles registered this week. two already burned.\n\n— dead-drop (automated)" },
  { id: "amb-2", from: "pastebin.black <no-reply@pastebin.black>", subject: "trending pastes", body: "someone dumped a corporate org chart again. mostly noise. the real leaks never trend.\n" },
  { id: "amb-3", from: "newswire <desk@newswire>", subject: "market jitters", body: "another 'unspecified security incident' at a firm that won't be named. shares dipped, then recovered. business as usual.\n" },
  { id: "amb-4", from: "??? <relay@ghost>", subject: "still here", body: "saw your handle move last night. sloppy on the disconnects. tighten up.\n\n— a friend (not really)" },
  { id: "amb-5", from: "tools.market <sales@tools.market>", subject: "restock", body: "new inventory landed. the good stuff never lasts. spend rep, not regret.\n" },
  { id: "amb-6", from: "cold-rocket <cr@dead-drop.exchange>", subject: "quiet week?", body: "it's never a quiet week. it's just a week before a loud one. keep your ear down.\n" },
  { id: "amb-7", from: "board@dead-drop.exchange", subject: "reminder", body: "your route is only as clean as your last logclean. the board doesn't cover funerals.\n\n— dead-drop (automated)" },
];

let idx = 0;
let timer: number | undefined;

export function startAmbient() {
  stopAmbient();
  const tick = () => {
    // don't interrupt an active op; try again next cycle
    if (!store.state.connection && idx < AMBIENT.length) {
      pushEmail(AMBIENT[idx++]);
    }
    schedule();
  };
  const schedule = () => {
    if (idx >= AMBIENT.length) return; // pool drained — stop scheduling
    timer = window.setTimeout(tick, 90000 + Math.floor(Math.random() * 60000)); // 90–150s
  };
  schedule();
}
export function stopAmbient() {
  if (timer) { clearTimeout(timer); timer = undefined; }
}
