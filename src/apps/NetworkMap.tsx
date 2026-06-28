import { useStore } from "../store";
import { connect } from "../game/engine";

export function NetMapApp() {
  const hosts = useStore((s) => s.hosts);
  const connection = useStore((s) => s.connection);
  // newest-discovered first (reverse of definition order), so fresh hosts land top-left
  const discovered = Object.values(hosts).filter((h) => h.discovered).reverse();

  return (
    <div className="pad scroll netmap">
      <div className="board-head">NETWORK MAP</div>
      {discovered.length === 0 && <p className="muted">nothing discovered. follow leads, then <code>scan &lt;host&gt;</code>.</p>}
      <div className="node node-self">◉ operator-ws <span className="muted">(you)</span></div>
      <div className="nodes">
        {discovered.map((h) => (
          <div key={h.id} className={"node" + (h.compromised ? " owned" : "") + (connection === h.id ? " active" : "")}
            onClick={() => connect(h.id)} title="click to connect">
            <div className="node-name">{h.compromised ? "◉" : "○"} {h.hostname}</div>
            <div className="node-meta muted small">{h.ip} · {h.org} · sec {h.security}/5</div>
            <div className="node-svc small">{h.services.map((s) => s.name).join(" ") || "—"}</div>
            {connection === h.id && <div className="node-tag">connected · /mnt/{h.id}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
