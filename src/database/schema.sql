-- ─────────────────────────────────────────────────────────
-- ORBIT SQLite Schema v1
-- Run once on first app launch via migration system
-- ─────────────────────────────────────────────────────────

-- Global settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Projects (containers for tasks)
CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#7c6fff',
  icon        TEXT DEFAULT '📁',
  status      TEXT DEFAULT 'active',
  deadline    TEXT,
  position    INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- Tasks (core module — built in Phase 2)
CREATE TABLE IF NOT EXISTS tasks (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  notes        TEXT,
  status       TEXT DEFAULT 'not_started',
  priority     TEXT DEFAULT 'medium',
  category     TEXT,
  assigned_to  TEXT,
  due_date     TEXT,
  completed_at TEXT,
  recurrence   TEXT,
  parent_id    TEXT REFERENCES tasks(id),
  project_id   TEXT REFERENCES projects(id),
  goal_id      TEXT,
  position     INTEGER DEFAULT 0,
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now'))
);

-- Habits
CREATE TABLE IF NOT EXISTS habits (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  color       TEXT DEFAULT '#7c6fff',
  frequency   TEXT DEFAULT 'daily',
  target_days TEXT DEFAULT '[0,1,2,3,4,5,6]',
  difficulty  TEXT DEFAULT 'medium',
  category    TEXT,
  archived    INTEGER DEFAULT 0,
  position    INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id        TEXT PRIMARY KEY,
  habit_id  TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date      TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  note      TEXT,
  UNIQUE(habit_id, date)
);

-- Goals
CREATE TABLE IF NOT EXISTS goal_areas (
  id       TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  icon     TEXT,
  color    TEXT,
  position INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS goals (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  area_id     TEXT REFERENCES goal_areas(id),
  reward      TEXT,
  status      TEXT DEFAULT 'not_started',
  progress    INTEGER DEFAULT 0,
  deadline    TEXT,
  is_priority INTEGER DEFAULT 0,
  position    INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS goal_steps (
  id        TEXT PRIMARY KEY,
  goal_id   TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  task_id   TEXT REFERENCES tasks(id),
  position  INTEGER DEFAULT 0
);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
  id          TEXT PRIMARY KEY,
  title       TEXT DEFAULT 'Untitled',
  content     TEXT,
  parent_id   TEXT REFERENCES notes(id),
  category    TEXT DEFAULT 'notes',
  icon        TEXT,
  cover_url   TEXT,
  is_template INTEGER DEFAULT 0,
  is_favorite INTEGER DEFAULT 0,
  metadata    TEXT,
  position    INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- Custom Databases (Spreadsheet builder)
CREATE TABLE IF NOT EXISTS custom_databases (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  icon        TEXT,
  description TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS db_fields (
  id         TEXT PRIMARY KEY,
  db_id      TEXT NOT NULL REFERENCES custom_databases(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL,
  options    TEXT,
  position   INTEGER DEFAULT 0,
  is_primary INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS db_rows (
  id         TEXT PRIMARY KEY,
  db_id      TEXT NOT NULL REFERENCES custom_databases(id) ON DELETE CASCADE,
  position   INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS db_cells (
  id       TEXT PRIMARY KEY,
  row_id   TEXT NOT NULL REFERENCES db_rows(id) ON DELETE CASCADE,
  field_id TEXT NOT NULL REFERENCES db_fields(id) ON DELETE CASCADE,
  value    TEXT,
  UNIQUE(row_id, field_id)
);

-- Calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT,
  start_datetime TEXT NOT NULL,
  end_datetime   TEXT,
  all_day        INTEGER DEFAULT 0,
  color          TEXT,
  ref_type       TEXT,
  ref_id         TEXT,
  show_on_cal    INTEGER DEFAULT 1,
  created_at     TEXT DEFAULT (datetime('now'))
);

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    INTEGER PRIMARY KEY,
  applied_at TEXT DEFAULT (datetime('now'))
);
