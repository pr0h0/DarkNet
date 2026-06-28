// Browser site registry. `html` pages are lore/static; `component` pages are
// interactive (rendered by special React components in Browser.tsx).
export interface Site {
  title: string;
  html?: string;
  component?: "contracts" | "tools" | "pastebin" | "helios" | "whois";
  hidden?: boolean; // not in default bookmarks; reached via clue
}

export const SITES: Record<string, Site> = {
  "darkboard://contracts": { title: "darkboard // contracts", component: "contracts" },
  "tools.market": { title: "tool market", component: "tools" },
  "pastebin.black": { title: "pastebin.black", component: "pastebin" },
  "whois.lookup": { title: "whois lookup", component: "whois" },

  "exploit-db.game": {
    title: "exploit-db (game)",
    html: `<h1>exploit-db <span class="muted">// fictional archive</span></h1>
<p class="muted">community-maintained list of known fictional weaknesses. for research only.</p>
<table class="tbl">
<tr><th>id</th><th>service</th><th>tool</th><th>notes</th></tr>
<tr><td>EX-118</td><td>orb-smb (legacy)</td><td><b>OrbitKey</b></td><td>opens orbit-locked SMB shares on unpatched aerospace gear</td></tr>
<tr><td>EX-204</td><td>http portal</td><td>webmap</td><td>crawl for unlinked backup pages and hidden hosts</td></tr>
<tr><td>EX-091</td><td>weak archive</td><td>decrypt / portcrack</td><td>any zip whose key leaked — or brute it with portcrack</td></tr>
<tr><td>EX-330</td><td>gx-relay</td><td><b>GhostRelay</b></td><td>hijacks rival relay-node handshakes</td></tr>
<tr><td>EX-052</td><td>any route</td><td>proxychain</td><td>passive — halves trace you generate</td></tr>
<tr><td>EX-077</td><td>wiped disk</td><td>forensic</td><td>recover deleted files on a host you control</td></tr>
</table>
<p class="muted">tip: tools are sold on <a href="tools.market">tools.market</a> or dropped by clients.</p>`,
  },

  newswire: {
    title: "newswire",
    html: `<h1>NEWSWIRE</h1>
<article><h2>Helios Aerospace celebrates "flawless" Blue Orbit launch</h2>
<p class="muted">press desk · 3 days ago</p>
<p>Helios Aerospace called its Blue Orbit test launch a complete success, citing a
"minor telemetry fault" that did not affect the mission. Director R. Vance praised
the team's "spotless safety record."</p>
<p class="muted">tip line: leaks@newswire — we protect sources.</p></article>
<article><h2>Anonymous board "dead-drop" linked to corporate leaks</h2>
<p class="muted">cyber desk · 1 week ago</p>
<p>Security firms warn that an automated marketplace is paying freelancers to probe
corporate networks. Targets are advised to monitor for unusual <b>traces</b>.</p></article>`,
  },

  "loudhaus.fm": {
    title: "Loud House FM",
    html: `<h1 style="color:#f43f5e">OWNED BY m0ngrel</h1>
<p>your little podcast is mine now. say hi to the feds.</p>
<p class="muted">— the real loudhaus.fm is down. whoever did this left fingerprints in the server logs.</p>
<p class="muted">recon: <code>whois loudhaus.fm</code> → <code>connect loudhaus-web</code> → grep the access log.</p>`,
  },
  "vanta-holdings.local": {
    title: "Vanta Holdings",
    html: `<h1>Vanta Holdings <span class="muted">// strategic capital</span></h1>
<p>We invest in tomorrow. Quietly.</p>
<ul><li>About</li><li>Portfolio</li><li>Contact: d.soto@vanta-holdings.local</li></ul>
<p class="muted">Nothing else is linked here. If their real records exist, they're on an unlinked host —
crawl it: <code>run webmap vanta-holdings.local</code>.</p>`,
  },
  "meridian-trust.local": {
    title: "Meridian Trust",
    html: `<h1>Meridian Trust <span class="muted">// banking, reimagined</span></h1>
<p>Your money, protected. Your trust, earned.</p>
<ul><li>Personal</li><li>Business</li><li>Security: we take it seriously</li></ul>
<p class="muted">Careers: j.poole@meridian-trust.local (IT)</p>
<p class="muted">Nothing sensitive is linked here. Their dev/staging box isn't advertised —
crawl it: <code>run webmap meridian-trust.local</code>.</p>`,
  },
  "northwind-logi.local": {
    title: "Northwind Logistics",
    html: `<h1>Northwind Logistics <span class="muted">// freight, on time</span></h1>
<p>Global freight forwarding. Nothing to see here.</p>
<p class="muted">Their comms relay isn't linked publicly — <code>run webmap northwind-logi.local</code>.</p>`,
  },
  "saltwire-energy.local": {
    title: "Saltwire Energy",
    html: `<h1>Saltwire Energy <span class="muted">// powering the coast</span></h1>
<p>Clean energy. Clear conscience.</p>
<p class="muted">Contractor access via the jump host (<code>whois saltwire-energy.local</code>, then connect).</p>`,
  },
  "lumen-studio.local": {
    title: "Lumen Studios",
    html: `<h1>Lumen Studios <span class="muted">// we make it real</span></h1>
<p>Award-winning visual effects and "synthetic media."</p>
<p class="muted">Render farm is internal — <code>run webmap lumen-studio.local</code>.</p>`,
  },
  "vance-trust.local": {
    title: "Vance Trust",
    html: `<h1>Vance Trust <span class="muted">// private holdings</span></h1>
<p>By invitation only.</p>
<p class="muted">There is nothing here for you. (whois it anyway.)</p>`,
  },
  "coinhollow.local": {
    title: "CoinHollow",
    html: `<h1>CoinHollow <span class="muted">// the future of money</span></h1>
<p>Trade with confidence. <span class="muted">(site frozen — "undergoing maintenance after a security incident")</span></p>
<p class="muted">Their API/admin host isn't linked here — <code>run webmap coinhollow.local</code>.</p>`,
  },
  "redline-pr.local": {
    title: "Redline PR",
    html: `<h1>Redline PR <span class="muted">// reputation management</span></h1>
<p>We protect the right narrative.</p>
<p class="muted">Mail server is internal — <code>run webmap redline-pr.local</code>.</p>`,
  },
  "aerolink.local": {
    title: "AeroLink",
    html: `<h1>AeroLink <span class="muted">// regional wings</span></h1>
<p>Safety is our first priority.™</p>
<p class="muted">Maintenance file host is unlinked — <code>run webmap aerolink.local</code>.</p>`,
  },
  "http://archive.helios-aero.local": { title: "Helios Archive Portal", component: "helios", hidden: true },
  "mail.operator.local": {
    title: "operator mail",
    html: `<h1>operator mail</h1><p>use the <b>Email</b> app (or type <code>mail</code> in the terminal) to read your inbox.</p>`,
  },
};

// whois clue database (shared by terminal `whois` and the whois.lookup site)
export const WHOIS_DB: Record<string, string> = {
  "helios-aero.local": `Domain: helios-aero.local
Registrant Org: Helios Aerospace
Admin Contact: Mara Chen <m.chen@helios-aero.local>
Name Server: ns1.helios-aero.local (198.51.100.20)
Status: active
Note: subdomain 'archive' hosts the employee portal.`,
  "dead-drop.exchange": `Domain: dead-drop.exchange
Registrant: REDACTED (privacy relay)
Admin Contact: board@dead-drop.exchange
Status: active`,
  "loudhaus.fm": `Domain: loudhaus.fm
Registrant Org: Loud House FM
Admin Contact: studio@loudhaus.fm
Host: loudhaus-web (192.0.2.44)
Status: active (defaced)
Note: ssh + http open; server keeps access logs under /var/log.`,
  "vanta-holdings.local": `Domain: vanta-holdings.local
Registrant Org: Vanta Holdings
Admin Contact: d.soto@vanta-holdings.local
Status: active
Note: public web only. internal file host is not advertised.`,
  "meridian-trust.local": `Domain: meridian-trust.local
Registrant Org: Meridian Trust
Admin Contact: j.poole@meridian-trust.local (IT)
Status: active
Note: public web host only. dev/staging is internal — crawl the domain to find it.`,
  "northwind-logi.local": `Domain: northwind-logi.local
Registrant Org: Northwind Logistics
Admin Contact: ops@northwind-logi.local
Status: active
Note: public freight site. comms relay (subdomain 'relay') is not advertised — crawl it.`,
  "saltwire-energy.local": `Domain: saltwire-energy.local
Registrant Org: Saltwire Energy
Admin Contact: it@saltwire-energy.local
Host: saltwire-jump (10.60.0.2)
Status: active
Note: contractor jump host is open. the plant network sits behind a VPN.`,
  "lumen-studio.local": `Domain: lumen-studio.local
Registrant Org: Lumen Studios
Admin Contact: render@lumen-studio.local
Status: active
Note: public site only. render farm is internal — crawl the domain.`,
  "vance-trust.local": `Domain: vance-trust.local
Registrant: REDACTED
Admin Contact: r.vance@vance-trust.local
Host: vance-edge (10.80.0.3)
Status: active
Note: edge box reachable. the core is hardened and not advertised.`,
  "coinhollow.local": `Domain: coinhollow.local
Registrant Org: CoinHollow (dissolved?)
Admin Contact: admin@coinhollow.local
Status: active
Note: public site frozen. api/admin host is internal — crawl the domain.`,
  "mercy-health.local": `Domain: mercy-health.local
Registrant Org: Mercy General
Admin Contact: it@mercy-health.local
Host: mercy-jump (10.91.0.2)
Status: active
Note: contractor jump host is open. records DB sits behind it.`,
  "redline-pr.local": `Domain: redline-pr.local
Registrant Org: Redline PR
Admin Contact: postmaster@redline-pr.local
Status: active
Note: public site only. mail server is internal — crawl the domain.`,
  "aerolink.local": `Domain: aerolink.local
Registrant Org: AeroLink
Admin Contact: maint@aerolink.local
Status: active
Note: public site only. maintenance file host is unlinked — crawl the domain.`,
};

// Pastebin secret leaks, keyed by a phrase the player searches for.
// Each reveal sets flags / discovers hosts via the engine.
export interface Paste {
  match: RegExp;
  title: string;
  body: string;
  reveals?: string;  // host id to mark discovered
  flag?: string;     // story flag to set
  link?: string;     // a clickable url shown with the paste
}
export const PASTES: Paste[] = [
  {
    match: /blue\s*orbit\s*archive/i, flag: "pastebin_found", reveals: "helios-web",
    title: "#9001 — [helios leak]",
    body: `blue orbit archive is real. it lives at:
   archive.helios-aero.local

mara.chen never changed her habits — she signs everything
"oblivion83" and reuses it as a password. you didn't hear it from me.`,
    link: "http://archive.helios-aero.local",
  },
  {
    match: /ghost\s*invoices/i, flag: "vanta_found",
    title: "#9044 — [vanta dump teaser]",
    body: `vanta holdings runs "ghost invoices" through shell vendors.
their public site shows nothing — the real ledger sits on an UNLINKED file host.
map the domain (webmap) and you'll find it. accountant is d. soto.`,
    link: "vanta-holdings.local",
  },
  {
    match: /meridian\s*breach/i, flag: "meridian_found",
    title: "#9120 — [meridian dump]",
    body: `meridian trust had a breach and is sitting on it.
grabbed an IT hash before they rotated — crack it, the login is reused everywhere:

  user: j.poole
  hash: 7c4a8d09ca3762af     (try: hashcrack 7c4a8d09ca3762af)

their staging box is the way in. start at meridian-trust.local.`,
    link: "meridian-trust.local",
  },
  {
    match: /northwind\s*manifest/i, flag: "northwind_found",
    title: "#9210 — [northwind ops]",
    body: `northwind logistics ships dirty freight. their relay login leaked:

  user: ops
  hash: 9b74c9897bac770f     (hashcrack it)

the relay's unlinked — webmap northwind-logi.local to find it.`,
    link: "northwind-logi.local",
  },
  {
    match: /lumen\s*(render|deepfake)/i, flag: "lumen_found",
    title: "#9301 — [lumen render]",
    body: `lumen studios makes deepfakes to order. render-box creds, before they notice:

  user: render
  hash: e99a18c428cb38d5     (hashcrack it)

they auto-delete the jobs — bring forensic.`,
    link: "lumen-studio.local",
  },
  {
    match: /vance|apollo/i, flag: "vance_found",
    title: "#9999 — [the core]",
    body: `if you're reading this you already know. r.vance's edge box creds:

  user: r.vance
  hash: 098f6bcd4621d373     (hashcrack it)

the core is kx-core hardened. you'll need KernelSlip. good luck.`,
    link: "vance-trust.local",
  },
  {
    match: /hollow\s*coin|coinhollow/i, flag: "coinhollow_found",
    title: "#9410 — [coinhollow exit]",
    body: `coinhollow didn't get hacked, the founders rugged it. admin creds:

  user: admin
  hash: 0d107d09f5bbe40c     (hashcrack it)

api host is unlinked — webmap coinhollow.local. the config has everything.`,
    link: "coinhollow.local",
  },
  {
    match: /red\s*letter|redline/i, flag: "redline_found",
    title: "#9520 — [redline]",
    body: `redline "PR" runs blackmail. postmaster creds before they notice:

  user: postmaster
  hash: 8621ffdbc5698829     (hashcrack it)

mail host is internal — webmap redline-pr.local.`,
    link: "redline-pr.local",
  },
  {
    match: /aerolink|black\s*box|flight\s*229/i, flag: "aerolink_found",
    title: "#9630 — [flt 229]",
    body: `aerolink edited a flight recorder to bury a near-crash. maintenance creds:

  user: maint
  hash: 1f3870be274f6c49     (hashcrack it)

maint host is unlinked — webmap aerolink.local. the archive key is on the box.`,
    link: "aerolink.local",
  },
];

export function resolveUrl(input: string): string {
  let u = input.trim();
  if (!u) return u;
  // tolerate with/without scheme for known sites
  if (SITES[u]) return u;
  const stripped = u.replace(/^https?:\/\//, "");
  if (SITES[stripped]) return stripped;
  if (SITES["http://" + stripped]) return "http://" + stripped;
  return u;
}
