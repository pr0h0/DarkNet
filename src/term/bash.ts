import { Bash, defineCommand } from "just-bash/browser";
import type { ExecResult } from "just-bash/browser";
import { store, setFsDumpProvider } from "../store";
import { SEED_FILES } from "../game/content";
import * as E from "../game/engine";

const ok =(stdout: string): ExecResult => ({ stdout: stdout.endsWith("\n") || stdout === "" ? stdout : stdout + "\n", stderr: "", exitCode: 0 });
const err = (stderr: string): ExecResult => ({ stdout: "", stderr: stderr + "\n", exitCode: 1 });

function cmds() {
  const open = (app: Parameters<typeof E.openApp>[0]) => E.openApp(app);

  return [
    defineCommand("mail", async () => { open("email"); const u = store.state.emails.filter(e=>!e.read).length;
      return ok(`inbox: ${store.state.emails.length} messages, ${u} unread. (opened Mail)\n` +
        store.state.emails.map(e => `  ${e.read?" ":"*"} ${e.from.split("<")[0].trim().padEnd(22)} ${e.subject}`).join("\n")); }),

    defineCommand("browser", async (a) => {
      const sub = a[0];
      if (!sub || sub === "open") {
        const url = a[1];
        open("browser");
        if (url) { E.browserNavigate(url); return ok(`browser: opening ${url}`); }
        return ok("browser: opened. usage: browser open <url>");
      }
      if (sub === "source") {
        const cur = E.currentUrl();
        return ok(cur ? `source of ${cur}:\n<!-- fictional page markup, view in Browser > source -->` : "browser: nothing open");
      }
      if (sub === "cookies") return ok("session: anon-token=ghost-0; trace-id=" + store.state.identity);
      if (sub === "back") { E.browserBack(); return ok("browser: back"); }
      if (sub === "forward") { E.browserForward(); return ok("browser: forward"); }
      return err(`browser: unknown subcommand '${sub}'`);
    }),

    defineCommand("contracts", async () => {
      open("contracts");
      const list = Object.values(store.state.contracts).reverse();
      return ok("CONTRACTS (opened board)\n" + list.map(c => {
        const gate = c.status === "available" ? E.contractGate(c) : null;
        const tag = gate ? "locked" : c.status;
        return `  [${tag.padEnd(9)}] ${c.id.padEnd(15)} ${c.title}  (${c.payout}cr, ${c.risk})${gate ? "  — " + gate : ""}`;
      }).join("\n"));
    }),

    defineCommand("accept", async (a) => a[0] ? ok(E.acceptContract(a[0])) : err("usage: accept <contract-id>")),
    defineCommand("submit", async (a) => a[0] ? ok(E.submitContract(a[0])) : err("usage: submit <contract-id>")),

    defineCommand("scan", async (a) => ok(E.scan(a[0]))),
    defineCommand("probe", async (a) => ok(E.probe(a[0]))),
    defineCommand("connect", async (a) => a[0] ? ok(await E.connect(a[0], a[1], a[2])) : err("usage: connect <host> [user] [pass]")),
    defineCommand("disconnect", async () => ok(await E.disconnect())),
    defineCommand("hashcrack", async (a) => ok(E.hashcrack(a[0]))),
    defineCommand("download", async (a) => a[0] ? ok(await E.download(a[0])) : err("usage: download <path>")),
    defineCommand("decrypt", async (a) => a[0] ? ok(await E.decrypt(a[0], a[1])) : err("usage: decrypt <file> <key>")),

    defineCommand("run", async (a) => a[0] ? ok(await E.runTool(a[0], a[1])) : err("usage: run <tool> [target]")),

    defineCommand("tools", async (a) => {
      if (a[0] === "buy") { open("arsenal"); return a[1] ? ok(E.buyTool(a[1])) : err("usage: tools buy <id>"); }
      open("arsenal");
      return ok("ARSENAL\n" + Object.values(store.state.tools).map(t =>
        `  ${t.owned ? "✓" : "·"} ${t.name.padEnd(12)} noise:${t.noise}  ${t.owned ? "" : t.price != null ? `(${t.price}cr) ` : "(locked) "}${t.desc}`).join("\n"));
    }),

    defineCommand("evidence", async (a) => {
      const sub = a[0];
      if (sub === "pin") return a[1] ? ok(await E.pinEvidence(a[1])) : err("usage: evidence pin <file>");
      if (sub === "note") { const txt = a.slice(1).join(" "); return txt ? ok(E.addNote(txt)) : err('usage: evidence note "text"'); }
      open("evidence");
      const ev = store.state.evidence;
      return ok("EVIDENCE BOARD (opened)\n" + (ev.length ? ev.map(e => `  • [${e.kind}] ${e.label}`).join("\n") : "  (empty) pin files with: evidence pin <file>"));
    }),

    defineCommand("notes", async (a) => {
      const txt = a.join(" ");
      open("evidence");
      return txt ? ok(E.addNote(txt)) : ok("opened evidence/notes board.");
    }),

    defineCommand("trace", async () => {
      const t = store.state.trace;
      const bar = "█".repeat(Math.round(t / 5)).padEnd(20, "░");
      return ok(`trace [${bar}] ${t}%  ${store.state.traceArmed ? "(active route)" : "(idle)"}\n` +
        (t >= 50 ? "you are hot. disconnect, run logclean, or finish fast." : "you are cool."));
    }),

    defineCommand("logclean", async () => ok(E.logclean())),

    defineCommand("map", async () => {
      open("netmap");
      const disc = Object.values(store.state.hosts).filter(h => h.discovered).reverse();
      return ok("NETWORK MAP (opened)\n" + (disc.length ? disc.map(h =>
        `  ${h.compromised ? "◉" : "○"} ${h.hostname.padEnd(18)} ${h.ip.padEnd(15)} ${h.org}`).join("\n") : "  nothing discovered yet."));
    }),

    defineCommand("whois", async (a) => {
      if (!a[0]) return err("usage: whois <domain>");
      return ok(E.whoisLookup(a[0]));
    }),

    defineCommand("theme", async (a) => {
      if (!a[0]) return ok(`theme: ${store.state.theme}. options: midnight, amber, ice, hazard`);
      E.setTheme(a[0]); return ok(`theme set: ${a[0]}`);
    }),

    defineCommand("clear", async () => ({ stdout: "\x1b[2J\x1b[H", stderr: "", exitCode: 0 })),
  ];
}

let _bash: Bash | null = null;
export function getBash(): Bash | null { return _bash; }

export async function initBash(savedFs?: Record<string, string>): Promise<Bash> {
  const files = savedFs && Object.keys(savedFs).length ? savedFs : SEED_FILES;
  const bash = new Bash({
    files,
    cwd: "/home/op",
    env: { HOME: "/home/op", USER: "op", PS1: "op@darknet:\\w$ " },
    customCommands: cmds(),
  });
  E.setBash(bash);
  // persistence: dump text files on save
  setFsDumpProvider(async () => {
    const out: Record<string, string> = {};
    for (const p of bash.fs.getAllPaths()) {
      try {
        const st = await bash.fs.stat(p);
        if (st.isFile) out[p] = await bash.fs.readFile(p);
      } catch { /* skip */ }
    }
    return out;
  });
  _bash = bash;
  return bash;
}
