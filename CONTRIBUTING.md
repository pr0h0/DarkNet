# Contributing to DARKNET // operator

Thanks for wanting to help! This is a hobby project and contributions of all
sizes are welcome — new missions, tools, themes, accessibility fixes, bug fixes,
and docs.

By submitting a contribution you agree it is licensed under the project's
[PolyForm Noncommercial License 1.0.0](./LICENSE).

## Ground rules

- **Keep it fictional.** No real exploit code, no real network/target interaction,
  no real credentials. Invent organisations and tools (e.g. `OrbitKey`, *Helios
  Aerospace*). The game must remain a safe local simulation.
- Keep the diff small and the code boring. Match the surrounding style.
- Run the checks before opening a PR (see below).

## Dev setup

```bash
npm install
npm run dev          # play at http://localhost:5173
npm run build        # type-check + production build
npx tsx scripts/smoke.ts   # headless full-campaign test
```

## How the game is structured

Almost everything is **data**, wired together by one engine file:

- `src/game/content.ts` — hosts (the network), contracts (missions), tools, the
  hash lookup, and the player's starting virtual filesystem.
- `src/game/sites.ts` — browser pages, `whois` records, and paste-site leaks.
- `src/game/engine.ts` — all actions and side effects: recon, connect/mount,
  decrypt, evidence, tool behaviours, contract gating, and mission scripting
  (briefing emails, evidence sources, story choices).

## Adding a mission (the short version)

1. **Hosts** — add `H({...})` entries to `HOSTS` in `content.ts`. A host can be
   open, credential-gated (`access`), or tool-gated (`requiresTool`), hold `files`
   (mounted under `/mnt/<id>` on connect), recoverable `hidden` files (forensic),
   or a `dbdump`.
2. **Contract** — add an entry to `CONTRACTS`. Use the gate fields to lock it:
   `dependsOn`, `reqRep`, `reqTool`, `reqFlag`, `blockFlag`. Add `requires`
   (evidence ids) and optional `choices` for a branching ending.
3. **Evidence** — add an `EV_SOURCES` entry in `engine.ts` matching a string in
   the file the player will pin.
4. **Leads** — add a public site + `WHOIS_DB` entry in `sites.ts`, and a `PASTES`
   entry if the mission leaks a credential/hash. Add a `HASHES` entry if you use
   `hashcrack`. Register any `webmap` reveal in `engine.ts`.
5. **Briefing** — add a `pushEmail(...)` block in `onAccept` in `engine.ts`.
6. **Test** — extend `scripts/smoke.ts` to drive your mission end to end and run it.

Look at an existing mission (e.g. *Glass House* or the *Dead Channel → Open
Channel* pair) as a template — they exercise every mechanic.

## Submitting

- Make sure `npm run build` and `npx tsx scripts/smoke.ts` both pass.
- Open a PR describing what you changed. Screenshots/GIFs help for UI changes.
