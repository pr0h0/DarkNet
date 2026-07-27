# DARKNET // operator

A browser-based **hacker OS adventure game**. You play a freelance cyber-operator
working a hidden contract board from a stylish fictional desktop OS — accept jobs,
investigate targets through a real-ish terminal, follow leads across fake websites
and email, collect evidence, manage your trace, build an arsenal, and make choices
that shape a branching story.

Everything runs locally in your browser as a **fictional simulation**. There are no
real exploits, no real targets, and no network access — every "host", tool, and
organisation in the game is invented. It's a game first: non-technical players can
follow the clues and enjoy the mystery, while technical players get a genuine
Unix-like shell (pipes, globs, `grep`, `find`, redirection, loops) to play with.

> ⚠️ **Fiction only.** Tool names like `OrbitKey`, `BlueLatch`, and `KernelSlip`,
> and organisations like *Helios Aerospace* or *Meridian Trust*, are made up. The
> game never performs real network requests or touches your real filesystem.

---

## Features

- 🖥️ **Fake desktop OS** — top bar (clock, trace meter, credits, reputation),
  draggable/resizable windows with half- and quarter-screen snapping, a dock, an
  app launcher, keyboard shortcuts, and 4 themes.
- ⌨️ **Real terminal** — powered by [`just-bash`](https://www.npmjs.com/package/just-bash)
  and [`xterm.js`](https://xtermjs.org/): multi-tab, command history, tab-completion,
  full line editing, and ~20 custom game commands alongside standard Unix tools.
  `hashcrack` and `decrypt` run a work bar that scales with the target's strength
  (buy the `rainbow` cracker to blow through it).
- 🕸️ **Lateral movement** — `pivot` through a compromised foothold into a
  neighbouring host; quieter than a direct `connect`, the way real intrusions move.
- 🔊 **Sound & atmosphere** — subtle synthesized cues for new mail, trace
  thresholds, and getting burned (toggle in Settings). The world also has a life
  of its own — ambient chatter arrives while you work.
- 🌐 **In-game browser** — multiple tabs that keep their state, bookmarks,
  back/forward, rendered fictional sites, login forms, a paste-search engine, a
  whois lookup, a contract board, and a tool market.
- ✉️ **Email client** — briefings, follow-ups, and branching reply-choices.
- 📋 **Contract board** — 17 missions with a declarative gating system
  (depends-on chains, reputation gates, required-tool gates, story-flag gates).
- 🧩 **Evidence board** — pin files as proof, add/edit/remove notes.
- 🗺️ **Network map** — grows as you discover hosts through recon.
- 🧰 **Tool arsenal** — base tools, buyable conveniences, and mission-reward exploits.
- 📈 **Trace & risk** — noisy actions raise your trace; manage it with `logclean`,
  `proxychain`, and disconnects, or get burned.
- 💾 **Persistence** — your whole virtual filesystem and game state autosave to
  IndexedDB; reset any time from Settings.

## Gameplay at a glance

Most missions follow a loop that rewards real investigation rather than memorised
commands:

```
whois / webmap recon  →  hunt leaks on paste sites  →  hashcrack credentials
   →  log in to hosts  →  scan & pivot deeper into the network
   →  decrypt / dbdump / forensic to recover evidence  →  pin proof
   →  submit  →  branching story choice (who pays, who answers, who you become)
```

17 contracts span standalone side-jobs, multi-host deep dives, two connected
two-part arcs, and a finale that ties the whole conspiracy together. The story
threads — an aerospace cover-up, a smuggling ring, a bank breach, a deepfake
studio, and more — all trace back to one place.

Type `help` in the terminal to see the command list. The first contract,
**Welcome Packet**, teaches the basics (decode → pin → submit).

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [`just-bash`](https://www.npmjs.com/package/just-bash) — in-browser bash + virtual filesystem
- [`xterm.js`](https://xtermjs.org/) — terminal rendering
- IndexedDB for save persistence
- Plain CSS (no UI framework)

## Getting started

**Prerequisites:** [Node.js](https://nodejs.org/) 18+ and npm.

```bash
# 1. install dependencies
npm install

# 2. run the dev server (http://localhost:5173)
npm run dev

# 3. build a production bundle into dist/
npm run build

# 4. preview the production build locally
npm run preview
```

Then open the dev URL in your browser and play. Everything is client-side — no
backend, no accounts, no telemetry.

## Tests

A headless end-to-end script drives the entire campaign (all 17 missions, the
gating system, every tool, and the branching endings) through the real bash
runtime and game engine, asserting the whole chain:

```bash
npx tsx scripts/smoke.ts
```

## Project structure

```
src/
  main.tsx            entry
  App.tsx             boot sequence + save migration
  store.ts            central game state + IndexedDB persistence
  styles.css          all styling + themes
  game/
    content.ts        hosts, contracts, tools, hashes, seed filesystem
    sites.ts          browser pages, whois records, paste leaks
    engine.ts         all game actions + side effects (the core)
  term/
    bash.ts           just-bash instance + custom game commands
    Terminal.tsx      xterm component + multi-tab readline
  os/                 desktop shell: window manager, top bar, dock, app registry
  apps/               Browser, Email, Contracts, Evidence, Files, NetworkMap, Arsenal, Settings
scripts/
  smoke.ts            headless full-campaign test
PLAN.md               original design document
```

## Contributing

Contributions are very welcome — new missions, tools, themes, accessibility
improvements, and bug fixes especially. See [CONTRIBUTING.md](./CONTRIBUTING.md)
for how missions are structured (it's mostly data) and how to add one.

By contributing, you agree your contributions are licensed under the project's
[noncommercial license](#license).

## License

Licensed under the **PolyForm Noncommercial License 1.0.0** — see [LICENSE](./LICENSE).

In short: **free for personal and other noncommercial use** (play it, fork it,
modify it, share it, contribute back). **Commercial use is not permitted** —
you may not sell this software or any derivative, or use it to earn money,
without a separate commercial license from the copyright holder (pr0h0).

The game is a work of fiction for entertainment and education. It contains no
real security exploits and performs no real-world network or filesystem activity.
