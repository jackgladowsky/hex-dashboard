// Server-side only - Clawdbot CLI wrapper
import { exec } from "child_process";
import { promisify } from "util";
import type {
  GatewayHealth,
  CronListResponse,
  SessionsListResponse,
} from "./types";

const execAsync = promisify(exec);

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
