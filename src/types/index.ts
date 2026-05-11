// ─────────────────────────────────────────────────────────
// ORBIT — Global TypeScript Types
// All shared interfaces live here. Module-specific types
// go in their own module folder.
// ─────────────────────────────────────────────────────────

export type Priority = "critical" | "high" | "medium" | "low";
export type Status = "not_started" | "pending" | "in_progress" | "on_hold" | "delayed" | "completed";
export type Theme = "dark" | "light";
export type Frequency = "daily" | "weekly" | "monthly";

export interface NavItem {
  id: string;
  label: string;
  icon: string; // lucide icon name
  path: string;
  badge?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  status: Status;
  priority: Priority;
  category?: string;
  assigned_to?: string;
  due_date?: string;      // ISO string
  completed_at?: string;
  parent_id?: string;
  project_id?: string;
  goal_id?: string;
  recurrence?: string;   // e.g. "daily", "weekly"
  position: number;
  created_at: string;
  updated_at: string;
  // Computed (not stored)
  days_left?: number;
  is_overdue?: boolean;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  frequency: Frequency;
  target_days?: number[]; // [0,1,2,3,4,5,6] for weekdays
  difficulty?: "easy" | "medium" | "hard";
  category?: string;
  archived: boolean;
  position: number;
  created_at: string;
  // Computed
  streak?: number;
  today_completed?: boolean;
  completion_rate?: number;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;           // YYYY-MM-DD
  completed: boolean;
  note?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  area_id?: string;
  reward?: string;
  status: Status;
  progress: number;       // 0–100
  deadline?: string;
  is_priority: boolean;
  position: number;
  created_at: string;
}

export interface GoalStep {
  id: string;
  goal_id: string;
  title: string;
  completed: boolean;
  task_id?: string;
  position: number;
}

export interface GoalArea {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  position: number;
}

export interface Note {
  id: string;
  title: string;
  content?: string;       // JSON or HTML string from TipTap
  parent_id?: string;
  category?: string;      // "notes", "inbox", "journal", "meetings"
  icon?: string;
  cover_url?: string;
  is_template: boolean;
  is_favorite: boolean;
  metadata?: string;      // JSON string for advanced properties
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CustomDatabase {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  created_at: string;
}

export type FieldType =
  | "text" | "number" | "select" | "multi_select"
  | "date" | "checkbox" | "url" | "relation" | "formula";

export interface DbField {
  id: string;
  db_id: string;
  name: string;
  type: FieldType;
  options?: string;       // JSON
  position: number;
  is_primary: boolean;
}

export interface DbRow {
  id: string;
  db_id: string;
  position: number;
  created_at: string;
}

export interface DbCell {
  id: string;
  row_id: string;
  field_id: string;
  value?: string;
}
