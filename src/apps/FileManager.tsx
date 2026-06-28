import { useEffect, useState } from "react";
import { getBash } from "../term/bash";

export function FilesApp() {
  const [cwd, setCwd] = useState("/home/op");
  const [entries, setEntries] = useState<{ name: string; dir: boolean }[]>([]);
  const [preview, setPreview] = useState<{ name: string; body: string } | null>(null);

  async function load(dir: string) {
    const bash = getBash();
    if (!bash) return;
    try {
      const names = await bash.fs.readdir(dir);
      const rows = await Promise.all(names.map(async (n) => {
        try { const st = await bash.fs.stat(dir.replace(/\/$/, "") + "/" + n); return { name: n, dir: st.isDirectory }; }
        catch { return { name: n, dir: false }; }
      }));
      rows.sort((a, b) => Number(b.dir) - Number(a.dir) || a.name.localeCompare(b.name));
      setEntries(rows); setCwd(dir);
    } catch { /* ignore */ }
  }
  useEffect(() => { load("/home/op"); }, []);

  async function openEntry(e: { name: string; dir: boolean }) {
    const path = cwd.replace(/\/$/, "") + "/" + e.name;
    if (e.dir) { setPreview(null); load(path); return; }
    const bash = getBash();
    try { const body = await bash!.fs.readFile(path); setPreview({ name: e.name, body }); }
    catch { setPreview({ name: e.name, body: "(binary or unreadable)" }); }
  }

  const parent = cwd === "/" ? null : cwd.slice(0, cwd.lastIndexOf("/")) || "/";

  return (
    <div className="files">
      <div className="files-bar">
        <button disabled={!parent} onClick={() => parent && load(parent)}>↑</button>
        <span className="path">{cwd}</span>
      </div>
      <div className="files-main">
        <div className="files-list scroll">
          {entries.map((e) => (
            <div key={e.name} className="file-row" onClick={() => openEntry(e)}>
              <span className="fi">{e.dir ? "📁" : "📄"}</span>{e.name}
            </div>
          ))}
          {entries.length === 0 && <div className="muted pad">empty</div>}
        </div>
        <div className="files-preview scroll">
          {preview ? (<><div className="fp-name">{preview.name}</div><pre>{preview.body}</pre></>)
            : <div className="muted pad">select a file to preview</div>}
        </div>
      </div>
    </div>
  );
}
