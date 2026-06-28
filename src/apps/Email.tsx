import { useState } from "react";
import { useStore } from "../store";
import { chooseEmail, readEmail } from "../game/engine";

export function EmailApp() {
  const emails = useStore((s) => s.emails);
  const [sel, setSel] = useState<string | null>(emails[emails.length - 1]?.id ?? null);
  const cur = emails.find((e) => e.id === sel);

  return (
    <div className="email">
      <div className="email-list">
        {[...emails].reverse().map((e) => (
          <div key={e.id} className={"email-item" + (e.id === sel ? " on" : "") + (e.read ? "" : " unread")}
            onClick={() => { setSel(e.id); readEmail(e.id); }}>
            <div className="ei-from">{e.read ? "" : "● "}{e.from.split("<")[0].trim()}</div>
            <div className="ei-subj">{e.subject}</div>
          </div>
        ))}
      </div>
      <div className="email-view">
        {!cur && <p className="muted pad">no message selected.</p>}
        {cur && (
          <div className="pad scroll">
            <div className="ev-subj">{cur.subject}</div>
            <div className="ev-from muted">from: {cur.from}</div>
            <pre className="ev-body">{cur.body}</pre>
            {cur.choices && !cur.chosen && (
              <div className="ev-choices">
                {cur.choices.map((ch) => (
                  <button key={ch.action} className="primary" onClick={() => chooseEmail(cur.id, ch.action)}>{ch.label}</button>
                ))}
              </div>
            )}
            {cur.chosen && <div className="muted">— decision recorded —</div>}
          </div>
        )}
      </div>
    </div>
  );
}
