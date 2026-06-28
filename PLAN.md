# Hacker-For-Hire OS Game Plan

## Direction

Build a fresh browser game from scratch. The player uses a stylish fictional desktop OS to accept underground contracts, investigate targets, communicate by email, browse fictional websites, and operate through a real-ish terminal powered by `just-bash`.

The goal is a game first, not a CTF worksheet. Nontechnical players should be able to follow clues and enjoy the mystery. Technical players should still get satisfying shell behavior, files, pipes, globs, recon, and deeper optional paths.

## Core Fantasy

The player is a freelance cyber operator using a custom OS. They find work through a hidden hacker-for-hire marketplace, accept missions in the browser, receive follow-up communication over email, investigate targets, collect evidence, earn reputation, and expand their tool arsenal.

The game should feel like an immersive hacker OS adventure: terminal, browser, email, notes, windows, traces, factions, and contracts all belong to the same fictional system.

## Safety Boundary

Everything runs in a local fictional simulation. Do not implement real exploit instructions or real-world target interaction. Tools may be inspired by security concepts, but advanced tools should be fictionalized and operate only against game data.

Use fictional organizations and fictional tool names instead of real targets such as NASA or real exploit names such as EternalBlue.

Examples:

- `OrbitKey` instead of a real-world exploit.
- `BlueLatch` instead of an actual SMB exploit.
- `Helios Aerospace` instead of NASA.

## Platform

Recommended stack:

- Vite
- React
- TypeScript
- `just-bash`
- `xterm.js`
- IndexedDB persistence
- Plain CSS or CSS modules

`just-bash` provides shell parsing and many Unix-like commands in browser. Browser runtime must use a virtual persistent filesystem, not the user's real OS filesystem.

## OS UI

Build a fake desktop OS inspired by macOS, pretty Linux, and Wayland compositors.

Features:

- Full-screen desktop, no landing page.
- Top bar with clock, network status, trace state, active identity.
- Tiling and floating windows.
- Multi-tab terminal.
- Browser.
- Email client.
- Notes and evidence board.
- File manager.
- Network map.
- Tool arsenal window.
- Mission/contract board.
- Settings/themes.
- App launcher and keyboard shortcuts.

Window behavior:

- Drag windows.
- Snap left/right.
- Tile terminal with browser or email.
- Fullscreen terminal mode.
- Persistent window layout.

## Primary Apps

### Terminal

The terminal is the core interaction surface.

Use `just-bash` for:

- `ls`
- `cd`
- `cat`
- `grep`
- `find`
- `sed`
- pipes
- redirection
- variables
- loops
- globs
- filesystem behavior

Add custom game commands:

- `mail`
- `browser`
- `contracts`
- `accept`
- `scan`
- `probe`
- `connect`
- `disconnect`
- `run`
- `tools`
- `download`
- `evidence`
- `submit`
- `trace`
- `map`
- `notes`
- `theme`

Terminal features:

- Multiple tabs.
- Command history.
- Tab completion.
- Copy/paste.
- Optional command suggestions in Story Mode.

### Browser

The browser is a full in-game app, not just a text preview.

Features:

- Address bar.
- Bookmarks.
- Back/forward.
- Rendered fictional websites.
- Login forms.
- Admin dashboards.
- Source view.
- Cookies/session panel.
- Downloads.
- Hidden pages.
- Contract board.
- Tool market.
- Paste sites.
- News sites.

Default bookmarks:

- `darkboard://contracts`
- `mail.operator.local`
- `tools.market`
- `exploit-db.game`
- `reputation.net`
- `dead-drop.exchange`
- `pastebin.black`
- `whois.lookup`
- `newswire`

Browser should be controllable from terminal:

```bash
browser open darkboard://contracts
browser open http://archive.helios.local
browser source
browser cookies
download /backup/audit.zip
```

### Email

Missions are accepted on the web, then follow-up communication often happens over email.

Flow:

1. Player browses contract board.
2. Player accepts a contract.
3. Client sends initial email with tone, context, and vague leads.
4. Player may receive follow-up emails after discoveries.
5. Some missions require replying, sending evidence, or choosing a side.

Email features:

- Inbox.
- Threads.
- Attachments.
- Reply choices.
- Client identities.
- Delayed messages after triggers.
- Suspicious or hostile emails.

### Contracts

The contract board is where the player accepts missions.

Contract fields:

- Title.
- Client alias.
- Risk.
- Payout.
- Reputation impact.
- Known leads.
- Vague brief.
- Optional bonus.
- Moral complication.
- Accept button.

Contracts should not say “run command X.” They should give leads and goals.

Example:

> A biotech contractor believes a research portal is leaking deployment secrets. Confirm exposure, identify affected systems, and recover proof without disrupting operations.

### Evidence Board

Evidence is not just flags. The player collects proof.

Evidence types:

- Downloaded files.
- Emails.
- Logs.
- Screenshots.
- Credentials.
- Web pages.
- Source snippets.
- Terminal output.
- Notes.

Evidence can be pinned manually:

```bash
evidence pin /downloads/config.bak
evidence note "Backup contains service token"
submit contract-042
```

Submissions are graded by:

- Required evidence.
- Optional evidence.
- Detection/noise.
- Whether the player caused damage.
- Whether the player found hidden context.

## Game Modes

### Story Mode

For nontechnical players.

- Strong autocomplete.
- More hints.
- Forgiving trace.
- Suggested commands after repeated failure.
- Clearer email clues.

### Operator Mode

Default.

- Subtle hints.
- Moderate trace.
- Clues require reading and inference.

### Blackout Mode

For advanced players.

- Minimal hints.
- Faster trace.
- Stricter report grading.
- More consequences for failed logins/noisy scans.

## World Model

Represent everything as game data.

Host fields:

- ID.
- IP.
- Domain.
- Hostname.
- Organization.
- Services.
- Open ports.
- Security level.
- Filesystem seed.
- Logs.
- Users.
- Credentials.
- Linked hosts.
- Browser pages.
- Vulnerabilities.
- Story triggers.

Network behavior:

- Player starts with very little visible.
- `scan` reveals reachable neighbors from the current context.
- `whois`, `dig`, emails, files, and websites reveal new domains/IPs.
- Compromising one host exposes more neighbors.
- Network map grows from discoveries, not mission checklist.

## Tools And Arsenal

Tools are gained as the player progresses.

They can be:

- Purchased from market.
- Sent by clients.
- Found during missions.
- Stolen from targets.
- Earned as faction rewards.

Early tools:

- `scan`
- `probe`
- `ssh`
- `ftp`
- `grep`
- `decrypt`
- `logclean`

Mid-game tools:

- `webmap`
- `cookiejar`
- `hashcat-lite`
- `portcrack`
- `proxychain`
- `packetdump`
- `forensic`

Late-game fictional tools:

- `BlueLatch`
- `GhostRelay`
- `KernelSlip`
- `OrbitKey`
- `ZeroTrace`
- `MemoryNeedle`

Tool behavior:

- Each tool has requirements.
- Each tool has noise/trace impact.
- Some tools are safer but slower.
- Some tools unlock easier paths through future systems.
- Powerful tools can create consequences if overused.

Example progression:

After a fictional aerospace mission, the player obtains `OrbitKey`, which can open outdated `orb-smb` services in later missions.

## Trace And Risk

Trace creates game tension.

Actions increase trace/noise:

- Failed logins.
- Noisy scans.
- Running aggressive tools.
- Accessing admin panels.
- Downloading protected files.
- Repeated failed commands against a host.

Trace effects:

- Warning notifications.
- Host lockouts.
- Host logs showing player route.
- Rival hacker messages.
- Contract payout penalties.
- Emergency disconnect events.

Trace mitigation:

- `disconnect`
- `proxychain`
- `logclean`
- slower stealth tools
- route through compromised hosts
- submit report before trace completes

## Story And Factions

Tone: stylish cyber mystery, not training course.

Act 1:

- Player inherits or buys access to a custom operator workstation.
- Joins a hidden contractor board.
- Accepts small jobs.
- Learns the OS naturally.

Act 2:

- Contracts start connecting to the same shadow infrastructure.
- A rival operator notices the player.
- Tool vendors and clients become unreliable.

Act 3:

- Player gets access to high-value networks from fictional corporations and agencies.
- Powerful tools are obtained through risky missions.
- Choices affect reputation and factions.

Act 4:

- Player chooses whether to expose, sell, bury, or weaponize the final evidence.

Factions:

- Underground contract board.
- Tool market vendor.
- Whistleblower contact.
- Corporate security team.
- Rival operator.
- Dead-drop automated assistant.

## Mission Acceptance Flow

1. Player opens browser.
2. Player visits contract board.
3. Player accepts mission.
4. Mission creates a case file in OS.
5. Client sends email thread.
6. Email gives vague leads.
7. Player investigates through terminal/browser/files.
8. Player collects evidence.
9. Player submits evidence through contract board or email.
10. Client replies with outcome, payment, reputation, and possible new leads.

## Example Mission: Quiet Launch

Contract board:

- Title: Quiet Launch
- Client: `cold-rocket`
- Target: Helios Aerospace, fictional.
- Brief: A failed launch audit may have been buried. Recover proof of what happened.
- Known leads: `helios-aero.local`, employee `Mara Chen`, phrase `blue orbit archive`.
- Reward: money, reputation, potential tool drop.

Player path:

1. Search browser/paste sites for phrase.
2. Find subdomain `archive.helios-aero.local`.
3. Browse employee portal.
4. Find old backup.
5. Use terminal to inspect downloaded files.
6. Crack weak archive password from notes.
7. Discover internal host.
8. Use newly gained tool.
9. Extract audit report.
10. Choose submission path:
    - give to client
    - leak publicly
    - warn the lab

Rewards:

- Money.
- Reputation.
- `OrbitKey` fictional tool.
- New faction contact.

## MVP Scope

Build one excellent 45-minute chapter before adding a large campaign.

MVP includes:

- Fake desktop OS shell.
- `just-bash` terminal runtime.
- Multi-tab `xterm.js` terminal.
- Browser app with bookmarks.
- Email app.
- Contract board website.
- Notes/evidence app.
- Network map.
- Tool arsenal.
- Trace meter.
- Persistent virtual filesystem.
- Three contracts.
- Six to eight websites.
- Eight to ten hosts.
- Five tools.
- One meaningful story choice.

## MVP Chapter Flow

1. Boot into OS.
2. Open contract board in browser.
3. Accept first contract.
4. Receive client email.
5. Use terminal and browser to investigate.
6. Discover first host.
7. Use `scan` and `probe`.
8. Find credential or weak page.
9. Download evidence.
10. Use notes/evidence board.
11. Trigger small trace event.
12. Submit contract.
13. Receive payout, reputation, and new tool.
14. Unlock next contract.

## Implementation Phases

### Phase 1: Clean App Foundation

- Create Vite React TypeScript app.
- Install `just-bash`, `xterm.js`, IndexedDB helper.
- Build full-screen OS frame.
- Add top bar, desktop, window manager shell.

### Phase 2: Terminal Runtime

- Integrate `just-bash`.
- Integrate `xterm.js`.
- Add multi-tab terminals.
- Seed virtual filesystem.
- Persist filesystem to IndexedDB.

### Phase 3: OS Apps

- Browser window.
- Email window.
- Contract board.
- Notes/evidence board.
- File manager.
- Network map.
- Tool arsenal.

### Phase 4: Game Engine

- World model.
- Host model.
- Services and ports.
- Browser page model.
- Email triggers.
- Contract state.
- Evidence state.
- Tool inventory.
- Trace state.

### Phase 5: Custom Commands

- `mail`
- `browser`
- `contracts`
- `accept`
- `scan`
- `probe`
- `connect`
- `disconnect`
- `run`
- `tools`
- `download`
- `evidence`
- `submit`
- `trace`
- `map`
- `notes`
- `theme`

### Phase 6: First Chapter

- Three contracts.
- First email thread.
- First fake web targets.
- First host network.
- First evidence submission.
- First trace event.
- First tool reward.

### Phase 7: Polish

- Themes.
- Sound.
- Notifications.
- Window animations.
- Trace warnings.
- Keyboard shortcuts.
- Save/load/reset.

## Success Criteria

The first playable version is successful when a player can:

- Start in a fake OS desktop.
- Open the browser.
- Accept a mission from a hidden contract board.
- Receive and read a follow-up email.
- Use the terminal to investigate.
- Use the browser to inspect target pages.
- Download or pin evidence.
- Submit a contract.
- Receive a result email and a new tool.
- Understand the game without prior Linux experience.

## Non-Goals For MVP

- Real Docker targets.
- Real exploit execution.
- Massive 50-mission campaign.
- Multiplayer.
- Real internet/network access.
- Real user filesystem access.

## Design Principle

Teach Linux and security through play. The player should learn because commands help solve a mystery, not because the game lectures them.
