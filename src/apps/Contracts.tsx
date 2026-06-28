import { useState } from "react";
import { useStore } from "../store";
import { acceptContract, submitContract, contractGate } from "../game/engine";

function BrokerTerminal() {
  const identity = useStore((s) => s.identity);
  const rep = useStore((s) => s.rep);
  const money = useStore((s) => s.money);
  const contracts = useStore((s) => s.contracts);
  const flags = useStore((s) => s.flags);
  const all = Object.values(contracts);
  const done = all.filter((c) => c.status === "submitted").length;
  const total = all.length;
  const tier = rep >= 20 ? "ghost" : rep >= 12 ? "operator" : rep >= 5 ? "known" : rep >= 1 ? "rookie" : "unknown";

  return (
    <div className="broker">
      <div className="board-head">DEAD-DROP // broker terminal <span className="muted">— anonymous brokerage</span></div>
      <div className="broker-grid">
        <div className="bstat"><span className="bk">operator</span><span className="bv accent">{identity}</span></div>
        <div className="bstat"><span className="bk">credits</span><span className="bv">{money} cr</span></div>
        <div className="bstat"><span className="bk">reputation</span><span className="bv">{rep} · {tier}</span></div>
        <div className="bstat"><span className="bk">contracts</span><span className="bv">{done}/{total} delivered</span></div>
      </div>
      <div className="broker-standing">
        <span className="bk">standing</span>
        <ul>
          <li>dead-drop board: {rep >= 1 ? "trusted" : "probation"}</li>
          <li>cold-rocket: {flags["ql-out-warn"] ? "blacklisted" : rep >= 4 ? "favoured" : "neutral"}</li>
          <li>whistleblower relay: {flags["ql-out-leak"] ? "allied" : "watching"}</li>
        </ul>
      </div>
      <blockquote className="broker-motto">"be quiet, be clean, be gone."</blockquote>
    </div>
  );
}

export function ContractBoard() {
  const contracts = useStore((s) => s.contracts);
  const [open, setOpen] = useState<string | null>(null);
  // newest contracts first (reverse of definition order)
  const list = Object.values(contracts).reverse();

  return (
    <div className="contracts">
      <BrokerTerminal />
      <div className="board-head">DARKBOARD // open contracts</div>
      {list.length === 0 && <p className="muted">no contracts available.</p>}
      {list.map((c) => {
        const gate = c.status === "available" ? contractGate(c) : null;
        return (
        <div key={c.id} className={"contract-card risk-" + c.risk + (gate ? " gated" : "")}>
          <div className="cc-top" onClick={() => setOpen(open === c.id ? null : c.id)}>
            <span className="cc-title">{gate ? "🔒 " : ""}{c.title}</span>
            <span className={"badge st-" + (gate ? "gated" : c.status)}>{gate ? "locked" : c.status}</span>
            <span className="cc-pay">{c.payout} cr</span>
          </div>
          <div className="cc-meta">
            client <b>{c.client}</b> · risk <b>{c.risk}</b> · rep +{c.rep}
            {gate && <span className="gate-reason"> · {gate}</span>}
          </div>
          {open === c.id && (
            <div className="cc-body">
              <p>{c.brief}</p>
              {c.leads.length > 0 && <div className="leads"><b>leads:</b><ul>{c.leads.map((l, i) => <li key={i}>{l}</li>)}</ul></div>}
              {c.bonus && <p className="muted">bonus: {c.bonus}</p>}
              {c.complication && <p className="warn">⚠ {c.complication}</p>}
              <div className="cc-actions">
                {c.status === "available" && !gate && <button className="primary" onClick={() => acceptContract(c.id)}>Accept</button>}
                {c.status === "available" && gate && <span className="gate-reason">🔒 {gate}</span>}
                {c.status === "accepted" && <button className="primary" onClick={() => submitContract(c.id)}>Submit evidence</button>}
                {c.status === "submitted" && <span className="done">✓ delivered</span>}
              </div>
            </div>
          )}
        </div>
      );})}
    </div>
  );
}

export function ContractsApp() {
  return <div className="pad scroll"><ContractBoard /></div>;
}
