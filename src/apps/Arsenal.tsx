import { useStore } from "../store";
import { buyTool } from "../game/engine";

export function ToolMarket({ market }: { market?: boolean }) {
  const tools = useStore((s) => s.tools);
  const money = useStore((s) => s.money);
  const list = Object.values(tools).filter((t) => (market ? !t.owned && t.price != null : true));
  return (
    <div className="pad scroll arsenal">
      <div className="board-head">
        {market ? "tools.market // arsenal upgrades" : "ARSENAL"} <span className="muted">— credits: {money}</span>
      </div>
      {list.length === 0 && <p className="muted">nothing here.</p>}
      {list.map((t) => (
        <div key={t.id} className={"tool-row" + (t.owned ? " owned" : "")}>
          <div className="tool-name">{t.owned ? "✓ " : ""}{t.name}</div>
          <div className="tool-desc">{t.desc}</div>
          <div className="tool-meta">noise {t.noise}{t.price != null && !t.owned ? ` · ${t.price} cr` : ""}</div>
          {!t.owned && t.price != null && (
            <button disabled={money < t.price} onClick={() => buyTool(t.id)}>buy</button>
          )}
          {!t.owned && t.price == null && <span className="muted small">mission reward</span>}
        </div>
      ))}
    </div>
  );
}

export function ArsenalApp() { return <ToolMarket />; }
