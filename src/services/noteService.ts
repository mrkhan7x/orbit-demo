import { getDb, uuid } from "@/database/db";

// ─────────────────────────────────────────────────────────
// NOTE SERVICE
// ─────────────────────────────────────────────────────────

export interface Note {
  id: string;
  title: string;
  content?: string;
  parent_id?: string;
  category: "notes" | "inbox" | "fav" | "clips" | "voice" | "journal" | "meetings" | "all";
  icon?: string;
  cover_url?: string;
  is_template: number;
  is_favorite: number;
  metadata?: string;
  position: number;
  created_at: string;
  updated_at: string;
}

function rowToNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string | undefined,
    parent_id: row.parent_id as string | undefined,
    category: row.category as Note["category"],
    icon: row.icon as string | undefined,
    cover_url: row.cover_url as string | undefined,
    is_template: row.is_template as number,
    is_favorite: row.is_favorite as number || 0,
    metadata: row.metadata as string | undefined,
    position: row.position as number,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getNotes(): Promise<Note[]> {
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>("SELECT * FROM notes ORDER BY position ASC, updated_at DESC");
  return rows.map(rowToNote);
}

export async function createNote(data: Partial<Note>): Promise<Note> {
  const db = await getDb();
  const id = uuid();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO notes (id, title, content, parent_id, category, icon, cover_url, is_template, is_favorite, metadata, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.title || "Untitled",
      data.content || "",
      data.parent_id || null,
      data.category || "notes",
      data.icon || "📄",
      data.cover_url || null,
      data.is_template || 0,
      data.is_favorite || 0,
      data.metadata || null,
      data.position || 0,
      now,
      now,
    ]
  );
  const rows = await db.select<Record<string, unknown>[]>("SELECT * FROM notes WHERE id = ?", [id]);
  return rowToNote(rows[0]);
}

export async function updateNote(id: string, data: Partial<Note>): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  const fields = Object.keys(data).filter(k => !["id", "created_at", "updated_at"].includes(k)).map(k => `${k} = ?`).join(", ");
  const values = Object.keys(data).filter(k => !["id", "created_at", "updated_at"].includes(k)).map(k => (data as any)[k]);
  
  if (!fields) return;
  await db.execute(`UPDATE notes SET ${fields}, updated_at = ? WHERE id = ?`, [...values, now, id]);
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM notes WHERE id = ?", [id]);
}
