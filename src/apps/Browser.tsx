import { useEffect, useState } from "react";
import { useStore } from "../store";
import { SITES, resolveUrl, type Paste } from "../game/sites";
import {
  browserBack, browserForward, browserNavigate, currentUrl,
  newBrowserTab, closeBrowserTab, setActiveBrowserTab,
  heliosLogin, addTrace, download, searchPaste, whoisLookup,
} from "../game/engine";
import { ContractBoard } from "./Contracts";
import { ToolMarket } from "./Arsenal";

export function BrowserApp() {
  const url = useStore(currentUrl);
  const tabs = useStore((s) => s.browserTabs);
  const activeTab = useStore((s) => s.activeTab);
  const bookmarks = useStore((s) => s.bookmarks);
  const [addr, setAddr] = useState(url);

  // keep the address bar in sync with the active tab's page (e.g. after a tab switch)
  useEffect(() => { setAddr(url); }, [url, activeTab]);

  function go(u?: string) {
    const target = resolveUrl((u ?? addr).trim());
    if (!target) return;
    browserNavigate(target);
    setAddr(target);
  }

  function tabLabel(t: { history: string[]; index: number }) {
    const u = t.index >= 0 ? t.history[t.index] : "";
    if (!u) return "new tab";
    return (SITES[u]?.title ?? u.replace(/^https?:\/\//, "")).slice(0, 22);
  }

  return (
    <div className="browser">
      <div className="browser-tabs">
        {tabs.map((t) => (
          <div key={t.id} className={"btab" + (t.id === activeTab ? " on" : "")} onClick={() => setActiveBrowserTab(t.id)}>
            <span>{tabLabel(t)}</span>
            {tabs.length > 1 && <button onClick={(e) => { e.stopPropagation(); closeBrowserTab(t.id); }}>×</button>}
          </div>
        ))}
        <button className="btab add" title="new tab" onClick={() => newBrowserTab()}>+</button>
      </div>
      <div className="browser-bar">
        <button onClick={() => browserBack()}>◀</button>
        <button onClick={() => browserForward()}>▶</button>
        <button onClick={() => go(url)}>⟳</button>
        <input className="addr" value={addr} onChange={(e) => setAddr(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()} placeholder="enter url…" />
        <button className="primary" onClick={() => go()}>go</button>
      </div>
      <div className="bookmarks">
        {bookmarks.map((b) => <button key={b} onClick={() => go(b)}>{b.replace(/^https?:\/\//, "")}</button>)}
      </div>
      <div className="browser-body" onClick={(e) => {
        // route in-page <a href> links (lore pages) through the in-app browser
        const a = (e.target as HTMLElement).closest("a");
        const href = a?.getAttribute("href");
        if (href) { e.preventDefault(); go(href); }
      }}>
        {/* every tab stays mounted (keeps its scroll + component state); only the
            active one is shown. closing a tab unmounts it, so reopening starts fresh. */}
        {tabs.map((t) => {
          const tu = t.index >= 0 ? t.history[t.index] : "";
          return (
            <div key={t.id} className="tab-view scroll" style={{ display: t.id === activeTab ? "block" : "none" }}>
              <TabView url={tu} go={go} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Renders the page content for one tab's current url. Kept mounted per tab.
function TabView({ url, go }: { url: string; go: (u: string) => void }) {
  const site = SITES[url];
  if (!url) return <Home go={go} />;
  if (!site) return <NotFound url={url} />;
  if (site.html) return <div className="page" dangerouslySetInnerHTML={{ __html: site.html }} />;
  switch (site.component) {
    case "contracts": return <div className="page"><ContractBoard /></div>;
    case "tools": return <div className="page"><ToolMarket market /></div>;
    case "pastebin": return <Pastebin go={go} />;
    case "helios": return <HeliosPortal />;
    case "whois": return <Whois />;
    default: return <NotFound url={url} />;
  }
}

function Home({ go }: { go: (u: string) => void }) {
  return <div className="page"><h1>darknet // start</h1>
    <p className="muted">empty tab. pick a bookmark or type an address.</p>
    <p><a onClick={() => go("darkboard://contracts")}>open the contract board →</a></p></div>;
}
function NotFound({ url }: { url: string }) {
  return <div className="page"><h1>can't reach <span className="muted">{url}</span></h1>
    <p className="muted">unknown host. recon may reveal more domains (whois, paste sites, emails, files).</p></div>;
}

function Pastebin({ go }: { go: (u: string) => void }) {
  const [q, setQ] = useState("");
  const [hit, setHit] = useState<Paste | null>(null);
  const [tried, setTried] = useState(false);
  function search() {
    setTried(true);
    setHit(searchPaste(q));
  }
  return <div className="page">
    <h1>pastebin.black <span className="muted">// anonymous pastes</span></h1>
    <div className="row">
      <input className="addr" value={q} placeholder="search pastes…" onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && search()} />
      <button className="primary" onClick={search}>search</button>
    </div>
    <div className="paste muted">paste #8841 — "grocery list" — eggs, milk, exploit kit (jk)</div>
    <div className="paste muted">paste #8839 — "ns config dump" — boring</div>
    {hit && <div className="paste leak">
      <b>paste {hit.title}</b>
      <pre>{hit.body}</pre>
      {hit.link && <p><a onClick={() => go(hit.link!)}>{hit.link} →</a></p>}
    </div>}
    {tried && !hit && q && <p className="muted">no results. try the exact phrase a client gave you.</p>}
  </div>;
}

function HeliosPortal() {
  const loggedIn = useStore((s) => s.flags.helios_login ?? false);
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [msg, setMsg] = useState("");
  function login(e: React.FormEvent) {
    e.preventDefault();
    if (u.trim() === "mara.chen" && p === "oblivion83") { heliosLogin(); }
    else { addTrace(12); setMsg("invalid credentials — security notified."); }
  }
  if (!loggedIn) return <div className="page">
    <h1>Helios Aerospace <span className="muted">// employee archive</span></h1>
    <form className="login" onSubmit={login}>
      <label>username<input value={u} onChange={(e) => setU(e.target.value)} autoComplete="off" /></label>
      <label>password<input type="password" value={p} onChange={(e) => setP(e.target.value)} /></label>
      <button className="primary" type="submit">sign in</button>
      {msg && <div className="warn">{msg}</div>}
    </form>
    <p className="muted small">authorized employees only. failed logins are logged.</p>
  </div>;
  return <div className="page">
    <h1>Helios Archive <span className="muted">// welcome, Mara</span></h1>
    <h3>Launch Audit Backups</h3>
    <ul>
      <li>launch-audit.zip <button className="link" onClick={() => download("/backup/launch-audit.zip")}>download</button> <span className="muted small">(encrypted)</span></li>
    </ul>
    <p className="muted small">internal note: build server <b>helios-build-01</b> (10.20.0.7) holds the archive password on my desktop. — M</p>
    <p className="muted small">tip: from a connected host, <code>scan</code> reveals neighbours.</p>
  </div>;
}

function Whois() {
  const [d, setD] = useState(""); const [rec, setRec] = useState("");
  function look() { if (d.trim()) setRec(whoisLookup(d.trim())); }
  return <div className="page">
    <h1>whois lookup</h1>
    <div className="row">
      <input className="addr" value={d} placeholder="domain…" onChange={(e) => setD(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && look()} />
      <button className="primary" onClick={look}>lookup</button>
    </div>
    {rec && <pre className="page">{rec}</pre>}
  </div>;
}
