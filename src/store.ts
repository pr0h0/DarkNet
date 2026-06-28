import { useSyncExternalStore } from "react";

// ---- Game data types ----
export type AppId =
  | "terminal" | "browser" | "email" | "contracts"
  | "evidence" | "files" | "netmap" | "arsenal" | "settings";

export type GameMode = "story" | "operator" | "blackout";

export interface WindowState {
  id: string;
  app: AppId;
  title: string;
  x: number; y: number; w: number; h: number;
  z: number;
  minimized: boolean;
  snap: "none" | "left" | "right" | "max" | "tl" | "tr" | "bl" | "br";
}

export interface Host {
  id: string;
  ip: string;
  domain?: string;
  hostname: string;
  org: string;
  services: { port: number; name: string }[];
  security: number;
  links: string[];          // host ids revealed when this host is scanned/compromised
  files?: Record<string, string>; // remote fs mounted under /mnt/<id> when connected
  hidden?: Record<string, string>; // deleted files recoverable with the forensic tool
  notes?: string;
  access?: { user: string; pass: string }; // credential gate for connect (ssh-style)
  dbdump?: string;          // full database dump content, produced by the dbdump tool
  requiresTool?: string;    // tool id needed to compromise
  discovered: boolean;
  compromised: boolean;
}

export interface Contract {
  id: string;
  title: string;
  client: string;
  risk: "low" | "medium" | "high";
  payout: number;
  rep: number;
  brief: string;
  leads: string[];
  bonus?: string;
  complication?: string;
  requires: string[];       // evidence ids needed to submit
  optional?: string[];
  rewardTool?: string;
  // gates — a contract is shown but cannot be accepted until these pass
  dependsOn?: string;       // contract id that must be submitted first
  reqRep?: number;          // minimum reputation
  reqTool?: string;         // tool id you must own
  reqFlag?: string;         // story flag that must be set
  blockFlag?: string;       // story flag that, if set, closes this contract
  grantsFlag?: string;      // flag set when this contract is submitted
  // optional data-driven story choice presented on submit
  choices?: { action: string; label: string; money: number; rep: number; tool?: string; note: string; flag?: string }[];
  status: "available" | "accepted" | "submitted";
}

export interface Evidence {
  id: string;
  label: string;
  kind: string;
  source: string;
  pinned: boolean;
}

export interface Tool {
  id: string;
  name: string;
  desc: string;
  noise: number;
  price?: number;
  owned: boolean;
}

export interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  read: boolean;
  at: number;
  choices?: { label: string; action: string }[];
  chosen?: string;
}

export interface State {
  booted: boolean;
  mode: GameMode;
  theme: string;
  identity: string;
  money: number;
  rep: number;
  trace: number;          // 0-100
  traceArmed: boolean;    // a host route is actively tracing
  connection: string | null; // active host id
  windows: WindowState[];
  topZ: number;
  // browser (multi-tab: each tab has its own history + position)
  browserTabs: { id: number; history: string[]; index: number }[];
  activeTab: number;
  bookmarks: string[];
  lastLogclean: number;
  // game data
  hosts: Record<string, Host>;
  contracts: Record<string, Contract>;
  evidence: Evidence[];
  tools: Record<string, Tool>;
  emails: Email[];
  notes: string;
  flags: Record<string, boolean>; // arbitrary story flags
  log: string[];          // notification feed
}

type Listener = () => void;

class Store {
  state: State;
  private listeners = new Set<Listener>();
  constructor(initial: State) { this.state = initial; }
  get = () => this.state;
  subscribe = (l: Listener) => { this.listeners.add(l); return () => this.listeners.delete(l); };
  set(patch: Partial<State> | ((s: State) => Partial<State>)) {
    const p = typeof patch === "function" ? patch(this.state) : patch;
    this.state = { ...this.state, ...p };
    this.listeners.forEach((l) => l());
    save();
  }
  // convenience mutators
  notify(msg: string) {
    this.set((s) => ({ log: [msg, ...s.log].slice(0, 50) }));
  }
}

import { initialState } from "./game/content";
export const store = new Store(initialState());

// ---- React hook ----
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(store.subscribe, () => sel(store.state));
}

// ---- Persistence (IndexedDB, tiny wrapper) ----
const DB = "darknet-os", STORE = "save";
function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbPut(key: string, val: unknown) {
  const db = await idb();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(val, key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readonly");
    const rq = tx.objectStore(STORE).get(key);
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
}

let saveTimer: number | undefined;
let fsDumpProvider: (() => Promise<Record<string, string>>) | null = null;
export function setFsDumpProvider(fn: () => Promise<Record<string, string>>) {
  fsDumpProvider = fn;
}
function save() {
  // debounce; persist game state + filesystem snapshot
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(async () => {
    await idbPut("state", store.state);
    if (fsDumpProvider) await idbPut("fs", await fsDumpProvider());
  }, 400);
}
export async function loadSave(): Promise<{ state?: State; fs?: Record<string, string> }> {
  try {
    const state = await idbGet<State>("state");
    const fs = await idbGet<Record<string, string>>("fs");
    return { state, fs };
  } catch { return {}; }
}
export async function resetSave() {
  const db = await idb();
  await new Promise<void>((res) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => res();
  });
  location.reload();
}
