import { useEffect, useState } from "react";
import { useStore } from "../store";

export function TopBar() {
  const trace = useStore((s) => s.trace);
  const money = useStore((s) => s.money);
  const rep = useStore((s) => s.rep);
  const identity = useStore((s) => s.identity);
  const connection = useStore((s) => s.connection);
  const mode = useStore((s) => s.mode);
  const log = useStore((s) => s.log);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const t = () => setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    t(); const i = setInterval(t, 10000); return () => clearInterval(i);
  }, []);

  const traceClass = trace >= 80 ? "crit" : trace >= 50 ? "warn" : "ok";

  return (
    <div className="topbar">
      <span className="tb-logo">◢ DARKNET</span>
      <span className="tb-net">{connection ? `▣ ${connection}` : "○ offline"}</span>
      <span className={"tb-trace " + traceClass}>
        trace <span className="tb-bar"><span style={{ width: trace + "%" }} /></span> {trace}%
      </span>
      <span className="tb-flash">{log[0]}</span>
      <span className="tb-spacer" />
      <span className="tb-stat">{money} cr</span>
      <span className="tb-stat">rep {rep}</span>
      <span className="tb-stat muted">{mode}</span>
      <span className="tb-id">{identity}</span>
      <span className="tb-clock">{clock}</span>
    </div>
  );
}
