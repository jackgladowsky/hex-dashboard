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

// Known Discord channels for human-readable names
const KNOWN_CHANNELS: Record<string, string> = {
  "1464759031691219006": "#general",
  // Add more as needed
};

// Known cron job descriptions
const CRON_DESCRIPTIONS: Record<string, string> = {
  "Evening Recap": "Summarizes your day — what happened, pending tasks, tomorrow's calendar",
  "Morning Briefing": "Checks emails, GitHub notifications, and pending applications each morning",
  "Weekly Memory Cleanup": "Reviews and consolidates memory files, updates long-term memory",
};

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

export function getHumanSessionName(key: string): string {
  const { type, target } = parseSessionKey(key);
  
  switch (type) {
    case "main":
      return "Direct Chat";
    case "discord":
      if (target) {
        // Try to resolve channel ID to name
        const channelName = KNOWN_CHANNELS[target] || `Discord`;
        return channelName;
      }
      return "Discord";
    case "whatsapp":
      return "WhatsApp";
    case "cron":
      return "Scheduled Task";
    case "subagent":
      return "Background Task";
    default:
      return type || "Chat";
  }
}

export function getSessionDescription(session: SessionInfo): string {
  const { type, target } = parseSessionKey(session.key);
  
  switch (type) {
    case "main":
      return "Direct conversation with you";
    case "discord":
      return "Messages from Discord";
    case "whatsapp":
      return "Messages from WhatsApp";
    case "cron":
      return "Automated scheduled task";
    case "subagent":
      return "Background task I spawned";
    default:
      return "Conversation session";
  }
}

export function getCronDescription(job: CronJob): string {
  // Check if we have a known description
  if (CRON_DESCRIPTIONS[job.name]) {
    return CRON_DESCRIPTIONS[job.name];
  }
  
  // Otherwise, try to extract meaning from the payload
  const msg = job.payload?.message || "";
  if (msg.toLowerCase().includes("email")) {
    return "Checks and reports on emails";
  }
  if (msg.toLowerCase().includes("calendar")) {
    return "Checks calendar events";
  }
  if (msg.toLowerCase().includes("memory")) {
    return "Manages memory and notes";
  }
  if (msg.toLowerCase().includes("briefing") || msg.toLowerCase().includes("recap")) {
    return "Sends a summary update";
  }
  
  return "Scheduled automated task";
}

export function getHumanSchedule(expr: string, tz: string): string {
  // Parse common cron expressions into human-readable format
  const parts = expr.split(" ");
  if (parts.length !== 5) return expr;
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  // Daily at specific time
  if (dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    const h = parseInt(hour);
    const m = parseInt(minute);
    const timeStr = formatTime(h, m);
    return `Daily at ${timeStr}`;
  }
  
  // Weekly on specific day
  if (dayOfMonth === "*" && month === "*" && dayOfWeek !== "*") {
    const h = parseInt(hour);
    const m = parseInt(minute);
    const timeStr = formatTime(h, m);
    const dayName = getDayName(parseInt(dayOfWeek));
    return `Every ${dayName} at ${timeStr}`;
  }
  
  return expr;
}

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const m = minute.toString().padStart(2, "0");
  return `${h}:${m} ${period}`;
}

function getDayName(day: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[day] || "day";
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
