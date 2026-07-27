import type { State, Host, Contract, Tool } from "../store";

// ---------- Starting virtual filesystem ----------
// Encrypted files use the marker  ENC:<key>:<base64 payload>  (see decrypt command).
const b64 = (s: string) => btoa(unescape(encodeURIComponent(s)));

const AUDIT_REPORT = `HELIOS AEROSPACE // INTERNAL
LAUNCH AUDIT 7 — "BLUE ORBIT"  (CLASSIFICATION: BURIED)

Summary: The Blue Orbit test launch did NOT fail on telemetry as reported.
Pre-flight valve B was flagged by QA engineer M. Chen and overridden by
management to hold the launch window. Override ticket: HX-4471.
Root cause was known 11 days before launch. Public statement is false.

Signed-off override: director r.vance
`;

export const SEED_FILES: Record<string, string> = {
  "/home/op/README.txt": `welcome, operator.

this is your workstation. work comes through the board.

quick start:
  contracts            list jobs (or: browser open darkboard://contracts)
  mail                 read email
  browser open <url>   open a site in the browser
  scan <host>          discover neighbouring systems
  probe <host>         inspect services on a host
  connect <host>       mount a system you have access to under /mnt
  download <path>      pull a remote/portal file to ~/downloads
  evidence pin <path>  pin a file as proof for a contract
  submit <contract>    deliver a contract
  tools                list your arsenal
  trace                check how hot you are
  help                 list shell commands

your first job (welcome-packet) is already on the board.
`,
  "/home/op/onboarding/cipher.txt": `the board left you an activation phrase, encoded in base64 (last line).
decode it, save it to a file, then pin that file as evidence:

  cat onboarding/cipher.txt | tail -1 | base64 -d > activation.txt
  evidence pin activation.txt
  submit welcome-packet

${b64("ACTIVATION: GHOST-IN-THE-WIRE")}`,
  "/home/op/downloads/.keep": "",
  "/home/op/.profile": "export PS1='op@darknet:\\w$ '\n",
};

// ---------- Hosts ----------
function H(h: Partial<Host> & Pick<Host, "id" | "ip" | "hostname" | "org">): Host {
  return {
    domain: undefined, services: [], security: 1, links: [],
    discovered: false, compromised: false, ...h,
  };
}

export const HOSTS: Host[] = [
  // Public infrastructure — already known (these back your bookmarks).
  H({ id: "dead-drop", ip: "185.13.40.2", domain: "dead-drop.exchange", hostname: "dead-drop-relay", org: "(anonymous broker)", security: 4, discovered: true, services: [{ port: 443, name: "https" }, { port: 9001, name: "relay" }], notes: "automated contract broker" }),
  H({ id: "paste-black", ip: "185.13.40.9", domain: "pastebin.black", hostname: "paste-black", org: "(anonymous)", security: 1, discovered: true, services: [{ port: 80, name: "http" }], notes: "anonymous paste host" }),
  H({ id: "whois-svc", ip: "199.7.83.42", domain: "whois.lookup", hostname: "whois-svc", org: "registry", security: 1, discovered: true, services: [{ port: 43, name: "whois" }], notes: "domain registry lookup" }),
  H({ id: "tools-market", ip: "185.13.41.7", domain: "tools.market", hostname: "tools-market", org: "(vendor)", security: 3, discovered: true, services: [{ port: 443, name: "https" }], notes: "arsenal vendor" }),
  H({ id: "reputation-net", ip: "185.13.41.20", domain: "reputation.net", hostname: "rep-net", org: "(federated)", security: 2, discovered: true, services: [{ port: 443, name: "https" }], notes: "operator standing" }),
  H({ id: "newswire-host", ip: "203.0.113.5", domain: "newswire", hostname: "newswire", org: "Newswire", security: 2, discovered: true, services: [{ port: 80, name: "http" }, { port: 443, name: "https" }], notes: "public news desk" }),
  H({ id: "exploit-db-host", ip: "203.0.113.77", domain: "exploit-db.game", hostname: "exploit-db", org: "(community)", security: 1, discovered: true, services: [{ port: 80, name: "http" }], notes: "fictional weakness archive" }),

  // Mission targets — discovered through play.
  H({
    id: "helios-web", ip: "198.51.100.20", domain: "archive.helios-aero.local",
    hostname: "helios-portal", org: "Helios Aerospace", security: 2,
    services: [{ port: 80, name: "http" }, { port: 443, name: "https" }],
    links: ["helios-build-01"],
    notes: "employee archive portal",
  }),
  H({
    id: "helios-build-01", ip: "10.20.0.7", hostname: "helios-build-01",
    org: "Helios Aerospace", security: 3,
    services: [{ port: 22, name: "ssh" }, { port: 873, name: "rsync" }],
    links: ["helios-vault"],
    files: {
      "/notes/passwords.txt": `# do not commit (again)
launch-audit.zip : launchpad7
vault smb share is orbit-locked, ask director for OrbitKey
`,
      "/notes/todo.txt": "decommission build-01 before audit. (still here lol)\n",
      "/etc/motd": "helios build server 01 — authorized personnel only\n",
    },
    notes: "internal build server",
  }),
  H({
    id: "helios-vault", ip: "10.20.0.40", hostname: "helios-vault",
    org: "Helios Aerospace", security: 5, requiresTool: "orbitkey",
    services: [{ port: 445, name: "orb-smb" }],
    files: {
      "/share/ledger.txt": `HELIOS // OVERRIDE LEDGER (orb-smb share)
HX-4471  Blue Orbit  valve B override  approved:r.vance  payout-to:offshore-12
HX-4480  press line  "telemetry fault" narrative  approved:r.vance
`,
      "/share/readme": "orb-smb legacy share. migrate before Q3.\n",
    },
    notes: "orbit-locked storage vault",
  }),

  // ----- Loud House (loudhaus.fm defacement) -----
  H({
    id: "loudhaus-web", ip: "192.0.2.44", domain: "loudhaus.fm", hostname: "loudhaus-web",
    org: "Loud House FM", security: 1,
    services: [{ port: 80, name: "http" }, { port: 22, name: "ssh" }],
    files: {
      "/var/www/index.html": "<h1>OWNED BY m0ngrel</h1> your show is mine now.\n",
      "/var/www/style.css": "body{background:#111;color:#eee;font-family:monospace}\n",
      "/var/www/episodes/ep-101.md": "# Ep 101: late night frequencies\nguest: DJ Harlow. runtime 58m.\n",
      "/var/log/access.log": `192.0.2.9 - - "GET /episodes" 200
203.0.113.88 - - "GET / " 200
45.77.13.6 - - "GET /admin" 401
45.77.13.6 - - "POST /admin/login user=m0ngrel" 200 DEFACE
45.77.13.6 - - "PUT /var/www/index.html (handle: m0ngrel)" 200
192.0.2.9 - - "GET /rss" 200
`,
      "/var/log/cron.log": "0 3 * * * backup ran ok\n0 3 * * * backup ran ok\n",
      "/etc/hostname": "loudhaus-web\n",
    },
    notes: "podcast host, recently defaced",
  }),

  // ----- Paper Trail (Vanta Holdings laundering) -----
  H({
    id: "vanta-files", ip: "10.44.0.12", hostname: "vanta-files",
    org: "Vanta Holdings", security: 3,
    services: [{ port: 21, name: "ftp" }, { port: 873, name: "rsync" }],
    files: {
      "/share/readme.txt": "internal file drop. do NOT expose externally (again).\n",
      "/share/hr/holiday-rota.csv": "name,week\nA. Kerr,32\nB. Lund,33\n",
      "/share/hr/parking.txt": "bay 4 is reserved for the director. stop taking it.\n",
      "/share/it/backup.log": "nightly rsync ok\nnightly rsync ok\nnightly rsync ok\n",
      "/share/invoices.csv": `id,vendor,amount,memo
1001,OfficeCo,1200,supplies
1002,SHELL-ALPHA,89000,OFFSHORE TRANSFER ghost invoice
1003,CateringCo,640,lunch
1004,SHELL-BRAVO,142000,OFFSHORE TRANSFER ghost invoice
1005,SHELL-ALPHA,98000,OFFSHORE TRANSFER ghost invoice
`,
    },
    hidden: {
      "/share/.deleted/shell-companies.txt": "SHELL-ALPHA and SHELL-BRAVO both register to: D. Soto, 14 Pier Rd.\nthis ties the invoices to a person.\n",
    },
    notes: "Vanta internal file drop (unlinked — needs webmap)",
  }),

  // ----- Signal Loss (rival operator's relay) -----
  H({
    id: "relay-node", ip: "10.66.0.3", hostname: "ghost-relay", org: "(rival operator)",
    security: 5, requiresTool: "ghostrelay",
    services: [{ port: 7000, name: "gx-relay" }],
    files: {
      "/share/targets.txt": `RIVAL TARGET LIST (gx-relay)
- you (ghost-0)  <-- flagged for a frame job
- cold-rocket
- the dead-drop board itself
note: payout from "vance" to bury the helios leak.
`,
      "/share/note.txt": "handshake rotates hourly. if you're reading this, you won.\n",
    },
    notes: "rival operator relay — gx-relay locked",
  }),

  // ----- Glass House (Meridian Trust — multi-hop bank breach) -----
  H({
    id: "meridian-web", ip: "203.0.113.30", domain: "meridian-trust.local",
    hostname: "meridian-web", org: "Meridian Trust", security: 2,
    services: [{ port: 80, name: "http" }, { port: 443, name: "https" }],
    notes: "public bank site — staging host is unlinked",
  }),
  H({
    id: "meridian-staging", ip: "10.30.0.5", domain: "staging.meridian-trust.local",
    hostname: "meridian-staging", org: "Meridian Trust", security: 3,
    access: { user: "j.poole", pass: "summer2019" },
    services: [{ port: 22, name: "ssh" }, { port: 8080, name: "http-stage" }],
    links: ["meridian-db", "meridian-vault"],
    files: {
      "/home/jpoole/notes.txt": `ugh, prod creds again (delete this later):
  db box: svc / m3ridian-db   (10.30.0.40)  -> customer records
  board vault: 10.30.0.50, archive key is "kestrel"
compliance must NOT see the vault memo.`,
      "/home/jpoole/.bash_history": "ssh svc@10.30.0.40\nscp customers.csv .\nrm -rf logs\n",
      "/home/jpoole/todo.txt": "- fix the staging banner\n- reply to compliance (later)\n- lunch\n",
      "/var/www/stage/index.html": "<h1>Meridian Trust — STAGING</h1><p>do not index</p>\n",
      "/etc/motd": "meridian staging — non-production. yes, really.\n",
    },
    notes: "dev staging box — credentials reused from prod",
  }),
  H({
    id: "meridian-db", ip: "10.30.0.40", hostname: "meridian-db",
    org: "Meridian Trust", security: 4,
    access: { user: "svc", pass: "m3ridian-db" },
    services: [{ port: 5432, name: "postgres" }],
    files: {
      "/var/lib/db/customers.sample.csv": `CUSTOMER RECORDS (sample export)
acct,name,balance
10001,A. Reyes,4200
10002,B. Okafor,88150
10003,C. Lindqvist,310`,
    },
    dbdump: `FULL DUMP — meridian customers (14,402 rows, PII included)
acct,name,balance,ssn
10001,A. Reyes,4200,***-**-1190
10002,B. Okafor,88150,***-**-4471
10003,C. Lindqvist,310,***-**-0088
... 14,399 more rows ...
this is the real breach: balances + SSNs, fully exposed.`,
    notes: "production customer database",
  }),
  H({
    id: "meridian-vault", ip: "10.30.0.50", hostname: "meridian-vault",
    org: "Meridian Trust", security: 4,
    services: [{ port: 445, name: "smb" }],
    files: {
      "/share/board-memo.enc": `ENC:kestrel:${b64(`BOARD MEMO — CONFIDENTIAL
We are aware of the customer-data exposure. Decision: do NOT disclose.
Legal advises a quiet settlement is cheaper than the regulator's fine. — CFO`)}`,
      "/share/readme": "board documents. archive key rotates quarterly (it doesn't).\n",
    },
    notes: "board document share — encrypted memo inside",
  }),

  // ===== Dead Channel / Open Channel (Northwind smuggling, 2-part chain) =====
  H({
    id: "northwind-web", ip: "203.0.113.60", domain: "northwind-logi.local",
    hostname: "northwind-web", org: "Northwind Logistics", security: 2,
    services: [{ port: 80, name: "http" }, { port: 443, name: "https" }],
    notes: "freight company front — relay host is unlinked",
  }),
  H({
    id: "northwind-relay", ip: "10.50.0.4", domain: "relay.northwind-logi.local",
    hostname: "northwind-relay", org: "Northwind Logistics", security: 3,
    access: { user: "ops", pass: "northstar99" },
    services: [{ port: 22, name: "ssh" }, { port: 5000, name: "msg-relay" }],
    links: ["northwind-cache", "northwind-core"],
    files: {
      "/home/ops/handoff.txt": `manifest is in the cache box (10.50.0.9), file is encrypted.
archive key: "tailwind". DO NOT leave this here.
the boss's real ledger lives on core (10.50.0.40) behind a bl-share lock.`,
      "/home/ops/shift-notes.txt": "night crew: forklift 2 is down again. call maint.\n",
      "/var/spool/relay/queue.log": "msg relayed ok\nmsg relayed ok\nmsg relayed ok\n",
      "/etc/motd": "northwind ops relay — internal use only\n",
    },
    notes: "smuggling comms relay",
  }),
  H({
    id: "northwind-cache", ip: "10.50.0.9", hostname: "northwind-cache",
    org: "Northwind Logistics", security: 3,
    services: [{ port: 873, name: "rsync" }],
    files: {
      "/data/manifest.enc": `ENC:tailwind:${b64(`NORTHWIND MANIFEST — RUN 14
container NW-7781: "machine parts" (actual: untaxed cigarettes)
container NW-7790: "textiles" (actual: counterfeit pharma)
route: harbor 4 -> bonded warehouse 12 -> off-book buyers
broker on file: M. Calloway`)}`,
    },
    notes: "encrypted manifest store",
  }),
  H({
    id: "northwind-core", ip: "10.50.0.40", hostname: "northwind-core",
    org: "Northwind Logistics", security: 5, requiresTool: "bluelatch",
    services: [{ port: 445, name: "bl-share" }],
    files: {
      "/share/ledger.txt": `NORTHWIND LEDGER (bl-share)
owner: M. Calloway — runs the whole route.
payoffs: customs officer #4471, two harbor inspectors.
this is the proof that ties Calloway to every run.`,
    },
    notes: "kingpin's core file server — bl-share locked",
  }),

  // ===== Saltwire (sensor tampering; gated behind owning packetdump) =====
  H({
    id: "saltwire-jump", ip: "10.60.0.2", domain: "saltwire-energy.local",
    hostname: "saltwire-jump", org: "Saltwire Energy", security: 2,
    services: [{ port: 22, name: "ssh" }, { port: 8080, name: "http" }],
    links: ["saltwire-vpn"],
    files: { "/etc/motd": "saltwire jump host — contractors only\n" },
    notes: "internet-facing jump box (open)",
  }),
  H({
    id: "saltwire-vpn", ip: "10.60.0.5", hostname: "saltwire-vpn",
    org: "Saltwire Energy", security: 4,
    access: { user: "vpnuser", pass: "Brine!2021" },
    services: [{ port: 1194, name: "openvpn" }],
    links: ["saltwire-scada"],
    files: { "/home/vpnuser/readme": "internal VPN concentrator. scada segment is past here.\n" },
    notes: "VPN concentrator — creds sniffable on the jump segment",
  }),
  H({
    id: "saltwire-scada", ip: "10.60.0.20", hostname: "saltwire-scada",
    org: "Saltwire Energy", security: 4,
    services: [{ port: 502, name: "modbus" }],
    files: {
      "/var/log/sensors.log": `SENSOR TAMPER LOG (modbus)
2026-05-01 outflow sensor #3: raw 412ppm -> reported 38ppm (override: mgmt)
2026-05-08 outflow sensor #3: raw 455ppm -> reported 40ppm (override: mgmt)
they are dumping and faking the readings.`,
    },
    notes: "plant control network — falsified sensor logs",
  }),

  // ===== Paper Moon (deepfake ring; deleted evidence needs forensic; rep-gated) =====
  H({
    id: "lumen-web", ip: "203.0.113.90", domain: "lumen-studio.local",
    hostname: "lumen-web", org: "Lumen Studios", security: 2,
    services: [{ port: 80, name: "http" }, { port: 443, name: "https" }],
    notes: "media studio front — render farm is unlinked",
  }),
  H({
    id: "lumen-render", ip: "10.70.0.8", domain: "render.lumen-studio.local",
    hostname: "lumen-render", org: "Lumen Studios", security: 4,
    access: { user: "render", pass: "lights2019" },
    services: [{ port: 22, name: "ssh" }, { port: 4000, name: "render-api" }],
    files: {
      "/srv/jobs/readme.txt": "render jobs auto-purge after delivery. nothing incriminating here :)\n",
    },
    hidden: {
      "/srv/jobs/.purged/deepfake-source.txt": `DEEPFAKE SOURCE (recovered)
target: Senator Hale — fabricated "bribe" confession video
client: a PAC paid in crypto, wallet ends 0xC0FFEE
this is the smoking gun: a forgery built to order.`,
    },
    notes: "render farm — incriminating jobs deleted (recoverable)",
  }),

  // ===== Last Light (capstone — Vance's shadow network) =====
  H({
    id: "vance-edge", ip: "10.80.0.3", domain: "vance-trust.local",
    hostname: "vance-edge", org: "Vance Trust", security: 4,
    access: { user: "r.vance", pass: "apolloburns" },
    services: [{ port: 22, name: "ssh" }],
    links: ["vance-core"],
    files: {
      "/home/rvance/.note": "core box (10.80.0.50) is hardened — kx-core. it has EVERYTHING. burn after reading.\n",
    },
    notes: "Vance's edge box — gateway to the core",
  }),
  H({
    id: "vance-core", ip: "10.80.0.50", hostname: "vance-core",
    org: "Vance Trust", security: 5, requiresTool: "kernelslip",
    services: [{ port: 9999, name: "kx-core" }],
    files: {
      "/root/master-ledger.txt": `MASTER LEDGER — r. vance
- paid the rival operator to frame ghost-0 and bury the Helios audit
- funds Northwind smuggling, launders through Vanta Holdings
- Meridian Trust cover-up advised by the same lawyers
every thread you pulled ends here. this is the whole machine.`,
    },
    notes: "the core — kx-core locked. the end of the line.",
  }),

  // ===== Hollow Coin (crypto exchange rug-pull) =====
  H({
    id: "coinhollow-web", ip: "203.0.113.120", domain: "coinhollow.local",
    hostname: "coinhollow-web", org: "CoinHollow", security: 2,
    services: [{ port: 80, name: "http" }, { port: 443, name: "https" }],
    notes: "crypto exchange front — api host unlinked",
  }),
  H({
    id: "coinhollow-api", ip: "10.90.0.6", domain: "api.coinhollow.local",
    hostname: "coinhollow-api", org: "CoinHollow", security: 3,
    access: { user: "admin", pass: "moonbag2024" },
    services: [{ port: 22, name: "ssh" }, { port: 3000, name: "api" }],
    links: ["coinhollow-db", "coinhollow-vault"],
    files: {
      "/etc/app/config.yml": `db: ops / h0llowdb @ 10.90.0.20
cold_wallet_backup: /share/cold-wallet.enc @ 10.90.0.30  key: "frostbite"
# TODO rotate before the "exit" -- founders`,
      "/srv/api/routes.js": "app.get('/health', (_,res)=>res.send('ok'))\n",
      "/var/log/api/access.log": "GET /health 200\nGET /health 200\nGET /price 200\n",
      "/etc/motd": "coinhollow api — to the moon\n",
    },
    notes: "exchange api/admin box",
  }),
  H({
    id: "coinhollow-db", ip: "10.90.0.20", hostname: "coinhollow-db",
    org: "CoinHollow", security: 3,
    access: { user: "ops", pass: "h0llowdb" },
    services: [{ port: 5432, name: "postgres" }],
    files: {
      "/var/db/txns.csv": `RUGPULL LEDGER
ts,from,to,amount
t0,user-pool,0xDEAD...beef,4,100,000 (all user deposits)
note: founders drained the pool and faked "a hack".`,
    },
    dbdump: `FULL DUMP — coinhollow txns (211,940 rows)
every user deposit routed to the founders' wallet 0xDEAD...beef.
this is the whole rug-pull, on chain.`,
    notes: "exchange ledger database",
  }),
  H({
    id: "coinhollow-vault", ip: "10.90.0.30", hostname: "coinhollow-vault",
    org: "CoinHollow", security: 4,
    services: [{ port: 445, name: "smb" }],
    files: {
      "/share/cold-wallet.enc": `ENC:frostbite:${b64(`COLD WALLET — recovery keys
seed: glacier orbit ... (12 words)
holds the drained 4.1M in user funds. whoever has this, has the money.`)}`,
    },
    notes: "cold wallet backup store",
  }),

  // ===== Ghost Shift (hospital patient-data sale; rep-gated) =====
  H({
    id: "mercy-jump", ip: "10.91.0.2", domain: "mercy-health.local",
    hostname: "mercy-jump", org: "Mercy General", security: 2,
    services: [{ port: 22, name: "ssh" }, { port: 8080, name: "http" }],
    links: ["mercy-records"],
    files: { "/etc/motd": "Mercy General — contractor jump host\n" },
    notes: "hospital jump box (open) — records segment past it",
  }),
  H({
    id: "mercy-records", ip: "10.91.0.10", hostname: "mercy-records",
    org: "Mercy General", security: 4,
    access: { user: "svc", pass: "Patient!23" },
    services: [{ port: 1433, name: "mssql" }],
    files: { "/srv/records/readme": "EHR export jobs purge nightly. clean.\n" },
    hidden: {
      "/srv/records/.purged/sale.txt": `PATIENT DATA SALE (recovered)
42,000 patient records sold to a data broker, paid in crypto.
approved by: hospital CFO. billed as "analytics partnership".`,
    },
    notes: "EHR database — sale records deleted (recoverable)",
  }),

  // ===== Red Letter (PR-firm blackmail ring; rep-gated) =====
  H({
    id: "redline-web", ip: "203.0.113.150", domain: "redline-pr.local",
    hostname: "redline-web", org: "Redline PR", security: 2,
    services: [{ port: 80, name: "http" }, { port: 443, name: "https" }],
    notes: "PR firm front — mail host unlinked",
  }),
  H({
    id: "redline-mail", ip: "10.92.0.5", domain: "mail.redline-pr.local",
    hostname: "redline-mail", org: "Redline PR", security: 3,
    access: { user: "postmaster", pass: "inkblot77" },
    services: [{ port: 25, name: "smtp" }, { port: 143, name: "imap" }],
    files: {
      "/var/mail/spool.txt": `BLACKMAIL LEDGER (mail spool)
- target: city councilman (photos) -> "donate to our client or else"
- target: studio exec (emails) -> killed a bad story for us
leverage archive: /var/mail/leverage.enc  key: "redink"`,
      "/var/mail/leverage.enc": `ENC:redink:${b64(`LEVERAGE FILE
the raw kompromat: photos, recordings, draft threats.
this is what they hold over half the city.`)}`,
    },
    notes: "PR firm mail server — blackmail spool",
  }),

  // ===== Black Box -> Flight Risk (aviation safety cover-up; connected pair) =====
  H({
    id: "aerolink-web", ip: "203.0.113.180", domain: "aerolink.local",
    hostname: "aerolink-web", org: "AeroLink", security: 2,
    services: [{ port: 80, name: "http" }, { port: 443, name: "https" }],
    notes: "regional airline front — maintenance host unlinked",
  }),
  H({
    id: "aerolink-ftp", ip: "10.93.0.8", domain: "maint.aerolink.local",
    hostname: "aerolink-ftp", org: "AeroLink", security: 3,
    access: { user: "maint", pass: "skyfall88" },
    services: [{ port: 21, name: "ftp" }, { port: 22, name: "ssh" }],
    links: ["aerolink-core"],
    files: {
      "/data/notes.txt": "flight-data archive is encrypted. key: \"blackbox\". core box has the why.\n",
      "/data/flight-data.enc": `ENC:blackbox:${b64(`FLIGHT RECORDER — FLT 229
real: altitude warning + ignored stall alert for 40s.
reported: "no anomalies". the recorder was edited after the incident.`)}`,
    },
    notes: "maintenance file host — falsified flight data",
  }),
  H({
    id: "aerolink-core", ip: "10.93.0.40", hostname: "aerolink-core",
    org: "AeroLink", security: 5, requiresTool: "bluelatch",
    services: [{ port: 445, name: "bl-share" }],
    files: {
      "/share/coverup.txt": `AEROLINK COVERUP (bl-share)
order to edit the recorder came from the VP of ops, in writing.
two managers signed off. they knew, and they flew the fleet anyway.`,
    },
    notes: "ops core — the order to falsify, in writing (bl-share locked)",
  }),
];

// ---------- Tools ----------
// Base kit + buyable conveniences (ease, never required) + mission-reward exploits.
export const TOOLS: Tool[] = [
  { id: "scan", name: "scan", desc: "Map reachable neighbours from a host.", noise: 5, owned: true },
  { id: "probe", name: "probe", desc: "Enumerate services/ports on a host.", noise: 3, owned: true },
  { id: "decrypt", name: "decrypt", desc: "Open encrypted archives when you have the key.", noise: 1, owned: true },
  { id: "hashcrack", name: "hashcrack", desc: "Crack a leaked password hash into plaintext.", noise: 2, owned: true },
  { id: "logclean", name: "logclean", desc: "Scrub your route from host logs. Lowers trace (cooldown).", noise: 0, owned: true },
  // buyable, optional conveniences
  { id: "proxychain", name: "proxychain", desc: "Route through relays — halves the trace every noisy action generates.", noise: 0, price: 250, owned: false },
  { id: "portcrack", name: "portcrack", desc: "Brute-forces a weak archive key, so you can skip hunting for the password.", noise: 8, price: 300, owned: false },
  { id: "forensic", name: "forensic", desc: "Recover deleted/hidden files on a connected host (bonus evidence).", noise: 2, price: 400, owned: false },
  { id: "packetdump", name: "packetdump", desc: "Sniff a connected network to reveal a neighbour's credentials.", noise: 6, price: 350, owned: false },
  { id: "dbdump", name: "dbdump", desc: "Dump a full database service to a file (bonus evidence).", noise: 10, price: 500, owned: false },
  { id: "rainbow", name: "rainbow", desc: "Precomputed tables + GPU rig — hashcrack and decrypt finish almost instantly.", noise: 0, price: 450, owned: false },
  // mission-reward exploits (earned, not for sale)
  { id: "webmap", name: "webmap", desc: "Crawl a site and surface unlinked pages and hidden hosts.", noise: 4, owned: false },
  { id: "orbitkey", name: "OrbitKey", desc: "Fictional implant that opens outdated orb-smb services.", noise: 20, owned: false },
  { id: "ghostrelay", name: "GhostRelay", desc: "Hijacks gx-relay handshakes to take over rival relay nodes.", noise: 16, owned: false },
  { id: "bluelatch", name: "BlueLatch", desc: "Opens legacy bl-share file services on unpatched enterprise gear.", noise: 18, owned: false },
  { id: "kernelslip", name: "KernelSlip", desc: "Privilege-escalation implant — opens hardened kx-core services.", noise: 24, owned: false },
];

// Leaked password hashes the player can crack with hashcrack (fictional lookup).
export const HASHES: Record<string, string> = {
  "7c4a8d09ca3762af": "summer2019",  // meridian staging — j.poole
  "5f4dcc3b5aa765d6": "password",     // decoy
  "9b74c9897bac770f": "northstar99",  // northwind relay — ops
  "e99a18c428cb38d5": "lights2019",   // lumen render — render
  "098f6bcd4621d373": "apolloburns",  // vance edge — r.vance
  "0d107d09f5bbe40c": "moonbag2024",  // coinhollow api — admin
  "8621ffdbc5698829": "inkblot77",    // redline mail — postmaster
  "1f3870be274f6c49": "skyfall88",    // aerolink ftp — maint
};

// ---------- Contracts ----------
export const CONTRACTS: Contract[] = [
  {
    id: "welcome-packet", title: "Welcome Packet", client: "dead-drop",
    risk: "low", payout: 50, rep: 1, status: "available",
    brief: "Automated onboarding. Prove you can drive the workstation: recover the activation phrase the board left on your disk and submit it as evidence.",
    leads: ["check ~/onboarding", "the phrase is encoded"],
    requires: ["activation-phrase"],
    rewardTool: "webmap",
  },
  {
    id: "quiet-launch", title: "Quiet Launch", client: "cold-rocket",
    risk: "medium", payout: 600, rep: 4, status: "available", dependsOn: "welcome-packet",
    brief: "A biotech... no — an aerospace contractor believes a failed launch audit was buried. Recover proof of what really happened at Helios Aerospace without burning the place down.",
    leads: ["helios-aero.local", "employee Mara Chen", 'phrase "blue orbit archive"'],
    complication: "A whistleblower may reach out. The client wants this quiet.",
    requires: ["audit-report"],
    rewardTool: "orbitkey",
  },
  {
    id: "cold-storage", title: "Cold Storage", client: "cold-rocket",
    risk: "high", payout: 900, rep: 5, status: "available", dependsOn: "quiet-launch", blockFlag: "ql-warned",
    brief: "Finish it. Helios moved the money trail onto an orbit-locked vault. Crack it with the implant you earned and pull the override ledger.",
    leads: ["helios-vault runs orb-smb", "you now hold OrbitKey"],
    requires: ["override-ledger"],
  },

  // ----- Parallel side jobs (available from the start) -----
  {
    id: "loud-house", title: "Loud House", client: "mixtape",
    risk: "low", payout: 180, rep: 2, status: "available",
    brief: "Someone defaced the loudhaus.fm podcast site. The host just wants a name — find who did it and bring proof.",
    leads: ["loudhaus.fm", "the server keeps access logs", "try whois, then connect and grep the log"],
    requires: ["loudhaus-log"],
  },
  {
    id: "paper-trail", title: "Paper Trail", client: "auditor-9",
    risk: "medium", payout: 450, rep: 3, status: "available",
    brief: "Vanta Holdings is moving money through ghost invoices. Their real ledger isn't linked anywhere public. Recover it.",
    leads: ["vanta-holdings.local", 'phrase "ghost invoices"', "the file host is unlinked — you'll need to map it (webmap)"],
    requires: ["vanta-invoices"],
    rewardTool: "ghostrelay",
  },

  {
    id: "glass-house", title: "Glass House", client: "auditor-9",
    risk: "high", payout: 700, rep: 4, status: "available",
    brief: "Meridian Trust is sitting on a customer-data breach and burying it. Get in, prove the exposure, and find out what the board knew. This one has layers — public site, a dev box, the production database, and a sealed board vault.",
    leads: [
      "meridian-trust.local (their staging host is unlinked — webmap it)",
      'a paste mentions a "meridian breach" and leaks an employee hash',
      "dev boxes reuse prod credentials; follow them inward",
    ],
    bonus: "Recover the full database dump and the board memo for a bigger payout.",
    complication: "This is a lot of innocent people's data. What you do with it is on you.",
    requires: ["meridian-customers"],
    optional: ["meridian-fulldump", "meridian-memo"],
    rewardTool: "bluelatch",
    choices: [
      { action: "gh-report", label: "Hand the proof to the regulator", money: 700, rep: 6, note: "the regulator opens a formal probe. Meridian's stock craters but customers get notified. you sleep fine, and the board pays the price." },
      { action: "gh-sell", label: "Sell the customer data on the market", money: 1600, rep: -1, note: "the data broker pays well. somewhere, 14,000 people are about to have a very bad year. the board never even apologises." },
      { action: "gh-extort", label: "Quietly extort the bank", money: 2200, rep: 1, flag: "gh-dirty", note: "Meridian pays to keep it sealed. you're rich and they're still lying — exactly the outcome the CFO wanted, just with you in the middle." },
    ],
  },

  // ----- Dead Channel -> Open Channel (connected pair) -----
  {
    id: "dead-channel", title: "Dead Channel", client: "harbor",
    risk: "medium", payout: 500, rep: 4, status: "available", reqRep: 5,
    brief: "Northwind Logistics is running smuggled freight under fake manifests. Get onto their comms relay and recover a real manifest as proof.",
    leads: ["northwind-logi.local (relay host is unlinked — webmap it)", 'paste sites mention a "northwind manifest" + a leaked ops hash', "the manifest is encrypted; the key is on the relay"],
    requires: ["northwind-manifest"],
    grantsFlag: "northwind-in",
  },
  {
    id: "open-channel", title: "Open Channel", client: "harbor",
    risk: "high", payout: 1000, rep: 5, status: "available",
    dependsOn: "dead-channel", reqTool: "bluelatch",
    brief: "The manifest names a broker — M. Calloway — but the proof that ties them to everything is on Northwind's core server, behind a legacy bl-share lock. Crack it with BlueLatch and pull the ledger.",
    leads: ["northwind-core runs bl-share", "you need BlueLatch (reward from Glass House)"],
    complication: "Calloway has reach. Decide whether to hand them over or cash in.",
    requires: ["northwind-ledger"],
    choices: [
      { action: "oc-turnin", label: "Hand Calloway to harbor", money: 1000, rep: 6, note: "harbor's people move on Calloway at dawn. the route is dead and you're clean." },
      { action: "oc-sell", label: "Sell the route to a rival crew", money: 2000, rep: -2, note: "a competing crew pays double for the route. the smuggling never stops — it just changes hands. and yours." },
    ],
  },

  // ----- Saltwire (gated: must OWN packetdump to accept) -----
  {
    id: "saltwire", title: "Saltwire", client: "greenfield",
    risk: "medium", payout: 650, rep: 4, status: "available", reqTool: "packetdump",
    brief: "Saltwire Energy is dumping into the bay and faking the sensor readings. Get past their VPN onto the plant network and pull the tamper logs.",
    leads: ["saltwire-energy.local has an open jump host", "sniff the jump segment for VPN creds (packetdump)", "the SCADA box keeps the real sensor log"],
    requires: ["saltwire-tamper"],
  },

  // ----- Paper Moon (gated: reputation 12; needs forensic mid-mission) -----
  {
    id: "paper-moon", title: "Paper Moon", client: "inkwell",
    risk: "high", payout: 850, rep: 5, status: "available", reqRep: 12,
    brief: "Lumen Studios builds deepfakes to order. They delete the source files after delivery — but deleted isn't gone. Recover one and prove the forgery ring exists.",
    leads: ["lumen-studio.local (render farm unlinked — webmap)", "a paste leaks a render-account hash", "the source files were deleted — you'll need forensic on the render box"],
    requires: ["lumen-source"],
    rewardTool: "kernelslip",
  },

  // ----- Last Light (capstone: depends on Signal Loss + rep 18 + KernelSlip) -----
  {
    id: "last-light", title: "Last Light", client: "dead-drop",
    risk: "high", payout: 2500, rep: 8, status: "available",
    dependsOn: "signal-loss", reqRep: 18, reqTool: "kernelslip",
    brief: "Every job led back to one man: director Vance. His private network funds the rival, Northwind, Vanta, the Helios cover-up — all of it. Get to the core and take the master ledger. Then decide how it ends.",
    leads: ["vance-trust.local — find r.vance's credentials", "the core (10.80.0.50) is kx-core hardened — only KernelSlip opens it"],
    complication: "This is the whole machine. What you do with it decides who you've become.",
    requires: ["vance-ledger"],
    choices: [
      { action: "ll-expose", label: "Expose everything, publicly", money: 1500, rep: 12, note: "you dump the master ledger to every newswire at once. Vance falls, the rival folds, the board burns. you become a ghost story. the right kind." },
      { action: "ll-takeover", label: "Take the network over yourself", money: 4000, rep: -4, flag: "ll-throne", note: "you don't expose the machine — you inherit it. the payoffs now route to you. you won. you also became exactly what you hunted." },
      { action: "ll-burn", label: "Burn it all to the ground", money: 800, rep: 8, note: "you wipe the core, the relays, the ledgers — everything. no proof, no profit, no machine. just ash. some things shouldn't exist." },
    ],
  },

  // ----- Hollow Coin (crypto rug-pull) -----
  {
    id: "hollow-coin", title: "Hollow Coin", client: "burned-bagholder",
    risk: "medium", payout: 550, rep: 3, status: "available",
    brief: "CoinHollow exchange 'got hacked' and users lost everything. It wasn't a hack — the founders rugged it. Get the proof, and maybe the money.",
    leads: ["coinhollow.local (api host unlinked — webmap)", 'a paste leaks an admin hash for "hollow coin"', "the api config has the db creds and a cold-wallet key"],
    bonus: "Recover the cold-wallet backup for a much bigger score.",
    complication: "You could return the funds to the users — or keep 4 million in crypto.",
    requires: ["coinhollow-ledger"],
    optional: ["coinhollow-wallet"],
    choices: [
      { action: "hc-return", label: "Return the funds to the users", money: 550, rep: 8, note: "you push the cold wallet back to the user pool. nobody knows it was you. 11,000 people get made whole. that's the job." },
      { action: "hc-keep", label: "Keep the crypto", money: 3000, rep: -3, flag: "hc-thief", note: "4.1 million in stolen crypto, now yours. the users stay ruined. you tell yourself the founders would've kept it anyway." },
    ],
  },

  // ----- Ghost Shift (hospital data sale; rep-gated, forensic) -----
  {
    id: "ghost-shift", title: "Ghost Shift", client: "inkwell",
    risk: "medium", payout: 600, rep: 4, status: "available", reqRep: 8,
    brief: "Mercy General sold 42,000 patient records and called it an 'analytics partnership'. They deleted the paperwork. Recover proof.",
    leads: ["whois mercy-health.local — the jump host is open", "sniff the segment for the records-box creds (packetdump)", "the sale record was deleted — bring forensic"],
    requires: ["mercy-data"],
  },

  // ----- Red Letter (PR-firm blackmail ring; rep-gated) -----
  {
    id: "red-letter", title: "Red Letter", client: "inkwell",
    risk: "high", payout: 750, rep: 5, status: "available", reqRep: 6,
    brief: "Redline PR doesn't do PR — it runs a blackmail operation against half the city. Get into their mail server and pull the ledger.",
    leads: ["redline-pr.local (mail host unlinked — webmap)", "a paste leaks the postmaster hash", "the spool names the targets; the leverage archive is encrypted"],
    bonus: "Recover the encrypted leverage archive for more pay.",
    complication: "That leverage is worth a fortune to the wrong buyer.",
    requires: ["redline-ledger"],
    optional: ["redline-leverage"],
    choices: [
      { action: "rl-expose", label: "Expose the blackmail ring", money: 750, rep: 7, note: "the ledger goes public. Redline collapses overnight and a dozen people get their lives back. clean." },
      { action: "rl-sell", label: "Sell the leverage yourself", money: 2400, rep: -2, flag: "rl-dirty", note: "you become the new owner of everyone's worst secret. the blackmail never stops — it just has a new return address." },
    ],
  },

  // ----- Black Box -> Flight Risk (connected pair) -----
  {
    id: "black-box", title: "Black Box", client: "greenfield",
    risk: "medium", payout: 600, rep: 4, status: "available",
    brief: "AeroLink flight 229 nearly went down and they buried it by editing the flight recorder. Recover the real data.",
    leads: ["aerolink.local (maintenance host unlinked — webmap)", "a paste leaks a maintenance hash", "the flight-data archive is encrypted; the key is on the host"],
    requires: ["aerolink-fdr"],
    grantsFlag: "aerolink-in",
  },
  {
    id: "flight-risk", title: "Flight Risk", client: "greenfield",
    risk: "high", payout: 1100, rep: 6, status: "available",
    dependsOn: "black-box", reqTool: "bluelatch",
    brief: "The edited recorder proves what happened — but not who ordered it. That's on AeroLink's ops core, behind a bl-share lock. Get the names.",
    leads: ["aerolink-core runs bl-share", "you need BlueLatch"],
    complication: "These people kept a faulty fleet in the air. Decide who answers for it.",
    requires: ["aerolink-coverup"],
    choices: [
      { action: "fr-report", label: "Hand it to the safety board", money: 1100, rep: 8, note: "the regulator grounds the fleet and the VP is charged. planes get fixed. nobody else has to find out the hard way." },
      { action: "fr-blackmail", label: "Blackmail the executives", money: 2600, rep: -3, flag: "fr-dirty", note: "the execs pay to keep their names off it. the fleet keeps flying. you got rich betting nothing falls out of the sky." },
    ],
  },

  // ----- Endgame (depends on Cold Storage; needs GhostRelay from Paper Trail) -----
  {
    id: "signal-loss", title: "Signal Loss", client: "dead-drop",
    risk: "high", payout: 1200, rep: 6, status: "available",
    dependsOn: "cold-storage", reqTool: "ghostrelay",
    brief: "The rival who traced you runs a relay node and is selling a target list — your name is on it. Take the relay and pull the list before they move first.",
    leads: ["relay runs gx-relay", "you need GhostRelay (reward from Paper Trail)"],
    complication: "Helios money funds the rival. Finishing this closes the whole loop.",
    requires: ["rival-targets"],
    grantsFlag: "rival-down",
  },
];

// ---------- Initial state ----------
export function initialState(): State {
  const hosts: Record<string, Host> = {};
  HOSTS.forEach((h) => (hosts[h.id] = { ...h }));
  const contracts: Record<string, Contract> = {};
  CONTRACTS.forEach((c) => (contracts[c.id] = { ...c }));
  const tools: Record<string, Tool> = {};
  TOOLS.forEach((t) => (tools[t.id] = { ...t }));

  return {
    booted: false,
    mode: "operator",
    theme: "midnight",
    identity: "ghost-0",
    money: 0,
    rep: 0,
    trace: 0,
    traceArmed: false,
    connection: null,
    windows: [],
    topZ: 10,
    browserTabs: [{ id: 1, history: [], index: -1 }],
    activeTab: 1,
    lastLogclean: 0,
    bookmarks: [
      "darkboard://contracts",
      "tools.market",
      "pastebin.black",
      "whois.lookup",
      "exploit-db.game",
      "newswire",
    ],
    hosts,
    contracts,
    tools,
    evidence: [],
    emails: [
      {
        id: "intro",
        from: "board@dead-drop.exchange",
        subject: "you're in",
        body: `operator,

the board accepted your handle. workstation is yours now.

start with WELCOME PACKET on the contract board to warm up, then the
real work opens. don't be noisy. don't get traced. don't ask who we are.

— dead-drop (automated)`,
        read: false,
        at: 0,
      },
    ],
    notes: "",
    flags: {},
    log: ["system online", "1 unread message"],
  };
}
