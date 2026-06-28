import { useState } from "react";
import { useStore } from "../store";
import { addNote, removeEvidence, updateNote } from "../game/engine";

export function EvidenceApp() {
  const evidence = useStore((s) => s.evidence);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  function commitEdit(id: string) {
    if (draft.trim()) updateNote(id, draft.trim());
    setEditing(null);
  }

  return (
    <div className="pad scroll evidence">
      <div className="board-head">EVIDENCE BOARD</div>
      {evidence.length === 0 && <p className="muted">no evidence yet. pin proof from the terminal: <code>evidence pin &lt;file&gt;</code></p>}
      <div className="ev-grid">
        {evidence.map((e) => {
          const removable = e.kind === "note" || e.id.startsWith("file:");
          return (
            <div key={e.id} className={"ev-card kind-" + e.kind}>
              <div className="ev-kind">
                {e.kind}
                <span className="ev-tools">
                  {e.kind === "note" && editing !== e.id && (
                    <button title="edit" onClick={() => { setEditing(e.id); setDraft(e.label); }}>✎</button>
                  )}
                  {removable && <button title="remove" onClick={() => removeEvidence(e.id)}>×</button>}
                </span>
              </div>
              {editing === e.id ? (
                <input className="ev-edit" autoFocus value={draft}
                  onChange={(ev) => setDraft(ev.target.value)}
                  onBlur={() => commitEdit(e.id)}
                  onKeyDown={(ev) => { if (ev.key === "Enter") commitEdit(e.id); if (ev.key === "Escape") setEditing(null); }} />
              ) : (
                <div className="ev-label">{e.label}</div>
              )}
              <div className="ev-src muted small">{e.source}</div>
            </div>
          );
        })}
      </div>
      <div className="note-add">
        <input value={text} placeholder="add a note to the board…" onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) { addNote(text.trim()); setText(""); } }} />
        <button onClick={() => { if (text.trim()) { addNote(text.trim()); setText(""); } }}>pin</button>
      </div>
    </div>
  );
}
