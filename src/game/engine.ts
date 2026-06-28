import { store, type AppId, type WindowState, type Evidence, type State } from "../store";
import { resolveUrl, PASTES, WHOIS_DB, type Paste } from "./sites";
import type { Bash } from "just-bash/browser";

// ---- bash bridge (set once terminal mounts) ----
let bash: Bash | null = null;
export function setBash(b: Bash) { bash = b; }

const b64 = (s: string) => btoa(unescape(encodeURIComponent(s)));
const unb64 = (s: string) => decodeURIComponent(escape(atob(s)));

// The shell's working directory. Each bash.exec() is stateless (like `bash -c`),
// so cwd lives here instead of on the Bash instance. The terminal feeds it into
// every exec and updates it from the result's $PWD after each command.
let shellCwd = "/home/op";
export const getShellCwd = () => shellCwd;
export const setShellCwd = (c: string) => { shellCwd = c; };

// Resolve a user path against the shell's current dir (fs.realpath uses fs root).
function abspath(p: string): string {
  if (!bash) return p;
  return p.startsWith("/") ? p : bash.fs.resolvePath(shellCwd, p);
}

// ---------- Windows ----------
const APP_META: Record<AppId, { title: string; w: number; h: number }> = {
  terminal: { title: "terminal", w: 720, h: 440 },
  browser: { title: "browser", w: 880, h: 560 },
  email: { title: "mail", w: 640, h: 460 },
  contracts: { title: "contracts", w: 560, h: 480 },
  evidence: { title: "evidence board", w: 520, h: 440 },
  files: { title: "files", w: 560, h: 420 },
  netmap: { title: "network map", w: 600, h: 460 },
  arsenal: { title: "arsenal", w: 520, h: 440 },
  settings: { title: "settings", w: 440, h: 380 },
};

export function openApp(app: AppId) {
  const s = store.state;
  const existing = s.windows.find((w) => w.app === app);
  if (existing) { focusWindow(existing.id); if (existing.minimized) toggleMinimize(existing.id); return; }
  const meta = APP_META[app];
  const z = s.topZ + 1;
  const n = s.windows.length;
  const win: WindowState = {
    id: `${app}-${z}`, app, title: meta.title,
    x: 80 + (n % 6) * 32, y: 60 + (n % 6) * 28,
    w: meta.w, h: meta.h, z, minimized: false, snap: "none",
  };
  store.set({ windows: [...s.windows, win], topZ: z });
}
export function closeWindow(id: string) {
  store.set((s) => ({ windows: s.windows.filter((w) => w.id !== id) }));
}
export function focusWindow(id: string) {
  store.set((s) => {
    const z = s.topZ + 1;
    return { topZ: z, windows: s.windows.map((w) => (w.id === id ? { ...w, z } : w)) };
  });
}
export function updateWindow(id: string, patch: Partial<WindowState>) {
  store.set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
}
export function toggleMinimize(id: string) {
  store.set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: !w.minimized } : w)) }));
}
export function snapWindow(id: string, snap: WindowState["snap"]) {
  const top = 34, W = window.innerWidth, Hh = window.innerHeight - top; // minus topbar
  const hw = W / 2, hh = Hh / 2;
  const geo: Record<WindowState["snap"], Partial<WindowState>> = {
    left: { x: 0, y: top, w: hw, h: Hh },
    right: { x: hw, y: top, w: hw, h: Hh },
    max: { x: 0, y: top, w: W, h: Hh },
    tl: { x: 0, y: top, w: hw, h: hh },
    tr: { x: hw, y: top, w: hw, h: hh },
    bl: { x: 0, y: top + hh, w: hw, h: hh },
    br: { x: hw, y: top + hh, w: hw, h: hh },
    none: {},
  };
  updateWindow(id, { snap, ...geo[snap] });
  focusWindow(id);
}

// ---------- Browser (multi-tab) ----------
type BTab = { id: number; history: string[]; index: number };
function mapActive(s: State, fn: (t: BTab) => BTab): Partial<State> {
  return { browserTabs: s.browserTabs.map((t) => (t.id === s.activeTab ? fn(t) : t)) };
}
export function browserNavigate(input: string) {
  const url = resolveUrl(input);
  store.set((s) => mapActive(s, (t) => {
    const hist = t.history.slice(0, t.index + 1);
    hist.push(url);
    return { ...t, history: hist, index: hist.length - 1 };
  }));
}
export function browserBack() {
  store.set((s) => mapActive(s, (t) => (t.index > 0 ? { ...t, index: t.index - 1 } : t)));
}
export function browserForward() {
  store.set((s) => mapActive(s, (t) => (t.index < t.history.length - 1 ? { ...t, index: t.index + 1 } : t)));
}
export function currentUrl(): string {
  const s = store.state;
  const t = s.browserTabs.find((x) => x.id === s.activeTab) ?? s.browserTabs[0];
  return t && t.index >= 0 ? t.history[t.index] : "";
}
export function newBrowserTab(url?: string) {
  store.set((s) => {
    const id = Math.max(0, ...s.browserTabs.map((t) => t.id)) + 1;
    return { browserTabs: [...s.browserTabs, { id, history: [], index: -1 }], activeTab: id };
  });
  if (url) browserNavigate(url);
}
export function closeBrowserTab(id: number) {
  store.set((s) => {
    if (s.browserTabs.length <= 1) return {}; // keep at least one
    const idx = s.browserTabs.findIndex((t) => t.id === id);
    const tabs = s.browserTabs.filter((t) => t.id !== id);
    const active = s.activeTab === id ? tabs[Math.max(0, idx - 1)].id : s.activeTab;
    return { browserTabs: tabs, activeTab: active };
  });
}
export function setActiveBrowserTab(id: number) { store.set({ activeTab: id }); }

// whois — shared by the terminal `whois` command and the whois.lookup site.
// Returns the record and discovers any host whose domain falls under the lookup.
export function whoisLookup(domain: string): string {
  const key = domain.replace(/^https?:\/\//, "").replace(/^(archive|files|www)\./, "").trim();
  addTrace(1);
  const rec = WHOIS_DB[key];
  if (!rec) return `whois: no record for ${domain}`;
  Object.values(store.state.hosts).forEach((h) => {
    if (h.domain && (h.domain === key || h.domain.endsWith("." + key) || h.domain.endsWith(key))) {
      store.set((s) => ({ hosts: { ...s.hosts, [h.id]: { ...s.hosts[h.id], discovered: true } } }));
    }
  });
  return rec;
}

// Pastebin search — returns the matching leak and applies its side effects.
export function searchPaste(query: string): Paste | null {
  const p = PASTES.find((x) => x.match.test(query));
  if (!p) return null;
  store.set((s) => {
    const patch: Partial<State> = {};
    if (p.flag) patch.flags = { ...s.flags, [p.flag]: true };
    if (p.reveals) patch.hosts = { ...s.hosts, [p.reveals]: { ...s.hosts[p.reveals], discovered: true } };
    return patch;
  });
  store.notify(`paste found: ${p.title}`);
  return p;
}

// ---------- Trace ----------
export function addTrace(n: number) {
  // proxychain (if owned) passively dampens the noise you generate
  if (n > 0 && store.state.tools["proxychain"]?.owned) n = Math.ceil(n * 0.5);
  store.set((s) => ({ trace: Math.min(100, s.trace + n), traceArmed: n > 0 ? true : s.traceArmed }));
  const t = store.state.trace;
  if (t >= 50 && !store.state.flags.traceWarned) {
    store.set((s) => ({ flags: { ...s.flags, traceWarned: true } }));
    store.notify("⚠ trace at 50% — you are being followed");
    pushEmail({
      id: "rival-warn", from: "??? <relay@ghost>", subject: "i see you",
      body: "sloppy. drop the connection or i drop a dime on you.\n\n— a friend",
    });
  }
  if (t >= 100) traceComplete();
}
function traceComplete() {
  store.notify("⛔ TRACE COMPLETE — emergency disconnect");
  if (store.state.connection) store.set((s) => ({
    hosts: { ...s.hosts, [s.connection!]: { ...s.hosts[s.connection!], compromised: false } },
  }));
  disconnect();
  store.set((s) => ({ trace: 60, rep: Math.max(0, s.rep - 1), flags: { ...s.flags, burned: true } }));
}
const LOGCLEAN_COOLDOWN = 20000; // ms — can't be mashed down to zero instantly
export function logclean(): string {
  if (store.state.trace === 0) return "logs already clean.";
  const since = Date.now() - (store.state.lastLogclean || 0);
  if (since < LOGCLEAN_COOLDOWN)
    return `logclean: scrubber still cooling down (${Math.ceil((LOGCLEAN_COOLDOWN - since) / 1000)}s). it leaves traces of its own if overused.`;
  store.set((s) => ({ trace: Math.max(0, s.trace - 35), traceArmed: false, lastLogclean: Date.now() }));
  store.notify("logs scrubbed (-35 trace)");
  return "route scrubbed from host logs. trace lowered by 35. let it cool before the next pass.";
}

// ---------- Recon ----------
export function scan(hostKey?: string): string {
  addTrace(5);
  const s = store.state;
  if (!hostKey) {
    // scan from current connection or list discovered
    const disc = Object.values(s.hosts).filter((h) => h.discovered);
    return disc.length
      ? "discovered hosts:\n" + disc.map((h) => `  ${h.hostname.padEnd(18)} ${h.ip}  ${h.domain ?? ""}`).join("\n")
      : "no hosts discovered yet. follow leads from contracts, email and the browser.";
  }
  const host = findHost(hostKey);
  if (!host) return `scan: cannot resolve '${hostKey}'`;
  if (!host.discovered) store.set((st) => ({ hosts: { ...st.hosts, [host.id]: { ...host, discovered: true } } }));
  // reveal neighbours
  const revealed: string[] = [];
  host.links.forEach((id) => {
    const n = store.state.hosts[id];
    if (n && !n.discovered) {
      store.set((st) => ({ hosts: { ...st.hosts, [id]: { ...st.hosts[id], discovered: true } } }));
      revealed.push(`${n.hostname} (${n.ip})`);
    }
  });
  let out = `scanning ${host.hostname} (${host.ip})...\n`;
  out += revealed.length ? "  neighbours found:\n" + revealed.map((r) => "    + " + r).join("\n") : "  no new neighbours.";
  return out;
}

export function probe(hostKey?: string): string {
  addTrace(3);
  const host = hostKey ? findHost(hostKey) : store.state.connection ? store.state.hosts[store.state.connection] : null;
  if (!host) return "probe: specify a discovered host, e.g. probe helios-build-01";
  if (!host.discovered) return `probe: '${hostKey}' not discovered yet — scan first.`;
  let out = `${host.hostname}  ${host.ip}  [${host.org}]  security:${host.security}/5\n`;
  out += "  PORT   SERVICE\n";
  host.services.forEach((sv) => (out += `  ${String(sv.port).padEnd(6)} ${sv.name}\n`));
  if (host.requiresTool && !host.compromised) out += `  ! locked service — needs a special tool (run <tool> ${host.hostname}).\n`;
  if (host.access && !host.compromised) out += `  ! login required — connect ${host.id} <user> <pass> (find creds first).\n`;
  if (host.dbdump) out += `  i database present — dbdump can pull a full copy.\n`;
  return out.trimEnd();
}

function findHost(key: string) {
  const s = store.state;
  return Object.values(s.hosts).find(
    (h) => h.id === key || h.hostname === key || h.ip === key || h.domain === key,
  ) || null;
}

// ---------- Connect / mount ----------
export async function connect(hostKey: string, user?: string, pass?: string): Promise<string> {
  const host = findHost(hostKey);
  if (!host) return `connect: cannot resolve '${hostKey}'`;
  if (!host.discovered) return `connect: '${hostKey}' not discovered — scan first.`;
  if (host.requiresTool && !host.compromised && !store.state.tools[host.requiresTool]?.owned)
    return `connect: ${host.hostname} is locked (needs a tool). try: run <tool> ${host.hostname}`;
  if (host.requiresTool && !host.compromised && store.state.tools[host.requiresTool]?.owned)
    return `connect: ${host.hostname} is locked. run the implant first: run ${host.requiresTool} ${host.hostname}`;
  // credential gate (ssh-style). once cracked, the host stays compromised.
  if (host.access && !host.compromised) {
    if (!user || !pass)
      return `connect: ${host.hostname} requires login.  usage: connect ${hostKey} <user> <pass>\n(find credentials in files, pastes, or with hashcrack/packetdump)`;
    if (user !== host.access.user || pass !== host.access.pass) {
      addTrace(12);
      return `connect: ${host.hostname}: access denied for '${user}' — failed login logged (+trace).`;
    }
    store.set((s) => ({ hosts: { ...s.hosts, [host.id]: { ...host, compromised: true } } }));
    store.notify(`login accepted on ${host.hostname}`);
  }
  addTrace(8);
  store.set((s) => ({
    connection: host.id,
    hosts: { ...s.hosts, [host.id]: { ...host, discovered: true } },
  }));
  await mountHost(host.id);
  store.notify(`connected to ${host.hostname}`);
  return `connected to ${host.hostname}.\nremote files mounted at /mnt/${host.id} — use ls, cat, grep, find.`;
}

async function mountHost(id: string) {
  if (!bash) return;
  const host = store.state.hosts[id];
  const base = `/mnt/${id}`;
  await bash.exec(`mkdir -p ${base}`, { cwd: "/home/op" });
  for (const [p, content] of Object.entries(host.files ?? {})) {
    const full = base + p;
    const dir = full.slice(0, full.lastIndexOf("/"));
    await bash.exec(`mkdir -p '${dir}'`, { cwd: "/home/op" });
    await bash.fs.writeFile(full, content);
  }
}

export async function disconnect(): Promise<string> {
  const id = store.state.connection;
  if (!id) return "not connected.";
  if (bash) { try { await bash.exec(`rm -rf /mnt/${id}`, { cwd: "/home/op" }); } catch { /* ignore */ } }
  store.set({ connection: null, traceArmed: false });
  store.notify("disconnected");
  return `disconnected from ${id}.`;
}

// ---------- Downloads ----------
const ENC_AUDIT = `ENC:launchpad7:${b64(`HELIOS AEROSPACE // INTERNAL
LAUNCH AUDIT 7 — "BLUE ORBIT"  (CLASSIFICATION: BURIED)

The Blue Orbit test launch did NOT fail on telemetry as reported.
Pre-flight valve B was flagged by QA engineer M. Chen and OVERRIDDEN by
management to hold the launch window. Override ticket: HX-4471.
Root cause was known 11 days before launch. The public statement is false.

Sign-off: director r.vance`)}`;

interface DL { dest: string; content: string; trace: number; flag?: string; }
const DOWNLOADS: Record<string, DL> = {
  "/backup/launch-audit.zip": { dest: "/home/op/downloads/launch-audit.zip", content: ENC_AUDIT, trace: 6, flag: "helios_login" },
};

export async function download(path: string): Promise<string> {
  if (!bash) return "download: terminal not ready";
  // remote (mounted) or portal artifact
  const dl = DOWNLOADS[path];
  if (dl) {
    if (dl.flag && !store.state.flags[dl.flag]) return `download: ${path}: access denied (not authenticated)`;
    addTrace(dl.trace);
    await bash.fs.writeFile(dl.dest, dl.content);
    store.notify(`downloaded ${dl.dest.split("/").pop()}`);
    return `saved ${dl.dest}  (${dl.content.startsWith("ENC:") ? "encrypted — needs decrypt" : "ok"})`;
  }
  // generic: copy an existing (e.g. mounted) file into ~/downloads
  try {
    const src = abspath(path);
    if (!(await bash.fs.exists(src))) return `download: ${path}: no such file`;
    const name = src.split("/").pop()!;
    const data = await bash.fs.readFile(src);
    await bash.fs.writeFile(`/home/op/downloads/${name}`, data);
    store.notify(`downloaded ${name}`);
    return `saved /home/op/downloads/${name}`;
  } catch (e) { return `download: ${(e as Error).message}`; }
}

// ---------- decrypt ----------
export async function decrypt(file: string, key?: string): Promise<string> {
  if (!bash) return "decrypt: terminal not ready";
  let abs = abspath(file);
  if (!(await bash.fs.exists(abs))) {
    const alt = `/home/op/downloads/${file.split("/").pop()}`;
    if (await bash.fs.exists(alt)) abs = alt;
    else return `decrypt: ${file}: no such file`;
  }
  const raw = await bash.fs.readFile(abs);
  if (!raw.startsWith("ENC:")) return `decrypt: ${file} is not encrypted.`;
  const [, realKey, payload] = raw.split(":");
  let brute = "";
  if (!key) {
    // portcrack lets you skip finding the key entirely (noisier)
    if (store.state.tools["portcrack"]?.owned) { addTrace(8); key = realKey; brute = "portcrack brute-forced the key. "; }
    else return "decrypt: missing key.  usage: decrypt <file> <key>   (or buy portcrack to brute it)";
  }
  if (key !== realKey) { addTrace(2); return "decrypt: wrong key."; }
  const out = unb64(payload);
  const base = abs.replace(/\.(zip|enc|gpg)$/, "");
  const dest = abs.endsWith(".zip") ? base + "/audit-7.txt" : base + ".txt";
  const dir = dest.slice(0, dest.lastIndexOf("/"));
  await bash.exec(`mkdir -p '${dir}'`, { cwd: "/home/op" });
  await bash.fs.writeFile(dest, out);
  store.notify("archive decrypted");
  return `${brute}decrypted -> ${dest}\n\n${out}`;
}

// ---------- hashcrack ----------
import { HASHES } from "./content";
export function hashcrack(hash?: string): string {
  if (!hash) return "usage: hashcrack <hash>";
  if (!store.state.tools["hashcrack"]?.owned) return "hashcrack: tool not available.";
  addTrace(2);
  const pw = HASHES[hash.replace(/^[a-z0-9]+:/i, "").trim()];
  return pw
    ? `hashcrack: match found\n  ${hash}  ->  ${pw}`
    : `hashcrack: no match for '${hash}' in the wordlist.`;
}

// ---------- Tools ----------
export function grantTool(id: string) {
  store.set((s) => ({ tools: { ...s.tools, [id]: { ...s.tools[id], owned: true } } }));
  store.notify(`tool acquired: ${store.state.tools[id]?.name}`);
}
export function buyTool(id: string): string {
  const t = store.state.tools[id];
  if (!t) return "no such tool.";
  if (t.owned) return `${t.name}: already owned.`;
  if (t.price == null) return `${t.name} is not for sale.`;
  if (store.state.money < t.price) return `not enough credits (need ${t.price}).`;
  store.set((s) => ({ money: s.money - t.price! }));
  grantTool(id);
  return `purchased ${t.name} for ${t.price} credits.`;
}
export async function runTool(toolId: string, target?: string): Promise<string> {
  const t = store.state.tools[toolId.toLowerCase()];
  if (!t) return `run: unknown tool '${toolId}'`;
  if (!t.owned) return `run: you don't own ${t.name}.`;
  addTrace(t.noise);
  // implants that defeat a tool-locked service on a host
  const exploit: Record<string, string> = { orbitkey: "orb-smb", ghostrelay: "gx-relay", bluelatch: "bl-share", kernelslip: "kx-core" };
  if (exploit[t.id]) {
    const host = target ? findHost(target) : null;
    if (!host) return `run: ${t.name} needs a target host.`;
    if (host.requiresTool !== t.id) return `${t.name} has no effect on ${host.hostname}.`;
    store.set((s) => ({ hosts: { ...s.hosts, [host.id]: { ...host, compromised: true, discovered: true } } }));
    store.notify(`${t.name} opened ${host.hostname}`);
    return `${t.name}: ${exploit[t.id]} lock defeated on ${host.hostname}. now: connect ${host.hostname}`;
  }
  if (t.id === "webmap") {
    // crawl a domain to surface its unlinked file host
    const map: Record<string, string> = {
      "vanta-holdings.local": "vanta-files",
      "meridian-trust.local": "meridian-staging",
      "northwind-logi.local": "northwind-relay",
      "lumen-studio.local": "lumen-render",
      "coinhollow.local": "coinhollow-api",
      "redline-pr.local": "redline-mail",
      "aerolink.local": "aerolink-ftp",
    };
    const key = (target ?? "").replace(/^https?:\/\//, "");
    const hostId = map[key];
    if (!hostId) return `webmap: crawled ${target ?? "(no target)"} — no unlinked hosts found here.`;
    store.set((s) => ({ hosts: { ...s.hosts, [hostId]: { ...s.hosts[hostId], discovered: true } } }));
    store.notify(`webmap revealed ${store.state.hosts[hostId].hostname}`);
    return `webmap: found an unlinked host: ${store.state.hosts[hostId].hostname} (${store.state.hosts[hostId].ip}). now: connect ${hostId}`;
  }
  if (t.id === "forensic") {
    const id = store.state.connection;
    if (!id) return "forensic: connect to a host first.";
    const host = store.state.hosts[id];
    if (!host.hidden || Object.keys(host.hidden).length === 0) return `forensic: nothing recoverable on ${host.hostname}.`;
    await forensicRecover(id);
    return `forensic: recovered ${Object.keys(host.hidden).length} deleted file(s) into /mnt/${id}. look for hidden (dot) paths.`;
  }
  if (t.id === "packetdump") {
    const id = store.state.connection;
    if (!id) return "packetdump: connect to a host first, then sniff its network.";
    const host = store.state.hosts[id];
    const leaks = host.links.map((l) => store.state.hosts[l]).filter((h) => h?.access && !h.compromised);
    if (leaks.length === 0) return `packetdump: no plaintext credentials seen on ${host.hostname}'s segment.`;
    leaks.forEach((h) => store.set((s) => ({ hosts: { ...s.hosts, [h.id]: { ...s.hosts[h.id], discovered: true } } })));
    return "packetdump: captured credentials on the wire:\n" +
      leaks.map((h) => `  ${h.hostname} (${h.ip})  ->  ${h.access!.user} / ${h.access!.pass}`).join("\n");
  }
  if (t.id === "dbdump") {
    const host = target ? findHost(target) : store.state.connection ? store.state.hosts[store.state.connection] : null;
    if (!host) return "dbdump: connect to the database host first (or pass a target).";
    if (!host.dbdump) return `dbdump: ${host.hostname} has no dumpable database.`;
    if (store.state.connection !== host.id) return `dbdump: connect to ${host.hostname} first.`;
    await dbdumpWrite(host.id);
    return `dbdump: full dump written to /mnt/${host.id}/dump-full.csv (pin it for the bonus).`;
  }
  return `${t.name}: nothing to do against '${target ?? ""}'.`;
}

async function dbdumpWrite(id: string) {
  if (!bash) return;
  await bash.fs.writeFile(`/mnt/${id}/dump-full.csv`, store.state.hosts[id].dbdump ?? "");
  store.notify("database dumped");
}

async function forensicRecover(id: string) {
  if (!bash) return;
  const host = store.state.hosts[id];
  for (const [p, content] of Object.entries(host.hidden ?? {})) {
    const full = `/mnt/${id}${p}`;
    const dir = full.slice(0, full.lastIndexOf("/"));
    await bash.exec(`mkdir -p '${dir}'`, { cwd: "/home/op" });
    await bash.fs.writeFile(full, content);
  }
  store.notify("forensic recovery complete");
}

// ---------- Email ----------
export function pushEmail(e: { id: string; from: string; subject: string; body: string; choices?: { label: string; action: string }[] }) {
  if (store.state.emails.some((m) => m.id === e.id)) return;
  store.set((s) => ({ emails: [...s.emails, { ...e, read: false, at: s.emails.length }] }));
  store.notify(`new mail: ${e.subject}`);
}
export function readEmail(id: string) {
  store.set((s) => ({ emails: s.emails.map((m) => (m.id === id ? { ...m, read: true } : m)) }));
}
export function chooseEmail(id: string, action: string) {
  store.set((s) => ({ emails: s.emails.map((m) => (m.id === id ? { ...m, chosen: action } : m)) }));
  handleChoice(action);
}

// ---------- Evidence ----------
interface EvSource { id: string; label: string; kind: string; match: RegExp; }
const EV_SOURCES: EvSource[] = [
  { id: "activation-phrase", label: "Board activation phrase", kind: "credential", match: /ACTIVATION:/ },
  { id: "audit-report", label: "Helios buried launch audit", kind: "document", match: /LAUNCH AUDIT 7/ },
  { id: "override-ledger", label: "Helios override ledger", kind: "document", match: /OVERRIDE LEDGER/ },
  { id: "loudhaus-log", label: "loudhaus.fm defacement log (m0ngrel)", kind: "log", match: /m0ngrel/i },
  { id: "vanta-invoices", label: "Vanta ghost-invoice ledger", kind: "document", match: /OFFSHORE TRANSFER/ },
  { id: "vanta-shellco", label: "Vanta shell-company owner (D. Soto)", kind: "document", match: /SHELL-ALPHA and SHELL-BRAVO/ },
  { id: "rival-targets", label: "Rival operator target list", kind: "document", match: /RIVAL TARGET LIST/ },
  { id: "meridian-customers", label: "Meridian customer records (sample)", kind: "document", match: /CUSTOMER RECORDS/ },
  { id: "meridian-fulldump", label: "Meridian full database dump (PII)", kind: "document", match: /FULL DUMP/ },
  { id: "meridian-memo", label: "Meridian board cover-up memo", kind: "document", match: /BOARD MEMO/ },
  { id: "northwind-manifest", label: "Northwind smuggling manifest", kind: "document", match: /NORTHWIND MANIFEST/ },
  { id: "northwind-ledger", label: "Northwind kingpin ledger (Calloway)", kind: "document", match: /NORTHWIND LEDGER/ },
  { id: "saltwire-tamper", label: "Saltwire sensor tamper log", kind: "log", match: /SENSOR TAMPER/ },
  { id: "lumen-source", label: "Lumen deepfake source (recovered)", kind: "document", match: /DEEPFAKE SOURCE/ },
  { id: "vance-ledger", label: "Vance master ledger (the whole machine)", kind: "document", match: /MASTER LEDGER/ },
  { id: "coinhollow-ledger", label: "CoinHollow rug-pull ledger", kind: "document", match: /RUGPULL LEDGER/ },
  { id: "coinhollow-wallet", label: "CoinHollow cold-wallet keys", kind: "credential", match: /COLD WALLET/ },
  { id: "mercy-data", label: "Mercy General patient-data sale record", kind: "document", match: /PATIENT DATA SALE/ },
  { id: "redline-ledger", label: "Redline blackmail ledger", kind: "document", match: /BLACKMAIL LEDGER/ },
  { id: "redline-leverage", label: "Redline leverage archive", kind: "document", match: /LEVERAGE FILE/ },
  { id: "aerolink-fdr", label: "AeroLink real flight recorder data", kind: "document", match: /FLIGHT RECORDER/ },
  { id: "aerolink-coverup", label: "AeroLink falsification order", kind: "document", match: /AEROLINK COVERUP/ },
];

export async function pinEvidence(path: string): Promise<string> {
  if (!bash) return "evidence: terminal not ready";
  const abs = abspath(path);
  if (!(await bash.fs.exists(abs))) return `evidence: ${path}: no such file`;
  const content = await bash.fs.readFile(abs);
  const src = EV_SOURCES.find((s) => s.match.test(content));
  const ev: Evidence = src
    ? { id: src.id, label: src.label, kind: src.kind, source: abs, pinned: true }
    : { id: `file:${abs}`, label: abs.split("/").pop()!, kind: "file", source: abs, pinned: true };
  addEvidence(ev);
  if (src && src.id === "activation-phrase") store.notify("activation phrase verified");
  return `pinned evidence: ${ev.label}`;
}
export function addEvidence(ev: Evidence) {
  store.set((s) => (s.evidence.some((e) => e.id === ev.id) ? {} : { evidence: [...s.evidence, ev] }));
}
export function addNote(text: string): string {
  addEvidence({ id: `note:${Date.now()}`, label: text, kind: "note", source: "manual", pinned: true });
  return "note added to evidence board.";
}
export function removeEvidence(id: string) {
  store.set((s) => ({ evidence: s.evidence.filter((e) => e.id !== id) }));
}
export function updateNote(id: string, text: string) {
  store.set((s) => ({ evidence: s.evidence.map((e) => (e.id === id ? { ...e, label: text } : e)) }));
}

// ---------- Contracts ----------
import type { Contract } from "../store";

// Returns a human-readable lock reason, or null if the contract can be accepted.
export function contractGate(c: Contract): string | null {
  if (c.dependsOn) {
    const dep = store.state.contracts[c.dependsOn];
    if (dep && dep.status !== "submitted") return `depends on "${dep.title}"`;
  }
  if (c.reqRep != null && store.state.rep < c.reqRep) return `needs reputation ${c.reqRep} (you have ${store.state.rep})`;
  if (c.reqTool && !store.state.tools[c.reqTool]?.owned) return `needs tool: ${store.state.tools[c.reqTool]?.name ?? c.reqTool}`;
  if (c.reqFlag && !store.state.flags[c.reqFlag]) return "not yet available";
  if (c.blockFlag && store.state.flags[c.blockFlag]) return "closed by an earlier choice";
  return null;
}

export function acceptContract(id: string): string {
  const c = store.state.contracts[id];
  if (!c) return `accept: no contract '${id}'`;
  if (c.status !== "available") return `accept: ${id} already ${c.status}.`;
  const gate = contractGate(c);
  if (gate) return `accept: ${id} is locked — ${gate}.`;
  store.set((s) => ({ contracts: { ...s.contracts, [id]: { ...c, status: "accepted" } } }));
  store.notify(`accepted contract: ${c.title}`);
  onAccept(id);
  return `accepted "${c.title}". check your email and the leads.`;
}

function onAccept(id: string) {
  if (id === "quiet-launch") {
    pushEmail({
      id: "cr-brief", from: "cold-rocket <cr@dead-drop.exchange>", subject: "re: quiet launch",
      body: `you took it. good.

Helios buried a launch audit. i want proof.

leads:
 - their employee archive sits on helios-aero.local
 - a QA engineer, Mara Chen, was involved
 - people on the paste sites keep whispering "blue orbit archive"

stay quiet. don't wreck anything. — cold-rocket`,
    });
  }
  if (id === "cold-storage") {
    pushEmail({
      id: "cs-brief", from: "cold-rocket <cr@dead-drop.exchange>", subject: "re: cold storage",
      body: `last piece. the money trail is on an orbit-locked vault (helios-vault).
you've got OrbitKey now — open it, pull the override ledger, submit. — cold-rocket`,
    });
  }
  if (id === "loud-house") {
    pushEmail({
      id: "lh-brief", from: "mixtape <mix@loudhaus.fm>", subject: "re: loud house",
      body: `some clown defaced my show's site. i don't want revenge, i want a NAME.

start at loudhaus.fm. the box is old — it keeps access logs. that's all i've got.

  whois loudhaus.fm
  connect loudhaus-web
  grep the log under /mnt/loudhaus-web/var/log, then pin it and submit.

— mixtape`,
    });
  }
  if (id === "paper-trail") {
    pushEmail({
      id: "pt-brief", from: "auditor-9 <a9@dead-drop.exchange>", subject: "re: paper trail",
      body: `Vanta Holdings launders through "ghost invoices". their public site is a brochure —
the real ledger is on a host they never linked.

 - search the paste sites for "ghost invoices"
 - open vanta-holdings.local, then crawl it:  run webmap vanta-holdings.local
 - connect the host it finds, grep the invoices, pin them.

do this clean and the GhostRelay implant is yours. — auditor-9`,
    });
  }
  if (id === "glass-house") {
    pushEmail({
      id: "gh-brief", from: "auditor-9 <a9@dead-drop.exchange>", subject: "re: glass house",
      body: `Meridian Trust breached their customers and buried it. i want it proven.

this one has depth — don't expect a one-liner:
 1. whois / open meridian-trust.local, then  run webmap meridian-trust.local
 2. the paste sites have a "meridian breach" leak with an IT hash —
    crack it:  hashcrack <hash>
 3. log into staging:  connect staging.meridian-trust.local j.poole <password>
 4. read jpoole's notes — they reuse prod creds. scan from staging.
 5. log into the db, prove the customer exposure. the vault memo shows what
    the board knew (archive key is in jpoole's notes).
 6. optional: packetdump the segment / dbdump the full database for more pay.

then decide what it's worth to you. — auditor-9`,
    });
  }
  if (id === "dead-channel") {
    pushEmail({
      id: "dc-brief", from: "harbor <h@dead-drop.exchange>", subject: "re: dead channel",
      body: `Northwind ships dirty freight under clean manifests. i want a real one.

 1. open/whois northwind-logi.local, then  run webmap northwind-logi.local
 2. the paste sites leaked an "ops" hash — hashcrack it
 3. connect relay.northwind-logi.local ops <password>
 4. read the handoff note, scan, then connect the cache box and decrypt the manifest
 5. pin it and submit.

finish this clean and there's a bigger job waiting. — harbor`,
    });
  }
  if (id === "open-channel") {
    pushEmail({
      id: "oc-brief", from: "harbor <h@dead-drop.exchange>", subject: "re: open channel",
      body: `the manifest named the broker — M. Calloway. the proof is on Northwind's core
(10.50.0.40), behind a legacy bl-share lock. you've got BlueLatch from the bank job.

  run bluelatch northwind-core
  connect northwind-core
  pull /share/ledger.txt, pin it, submit — then make your call. — harbor`,
    });
  }
  if (id === "saltwire") {
    pushEmail({
      id: "sw-brief", from: "greenfield <g@dead-drop.exchange>", subject: "re: saltwire",
      body: `Saltwire dumps into the bay and fakes the sensors. prove it.

 1. whois saltwire-energy.local — the jump host is open, connect it
 2. run packetdump on the segment to grab the VPN creds
 3. connect the VPN with them, scan, then reach the SCADA box
 4. the sensor log is the proof. pin it, submit. — greenfield`,
    });
  }
  if (id === "paper-moon") {
    pushEmail({
      id: "pm-brief", from: "inkwell <ink@dead-drop.exchange>", subject: "re: paper moon",
      body: `Lumen Studios builds deepfakes to order and deletes the evidence. deleted isn't gone.

 1. webmap lumen-studio.local to find the render farm
 2. a paste leaked the render-account hash — crack it, log in
 3. the source files were purged — run forensic on the render box to recover one
 4. pin it and submit. pull this off and i'll get you a KernelSlip implant. — inkwell`,
    });
  }
  if (id === "last-light") {
    pushEmail({
      id: "ll-brief", from: "board@dead-drop.exchange", subject: "re: last light",
      body: `it was Vance all along. his private network funds the rival, Northwind, Vanta — all of it.

  whois vance-trust.local — find r.vance's creds (a paste has the hash)
  connect vance-edge r.vance <password>, scan to the core
  the core is kx-core hardened — run kernelslip vance-core
  take the master ledger, then decide how this ends.

this is the last one. — dead-drop`,
    });
  }
  if (id === "hollow-coin") {
    pushEmail({
      id: "hc-brief", from: "burned-bagholder <bb@dead-drop.exchange>", subject: "re: hollow coin",
      body: `coinhollow took everything i had and called it a hack. it wasn't.

 1. run webmap coinhollow.local to find the api box
 2. a paste leaks the admin hash — hashcrack it, log in
 3. the api config has the db creds AND the cold-wallet key
 4. the db ledger is the proof. the cold wallet is the money.
 5. pin the ledger, submit — then decide what happens to 4 million in user funds.`,
    });
  }
  if (id === "ghost-shift") {
    pushEmail({
      id: "gs-brief", from: "inkwell <ink@dead-drop.exchange>", subject: "re: ghost shift",
      body: `Mercy General sold 42,000 patients' records and shredded the paperwork.

 1. whois mercy-health.local — the jump host is open, connect it
 2. run packetdump to grab the records-box creds
 3. connect the records box; the sale file was deleted — run forensic
 4. pin the recovered record, submit. — inkwell`,
    });
  }
  if (id === "red-letter") {
    pushEmail({
      id: "rl-brief", from: "inkwell <ink@dead-drop.exchange>", subject: "re: red letter",
      body: `Redline "PR" is a blackmail shop. get their ledger.

 1. run webmap redline-pr.local to find the mail host
 2. a paste leaks the postmaster hash — crack it, log in
 3. grep the mail spool for the ledger; the leverage archive is encrypted (key's in the spool)
 4. pin the ledger, submit — and decide what to do with the leverage. — inkwell`,
    });
  }
  if (id === "black-box") {
    pushEmail({
      id: "bb-brief", from: "greenfield <g@dead-drop.exchange>", subject: "re: black box",
      body: `AeroLink edited a flight recorder to bury a near-crash on flight 229.

 1. run webmap aerolink.local to find the maintenance host
 2. a paste leaks a maintenance hash — crack it, log in
 3. the flight-data archive is encrypted; the key is in /data/notes.txt — decrypt it
 4. pin the real recorder data, submit. there's a follow-up if you want the names. — greenfield`,
    });
  }
  if (id === "flight-risk") {
    pushEmail({
      id: "fr-brief", from: "greenfield <g@dead-drop.exchange>", subject: "re: flight risk",
      body: `the recorder proves WHAT happened. the ops core proves WHO ordered it —
it's behind a bl-share lock (aerolink-core). you've got BlueLatch.

  run bluelatch aerolink-core
  connect aerolink-core
  pull /share/coverup.txt, pin it, submit — then make the call. — greenfield`,
    });
  }
  if (id === "signal-loss") {
    store.set((s) => ({ hosts: { ...s.hosts, "relay-node": { ...s.hosts["relay-node"], discovered: true } } }));
    pushEmail({
      id: "sl-brief", from: "board@dead-drop.exchange", subject: "re: signal loss",
      body: `the rival who traced you is selling a target list with your handle on it.
their relay (ghost-relay, 10.66.0.3) runs gx-relay — only GhostRelay opens it.

  run ghostrelay relay-node
  connect relay-node
  pull /mnt/relay-node/share/targets.txt, pin it, submit.

close the loop. — dead-drop`,
    });
  }
}

// Called when the player logs into the Helios portal (from Browser component).
export function heliosLogin() {
  if (store.state.flags.helios_login) return;
  store.set((s) => ({
    flags: { ...s.flags, helios_login: true },
    hosts: { ...s.hosts, "helios-web": { ...s.hosts["helios-web"], discovered: true } },
  }));
  addTrace(4);
  store.notify("authenticated to Helios portal");
}

// The Quiet Launch story choice.
function finishQuietLaunch(path: "client" | "leak" | "warn") {
  const c = store.state.contracts["quiet-launch"];
  if (!c || c.status === "submitted") return;
  let money = 0, rep = 0, tool = false, outcome = "";
  if (path === "client") {
    money = 600; rep = 4; tool = true;
    outcome = "cold-rocket paid in full. the audit never sees daylight. another job is open.";
  } else if (path === "leak") {
    money = 150; rep = 6; tool = true;
    outcome = "newswire ran the story. Helios is in freefall. cold-rocket is furious but you're untouchable.";
  } else {
    money = 0; rep = 3; tool = false;
    outcome = "you warned the lab. they patched and went quiet. cold-rocket blacklisted you — Cold Storage is off the table. you sleep fine.";
  }
  // the "warn" branch closes Cold Storage via a block flag; the others leave it open.
  store.set((s) => ({
    money: s.money + money, rep: s.rep + rep,
    contracts: { ...s.contracts, "quiet-launch": { ...c, status: "submitted" } },
    flags: { ...s.flags, "ql-resolved": true, ...(path === "warn" ? { "ql-warned": true } : {}) },
  }));
  if (tool) grantTool("orbitkey");
  pushEmail({
    id: `ql-out-${path}`, from: path === "warn" ? "Helios Lab <m.chen@helios-aero.local>" : "cold-rocket <cr@dead-drop.exchange>",
    subject: "outcome", body: `${outcome}\n\n+${money} credits, +${rep} rep.`,
  });
  store.notify(`Quiet Launch resolved (${path}): +${money} cr, +${rep} rep`);
}

function handleChoice(action: string) {
  if (action === "qc-client") return finishQuietLaunch("client");
  if (action === "qc-leak") return finishQuietLaunch("leak");
  if (action === "qc-warn") return finishQuietLaunch("warn");
  finishWithChoice(action);
}

// Resolve a data-driven contract choice (Contract.choices).
function finishWithChoice(action: string) {
  const c = Object.values(store.state.contracts).find((x) => x.choices?.some((ch) => ch.action === action));
  if (!c || c.status === "submitted") return;
  const ch = c.choices!.find((x) => x.action === action)!;
  const have = new Set(store.state.evidence.map((e) => e.id));
  const bonus = c.optional && c.optional.length && c.optional.every((o) => have.has(o)) ? Math.round(c.payout * 0.4) : 0;
  store.set((s) => ({
    money: s.money + ch.money + bonus,
    rep: Math.max(0, s.rep + ch.rep),
    contracts: { ...s.contracts, [c.id]: { ...c, status: "submitted" } },
    flags: ch.flag ? { ...s.flags, [ch.flag]: true } : s.flags,
  }));
  if (ch.tool) grantTool(ch.tool);
  if (c.rewardTool) grantTool(c.rewardTool);
  if (c.grantsFlag) store.set((s) => ({ flags: { ...s.flags, [c.grantsFlag!]: true } }));
  pushEmail({
    id: `out-${c.id}-${action}`, from: `${c.client} <${c.client}@dead-drop.exchange>`, subject: `outcome: ${c.title}`,
    body: `${ch.note}\n\n+${ch.money + bonus} credits${bonus ? " (incl. bonus)" : ""}, ${ch.rep >= 0 ? "+" : ""}${ch.rep} rep.${c.rewardTool ? `\ntool unlocked: ${store.state.tools[c.rewardTool].name}.` : ""}`,
  });
  store.notify(`${c.title} resolved: +${ch.money + bonus} cr, ${ch.rep >= 0 ? "+" : ""}${ch.rep} rep`);
}

// Generic submit (terminal `submit <id>` and contract board button).
export function submitContract(id: string): string {
  const c = store.state.contracts[id];
  if (!c) return `submit: no contract '${id}'`;
  if (c.status === "submitted") return `${c.title} already delivered.`;
  if (c.status !== "accepted") return `submit: accept ${id} first.`;
  const have = new Set(store.state.evidence.map((e) => e.id));
  const missing = c.requires.filter((r) => !have.has(r));
  if (missing.length) return `submit: missing evidence: ${missing.join(", ")}\n(pin proof with: evidence pin <file>)`;

  if (id === "quiet-launch") {
    // route through the story choice if not yet made
    if (c.status === "accepted") {
      pushEmail({
        id: "ql-choice", from: "whistleblower <relay@deadlight>", subject: "before you hand that over",
        body: `i know what you found. you have three moves:

 1) give it to cold-rocket and get paid (quiet)
 2) leak it to newswire and burn Helios (loud, less money, more cred)
 3) warn the lab and walk away clean (no pay, no tool)

choose in this message.`,
        choices: [
          { label: "Give it to the client", action: "qc-client" },
          { label: "Leak it to newswire", action: "qc-leak" },
          { label: "Warn the lab, walk away", action: "qc-warn" },
        ],
      });
      openApp("email");
      return "this one needs a decision. check your mail.";
    }
  }

  // data-driven story choice (new missions)
  if (c.choices && c.choices.length) {
    pushEmail({
      id: `${id}-choice`, from: `${c.client} <relay@dead-drop.exchange>`, subject: `decision: ${c.title}`,
      body: `${c.complication ?? "you've got what you came for."}\n\nhow do you want to play this? choose below.`,
      choices: c.choices.map((ch) => ({ label: ch.label, action: ch.action })),
    });
    openApp("email");
    return "this one needs a decision. check your mail.";
  }

  // default completion
  const bonus = c.optional && c.optional.length > 0 && c.optional.every((o) => have.has(o)) ? Math.round(c.payout * 0.4) : 0;
  store.set((s) => ({
    money: s.money + c.payout + bonus, rep: s.rep + c.rep,
    contracts: { ...s.contracts, [id]: { ...c, status: "submitted" } },
    flags: c.grantsFlag ? { ...s.flags, [c.grantsFlag]: true } : s.flags,
  }));
  if (c.rewardTool) grantTool(c.rewardTool);
  pushEmail({
    id: `out-${id}`, from: `${c.client} <${c.client}@dead-drop.exchange>`, subject: `re: ${c.title}`,
    body: `clean work.\n\n+${c.payout + bonus} credits${bonus ? " (incl. bonus)" : ""}, +${c.rep} reputation.${c.rewardTool ? `\ntool unlocked: ${store.state.tools[c.rewardTool].name}.` : ""}`,
  });
  store.notify(`contract delivered: ${c.title} (+${c.payout + bonus} cr)`);
  return `delivered "${c.title}". +${c.payout + bonus} credits, +${c.rep} rep.${c.rewardTool ? ` new tool: ${store.state.tools[c.rewardTool].name}.` : ""}`;
}

export function setTheme(t: string) { store.set({ theme: t }); }
export function setMode(m: State["mode"]) { store.set({ mode: m }); }
