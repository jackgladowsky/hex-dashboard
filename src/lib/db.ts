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
  const database = db!;

  // Agent templates table
  database.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT,
      role TEXT NOT NULL,
      description TEXT,
      model TEXT NOT NULL DEFAULT 'claude-sonnet-4',
      system_prompt TEXT,
      thinking TEXT DEFAULT 'low',
      skills TEXT,
      department TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Tasks table
  database.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'backlog',
      priority TEXT NOT NULL DEFAULT 'medium',
      assigned_agent TEXT REFERENCES agents(id),
      session_id TEXT,
      session_label TEXT,
      deadline INTEGER,
      tags TEXT,
      result TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      completed_at INTEGER
    )
  `);

  // Activity logs table
  database.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      type TEXT NOT NULL,
      source TEXT,
      action TEXT,
      details TEXT,
      entity_type TEXT,
      entity_id TEXT,
      session_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `);

  // Indexes
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_assigned_agent ON tasks(assigned_agent);
  `);
}

// ============ Agent Types & Functions ============

export interface Agent {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  description: string | null;
  model: string;
  system_prompt: string | null;
  thinking: string;
  skills: string | null; // JSON array
  department: string | null;
  created_at: number;
  updated_at: number;
}

export interface CreateAgent {
  name: string;
  avatar?: string;
  role: string;
  description?: string;
  model?: string;
  system_prompt?: string;
  thinking?: string;
  skills?: string[];
  department?: string;
}

export function createAgent(agent: CreateAgent): Agent {
  const database = getDatabase();
  const id = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = Date.now();

  const stmt = database.prepare(`
    INSERT INTO agents (id, name, avatar, role, description, model, system_prompt, thinking, skills, department, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    agent.name,
    agent.avatar ?? null,
    agent.role,
    agent.description ?? null,
    agent.model ?? "claude-sonnet-4",
    agent.system_prompt ?? null,
    agent.thinking ?? "low",
    agent.skills ? JSON.stringify(agent.skills) : null,
    agent.department ?? null,
    now,
    now
  );

  return getAgent(id)!;
}

export function getAgent(id: string): Agent | null {
  const database = getDatabase();
  const stmt = database.prepare("SELECT * FROM agents WHERE id = ?");
  return stmt.get(id) as Agent | null;
}

export function getAllAgents(): Agent[] {
  const database = getDatabase();
  const stmt = database.prepare("SELECT * FROM agents ORDER BY created_at DESC");
  return stmt.all() as Agent[];
}

export function updateAgent(id: string, updates: Partial<CreateAgent>): Agent | null {
  const database = getDatabase();
  const existing = getAgent(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (updates.avatar !== undefined) {
    fields.push("avatar = ?");
    values.push(updates.avatar);
  }
  if (updates.role !== undefined) {
    fields.push("role = ?");
    values.push(updates.role);
  }
  if (updates.description !== undefined) {
    fields.push("description = ?");
    values.push(updates.description);
  }
  if (updates.model !== undefined) {
    fields.push("model = ?");
    values.push(updates.model);
  }
  if (updates.system_prompt !== undefined) {
    fields.push("system_prompt = ?");
    values.push(updates.system_prompt);
  }
  if (updates.thinking !== undefined) {
    fields.push("thinking = ?");
    values.push(updates.thinking);
  }
  if (updates.skills !== undefined) {
    fields.push("skills = ?");
    values.push(JSON.stringify(updates.skills));
  }
  if (updates.department !== undefined) {
    fields.push("department = ?");
    values.push(updates.department);
  }

  if (fields.length === 0) return existing;

  fields.push("updated_at = ?");
  values.push(Date.now());
  values.push(id);

  const stmt = database.prepare(`UPDATE agents SET ${fields.join(", ")} WHERE id = ?`);
  stmt.run(...values);

  return getAgent(id);
}

export function deleteAgent(id: string): boolean {
  const database = getDatabase();
  const stmt = database.prepare("DELETE FROM agents WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

// ============ Task Types & Functions ============

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "backlog" | "assigned" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assigned_agent: string | null;
  session_id: string | null;
  session_label: string | null;
  deadline: number | null;
  tags: string | null; // JSON array
  result: string | null;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
}

export interface CreateTask {
  title: string;
  description?: string;
  status?: Task["status"];
  priority?: Task["priority"];
  assigned_agent?: string;
  deadline?: number;
  tags?: string[];
}

export function createTask(task: CreateTask): Task {
  const database = getDatabase();
  const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = Date.now();

  const stmt = database.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, assigned_agent, deadline, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    task.title,
    task.description ?? null,
    task.status ?? "backlog",
    task.priority ?? "medium",
    task.assigned_agent ?? null,
    task.deadline ?? null,
    task.tags ? JSON.stringify(task.tags) : null,
    now,
    now
  );

  return getTask(id)!;
}

export function getTask(id: string): Task | null {
  const database = getDatabase();
  const stmt = database.prepare("SELECT * FROM tasks WHERE id = ?");
  return stmt.get(id) as Task | null;
}

export function getAllTasks(filters?: { status?: string; assigned_agent?: string }): Task[] {
  const database = getDatabase();
  const conditions: string[] = [];
  const params: string[] = [];

  if (filters?.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }
  if (filters?.assigned_agent) {
    conditions.push("assigned_agent = ?");
    params.push(filters.assigned_agent);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const stmt = database.prepare(`SELECT * FROM tasks ${whereClause} ORDER BY created_at DESC`);
  return stmt.all(...params) as Task[];
}

export function updateTask(id: string, updates: Partial<CreateTask> & { 
  session_id?: string; 
  session_label?: string;
  result?: string;
  completed_at?: number;
}): Task | null {
  const database = getDatabase();
  const existing = getTask(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push("description = ?");
    values.push(updates.description);
  }
  if (updates.status !== undefined) {
    fields.push("status = ?");
    values.push(updates.status);
  }
  if (updates.priority !== undefined) {
    fields.push("priority = ?");
    values.push(updates.priority);
  }
  if (updates.assigned_agent !== undefined) {
    fields.push("assigned_agent = ?");
    values.push(updates.assigned_agent);
  }
  if (updates.session_id !== undefined) {
    fields.push("session_id = ?");
    values.push(updates.session_id);
  }
  if (updates.session_label !== undefined) {
    fields.push("session_label = ?");
    values.push(updates.session_label);
  }
  if (updates.deadline !== undefined) {
    fields.push("deadline = ?");
    values.push(updates.deadline);
  }
  if (updates.tags !== undefined) {
    fields.push("tags = ?");
    values.push(JSON.stringify(updates.tags));
  }
  if (updates.result !== undefined) {
    fields.push("result = ?");
    values.push(updates.result);
  }
  if (updates.completed_at !== undefined) {
    fields.push("completed_at = ?");
    values.push(updates.completed_at);
  }

  if (fields.length === 0) return existing;

  fields.push("updated_at = ?");
  values.push(Date.now());
  values.push(id);

  const stmt = database.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`);
  stmt.run(...values);

  return getTask(id);
}

export function deleteTask(id: string): boolean {
  const database = getDatabase();
  const stmt = database.prepare("DELETE FROM tasks WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

// ============ Activity Log Functions ============

export interface ActivityLog {
  id: number;
  timestamp: number;
  type: string;
  source: string | null;
  action: string | null;
  details: string | null;
  entity_type: string | null;
  entity_id: string | null;
  session_id: string | null;
  created_at: number;
}

export interface CreateActivityLog {
  type: string;
  source?: string;
  action?: string;
  details?: string;
  entity_type?: string;
  entity_id?: string;
  session_id?: string;
}

export function logActivity(log: CreateActivityLog): number {
  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT INTO activity_logs (timestamp, type, source, action, details, entity_type, entity_id, session_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    Date.now(),
    log.type,
    log.source ?? null,
    log.action ?? null,
    log.details ?? null,
    log.entity_type ?? null,
    log.entity_id ?? null,
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
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  const stmt = database.prepare(`
    SELECT * FROM activity_logs ${whereClause} ORDER BY timestamp DESC LIMIT ? OFFSET ?
  `);

  params.push(limit, offset);
  return stmt.all(...params) as ActivityLog[];
}

// Close database on process exit
if (typeof process !== "undefined") {
  process.on("exit", () => {
    if (db) {
      db.close();
    }
  });
}
