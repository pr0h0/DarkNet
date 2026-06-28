import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { getBash } from "./bash";
import { getShellCwd, setShellCwd } from "../game/engine";
import { getCommandNames } from "just-bash/browser";

const GAME_CMDS = [
  "mail", "browser", "contracts", "accept", "submit", "scan", "probe", "connect",
  "disconnect", "download", "decrypt", "hashcrack", "run", "tools", "evidence", "notes",
  "trace", "logclean", "map", "whois", "theme", "clear",
];
const ALL_CMDS = Array.from(new Set([...GAME_CMDS, ...safeNames()]));
function safeNames(): string[] { try { return getCommandNames(); } catch { return []; } }

interface Tab {
  id: number;
  term: XTerm;
  fit: FitAddon;
  el: HTMLDivElement;
  line: string;
  cursor: number;
  history: string[];
  hist: number;
  busy: boolean;
}

function prompt(): string {
  const cwd = getShellCwd();
  const short = cwd.replace(/^\/home\/op/, "~");
  return `\x1b[38;5;45mop@darknet\x1b[0m:\x1b[38;5;75m${short}\x1b[0m$ `;
}

export function TerminalApp() {
  const hostRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<Tab[]>([]);
  const nextId = useRef(1);
  const [tabIds, setTabIds] = useState<number[]>([]);
  const [active, setActive] = useState(0);

  function newTab() {
    const host = hostRef.current!;
    const el = document.createElement("div");
    el.className = "term-pane";
    host.appendChild(el);
    const term = new XTerm({
      fontFamily: "'JetBrains Mono','Fira Code',monospace",
      fontSize: 13, cursorBlink: true, convertEol: true,
      theme: { background: "#0a0e14", foreground: "#cbd5e1", cursor: "#38bdf8" },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(el);
    const tab: Tab = { id: nextId.current++, term, fit, el, line: "", cursor: 0, history: [], hist: -1, busy: false };
    term.writeln("\x1b[38;5;45mDARKNET OS\x1b[0m // operator shell — type \x1b[1mhelp\x1b[0m or \x1b[1mcontracts\x1b[0m");
    term.write(prompt());
    term.onData((d) => onData(tab, d));
    term.onKey(() => {});
    tabsRef.current.push(tab);
    setTabIds(tabsRef.current.map((t) => t.id));
    setActive(tab.id);
  }

  async function run(tab: Tab, cmd: string) {
    const bash = getBash();
    if (!bash) { tab.term.writeln("shell not ready"); tab.term.write(prompt()); return; }
    if (cmd.trim() === "help") {
      tab.term.writeln("game commands: " + GAME_CMDS.join(" "));
      tab.term.writeln("plus standard unix: ls cd cat grep find sed awk pipes globs redirects loops vars");
      tab.term.write(prompt()); return;
    }
    tab.busy = true;
    try {
      const res = await bash.exec(cmd, { cwd: getShellCwd() });
      if (res.env?.PWD) setShellCwd(res.env.PWD); // persist cd across commands
      if (res.stdout) tab.term.write(res.stdout.replace(/\n/g, "\r\n"));
      if (res.stderr) tab.term.write("\x1b[38;5;203m" + res.stderr.replace(/\n/g, "\r\n") + "\x1b[0m");
    } catch (e) {
      tab.term.writeln("\x1b[38;5;203m" + (e as Error).message + "\x1b[0m");
    }
    tab.busy = false;
    tab.term.write(prompt());
  }

  async function complete(tab: Tab) {
    const parts = tab.line.split(/\s+/);
    const isFirst = parts.length === 1;
    const frag = parts[parts.length - 1] ?? "";
    let matches: string[] = [];
    if (isFirst) {
      matches = ALL_CMDS.filter((c) => c.startsWith(frag)).sort();
    } else {
      const bash = getBash();
      if (bash) {
        const slash = frag.lastIndexOf("/");
        const dir = slash >= 0 ? frag.slice(0, slash + 1) : "";
        const base = slash >= 0 ? frag.slice(slash + 1) : frag;
        const lookup = dir ? (dir.startsWith("/") ? dir : getShellCwd() + "/" + dir) : getShellCwd();
        try {
          const names = await bash.fs.readdir(lookup);
          matches = names.filter((n) => n.startsWith(base)).map((n) => dir + n).sort();
        } catch { /* none */ }
      }
    }
    if (matches.length === 1) {
      const add = matches[0].slice(frag.length);
      tab.line += add; tab.cursor = tab.line.length; tab.term.write(add);
    } else if (matches.length > 1) {
      tab.term.write("\r\n" + matches.join("  ") + "\r\n" + prompt() + tab.line);
    }
  }

  function onData(tab: Tab, d: string) {
    if (tab.busy) return;
    const t = tab.term;
    // arrow keys / escape sequences
    if (d === "\x1b[A") { // up
      if (tab.history.length && tab.hist < tab.history.length - 1) {
        tab.hist++; replaceLine(tab, tab.history[tab.history.length - 1 - tab.hist]);
      }
      return;
    }
    if (d === "\x1b[B") { // down
      if (tab.hist > 0) { tab.hist--; replaceLine(tab, tab.history[tab.history.length - 1 - tab.hist]); }
      else { tab.hist = -1; replaceLine(tab, ""); }
      return;
    }
    if (d === "\x1b[C") { if (tab.cursor < tab.line.length) { tab.cursor++; t.write("\x1b[C"); } return; } // right
    if (d === "\x1b[D") { if (tab.cursor > 0) { tab.cursor--; t.write("\x1b[D"); } return; } // left
    if (d === "\x1b[H" || d === "\x01") { if (tab.cursor > 0) { t.write("\x1b[" + tab.cursor + "D"); tab.cursor = 0; } return; } // home / ctrl-a
    if (d === "\x1b[F" || d === "\x05") { const n = tab.line.length - tab.cursor; if (n > 0) { t.write("\x1b[" + n + "C"); tab.cursor = tab.line.length; } return; } // end / ctrl-e
    if (d === "\x1b[3~") { // forward-delete
      if (tab.cursor < tab.line.length) {
        const rest = tab.line.slice(tab.cursor + 1);
        tab.line = tab.line.slice(0, tab.cursor) + rest;
        t.write(rest + " \x1b[" + (rest.length + 1) + "D");
      }
      return;
    }
    if (d === "\t") { complete(tab); return; }
    if (d === "\r") { // enter
      const cmd = tab.line;
      t.write("\r\n");
      if (cmd.trim()) { tab.history.push(cmd); }
      tab.hist = -1;
      tab.line = ""; tab.cursor = 0;
      if (cmd.trim()) run(tab, cmd); else t.write(prompt());
      return;
    }
    if (d === "\x7f") { // backspace (delete char before cursor)
      if (tab.cursor > 0) {
        const rest = tab.line.slice(tab.cursor);
        tab.line = tab.line.slice(0, tab.cursor - 1) + rest;
        tab.cursor--;
        t.write("\b" + rest + " \x1b[" + (rest.length + 1) + "D"); // redraw tail, erase leftover, restore cursor
      }
      return;
    }
    if (d === "\x03") { // ctrl-c
      t.write("^C\r\n" + prompt()); tab.line = ""; tab.cursor = 0; return;
    }
    if (d === "\x0c") { // ctrl-l clear
      t.write("\x1b[2J\x1b[H" + prompt() + tab.line);
      if (tab.cursor < tab.line.length) t.write("\x1b[" + (tab.line.length - tab.cursor) + "D");
      return;
    }
    // printable — insert at cursor
    if (d >= " ") {
      const rest = tab.line.slice(tab.cursor);
      tab.line = tab.line.slice(0, tab.cursor) + d + rest;
      tab.cursor += d.length;
      t.write(d + rest);
      if (rest) t.write("\x1b[" + rest.length + "D"); // pull cursor back to just after the insert
    }
  }

  function replaceLine(tab: Tab, next: string) {
    const t = tab.term;
    t.write("\r\x1b[K" + prompt() + next);
    tab.line = next; tab.cursor = next.length;
  }

  // init first tab once
  useEffect(() => {
    if (tabsRef.current.length === 0) newTab();
    const onResize = () => activeFit();
    window.addEventListener("resize", onResize);
    // refit when the window (and thus the terminal host) is resized or snapped
    const ro = new ResizeObserver(() => activeFit());
    if (hostRef.current) ro.observe(hostRef.current);
    return () => { window.removeEventListener("resize", onResize); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function activeFit() {
    const tab = tabsRef.current.find((t) => t.id === active);
    if (tab) { try { tab.fit.fit(); } catch { /* noop */ } }
  }

  // toggle visibility + fit on active change
  useEffect(() => {
    tabsRef.current.forEach((t) => { t.el.style.display = t.id === active ? "block" : "none"; });
    const tab = tabsRef.current.find((t) => t.id === active);
    if (tab) { setTimeout(() => { try { tab.fit.fit(); } catch { /* */ } tab.term.focus(); }, 0); }
  }, [active, tabIds]);

  function closeTab(id: number) {
    const idx = tabsRef.current.findIndex((t) => t.id === id);
    if (idx < 0 || tabsRef.current.length === 1) return;
    const [t] = tabsRef.current.splice(idx, 1);
    t.term.dispose(); t.el.remove();
    const ids = tabsRef.current.map((x) => x.id);
    setTabIds(ids);
    if (active === id) setActive(ids[Math.max(0, idx - 1)]);
  }

  return (
    <div className="terminal-app">
      <div className="term-tabs">
        {tabIds.map((id, i) => (
          <div key={id} className={"term-tab" + (id === active ? " on" : "")} onClick={() => setActive(id)}>
            <span>sh {i + 1}</span>
            {tabIds.length > 1 && <button onClick={(e) => { e.stopPropagation(); closeTab(id); }}>×</button>}
          </div>
        ))}
        <button className="term-tab add" onClick={newTab}>+</button>
      </div>
      <div className="term-host" ref={hostRef} onClick={activeFit} />
    </div>
  );
}
