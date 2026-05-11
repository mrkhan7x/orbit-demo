import initSqlJs, { Database as SqlJsDatabase } from "sql.js";

// Mock Tauri Plugin SQL Response Interface
interface QueryResult {
  lastInsertId: number;
  rowsAffected: number;
}

export class WebDatabase {
  private db: SqlJsDatabase;

  constructor(db: SqlJsDatabase) {
    this.db = db;
  }

  async execute(sql: string, bindValues?: any[]): Promise<QueryResult> {
    try {
      this.db.run(sql, bindValues || []);
      this.saveToStorage();
      return { lastInsertId: 0, rowsAffected: 1 };
    } catch (error) {
      console.error("DB Execute Error:", error, sql);
      throw error;
    }
  }

  async select<T>(sql: string, bindValues?: any[]): Promise<T> {
    try {
      const stmt = this.db.prepare(sql);
      if (bindValues) stmt.bind(bindValues);
      
      const results: any[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results as unknown as T;
    } catch (error) {
      console.error("DB Select Error:", error, sql);
      throw error;
    }
  }

  private saveToStorage() {
    const data = this.db.export();
    let binary = '';
    const len = data.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(data[i]);
    }
    const base64 = btoa(binary);
    localStorage.setItem("orbit_web_db", base64);
  }
}

export type Database = WebDatabase;

let _db: WebDatabase | null = null;

export async function getDb(): Promise<WebDatabase> {
  if (_db) return _db;

  const SQL = await initSqlJs({
    locateFile: file => `./${file}`
  });

  const savedData = localStorage.getItem("orbit_web_db");
  if (savedData) {
    const binaryStr = atob(savedData);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    _db = new WebDatabase(new SQL.Database(bytes));
  } else {
    _db = new WebDatabase(new SQL.Database());
  }

  return _db;
}

export async function initializeDatabase(): Promise<void> {
  const db = await getDb();

  const statements = [
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, color TEXT, icon TEXT, created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY, project_id TEXT, title TEXT NOT NULL, content TEXT, plain_text TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')), is_pinned INTEGER DEFAULT 0,
      tags TEXT, participants TEXT, FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY, project_id TEXT, title TEXT NOT NULL, description TEXT,
      status TEXT DEFAULT 'todo', priority TEXT DEFAULT 'none', due_date TEXT,
      created_at TEXT DEFAULT (datetime('now')), completed_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, frequency TEXT DEFAULT 'daily',
      color TEXT DEFAULT '#4F46E5', created_at TEXT DEFAULT (datetime('now')), archived INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY, habit_id TEXT NOT NULL, completed_date TEXT NOT NULL,
      status TEXT DEFAULT 'completed', notes TEXT,
      FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
      UNIQUE(habit_id, completed_date)
    )`,
    `CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, target_date TEXT,
      status TEXT DEFAULT 'not_started', progress INTEGER DEFAULT 0, color TEXT DEFAULT '#10B981',
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS goal_milestones (
      id TEXT PRIMARY KEY, goal_id TEXT NOT NULL, title TEXT NOT NULL, is_completed INTEGER DEFAULT 0,
      FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS db_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT, version INTEGER NOT NULL, executed_at TEXT DEFAULT (datetime('now'))
    )`
  ];

  for (const sql of statements) {
    await db.execute(sql);
  }
}

export async function wipeDatabase(): Promise<void> {
  const db = await getDb();
  const tables = [
    "tasks", "projects", "habits", "habit_logs", "goals", "goal_milestones", "notes", "settings"
  ];
  for (const table of tables) {
    await db.execute(`DELETE FROM ${table}`);
  }
  localStorage.removeItem("orbit_web_db");
  console.log("[Orbit DB] Web database wiped cleanly.");
}

/** Generate a UUID v4 */
export function uuid(): string {
  return crypto.randomUUID();
}
