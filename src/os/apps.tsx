import type { AppId } from "../store";
import { TerminalApp } from "../term/Terminal";
import { BrowserApp } from "../apps/Browser";
import { EmailApp } from "../apps/Email";
import { ContractsApp } from "../apps/Contracts";
import { EvidenceApp } from "../apps/Evidence";
import { FilesApp } from "../apps/FileManager";
import { NetMapApp } from "../apps/NetworkMap";
import { ArsenalApp } from "../apps/Arsenal";
import { SettingsApp } from "../apps/Settings";

export const APPS: Record<AppId, { label: string; icon: string; render: () => React.ReactNode }> = {
  terminal: { label: "Terminal", icon: "▮", render: () => <TerminalApp /> },
  browser: { label: "Browser", icon: "◯", render: () => <BrowserApp /> },
  email: { label: "Mail", icon: "✉", render: () => <EmailApp /> },
  contracts: { label: "Contracts", icon: "▤", render: () => <ContractsApp /> },
  evidence: { label: "Evidence", icon: "◈", render: () => <EvidenceApp /> },
  files: { label: "Files", icon: "▦", render: () => <FilesApp /> },
  netmap: { label: "Network", icon: "⊹", render: () => <NetMapApp /> },
  arsenal: { label: "Arsenal", icon: "⚙", render: () => <ArsenalApp /> },
  settings: { label: "Settings", icon: "☰", render: () => <SettingsApp /> },
};

export const DOCK_ORDER: AppId[] = [
  "terminal", "browser", "email", "contracts", "evidence", "files", "netmap", "arsenal", "settings",
];
