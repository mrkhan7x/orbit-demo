import { getDb, uuid } from "@/database/db";

// ─────────────────────────────────────────────────────────
// PROJECT SERVICE — All project SQL lives here
// ─────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  status: "active" | "planned" | "on_hold" | "completed";
  deadline?: string;
  position: number;
  created_at: string;
  updated_at: string;
  // Computed
  task_count?: number;
}

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id:          row.id as string,
    name:        row.name as string,
    description: row.description as string | undefined,
    color:       row.color as string,
    icon:        row.icon as string,
    status:      row.status as Project["status"],
    deadline:    row.deadline as string | undefined,
    position:    row.position as number,
    created_at:  row.created_at as string,
    updated_at:  row.updated_at as string,
    task_count:  row.task_count as number | undefined,
  };
}

export async function getProjects(): Promise<Project[]> {
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(`
    SELECT p.*, COUNT(t.id) as task_count
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id AND t.status != 'completed'
    GROUP BY p.id
    ORDER BY p.position ASC
  `);
  return rows.map(rowToProject);
}

export async function createProject(data: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  status?: Project["status"];
  deadline?: string;
}): Promise<Project> {
  const db = await getDb();
  const id = uuid();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO projects (id, name, description, color, icon, status, deadline, position, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,0,?,?)`,
    [
      id, data.name, data.description ?? null,
      data.color ?? "#7c6fff", data.icon ?? "📁",
      data.status ?? "active", data.deadline ?? null,
      now, now,
    ]
  );
  const rows = await db.select<Record<string, unknown>[]>(
    "SELECT * FROM projects WHERE id = ?", [id]
  );
  return rowToProject(rows[0]);
}

export async function updateProject(id: string, data: Partial<Project>): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  const fields = Object.keys(data).filter(k => !["id","created_at","updated_at","task_count"].includes(k)).map(k => `${k} = ?`).join(", ");
  const values = Object.keys(data).filter(k => !["id","created_at","updated_at","task_count"].includes(k)).map(k => (data as Record<string, unknown>)[k]);
  if (!fields) return;
  await db.execute(`UPDATE projects SET ${fields}, updated_at = ? WHERE id = ?`, [...values, now, id]);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM projects WHERE id = ?", [id]);
}
