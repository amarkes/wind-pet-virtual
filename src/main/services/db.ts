import Database from 'better-sqlite3'
import { app } from 'electron'
import { join, dirname } from 'path'
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { config as loadEnv } from 'dotenv'
import type { Task, Note, PetState, AppSettings, AuditLog, FocusSession, Achievement } from '../../shared/types'

// ── Load .env from project root (works in both dev and packaged) ────────────
// Dev:  __dirname = out/main  → ../../ = project root
// Prod: exe = dist/mac/Buddy.app/Contents/MacOS/Buddy → 5x .. = project root
const projectRoot = app.isPackaged
  ? join(dirname(app.getPath('exe')), '..', '..', '..', '..', '..')
  : join(__dirname, '..', '..')
loadEnv({ path: join(projectRoot, '.env') })

// ── Data directory ─────────────────────────────────────────────────────────
// Always use the fixed project data directory (dev and prod share the same DB).
// Set DATA_DIR_FIXED in .env to configure.
function resolveDataDir(): string {
  if (!process.env.DATA_DIR_FIXED) throw new Error('DATA_DIR_FIXED is not set in .env')
  return process.env.DATA_DIR_FIXED
}

const DATA_DIR      = resolveDataDir()
const DB_PATH       = join(DATA_DIR, 'buddy.db')
const MIGRATED_FLAG = join(DATA_DIR, '.migrated')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  mkdirSync(DATA_DIR, { recursive: true })
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  initSchema()
  tryMigrate()
  return _db
}

// ── Schema ─────────────────────────────────────────────────────────────────

function initSchema(): void {
  _db!.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id                TEXT PRIMARY KEY,
      title             TEXT NOT NULL,
      description       TEXT,
      status            TEXT NOT NULL DEFAULT 'pending',
      priority          TEXT NOT NULL DEFAULT 'medium',
      difficulty        TEXT NOT NULL DEFAULT 'medium',
      tags              TEXT NOT NULL DEFAULT '[]',
      estimated_minutes INTEGER,
      due_date          TEXT,
      created_at        TEXT NOT NULL,
      updated_at        TEXT NOT NULL,
      completed_at      TEXT,
      subtasks          TEXT NOT NULL DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS notes (
      id         TEXT PRIMARY KEY,
      title      TEXT,
      content    TEXT NOT NULL DEFAULT '',
      tags       TEXT NOT NULL DEFAULT '[]',
      pinned     INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pet (
      id          INTEGER PRIMARY KEY DEFAULT 1,
      name        TEXT    NOT NULL DEFAULT 'Buddy',
      mood        TEXT    NOT NULL DEFAULT 'idle',
      xp          INTEGER NOT NULL DEFAULT 0,
      level       INTEGER NOT NULL DEFAULT 1,
      streak      INTEGER NOT NULL DEFAULT 0,
      last_active TEXT    NOT NULL,
      weight      REAL    NOT NULL DEFAULT 1.0
    );
    CREATE TABLE IF NOT EXISTS settings (
      id                    INTEGER PRIMARY KEY DEFAULT 1,
      user_name             TEXT    NOT NULL DEFAULT '',
      gemini_api_key        TEXT    NOT NULL DEFAULT '',
      working_directory     TEXT    NOT NULL DEFAULT '',
      commit_analysis_limit INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id         TEXT PRIMARY KEY,
      task_id    TEXT NOT NULL,
      task_title TEXT NOT NULL,
      action     TEXT NOT NULL,
      timestamp  TEXT NOT NULL,
      details    TEXT
    );
    CREATE TABLE IF NOT EXISTS focus_sessions (
      id               TEXT PRIMARY KEY,
      started_at       TEXT NOT NULL,
      ended_at         TEXT,
      duration_seconds INTEGER
    );
    CREATE TABLE IF NOT EXISTS achievements (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT NOT NULL,
      icon        TEXT NOT NULL,
      unlocked_at TEXT
    );
    CREATE TABLE IF NOT EXISTS tag_colors (
      tag   TEXT PRIMARY KEY,
      color TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT,
      color       TEXT NOT NULL DEFAULT '#6366f1',
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
  `)

  // Add project_id column to tasks if missing (schema evolution)
  const taskCols = (_db!.pragma('table_info(tasks)') as { name: string }[]).map((c) => c.name)
  if (!taskCols.includes('project_id')) {
    _db!.exec('ALTER TABLE tasks ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL')
  }

  if (!_db!.prepare('SELECT 1 FROM pet WHERE id = 1').get()) {
    _db!.prepare(
      'INSERT INTO pet (id,name,mood,xp,level,streak,last_active,weight) VALUES (1,?,?,0,1,0,?,1.0)'
    ).run('Buddy', 'idle', new Date().toISOString())
  }

  if (!_db!.prepare('SELECT 1 FROM settings WHERE id = 1').get()) {
    _db!.prepare(
      'INSERT INTO settings (id,user_name,gemini_api_key,working_directory,commit_analysis_limit) VALUES (1,?,?,?,1)'
    ).run('', '', '')
  }
}

// ── Migration from electron-store JSON ────────────────────────────────────

function tryMigrate(): void {
  if (existsSync(MIGRATED_FLAG)) return

  // Possible electron-store locations (dev uses app name from package.json, prod uses productName)
  const home = app.getPath('home')
  const candidates = [
    join(home, 'Library', 'Application Support', 'clearup', 'config.json'),
    join(home, 'Library', 'Application Support', 'Buddy',   'config.json'),
    join(home, 'Library', 'Application Support', 'Electron','config.json'),
  ]

  let old: Record<string, unknown> | null = null
  for (const p of candidates) {
    if (existsSync(p)) {
      try { old = JSON.parse(readFileSync(p, 'utf-8')); break } catch { /* skip */ }
    }
  }

  if (old) {
    const db = _db!
    db.transaction(() => {
      if (Array.isArray(old!.tasks)) {
        const ins = db.prepare(`INSERT OR IGNORE INTO tasks
          (id,title,description,status,priority,difficulty,tags,estimated_minutes,due_date,created_at,updated_at,completed_at,subtasks)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        for (const t of old!.tasks as Task[]) {
          ins.run(t.id, t.title, t.description ?? null, t.status, t.priority, t.difficulty,
            JSON.stringify(t.tags ?? []), t.estimatedMinutes ?? null, t.dueDate ?? null,
            t.createdAt, t.updatedAt, t.completedAt ?? null, JSON.stringify(t.subtasks ?? []))
        }
      }
      if (Array.isArray(old!.notes)) {
        const ins = db.prepare(`INSERT OR IGNORE INTO notes
          (id,title,content,tags,pinned,created_at,updated_at) VALUES (?,?,?,?,?,?,?)`)
        for (const n of old!.notes as Note[]) {
          ins.run(n.id, n.title ?? null, n.content, JSON.stringify(n.tags ?? []),
            n.pinned ? 1 : 0, n.createdAt, n.updatedAt)
        }
      }
      if (old!.pet) {
        const p = old!.pet as PetState
        db.prepare('UPDATE pet SET name=?,mood=?,xp=?,level=?,streak=?,last_active=?,weight=? WHERE id=1')
          .run(p.name, p.mood, p.xp, p.level, p.streak, p.lastActive, p.weight ?? 1.0)
      }
      if (old!.settings) {
        const s = old!.settings as AppSettings
        db.prepare('UPDATE settings SET user_name=?,gemini_api_key=?,working_directory=?,commit_analysis_limit=? WHERE id=1')
          .run(s.userName ?? '', s.geminiApiKey ?? '', s.workingDirectory ?? '', s.commitAnalysisLimit ?? 1)
      }
      if (Array.isArray(old!.auditLogs)) {
        const ins = db.prepare(`INSERT OR IGNORE INTO audit_logs
          (id,task_id,task_title,action,timestamp,details) VALUES (?,?,?,?,?,?)`)
        for (const a of old!.auditLogs as AuditLog[]) {
          ins.run(a.id, a.taskId, a.taskTitle, a.action, a.timestamp, a.details ?? null)
        }
      }
      if (Array.isArray(old!.focusSessions)) {
        const ins = db.prepare(`INSERT OR IGNORE INTO focus_sessions
          (id,started_at,ended_at,duration_seconds) VALUES (?,?,?,?)`)
        for (const f of old!.focusSessions as FocusSession[]) {
          ins.run(f.id, f.startedAt, f.endedAt ?? null, f.durationSeconds ?? null)
        }
      }
      if (Array.isArray(old!.achievements)) {
        const ins = db.prepare(`INSERT OR IGNORE INTO achievements
          (id,title,description,icon,unlocked_at) VALUES (?,?,?,?,?)`)
        for (const a of old!.achievements as Achievement[]) {
          ins.run(a.id, a.title, a.description, a.icon, a.unlockedAt ?? null)
        }
      }
      if (old!.tagColors && typeof old!.tagColors === 'object') {
        const ins = db.prepare('INSERT OR REPLACE INTO tag_colors (tag,color) VALUES (?,?)')
        for (const [tag, color] of Object.entries(old!.tagColors as Record<string, string>)) {
          ins.run(tag, color)
        }
      }
    })()
  }

  writeFileSync(MIGRATED_FLAG, new Date().toISOString())
}
