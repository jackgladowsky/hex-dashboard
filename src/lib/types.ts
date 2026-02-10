// Shared types for Clawdbot data

export interface GatewayHealth {
  ok: boolean;
  ts: number;
  durationMs: number;
  channels: Record<string, ChannelHealth>;
  channelOrder: string[];
  channelLabels: Record<string, string>;
  heartbeatSeconds: number;
  defaultAgentId: string;
  agents: AgentInfo[];
  sessions: SessionsSummary;
}

export interface ChannelHealth {
  configured: boolean;
  linked?: boolean;
  running: boolean;
  connected?: boolean;
  lastError?: string | null;
  probe?: {
    ok: boolean;
    bot?: { id: string; username: string };
  };
}

export interface AgentInfo {
  agentId: string;
  isDefault: boolean;
  heartbeat: {
    enabled: boolean;
    every: string;
    everyMs: number;
  };
  sessions: {
    count: number;
  };
}

export interface SessionsSummary {
  count: number;
  recent: SessionInfo[];
}

export interface SessionInfo {
  key: string;
  kind: string;
  sessionId: string;
  updatedAt: number;
  ageMs?: number;
  age?: number;
  model?: string;
  totalTokens?: number;
  contextTokens?: number;
  percentUsed?: number;
  inputTokens?: number;
  outputTokens?: number;
  systemSent?: boolean;
}

export interface CronJob {
  id: string;
  agentId: string;
  name: string;
  enabled: boolean;
  createdAtMs: number;
  updatedAtMs: number;
  schedule: {
    kind: string;
    expr: string;
    tz: string;
  };
  sessionTarget: string;
  wakeMode: string;
  payload: {
    kind: string;
    message: string;
    deliver: boolean;
    channel?: string;
    to?: string;
  };
  state: {
    nextRunAtMs: number;
    lastRunAtMs?: number;
    lastStatus?: string;
    lastDurationMs?: number;
  };
}

export interface CronListResponse {
  jobs: CronJob[];
}

export interface SessionsListResponse {
  path: string;
  count: number;
  activeMinutes: number | null;
  sessions: SessionInfo[];
}

export interface MemoryFile {
  name: string;
  path: string;
  relativePath: string;
  size: number;
  modifiedAt: number;
  isDirectory: boolean;
}

export interface MemoryFileContent {
  path: string;
  content: string;
  size: number;
  modifiedAt: number;
}

// Client-side utility functions
export function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatTokens(tokens: number): string {
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(2)}M`;
}

export function parseSessionKey(key: string): {
  agent: string;
  type: string;
  target?: string;
} {
  const parts = key.split(":");
  if (parts.length < 3) {
    return { agent: parts[1] || "unknown", type: "unknown" };
  }
  
  const agent = parts[1];
  const type = parts[2];
  const target = parts.slice(3).join(":");
  
  return { agent, type, target };
}

export function getSessionIcon(type: string): string {
  switch (type) {
    case "main":
      return "🏠";
    case "discord":
      return "💬";
    case "whatsapp":
      return "📱";
    case "cron":
      return "⏰";
    case "subagent":
      return "🤖";
    default:
      return "📝";
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function isMarkdownFile(name: string): boolean {
  return name.endsWith(".md");
}

export function isDateFile(name: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(-.*)?\.md$/.test(name);
}

export function extractDate(name: string): string | null {
  const match = name.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}
