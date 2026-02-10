import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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

async function runClawdbotCommand(command: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`clawdbot ${command}`, {
      timeout: 15000,
    });
    return stdout;
  } catch (error: unknown) {
    const err = error as { stderr?: string; message?: string };
    console.error(`Clawdbot command failed: ${command}`, err.stderr || err.message);
    throw new Error(err.stderr || err.message || "Command failed");
  }
}

export async function getGatewayHealth(): Promise<GatewayHealth> {
  const output = await runClawdbotCommand("gateway health --json");
  return JSON.parse(output);
}

export async function getGatewayStatus(): Promise<Record<string, unknown>> {
  const output = await runClawdbotCommand("gateway call status --json");
  return JSON.parse(output);
}

export async function getSessions(): Promise<SessionsListResponse> {
  const output = await runClawdbotCommand("sessions --json");
  return JSON.parse(output);
}

export async function getCronJobs(): Promise<CronListResponse> {
  const output = await runClawdbotCommand("cron list --json");
  return JSON.parse(output);
}

export async function toggleCronJob(id: string, enable: boolean): Promise<void> {
  const command = enable ? "enable" : "disable";
  await runClawdbotCommand(`cron ${command} ${id}`);
}

export async function runCronJob(id: string): Promise<void> {
  await runClawdbotCommand(`cron run ${id}`);
}

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
