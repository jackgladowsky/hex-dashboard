import Database from "better-sqlite3";
import { join } from "path";
import { homedir } from "os";

const DB_PATH = join(homedir(), ".clawdbot", "hex-dashboard.db");

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initializeDatabase();
  }
  return db;
}

function initializeDatabase() {
  const database = getDatabase();

  // Activity logs table
  database.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      type TEXT NOT NULL,
      source TEXT,
      action TEXT,
      details TEXT,
      session_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `);

  // Create index for faster queries
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp 
    ON activity_logs(timestamp DESC)
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_activity_logs_type 
    ON activity_logs(type)
  `);
}

export interface ActivityLog {
  id: number;
  timestamp: number;
  type: string;
  source: string | null;
  action: string | null;
  details: string | null;
  session_id: string | null;
  created_at: number;
}

export interface CreateActivityLog {
  timestamp?: number;
  type: string;
  source?: string;
  action?: string;
  details?: string;
  session_id?: string;
}

export function createActivityLog(log: CreateActivityLog): number {
  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT INTO activity_logs (timestamp, type, source, action, details, session_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    log.timestamp ?? Date.now(),
    log.type,
    log.source ?? null,
    log.action ?? null,
    log.details ?? null,
    log.session_id ?? null
  );

  return result.lastInsertRowid as number;
}

export function getActivityLogs(options: {
  limit?: number;
  offset?: number;
  type?: string;
  since?: number;
}): ActivityLog[] {
  const database = getDatabase();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options.type) {
    conditions.push("type = ?");
    params.push(options.type);
  }

  if (options.since) {
    conditions.push("timestamp >= ?");
    params.push(options.since);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = options.limit ?? 100;
  const offset = options.offset ?? 0;

  const stmt = database.prepare(`
    SELECT * FROM activity_logs
    ${whereClause}
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `);

  params.push(limit, offset);
  return stmt.all(...params) as ActivityLog[];
}

export function getActivityLogCount(options: { type?: string; since?: number }): number {
  const database = getDatabase();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options.type) {
    conditions.push("type = ?");
    params.push(options.type);
  }

  if (options.since) {
    conditions.push("timestamp >= ?");
    params.push(options.since);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const stmt = database.prepare(`
    SELECT COUNT(*) as count FROM activity_logs ${whereClause}
  `);

  const result = stmt.get(...params) as { count: number };
  return result.count;
}

export function clearOldLogs(olderThanDays: number = 30): number {
  const database = getDatabase();
  const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

  const stmt = database.prepare(`
    DELETE FROM activity_logs WHERE timestamp < ?
  `);

  const result = stmt.run(cutoff);
  return result.changes;
}

// Close database on process exit
if (typeof process !== "undefined") {
  process.on("exit", () => {
    if (db) {
      db.close();
    }
  });
}
