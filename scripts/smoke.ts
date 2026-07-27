// Headless end-to-end check of the MVP chapter. Stubs the two browser globals
// the store/engine touch (indexedDB autosave, window timers), then drives the
// full Quiet Launch + Cold Storage chain through real bash commands + engine.
const g = globalThis as any;
g.indexedDB = { open: () => ({}) }; // save() awaits forever, never fires — harmless
g.window = { innerWidth: 1280, innerHeight: 800, setTimeout: () => 0, clearTimeout: () => {}, addEventListener: () => {} };

const { initBash } = await import("../src/term/bash.ts");
const { store } = await import("../src/store.ts");
const E = await import("../src/game/engine.ts");

const bash = await initBash();
const sh = async (c: string) => (await bash.exec(c)).stdout.trim();
let fails = 0;
const ok = (cond: boolean, msg: string) => { console.log((cond ? "✓" : "✗ FAIL") + " " + msg); if (!cond) fails++; };

// --- Contract 1: welcome-packet ---
ok((await sh("cat onboarding/cipher.txt | tail -1 | base64 -d")).includes("GHOST-IN-THE-WIRE"), "base64 decode of cipher");
await bash.exec("cat onboarding/cipher.txt | tail -1 | base64 -d > activation.txt");
console.log("  pin:", await E.pinEvidence("activation.txt"));
ok(store.state.evidence.some(e => e.id === "activation-phrase"), "activation phrase pinned as evidence");
E.acceptContract("welcome-packet");
console.log("  submit:", E.submitContract("welcome-packet"));
ok(store.state.contracts["welcome-packet"].status === "submitted", "welcome-packet submitted");
ok(store.state.contracts["quiet-launch"].status === "available", "quiet-launch unlocked");
ok(store.state.tools["webmap"].owned, "webmap tool granted");
ok(store.state.money === 50, "money == 50 after c1 (got " + store.state.money + ")");

// --- Contract 2: quiet-launch ---
E.acceptContract("quiet-launch");
// browser-driven steps (pastebin search + portal login) simulated:
store.set((s: any) => ({ flags: { ...s.flags, pastebin_found: true }, hosts: { ...s.hosts, "helios-web": { ...s.hosts["helios-web"], discovered: true } } }));
E.heliosLogin();
console.log("  download:", await E.download("/backup/launch-audit.zip"));
ok(await bash.fs.exists("/home/op/downloads/launch-audit.zip"), "audit zip downloaded");
console.log(E.scan("archive.helios-aero.local"));
ok(store.state.hosts["helios-build-01"].discovered, "helios-build-01 discovered via scan");
console.log("  connect:", await E.connect("helios-build-01"));
ok((await sh("cat /mnt/helios-build-01/notes/passwords.txt")).includes("launchpad7"), "found archive password on build host");
const dec = await E.decrypt("/home/op/downloads/launch-audit.zip", "launchpad7");
ok(dec.includes("BLUE ORBIT"), "decrypt reveals audit");
ok(await bash.fs.exists("/home/op/downloads/launch-audit/audit-7.txt"), "audit extracted to file");
console.log("  pin:", await E.pinEvidence("/home/op/downloads/launch-audit/audit-7.txt"));
ok(store.state.evidence.some(e => e.id === "audit-report"), "audit-report evidence pinned");
// submit triggers story choice email
console.log("  submit:", E.submitContract("quiet-launch"));
ok(store.state.emails.some(e => e.id === "ql-choice"), "story choice email delivered");
E.chooseEmail("ql-choice", "qc-client");
ok(store.state.contracts["quiet-launch"].status === "submitted", "quiet-launch resolved");
ok(store.state.tools["orbitkey"].owned, "OrbitKey granted");
ok(store.state.contracts["cold-storage"].status === "available", "cold-storage unlocked");
console.log("  money after c2:", store.state.money, "rep:", store.state.rep);

// --- Contract 3: cold-storage (tool-gated) ---
E.acceptContract("cold-storage");
E.scan("helios-build-01");
ok(store.state.hosts["helios-vault"].discovered, "helios-vault discovered");
const blocked = await E.connect("helios-vault");
ok(/orbit-locked|locked/.test(blocked), "vault blocked before running OrbitKey");
console.log("  run:", await E.runTool("orbitkey", "helios-vault"));
console.log("  connect:", await E.connect("helios-vault"));
ok((await sh("cat /mnt/helios-vault/share/ledger.txt")).includes("OVERRIDE LEDGER"), "ledger readable after OrbitKey");
console.log("  pin:", await E.pinEvidence("/mnt/helios-vault/share/ledger.txt"));
console.log("  submit:", E.submitContract("cold-storage"));
ok(store.state.contracts["cold-storage"].status === "submitted", "cold-storage delivered");

// --- Side mission: Loud House (parallel, independent) ---
ok(store.state.contracts["loud-house"].status === "available", "loud-house available from start");
ok(store.state.contracts["paper-trail"].status === "available", "paper-trail available from start");
E.acceptContract("loud-house");
ok(/192.0.2.44/.test(E.whoisLookup("loudhaus.fm")), "whois loudhaus reveals host");
ok(store.state.hosts["loudhaus-web"].discovered, "loudhaus-web discovered via whois");
console.log("  connect:", await E.connect("loudhaus-web"));
ok((await sh("grep -i deface /mnt/loudhaus-web/var/log/access.log")).includes("m0ngrel"), "grep finds defacer in log");
await E.pinEvidence("/mnt/loudhaus-web/var/log/access.log");
console.log("  submit:", E.submitContract("loud-house"));
ok(store.state.contracts["loud-house"].status === "submitted", "loud-house delivered");
await E.disconnect();

// --- Side mission: Paper Trail (webmap + grep + reward tool) ---
E.acceptContract("paper-trail");
ok(!!E.searchPaste("ghost invoices"), "pastebin reveals ghost-invoices leak");
console.log("  webmap:", await E.runTool("webmap", "vanta-holdings.local"));
ok(store.state.hosts["vanta-files"].discovered, "webmap reveals vanta-files");
await E.connect("vanta-files");
ok((await sh("grep OFFSHORE /mnt/vanta-files/share/invoices.csv")).includes("ghost invoice"), "grep finds offshore transfers");
await E.pinEvidence("/mnt/vanta-files/share/invoices.csv");
console.log("  submit:", E.submitContract("paper-trail"));
ok(store.state.contracts["paper-trail"].status === "submitted", "paper-trail delivered");
ok(store.state.tools["ghostrelay"].owned, "GhostRelay granted by paper-trail");
await E.disconnect();

// --- Buyable convenience tools ---
const beforeBuy = store.state.money;
console.log("  buy:", E.buyTool("proxychain"));
ok(store.state.tools["proxychain"].owned, "proxychain purchased");
ok(store.state.money === beforeBuy - 250, "proxychain cost 250");
const tBefore = store.state.trace;
E.scan("helios-build-01"); // noisy action, now dampened by proxychain
ok(store.state.trace - tBefore <= 3, "proxychain halves scan noise");
console.log("  buy:", E.buyTool("rainbow"));
ok(store.state.tools["rainbow"].owned, "rainbow (faster cracker) purchased");

// --- Endgame: Signal Loss (needs GhostRelay, unlocked by cold-storage) ---
ok(store.state.contracts["signal-loss"].status === "available", "signal-loss unlocked by cold-storage");
E.acceptContract("signal-loss");
ok(store.state.hosts["relay-node"].discovered, "relay-node revealed on accept");
const slBlocked = await E.connect("relay-node");
ok(/locked/.test(slBlocked), "relay blocked before GhostRelay");
console.log("  run:", await E.runTool("ghostrelay", "relay-node"));
await E.connect("relay-node");
await E.pinEvidence("/mnt/relay-node/share/targets.txt");
console.log("  submit:", E.submitContract("signal-loss"));
ok(store.state.contracts["signal-loss"].status === "submitted", "signal-loss delivered");

// --- Deep mission: Glass House (multi-hop bank breach) ---
console.log("\n=== GLASS HOUSE ===");
store.set({ trace: 0 }); // simulate cooling off (logclean/time) between jobs
ok(store.state.contracts["glass-house"].status === "available", "glass-house available from start");
E.acceptContract("glass-house");
// 1. find leak + crack hash
ok(!!E.searchPaste("meridian breach"), "pastebin reveals meridian breach + hash");
ok(E.hashcrack("7c4a8d09ca3762af").includes("summer2019"), "hashcrack cracks the IT hash");
// 2. webmap to find staging
console.log("  webmap:", await E.runTool("webmap", "meridian-trust.local"));
ok(store.state.hosts["meridian-staging"].discovered, "webmap reveals staging host");
// 3. bad creds rejected, good creds accepted
ok(/access denied/.test(await E.connect("staging.meridian-trust.local", "j.poole", "wrong")), "wrong password rejected");
console.log("  login:", await E.connect("staging.meridian-trust.local", "j.poole", "summer2019"));
ok(store.state.connection === "meridian-staging", "logged into staging with creds");
// 4. read notes -> prod creds + vault key
const notes = await sh("cat /mnt/meridian-staging/home/jpoole/notes.txt");
ok(notes.includes("m3ridian-db") && notes.includes("kestrel"), "staging notes leak db creds + vault key");
// 5. pivot: scan reveals db + vault
E.scan("meridian-staging");
ok(store.state.hosts["meridian-db"].discovered && store.state.hosts["meridian-vault"].discovered, "scan reveals db + vault");
// 6. into the database -> required evidence (via lateral movement from staging)
ok(/isn't reachable|foothold/.test(await E.pivot("helios-vault")), "pivot rejects a non-neighbour host");
const pv = await E.pivot("meridian-db", "svc", "m3ridian-db");
ok(store.state.connection === "meridian-db" && /via meridian-staging/.test(pv), "pivot tunnels staging -> db");
await E.pinEvidence("/mnt/meridian-db/var/lib/db/customers.sample.csv");
ok(store.state.evidence.some((e) => e.id === "meridian-customers"), "customer sample pinned (required)");
// 7. optional bonus: dbdump (buy tool first) + vault memo
E.buyTool("dbdump");
console.log("  dbdump:", await E.runTool("dbdump", "meridian-db"));
await E.pinEvidence("/mnt/meridian-db/dump-full.csv");
ok(store.state.evidence.some((e) => e.id === "meridian-fulldump"), "full dump pinned (bonus)");
await E.disconnect();
await E.connect("meridian-vault");
ok((await E.decrypt("/mnt/meridian-vault/share/board-memo.enc", "kestrel")).includes("BOARD MEMO"), "vault memo decrypts with key from notes");
await E.pinEvidence("/mnt/meridian-vault/share/board-memo.txt");
ok(store.state.evidence.some((e) => e.id === "meridian-memo"), "board memo pinned (bonus)");
// 8. submit -> story choice -> resolve
console.log("  submit:", E.submitContract("glass-house"));
ok(store.state.emails.some((e) => e.id === "glass-house-choice"), "glass-house choice email delivered");
const ghMoney = store.state.money;
E.chooseEmail("glass-house-choice", "gh-report");
ok(store.state.contracts["glass-house"].status === "submitted", "glass-house resolved via choice");
ok(store.state.tools["bluelatch"].owned, "BlueLatch granted");
ok(store.state.money > ghMoney, "report choice paid out (incl. bonus)");
console.log("  packetdump tool check:", store.state.tools["packetdump"].desc.slice(0, 30));

// --- Gating system ---
console.log("\n=== GATES + NEW MISSIONS ===");
store.set({ trace: 0 });
ok(E.contractGate(store.state.contracts["saltwire"])?.includes("packetdump") ?? false, "saltwire gated: needs packetdump tool");
ok(E.contractGate(store.state.contracts["last-light"]) !== null, "last-light gated (depends/rep/tool)");
ok(/needs tool|depends|reputation/.test(E.acceptContract("last-light")), "accept refuses gated contract");

// --- Dead Channel -> Open Channel (connected pair) ---
E.acceptContract("dead-channel");
ok(!!E.searchPaste("northwind manifest"), "paste leaks northwind ops hash");
ok(E.hashcrack("9b74c9897bac770f").includes("northstar99"), "hashcrack -> northstar99");
await E.runTool("webmap", "northwind-logi.local");
ok(store.state.hosts["northwind-relay"].discovered, "webmap reveals relay");
await E.connect("relay.northwind-logi.local", "ops", "northstar99");
ok((await sh("cat /mnt/northwind-relay/home/ops/handoff.txt")).includes("tailwind"), "handoff note leaks cache key");
E.scan("northwind-relay");
ok(store.state.hosts["northwind-cache"].discovered && store.state.hosts["northwind-core"].discovered, "scan reveals cache + core");
await E.connect("northwind-cache");
await E.decrypt("/mnt/northwind-cache/data/manifest.enc", "tailwind");
await E.pinEvidence("/mnt/northwind-cache/data/manifest.txt");
ok(store.state.evidence.some(e => e.id === "northwind-manifest"), "manifest pinned");
E.submitContract("dead-channel");
ok(store.state.contracts["dead-channel"].status === "submitted", "dead-channel delivered");
await E.disconnect();
// open-channel now unlocked (depends on dead-channel) and needs bluelatch (owned from glass-house)
ok(E.contractGate(store.state.contracts["open-channel"]) === null, "open-channel unlocked after dead-channel");
E.acceptContract("open-channel");
await E.runTool("bluelatch", "northwind-core");
await E.connect("northwind-core");
await E.pinEvidence("/mnt/northwind-core/share/ledger.txt");
E.submitContract("open-channel");
E.chooseEmail("open-channel-choice", "oc-turnin");
ok(store.state.contracts["open-channel"].status === "submitted", "open-channel resolved via choice");
await E.disconnect();

// --- Saltwire (must own packetdump; uses it to sniff creds) ---
store.set({ trace: 0 });
console.log("  buy packetdump:", E.buyTool("packetdump"));
ok(E.contractGate(store.state.contracts["saltwire"]) === null, "saltwire unlocked after buying packetdump");
E.acceptContract("saltwire");
E.whoisLookup("saltwire-energy.local");
await E.connect("saltwire-jump");
const sniff = await E.runTool("packetdump");
ok(sniff.includes("Brine!2021"), "packetdump sniffs VPN creds");
await E.connect("saltwire-vpn", "vpnuser", "Brine!2021");
E.scan("saltwire-vpn");
await E.connect("saltwire-scada");
await E.pinEvidence("/mnt/saltwire-scada/var/log/sensors.log");
E.submitContract("saltwire");
ok(store.state.contracts["saltwire"].status === "submitted", "saltwire delivered");
await E.disconnect();

// --- Paper Moon (rep-gated; forensic recovers deleted evidence) ---
store.set({ trace: 0 });
E.acceptContract("paper-moon");
await E.runTool("webmap", "lumen-studio.local");
E.searchPaste("lumen render");
ok(E.hashcrack("e99a18c428cb38d5").includes("lights2019"), "hashcrack -> lights2019");
await E.connect("render.lumen-studio.local", "render", "lights2019");
E.buyTool("forensic");
console.log("  forensic:", await E.runTool("forensic"));
await E.pinEvidence("/mnt/lumen-render/srv/jobs/.purged/deepfake-source.txt");
ok(store.state.evidence.some(e => e.id === "lumen-source"), "forensic-recovered source pinned");
E.submitContract("paper-moon");
ok(store.state.tools["kernelslip"].owned, "KernelSlip granted by paper-moon");
await E.disconnect();

// --- Last Light (capstone: depends on signal-loss + rep18 + kernelslip) ---
store.set({ trace: 0 });
ok(E.contractGate(store.state.contracts["last-light"]) === null, "last-light unlocked (all gates satisfied)");
E.acceptContract("last-light");
E.searchPaste("vance");
ok(E.hashcrack("098f6bcd4621d373").includes("apolloburns"), "hashcrack -> apolloburns");
E.whoisLookup("vance-trust.local");
await E.connect("vance-edge", "r.vance", "apolloburns");
E.scan("vance-edge");
await E.runTool("kernelslip", "vance-core");
await E.connect("vance-core");
await E.pinEvidence("/mnt/vance-core/root/master-ledger.txt");
E.submitContract("last-light");
E.chooseEmail("last-light-choice", "ll-expose");
ok(store.state.contracts["last-light"].status === "submitted", "last-light resolved (the end)");

// --- Batch 2 new missions ---
console.log("\n=== MORE MISSIONS ===");
store.set({ trace: 0 });
// Hollow Coin (crypto rug-pull, choice)
E.acceptContract("hollow-coin");
E.searchPaste("hollow coin");
await E.runTool("webmap", "coinhollow.local");
await E.connect("api.coinhollow.local", "admin", E.hashcrack("0d107d09f5bbe40c").split("->").pop()!.trim());
ok(store.state.connection === "coinhollow-api", "coinhollow api login");
E.scan("coinhollow-api");
await E.connect("coinhollow-db", "ops", "h0llowdb");
await E.pinEvidence("/mnt/coinhollow-db/var/db/txns.csv");
E.submitContract("hollow-coin");
E.chooseEmail("hollow-coin-choice", "hc-return");
ok(store.state.contracts["hollow-coin"].status === "submitted", "hollow-coin resolved");
await E.disconnect();
// Black Box -> Flight Risk (connected pair)
store.set({ trace: 0 });
E.acceptContract("black-box");
E.searchPaste("aerolink");
await E.runTool("webmap", "aerolink.local");
await E.connect("maint.aerolink.local", "maint", "skyfall88");
await E.decrypt("/mnt/aerolink-ftp/data/flight-data.enc", "blackbox");
await E.pinEvidence("/mnt/aerolink-ftp/data/flight-data.txt");
E.submitContract("black-box");
ok(store.state.contracts["black-box"].status === "submitted", "black-box delivered");
ok(E.contractGate(store.state.contracts["flight-risk"]) === null, "flight-risk unlocked after black-box");
E.scan("aerolink-ftp");
E.acceptContract("flight-risk");
await E.runTool("bluelatch", "aerolink-core");
await E.connect("aerolink-core");
await E.pinEvidence("/mnt/aerolink-core/share/coverup.txt");
E.submitContract("flight-risk");
E.chooseEmail("flight-risk-choice", "fr-report");
ok(store.state.contracts["flight-risk"].status === "submitted", "flight-risk resolved via choice");
await E.disconnect();
// Ghost Shift (packetdump + forensic) and Red Letter (rep-gated)
store.set({ trace: 0 });
E.acceptContract("ghost-shift");
E.whoisLookup("mercy-health.local");
await E.connect("mercy-jump");
await E.runTool("packetdump");
await E.connect("mercy-records", "svc", "Patient!23");
await E.runTool("forensic");
await E.pinEvidence("/mnt/mercy-records/srv/records/.purged/sale.txt");
E.submitContract("ghost-shift");
ok(store.state.contracts["ghost-shift"].status === "submitted", "ghost-shift delivered (packetdump+forensic)");
await E.disconnect();
store.set({ trace: 0 });
E.acceptContract("red-letter");
E.searchPaste("red letter");
await E.runTool("webmap", "redline-pr.local");
await E.connect("mail.redline-pr.local", "postmaster", "inkblot77");
await E.pinEvidence("/mnt/redline-mail/var/mail/spool.txt");
E.submitContract("red-letter");
E.chooseEmail("red-letter-choice", "rl-expose");
ok(store.state.contracts["red-letter"].status === "submitted", "red-letter resolved");
await E.disconnect();

const totalDone = Object.values(store.state.contracts).filter(c => c.status === "submitted").length;
ok(totalDone === 17, "all 17 contracts delivered (got " + totalDone + ")");
console.log("\nFINAL  money:", store.state.money, " rep:", store.state.rep, " trace:", store.state.trace);
console.log(fails === 0 ? "\nALL CHECKS PASSED" : `\n${fails} CHECK(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
