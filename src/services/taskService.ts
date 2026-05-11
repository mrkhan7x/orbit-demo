import { getDb, uuid } from "@/database/db";
import type { Task, Priority, Status } from "@/types";

// ─────────────────────────────────────────────────────────
// TASK SERVICE — All SQL is here. NEVER in components.
// This is the only file that talks to the tasks table.
// ─────────────────────────────────────────────────────────

function computeDaysLeft(due_date?: string | null): number | undefined {
  if (!due_date) return undefined;
  const due = new Date(due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.floor((due.getTime() - today.getTime()) / 86_400_000);
}

function rowToTask(row: Record<string, unknown>): Task {
  const days_left = computeDaysLeft(row.due_date as string);
  return {
    id:           row.id as string,
    title:        row.title as string,
    description:  row.description as string | undefined,
    notes:        row.notes as string | undefined,
    status:       row.status as Status,
    priority:     row.priority as Priority,
    category:     row.category as string | undefined,
    assigned_to:  row.assigned_to as string | undefined,
    due_date:     row.due_date as string | undefined,
    completed_at: row.completed_at as string | undefined,
    recurrence:   row.recurrence as string | undefined,
    parent_id:    row.parent_id as string | undefined,
    project_id:   row.project_id as string | undefined,
    goal_id:      row.goal_id as string | undefined,
    position:     row.position as number,
    created_at:   row.created_at as string,
    updated_at:   row.updated_at as string,
    days_left,
    is_overdue:   days_left !== undefined && days_left < 0 && row.status !== "completed",
  };
}

/** Fetch all tasks, ordered by position then created_at */
export async function getTasks(): Promise<Task[]> {
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    "SELECT * FROM tasks ORDER BY position ASC, created_at DESC"
  );
  return rows.map(rowToTask);
}

/** Fetch tasks by project */
export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    "SELECT * FROM tasks WHERE project_id = ? ORDER BY position ASC",
    [projectId]
  );
  return rows.map(rowToTask);
}

/** Full-text search across title, description, notes */
export async function searchTasks(query: string): Promise<Task[]> {
  const db = await getDb();
  const q = `%${query}%`;
  const rows = await db.select<Record<string, unknown>[]>(
    `SELECT * FROM tasks
     WHERE title LIKE ? OR description LIKE ? OR notes LIKE ?
     ORDER BY created_at DESC`,
    [q, q, q]
  );
  return rows.map(rowToTask);
}

/** Create a new task */
export async function createTask(data: {
  title: string;
  description?: string;
  notes?: string;
  priority?: Priority;
  category?: string;
  assigned_to?: string;
  due_date?: string;
  project_id?: string;
  parent_id?: string;
}): Promise<Task> {
  const db = await getDb();
  const id = uuid();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO tasks
      (id, title, description, notes, priority, category, assigned_to,
       due_date, project_id, parent_id, status, position, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,'not_started',0,?,?)`,
    [
      id, data.title, data.description ?? null, data.notes ?? null,
      data.priority ?? "medium", data.category ?? null,
      data.assigned_to ?? null, data.due_date ?? null,
      data.project_id ?? null, data.parent_id ?? null, now, now,
    ]
  );

  const rows = await db.select<Record<string, unknown>[]>(
    "SELECT * FROM tasks WHERE id = ?", [id]
  );
  return rowToTask(rows[0]);
}

/** Update any fields on a task */
export async function updateTask(
  id: string,
  data: Partial<Omit<Task, "id" | "created_at" | "days_left" | "is_overdue">>
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  const fields = Object.keys(data)
    .filter((k) => !["updated_at"].includes(k))
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = Object.values(data);
  await db.execute(
    `UPDATE tasks SET ${fields}, updated_at = ? WHERE id = ?`,
    [...values, now, id]
  );
}

/** Toggle task completed ↔ not_started */
export async function toggleTask(id: string, currentStatus: Status): Promise<Status> {
  const db = await getDb();
  const now = new Date().toISOString();
  const newStatus: Status =
    currentStatus === "completed" ? "not_started" : "completed";
  const completedAt = newStatus === "completed" ? now : null;

  await db.execute(
    "UPDATE tasks SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?",
    [newStatus, completedAt, now, id]
  );
  return newStatus;
}

/** Soft delete (or hard delete) */
export async function deleteTask(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM tasks WHERE id = ?", [id]);
}

// ─── Recurring Task Engine ──────────────────────────────
// Runs on app startup. For each task with recurrence:
// - If the task is completed and its due_date is in the past,
//   create a new clone for the next occurrence.

function getNextDate(dueDate: string, recurrence: string): string {
  const d = new Date(dueDate + "T00:00:00");
  if (recurrence === "daily") d.setDate(d.getDate() + 1);
  else if (recurrence === "weekly") d.setDate(d.getDate() + 7);
  else if (recurrence === "monthly") d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
}

export async function processRecurringTasks(): Promise<number> {
  const db = await getDb();
  const today = new Date().toISOString().split("T")[0];

  // Find completed recurring tasks whose due_date is in the past
  const rows = await db.select<Record<string, unknown>[]>(
    `SELECT * FROM tasks 
     WHERE recurrence IS NOT NULL AND recurrence != '' 
     AND status = 'completed' 
     AND due_date IS NOT NULL AND due_date < ?`,
    [today]
  );

  let created = 0;
  for (const row of rows) {
    const nextDate = getNextDate(row.due_date as string, row.recurrence as string);
    // Check if we already created one for this date
    const existing = await db.select<Record<string, unknown>[]>(
      `SELECT id FROM tasks WHERE title = ? AND due_date = ? AND recurrence = ?`,
      [row.title, nextDate, row.recurrence]
    );
    if (existing.length > 0) continue;

    const id = uuid();
    const now = new Date().toISOString();
    await db.execute(
      `INSERT INTO tasks (id, title, description, notes, priority, category, 
       due_date, project_id, recurrence, status, position, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,'not_started',0,?,?)`,
      [id, row.title, row.description ?? null, row.notes ?? null,
       row.priority ?? "medium", row.category ?? null,
       nextDate, row.project_id ?? null, row.recurrence, now, now]
    );
    created++;
  }
  return created;
}

// ─── CSV Import ─────────────────────────────────────────
// Imports tasks from a Notion-exported CSV string

export async function importTasksFromCSV(csvContent: string): Promise<number> {
  const lines = csvContent.split("\n").filter(l => l.trim());
  if (lines.length < 2) return 0;

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
  const db = await getDb();
  let imported = 0;

  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parsing (handles quoted fields)
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx]?.trim().replace(/^"|"$/g, "") || ""; });

    const title = row["name"] || row["title"] || row["task"] || "";
    if (!title) continue;

    const id = uuid();
    const now = new Date().toISOString();
    const status = mapNotionStatus(row["status"] || "");
    const priority = mapNotionPriority(row["priority"] || "");
    const dueDate = row["due date"] || row["due"] || row["date"] || null;

    await db.execute(
      `INSERT INTO tasks (id, title, description, priority, category, due_date, status, position, created_at, updated_at)
       VALUES (?,?,?,?,?,?,'${status}',0,?,?)`,
      [id, title, row["description"] || null, priority, row["category"] || row["type"] || null,
       dueDate || null, now, now]
    );
    imported++;
  }
  return imported;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(current); current = ""; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

function mapNotionStatus(s: string): string {
  const lower = s.toLowerCase();
  if (lower.includes("done") || lower.includes("complete")) return "completed";
  if (lower.includes("progress") || lower.includes("doing")) return "in_progress";
  if (lower.includes("hold")) return "on_hold";
  if (lower.includes("delay")) return "delayed";
  return "not_started";
}

function mapNotionPriority(p: string): string {
  const lower = p.toLowerCase();
  if (lower.includes("critical") || lower.includes("urgent")) return "critical";
  if (lower.includes("high")) return "high";
  if (lower.includes("low")) return "low";
  return "medium";
}
