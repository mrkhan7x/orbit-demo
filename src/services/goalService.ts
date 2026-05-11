import { getDb, uuid } from "@/database/db";

// ─────────────────────────────────────────────────────────
// GOAL SERVICE
// ─────────────────────────────────────────────────────────

export interface Goal {
  id: string;
  title: string;
  description?: string;
  area_id?: string;
  reward?: string;
  status: "not_started" | "in_progress" | "completed" | "abandoned";
  progress: number;
  deadline?: string;
  is_priority: number;
  position: number;
  created_at: string;
}

function rowToGoal(row: Record<string, unknown>): Goal {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | undefined,
    area_id: row.area_id as string | undefined,
    reward: row.reward as string | undefined,
    status: row.status as Goal["status"],
    progress: row.progress as number,
    deadline: row.deadline as string | undefined,
    is_priority: row.is_priority as number,
    position: row.position as number,
    created_at: row.created_at as string,
  };
}

export async function getGoals(): Promise<Goal[]> {
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>("SELECT * FROM goals ORDER BY is_priority DESC, position ASC");
  return rows.map(rowToGoal);
}

export async function createGoal(data: Partial<Goal>): Promise<Goal> {
  const db = await getDb();
  const id = uuid();
  await db.execute(
    `INSERT INTO goals (id, title, description, area_id, reward, status, progress, deadline, is_priority, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.title || "New Goal",
      data.description || null,
      data.area_id || null,
      data.reward || null,
      data.status || "not_started",
      data.progress || 0,
      data.deadline || null,
      data.is_priority || 0,
      data.position || 0,
    ]
  );
  const rows = await db.select<Record<string, unknown>[]>("SELECT * FROM goals WHERE id = ?", [id]);
  return rowToGoal(rows[0]);
}

export async function updateGoal(id: string, data: Partial<Goal>): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(data).filter(k => !["id", "created_at"].includes(k)).map(k => `${k} = ?`).join(", ");
  const values = Object.keys(data).filter(k => !["id", "created_at"].includes(k)).map(k => (data as any)[k]);
  if (!fields) return;
  await db.execute(`UPDATE goals SET ${fields} WHERE id = ?`, [...values, id]);
}

export async function deleteGoal(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM goals WHERE id = ?", [id]);
}
