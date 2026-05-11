import { getDb, uuid } from "@/database/db";

// ─────────────────────────────────────────────────────────
// HABIT SERVICE
// ─────────────────────────────────────────────────────────

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  frequency: "daily" | "weekly";
  target_days: string; // JSON array string
  difficulty: "easy" | "medium" | "hard";
  category?: string;
  archived: number;
  position: number;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  completed: number;
  note?: string;
}

function rowToHabit(row: Record<string, unknown>): Habit {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    icon: row.icon as string | undefined,
    color: row.color as string,
    frequency: row.frequency as Habit["frequency"],
    target_days: row.target_days as string,
    difficulty: row.difficulty as Habit["difficulty"],
    category: row.category as string | undefined,
    archived: row.archived as number,
    position: row.position as number,
    created_at: row.created_at as string,
  };
}

function rowToHabitLog(row: Record<string, unknown>): HabitLog {
  return {
    id: row.id as string,
    habit_id: row.habit_id as string,
    date: row.date as string,
    completed: row.completed as number,
    note: row.note as string | undefined,
  };
}

export async function getHabits(): Promise<Habit[]> {
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>("SELECT * FROM habits ORDER BY position ASC");
  return rows.map(rowToHabit);
}

export async function createHabit(data: Partial<Habit>): Promise<Habit> {
  const db = await getDb();
  const id = uuid();
  await db.execute(
    `INSERT INTO habits (id, name, description, icon, color, frequency, target_days, difficulty, category)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name || "New Habit",
      data.description || null,
      data.icon || "🔥",
      data.color || "#7c6fff",
      data.frequency || "daily",
      data.target_days || "[0,1,2,3,4,5,6]",
      data.difficulty || "medium",
      data.category || null,
    ]
  );
  const rows = await db.select<Record<string, unknown>[]>("SELECT * FROM habits WHERE id = ?", [id]);
  return rowToHabit(rows[0]);
}

export async function updateHabit(id: string, data: Partial<Habit>): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(data).filter(k => !["id", "created_at"].includes(k)).map(k => `${k} = ?`).join(", ");
  const values = Object.keys(data).filter(k => !["id", "created_at"].includes(k)).map(k => (data as any)[k]);
  if (!fields) return;
  await db.execute(`UPDATE habits SET ${fields} WHERE id = ?`, [...values, id]);
}

export async function deleteHabit(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM habits WHERE id = ?", [id]);
}

export async function getHabitLogs(startDate: string, endDate: string): Promise<HabitLog[]> {
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    "SELECT * FROM habit_logs WHERE date >= ? AND date <= ?",
    [startDate, endDate]
  );
  return rows.map(rowToHabitLog);
}

export async function toggleHabitLog(habitId: string, date: string, completed: boolean): Promise<HabitLog> {
  const db = await getDb();
  const existing = await db.select<Record<string, unknown>[]>(
    "SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?",
    [habitId, date]
  );

  if (existing.length > 0) {
    await db.execute("UPDATE habit_logs SET completed = ? WHERE id = ?", [completed ? 1 : 0, existing[0].id]);
    existing[0].completed = completed ? 1 : 0;
    return rowToHabitLog(existing[0]);
  } else {
    const id = uuid();
    await db.execute("INSERT INTO habit_logs (id, habit_id, date, completed) VALUES (?, ?, ?, ?)", [id, habitId, date, completed ? 1 : 0]);
    return { id, habit_id: habitId, date, completed: completed ? 1 : 0 };
  }
}
