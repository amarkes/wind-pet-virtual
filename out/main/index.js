"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const path = require("path");
const crypto = require("crypto");
const Database = require("better-sqlite3");
const fs = require("fs");
const genai = require("@google/genai");
const simpleGit = require("simple-git");
function resolveDataDir() {
  if (electron.app.isPackaged) {
    return path.join(path.dirname(electron.app.getPath("exe")), "..", "..", "..", "data");
  }
  return path.join(electron.app.getAppPath(), "data");
}
const DATA_DIR = resolveDataDir();
const DB_PATH = path.join(DATA_DIR, "buddy.db");
const MIGRATED_FLAG = path.join(DATA_DIR, ".migrated");
let _db = null;
function getDb() {
  if (_db) return _db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  initSchema();
  tryMigrate();
  return _db;
}
function initSchema() {
  _db.exec(`
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
  `);
  const taskCols = _db.pragma("table_info(tasks)").map((c) => c.name);
  if (!taskCols.includes("project_id")) {
    _db.exec("ALTER TABLE tasks ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL");
  }
  if (!_db.prepare("SELECT 1 FROM pet WHERE id = 1").get()) {
    _db.prepare(
      "INSERT INTO pet (id,name,mood,xp,level,streak,last_active,weight) VALUES (1,?,?,0,1,0,?,1.0)"
    ).run("Buddy", "idle", (/* @__PURE__ */ new Date()).toISOString());
  }
  if (!_db.prepare("SELECT 1 FROM settings WHERE id = 1").get()) {
    _db.prepare(
      "INSERT INTO settings (id,user_name,gemini_api_key,working_directory,commit_analysis_limit) VALUES (1,?,?,?,1)"
    ).run("", "", "");
  }
}
function tryMigrate() {
  if (fs.existsSync(MIGRATED_FLAG)) return;
  const home = electron.app.getPath("home");
  const candidates = [
    path.join(home, "Library", "Application Support", "clearup", "config.json"),
    path.join(home, "Library", "Application Support", "Buddy", "config.json"),
    path.join(home, "Library", "Application Support", "Electron", "config.json")
  ];
  let old = null;
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        old = JSON.parse(fs.readFileSync(p, "utf-8"));
        break;
      } catch {
      }
    }
  }
  if (old) {
    const db = _db;
    db.transaction(() => {
      if (Array.isArray(old.tasks)) {
        const ins = db.prepare(`INSERT OR IGNORE INTO tasks
          (id,title,description,status,priority,difficulty,tags,estimated_minutes,due_date,created_at,updated_at,completed_at,subtasks)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
        for (const t of old.tasks) {
          ins.run(
            t.id,
            t.title,
            t.description ?? null,
            t.status,
            t.priority,
            t.difficulty,
            JSON.stringify(t.tags ?? []),
            t.estimatedMinutes ?? null,
            t.dueDate ?? null,
            t.createdAt,
            t.updatedAt,
            t.completedAt ?? null,
            JSON.stringify(t.subtasks ?? [])
          );
        }
      }
      if (Array.isArray(old.notes)) {
        const ins = db.prepare(`INSERT OR IGNORE INTO notes
          (id,title,content,tags,pinned,created_at,updated_at) VALUES (?,?,?,?,?,?,?)`);
        for (const n of old.notes) {
          ins.run(
            n.id,
            n.title ?? null,
            n.content,
            JSON.stringify(n.tags ?? []),
            n.pinned ? 1 : 0,
            n.createdAt,
            n.updatedAt
          );
        }
      }
      if (old.pet) {
        const p = old.pet;
        db.prepare("UPDATE pet SET name=?,mood=?,xp=?,level=?,streak=?,last_active=?,weight=? WHERE id=1").run(p.name, p.mood, p.xp, p.level, p.streak, p.lastActive, p.weight ?? 1);
      }
      if (old.settings) {
        const s = old.settings;
        db.prepare("UPDATE settings SET user_name=?,gemini_api_key=?,working_directory=?,commit_analysis_limit=? WHERE id=1").run(s.userName ?? "", s.geminiApiKey ?? "", s.workingDirectory ?? "", s.commitAnalysisLimit ?? 1);
      }
      if (Array.isArray(old.auditLogs)) {
        const ins = db.prepare(`INSERT OR IGNORE INTO audit_logs
          (id,task_id,task_title,action,timestamp,details) VALUES (?,?,?,?,?,?)`);
        for (const a of old.auditLogs) {
          ins.run(a.id, a.taskId, a.taskTitle, a.action, a.timestamp, a.details ?? null);
        }
      }
      if (Array.isArray(old.focusSessions)) {
        const ins = db.prepare(`INSERT OR IGNORE INTO focus_sessions
          (id,started_at,ended_at,duration_seconds) VALUES (?,?,?,?)`);
        for (const f of old.focusSessions) {
          ins.run(f.id, f.startedAt, f.endedAt ?? null, f.durationSeconds ?? null);
        }
      }
      if (Array.isArray(old.achievements)) {
        const ins = db.prepare(`INSERT OR IGNORE INTO achievements
          (id,title,description,icon,unlocked_at) VALUES (?,?,?,?,?)`);
        for (const a of old.achievements) {
          ins.run(a.id, a.title, a.description, a.icon, a.unlockedAt ?? null);
        }
      }
      if (old.tagColors && typeof old.tagColors === "object") {
        const ins = db.prepare("INSERT OR REPLACE INTO tag_colors (tag,color) VALUES (?,?)");
        for (const [tag, color] of Object.entries(old.tagColors)) {
          ins.run(tag, color);
        }
      }
    })();
  }
  fs.writeFileSync(MIGRATED_FLAG, (/* @__PURE__ */ new Date()).toISOString());
}
const PROJECT_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
function toTask(r) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status,
    priority: r.priority,
    difficulty: r.difficulty,
    tags: JSON.parse(r.tags || "[]"),
    estimatedMinutes: r.estimated_minutes,
    dueDate: r.due_date,
    projectId: r.project_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    completedAt: r.completed_at,
    subtasks: JSON.parse(r.subtasks || "[]")
  };
}
function toProject(r) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    color: r.color,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}
function toNote(r) {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    tags: JSON.parse(r.tags || "[]"),
    pinned: Boolean(r.pinned),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}
function toPet(r) {
  return {
    name: r.name,
    mood: r.mood,
    xp: r.xp,
    level: r.level,
    streak: r.streak,
    lastActive: r.last_active,
    weight: r.weight
  };
}
function toSettings(r) {
  return {
    userName: r.user_name,
    geminiApiKey: r.gemini_api_key,
    workingDirectory: r.working_directory,
    commitAnalysisLimit: r.commit_analysis_limit
  };
}
function normalizeProjectFields(data) {
  return {
    name: data.name.trim(),
    description: data.description?.trim() || void 0,
    color: data.color.trim()
  };
}
function validateProjectFields(data) {
  const normalized = normalizeProjectFields(data);
  if (!normalized.name) {
    throw new Error("Project name cannot be empty");
  }
  if (!PROJECT_COLOR_RE.test(normalized.color)) {
    throw new Error("Project color must be a valid hex value like #22c55e");
  }
  return normalized;
}
function withProjectDbError(operation, fn) {
  try {
    return fn();
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown database error";
    throw new Error(`Failed to ${operation} project: ${details}`);
  }
}
function getTasks() {
  return getDb().prepare("SELECT * FROM tasks ORDER BY created_at DESC").all().map(toTask);
}
function createTask(data) {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  db.prepare(`
    INSERT INTO tasks (id,title,description,status,priority,difficulty,tags,estimated_minutes,due_date,project_id,created_at,updated_at,completed_at,subtasks)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id,
    data.title,
    data.description ?? null,
    data.status,
    data.priority,
    data.difficulty,
    JSON.stringify(data.tags ?? []),
    data.estimatedMinutes ?? null,
    data.dueDate ?? null,
    data.projectId ?? null,
    now,
    now,
    data.completedAt ?? null,
    JSON.stringify(data.subtasks ?? [])
  );
  return toTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id));
}
function updateTask(id, data) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!row) return null;
  const t = { ...toTask(row), ...data, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  db.prepare(`
    UPDATE tasks SET title=?,description=?,status=?,priority=?,difficulty=?,tags=?,
    estimated_minutes=?,due_date=?,project_id=?,updated_at=?,completed_at=?,subtasks=? WHERE id=?
  `).run(
    t.title,
    t.description ?? null,
    t.status,
    t.priority,
    t.difficulty,
    JSON.stringify(t.tags ?? []),
    t.estimatedMinutes ?? null,
    t.dueDate ?? null,
    t.projectId ?? null,
    t.updatedAt,
    t.completedAt ?? null,
    JSON.stringify(t.subtasks ?? []),
    id
  );
  return t;
}
function deleteTask(id) {
  return getDb().prepare("DELETE FROM tasks WHERE id = ?").run(id).changes > 0;
}
function completeTask(id) {
  return updateTask(id, { status: "completed", completedAt: (/* @__PURE__ */ new Date()).toISOString() });
}
function cancelTask(id) {
  return updateTask(id, { status: "cancelled" });
}
function addSubtask(taskId, title) {
  const task = getTasks().find((t) => t.id === taskId);
  if (!task) return null;
  const subtask = { id: crypto.randomUUID(), title, completed: false };
  return updateTask(taskId, { subtasks: [...task.subtasks ?? [], subtask] });
}
function toggleSubtask(taskId, subtaskId) {
  const task = getTasks().find((t) => t.id === taskId);
  if (!task) return null;
  return updateTask(taskId, {
    subtasks: (task.subtasks ?? []).map(
      (s) => s.id === subtaskId ? { ...s, completed: !s.completed } : s
    )
  });
}
function removeSubtask(taskId, subtaskId) {
  const task = getTasks().find((t) => t.id === taskId);
  if (!task) return null;
  return updateTask(taskId, { subtasks: (task.subtasks ?? []).filter((s) => s.id !== subtaskId) });
}
function getTagColors() {
  const rows = getDb().prepare("SELECT tag, color FROM tag_colors").all();
  return Object.fromEntries(rows.map((r) => [r.tag, r.color]));
}
function setTagColors(colors) {
  const db = getDb();
  const upsert = db.prepare("INSERT OR REPLACE INTO tag_colors (tag,color) VALUES (?,?)");
  const del = db.prepare("DELETE FROM tag_colors WHERE tag = ?");
  const existing = getTagColors();
  db.transaction(() => {
    for (const tag of Object.keys(existing)) {
      if (!(tag in colors)) del.run(tag);
    }
    for (const [tag, color] of Object.entries(colors)) {
      upsert.run(tag, color);
    }
  })();
  return colors;
}
function getAuditLogs() {
  return getDb().prepare("SELECT * FROM audit_logs ORDER BY timestamp DESC").all().map((r) => ({
    id: r.id,
    taskId: r.task_id,
    taskTitle: r.task_title,
    action: r.action,
    timestamp: r.timestamp,
    details: r.details
  }));
}
function addAuditLog(taskId, taskTitle, action, details) {
  const entry = { id: crypto.randomUUID(), taskId, taskTitle, action, timestamp: (/* @__PURE__ */ new Date()).toISOString(), details };
  getDb().prepare(
    "INSERT INTO audit_logs (id,task_id,task_title,action,timestamp,details) VALUES (?,?,?,?,?,?)"
  ).run(entry.id, entry.taskId, entry.taskTitle, entry.action, entry.timestamp, null);
  return entry;
}
function getNotes() {
  return getDb().prepare("SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC").all().map(toNote);
}
function createNote(data) {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  db.prepare(
    "INSERT INTO notes (id,title,content,tags,pinned,created_at,updated_at) VALUES (?,?,?,?,?,?,?)"
  ).run(id, data.title ?? null, data.content, JSON.stringify(data.tags ?? []), data.pinned ? 1 : 0, now, now);
  return toNote(db.prepare("SELECT * FROM notes WHERE id = ?").get(id));
}
function updateNote(id, data) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM notes WHERE id = ?").get(id);
  if (!row) return null;
  const n = { ...toNote(row), ...data, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  db.prepare(
    "UPDATE notes SET title=?,content=?,tags=?,pinned=?,updated_at=? WHERE id=?"
  ).run(n.title ?? null, n.content, JSON.stringify(n.tags), n.pinned ? 1 : 0, n.updatedAt, id);
  return n;
}
function deleteNote(id) {
  return getDb().prepare("DELETE FROM notes WHERE id = ?").run(id).changes > 0;
}
function getPetState() {
  return toPet(getDb().prepare("SELECT * FROM pet WHERE id = 1").get());
}
function updatePetState(data) {
  const p = { ...getPetState(), ...data };
  getDb().prepare(
    "UPDATE pet SET name=?,mood=?,xp=?,level=?,streak=?,last_active=?,weight=? WHERE id=1"
  ).run(p.name, p.mood, p.xp, p.level, p.streak, p.lastActive, p.weight);
  return p;
}
function updatePetWeight(score) {
  const current = getPetState();
  const delta = score >= 70 ? -0.04 : 0.06;
  const weight = Math.min(1.4, Math.max(0.75, (current.weight ?? 1) + delta));
  return updatePetState({ weight });
}
function getSettings() {
  return toSettings(getDb().prepare("SELECT * FROM settings WHERE id = 1").get());
}
function updateSettings(data) {
  const s = { ...getSettings(), ...data };
  getDb().prepare(
    "UPDATE settings SET user_name=?,gemini_api_key=?,working_directory=?,commit_analysis_limit=? WHERE id=1"
  ).run(s.userName, s.geminiApiKey ?? "", s.workingDirectory ?? "", s.commitAnalysisLimit);
  return s;
}
function getFocusSessions() {
  return getDb().prepare("SELECT * FROM focus_sessions ORDER BY started_at DESC").all().map((r) => ({
    id: r.id,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    durationSeconds: r.duration_seconds
  }));
}
function startFocusSession() {
  const session = { id: crypto.randomUUID(), startedAt: (/* @__PURE__ */ new Date()).toISOString() };
  getDb().prepare("INSERT INTO focus_sessions (id,started_at) VALUES (?,?)").run(session.id, session.startedAt);
  return session;
}
function endFocusSession(id) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM focus_sessions WHERE id = ?").get(id);
  if (!row) return null;
  const endedAt = (/* @__PURE__ */ new Date()).toISOString();
  const durationSeconds = Math.round(
    (new Date(endedAt).getTime() - new Date(row.started_at).getTime()) / 1e3
  );
  db.prepare("UPDATE focus_sessions SET ended_at=?,duration_seconds=? WHERE id=?").run(endedAt, durationSeconds, id);
  return { id, startedAt: row.started_at, endedAt, durationSeconds };
}
function getFocusSummaries(days = 7) {
  const result = /* @__PURE__ */ new Map();
  const today = /* @__PURE__ */ new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split("T")[0];
    result.set(key, { date: key, totalFocusSeconds: 0, totalAwaySeconds: 0, sessions: 0 });
  }
  const rows = getDb().prepare("SELECT * FROM focus_sessions WHERE duration_seconds IS NOT NULL").all();
  for (const r of rows) {
    const key = r.started_at.split("T")[0];
    const entry = result.get(key);
    if (entry) {
      entry.totalFocusSeconds += r.duration_seconds;
      entry.sessions++;
    }
  }
  return Array.from(result.values()).sort((a, b) => a.date.localeCompare(b.date));
}
function getAchievements() {
  return getDb().prepare("SELECT * FROM achievements").all().map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    icon: r.icon,
    unlockedAt: r.unlocked_at
  }));
}
function unlockAchievement(id, meta) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM achievements WHERE id = ?").get(id);
  if (row?.unlocked_at) {
    return { id, title: row.title, description: row.description, icon: row.icon, unlockedAt: row.unlocked_at };
  }
  const unlockedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.prepare("INSERT OR REPLACE INTO achievements (id,title,description,icon,unlocked_at) VALUES (?,?,?,?,?)").run(id, meta.title, meta.description, meta.icon, unlockedAt);
  return { id, ...meta, unlockedAt };
}
function isAchievementUnlocked(id) {
  const row = getDb().prepare("SELECT unlocked_at FROM achievements WHERE id = ?").get(id);
  return !!row?.unlocked_at;
}
function getProjects() {
  return withProjectDbError(
    "load",
    () => getDb().prepare("SELECT * FROM projects ORDER BY created_at ASC").all().map(toProject)
  );
}
function createProject(data) {
  return withProjectDbError("create", () => {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const project = validateProjectFields(data);
    db.prepare(
      "INSERT INTO projects (id,name,description,color,created_at,updated_at) VALUES (?,?,?,?,?,?)"
    ).run(id, project.name, project.description ?? null, project.color, now, now);
    return toProject(db.prepare("SELECT * FROM projects WHERE id = ?").get(id));
  });
}
function updateProject(id, data) {
  return withProjectDbError("update", () => {
    const db = getDb();
    const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
    if (!row) return null;
    const current = toProject(row);
    const projectFields = validateProjectFields({
      name: data.name ?? current.name,
      description: data.description ?? current.description,
      color: data.color ?? current.color
    });
    const updatedProject = {
      ...current,
      ...projectFields,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.prepare(
      "UPDATE projects SET name=?,description=?,color=?,updated_at=? WHERE id=?"
    ).run(
      updatedProject.name,
      updatedProject.description ?? null,
      updatedProject.color,
      updatedProject.updatedAt,
      id
    );
    return updatedProject;
  });
}
function deleteProject(id) {
  return withProjectDbError("delete", () => {
    const db = getDb();
    const removeProjectWithTasks = db.transaction((projectId) => {
      db.prepare("DELETE FROM tasks WHERE project_id = ?").run(projectId);
      return db.prepare("DELETE FROM projects WHERE id = ?").run(projectId).changes > 0;
    });
    return removeProjectWithTasks(id);
  });
}
const XP_REWARDS = {
  task_easy: 10,
  task_medium: 20,
  task_hard: 35,
  task_epic: 50,
  task_created: 5,
  note_created: 5,
  pomodoro_completed: 15,
  daily_streak: 25
};
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1e3, 2e3, 4e3, 8e3];
function calcLevel(xp) {
  return LEVEL_THRESHOLDS.filter((t) => xp >= t).length;
}
function addXP(action, difficulty) {
  const key = difficulty ? `task_${difficulty}` : action;
  const xpGained = XP_REWARDS[key] ?? 5;
  const pet = getPetState();
  const newXP = pet.xp + xpGained;
  const newLevel = calcLevel(newXP);
  const leveledUp = newLevel > pet.level;
  return updatePetState({
    xp: newXP,
    level: newLevel,
    mood: leveledUp ? "celebrating" : pet.mood,
    lastActive: (/* @__PURE__ */ new Date()).toISOString()
  });
}
function updateStreak() {
  const pet = getPetState();
  const last = new Date(pet.lastActive);
  const now = /* @__PURE__ */ new Date();
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1e3 * 60 * 60 * 24));
  let newStreak = pet.streak;
  if (diffDays === 1) {
    newStreak = pet.streak + 1;
  } else if (diffDays > 1) {
    newStreak = 1;
  }
  return updatePetState({ streak: newStreak, lastActive: now.toISOString() });
}
function setMood(mood) {
  return updatePetState({ mood });
}
function xpToNextLevel(xp) {
  const level = calcLevel(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? Infinity;
  if (nextThreshold === Infinity) {
    return { current: 0, needed: 0, percent: 100 };
  }
  const current = xp - currentThreshold;
  const needed = nextThreshold - currentThreshold;
  return { current, needed, percent: Math.round(current / needed * 100) };
}
const ACHIEVEMENT_DEFS = {
  first_task: {
    title: "Primeira Missão",
    description: "Complete sua primeira tarefa.",
    icon: "🎯"
  },
  tasks_10: {
    title: "Em Ritmo",
    description: "Complete 10 tarefas no total.",
    icon: "🔥"
  },
  tasks_50: {
    title: "Máquina de Produtividade",
    description: "Complete 50 tarefas no total.",
    icon: "⚡"
  },
  streak_7: {
    title: "Semana Perfeita",
    description: "Mantenha uma sequência de 7 dias.",
    icon: "📅"
  },
  epic_slayer: {
    title: "Mata-Épico",
    description: "Complete uma tarefa épica.",
    icon: "👑"
  },
  note_taker: {
    title: "Anotador",
    description: "Crie 10 notas.",
    icon: "📝"
  },
  commit_analyzer: {
    title: "Inspetor de Código",
    description: "Analise seus commits pela primeira vez.",
    icon: "🔍"
  },
  level_5: {
    title: "Dedicado",
    description: "Alcance o nível 5.",
    icon: "⭐"
  },
  subtask_master: {
    title: "Mestre das Subtarefas",
    description: "Quebre uma tarefa épica em subtarefas com IA.",
    icon: "🧩"
  },
  daily_reviewer: {
    title: "Reflexivo",
    description: "Gere seu primeiro daily review.",
    icon: "📊"
  },
  focus_hour: {
    title: "Focado",
    description: "Acumule 1 hora de foco no app em um dia.",
    icon: "🎯"
  }
};
function tryUnlock(id) {
  if (isAchievementUnlocked(id)) return null;
  return unlockAchievement(id, ACHIEVEMENT_DEFS[id]);
}
function checkAfterTaskComplete(difficulty) {
  const unlocked = [];
  const completed = getTasks().filter((t) => t.status === "completed");
  const count = completed.length;
  const r0 = tryUnlock("first_task");
  if (r0) unlocked.push(r0);
  if (count >= 10) {
    const r = tryUnlock("tasks_10");
    if (r) unlocked.push(r);
  }
  if (count >= 50) {
    const r = tryUnlock("tasks_50");
    if (r) unlocked.push(r);
  }
  if (difficulty === "epic") {
    const r = tryUnlock("epic_slayer");
    if (r) unlocked.push(r);
  }
  return unlocked;
}
function checkAfterNoteCreate() {
  const unlocked = [];
  const notes = getNotes();
  if (notes.length >= 10) {
    const r = tryUnlock("note_taker");
    if (r) unlocked.push(r);
  }
  return unlocked;
}
function checkAfterSubtaskBreak() {
  const r = tryUnlock("subtask_master");
  return r ? [r] : [];
}
function checkAfterCommitAnalysis() {
  const r = tryUnlock("commit_analyzer");
  return r ? [r] : [];
}
function checkAfterDailyReview() {
  const r = tryUnlock("daily_reviewer");
  return r ? [r] : [];
}
function checkAfterFocusHour() {
  const r = tryUnlock("focus_hour");
  return r ? [r] : [];
}
function checkRetroactive() {
  const unlocked = [];
  const tasks = getTasks();
  const completed = tasks.filter((t) => t.status === "completed");
  const count = completed.length;
  if (count >= 1) {
    const r = tryUnlock("first_task");
    if (r) unlocked.push(r);
  }
  if (count >= 10) {
    const r = tryUnlock("tasks_10");
    if (r) unlocked.push(r);
  }
  if (count >= 50) {
    const r = tryUnlock("tasks_50");
    if (r) unlocked.push(r);
  }
  if (completed.some((t) => t.difficulty === "epic")) {
    const r = tryUnlock("epic_slayer");
    if (r) unlocked.push(r);
  }
  const notes = getNotes();
  if (notes.length >= 10) {
    const r = tryUnlock("note_taker");
    if (r) unlocked.push(r);
  }
  const pet = getPetState();
  if (pet.level >= 5) {
    const r = tryUnlock("level_5");
    if (r) unlocked.push(r);
  }
  if (pet.streak >= 7) {
    const r = tryUnlock("streak_7");
    if (r) unlocked.push(r);
  }
  return unlocked;
}
function getAllAchievements() {
  const stored = getAchievements();
  const storedMap = new Map(stored.map((a) => [a.id, a]));
  return Object.keys(ACHIEVEMENT_DEFS).map((id) => {
    const def = ACHIEVEMENT_DEFS[id];
    const stored2 = storedMap.get(id);
    return {
      ...def,
      id,
      unlockedAt: stored2?.unlockedAt
    };
  });
}
function broadcast$1(event, data) {
  electron.BrowserWindow.getAllWindows().forEach((w) => w.webContents.send(event, data));
}
function registerTasksIpc() {
  electron.ipcMain.handle("tasks:getAll", () => {
    return getTasks();
  });
  electron.ipcMain.handle("tasks:create", (_, data) => {
    const task = createTask(data);
    addXP("task_created");
    addAuditLog(task.id, task.title, "created");
    return task;
  });
  electron.ipcMain.handle("tasks:update", (_, id, data) => {
    const tasks = getTasks();
    const task = tasks.find((t) => t.id === id);
    const updated = updateTask(id, data);
    if (updated && task) {
      addAuditLog(id, task.title, "updated");
    }
    return updated;
  });
  electron.ipcMain.handle("tasks:delete", (_, id) => {
    const tasks = getTasks();
    const task = tasks.find((t) => t.id === id);
    const result = deleteTask(id);
    if (result && task) {
      addAuditLog(id, task.title, "deleted");
    }
    return result;
  });
  electron.ipcMain.handle("tasks:complete", (_, id) => {
    const tasks = getTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;
    const completed = completeTask(id);
    addXP("task_completed", task.difficulty);
    if (completed) {
      addAuditLog(id, task.title, "completed");
      const unlocked = checkAfterTaskComplete(task.difficulty);
      unlocked.forEach((a) => broadcast$1("achievement:unlocked", a));
    }
    return completed;
  });
  electron.ipcMain.handle("tasks:cancel", (_, id) => {
    const tasks = getTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;
    const cancelled = cancelTask(id);
    if (cancelled) {
      addAuditLog(id, task.title, "cancelled");
    }
    return cancelled;
  });
  electron.ipcMain.handle("audit:getAll", () => {
    return getAuditLogs();
  });
  electron.ipcMain.handle("tasks:addSubtask", (_, taskId, title) => {
    return addSubtask(taskId, title);
  });
  electron.ipcMain.handle("tasks:toggleSubtask", (_, taskId, subtaskId) => {
    return toggleSubtask(taskId, subtaskId);
  });
  electron.ipcMain.handle("tasks:removeSubtask", (_, taskId, subtaskId) => {
    return removeSubtask(taskId, subtaskId);
  });
}
function registerNotesIpc() {
  electron.ipcMain.handle("notes:getAll", () => {
    return getNotes();
  });
  electron.ipcMain.handle("notes:create", (_, data) => {
    const note = createNote(data);
    addXP("note_created");
    const unlocked = checkAfterNoteCreate();
    unlocked.forEach((a) => electron.BrowserWindow.getAllWindows().forEach((w) => w.webContents.send("achievement:unlocked", a)));
    return note;
  });
  electron.ipcMain.handle("notes:update", (_, id, data) => {
    return updateNote(id, data);
  });
  electron.ipcMain.handle("notes:delete", (_, id) => {
    return deleteNote(id);
  });
}
function registerPetIpc() {
  electron.ipcMain.handle("pet:getState", () => {
    const pet = getPetState();
    const progress = xpToNextLevel(pet.xp);
    return { ...pet, xpProgress: progress };
  });
  electron.ipcMain.handle("pet:addXP", (_, action) => {
    return addXP(action);
  });
  electron.ipcMain.handle("pet:updateStreak", () => {
    return updateStreak();
  });
  electron.ipcMain.handle("pet:setMood", (_, mood) => {
    return setMood(mood);
  });
  electron.ipcMain.handle("pet:updateWeight", (_, score) => {
    return updatePetWeight(score);
  });
  electron.ipcMain.handle("settings:get", () => {
    return getSettings();
  });
  electron.ipcMain.handle("settings:update", (_, data) => {
    return updateSettings(data);
  });
}
const MODEL = "gemini-2.5-flash";
function makeAI(apiKey) {
  return new genai.GoogleGenAI({ apiKey });
}
async function generate(apiKey, system, prompt) {
  const ai = makeAI(apiKey);
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { systemInstruction: system }
  });
  return (response.text ?? "").trim().replace(/^```json\n?|\n?```$/g, "");
}
async function suggestTask(apiKey, title, description) {
  const text = await generate(
    apiKey,
    `Você é um assistente de produtividade que analisa tarefas e sugere melhorias.
Analise o título e a descrição fornecidos e retorne um JSON com:
- difficulty: "easy" | "medium" | "hard" | "epic"
- estimatedMinutes: número inteiro positivo
- reasoning: breve explicação da dificuldade em português (max 1 frase)
- improvedTitle: título melhorado — mais claro, acionável e específico (em português)
- improvedDescription: prompt de desenvolvimento pronto para colar em ferramentas de IA (Cursor, Claude, ChatGPT) — deve ser imperativo ("Implemente...", "Corrija...", "Crie..."), incluir contexto técnico inferido do título, e terminar com critérios de aceite objetivos; máximo 3 frases em português; não use markdown
- suggestedTags: array de 2 a 4 tags em minúsculas (exemplos: "bug", "frontend", "backend", "docs", "reunião", "refactor", "fix", "feature", "ux", "teste")

Responda apenas com JSON válido, sem markdown.`,
    `Título: "${title}"${description ? `
Descrição: ${description}` : ""}`
  );
  const parsed = JSON.parse(text);
  return {
    difficulty: parsed.difficulty ?? "medium",
    estimatedMinutes: parsed.estimatedMinutes ?? 30,
    reasoning: parsed.reasoning ?? "",
    improvedTitle: parsed.improvedTitle,
    improvedDescription: parsed.improvedDescription,
    suggestedTags: parsed.suggestedTags ?? []
  };
}
async function breakIntoSubtasks(apiKey, taskTitle, taskDescription) {
  const text = await generate(
    apiKey,
    `Você é um assistente de produtividade. Quebre a tarefa fornecida em 3 a 6 subtarefas concretas e acionáveis.
Responda apenas com JSON: array de strings com os títulos das subtarefas em português, sem markdown.`,
    `Tarefa: "${taskTitle}"${taskDescription ? `
Descrição: ${taskDescription}` : ""}`
  );
  return JSON.parse(text);
}
async function analyzeCommits(apiKey, repoPath, limit = 10) {
  const git = simpleGit(repoPath);
  const log = await git.log({ maxCount: limit });
  const MAX_DIFF_CHARS = 3500;
  const commitsWithDiff = await Promise.all(
    log.all.map(async (c) => {
      let additions = 0;
      let deletions = 0;
      let rawDiff = "";
      try {
        const summary = await git.diffSummary([`${c.hash}^`, c.hash]);
        additions = summary.insertions;
        deletions = summary.deletions;
        const full = await git.diff([`${c.hash}^`, c.hash]);
        rawDiff = full.length > MAX_DIFF_CHARS ? full.slice(0, MAX_DIFF_CHARS) + "\n... (diff truncado)" : full;
      } catch {
      }
      return {
        hash: c.hash.slice(0, 7),
        message: c.message,
        author: c.author_name,
        date: c.date,
        additions,
        deletions,
        rawDiff
      };
    })
  );
  const commitsText = commitsWithDiff.map(
    (c) => `## Commit ${c.hash}: "${c.message}" (+${c.additions}/-${c.deletions})
${c.rawDiff || "(sem diff disponível)"}`
  ).join("\n\n---\n\n");
  const text = await generate(
    apiKey,
    `Você é um engenheiro de software sênior fazendo code review de commits.
Analise as mudanças reais de código (diffs), avaliando:
- Qualidade e clareza do código
- Boas práticas e padrões (SOLID, DRY, etc.)
- Possíveis bugs ou problemas de lógica
- Segurança (injeção, exposição de dados, etc.)
- Legibilidade e manutenibilidade
- Qualidade da mensagem do commit

Responda apenas com JSON válido sem markdown:
{
  "feedback": "análise geral do código em 2-3 parágrafos",
  "score": número 0-100,
  "tips": ["sugestão prática 1", "sugestão prática 2"],
  "commitReviews": {
    "HASH_7_CHARS": {
      "issues": ["problema encontrado no código"],
      "suggestions": ["melhoria sugerida"],
      "rating": "good" | "ok" | "needs_work"
    }
  },
  "petMood": "idle" | "happy" | "excited" | "tired" | "sad",
  "petMessage": "mensagem curta e animada do pet (1 frase)"
}`,
    `Faça code review destes ${commitsWithDiff.length} commits:

${commitsText}`
  );
  const parsed = JSON.parse(text);
  const commits = commitsWithDiff.map((c) => {
    const raw = parsed.commitReviews?.[c.hash];
    const review = raw ? {
      issues: raw.issues ?? [],
      suggestions: raw.suggestions ?? [],
      rating: raw.rating ?? "ok"
    } : void 0;
    return { hash: c.hash, message: c.message, author: c.author, date: c.date, additions: c.additions, deletions: c.deletions, review };
  });
  return { feedback: parsed.feedback, score: parsed.score, tips: parsed.tips, petMood: parsed.petMood, petMessage: parsed.petMessage, commits };
}
async function dailyReview(apiKey, tasks) {
  const today = (/* @__PURE__ */ new Date()).toDateString();
  const todayTasks = tasks.filter((t) => new Date(t.createdAt).toDateString() === today);
  const completed = todayTasks.filter((t) => t.status === "completed");
  const overdue = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < /* @__PURE__ */ new Date() && t.status !== "completed" && t.status !== "cancelled"
  );
  const tasksSummary = [
    `Tarefas criadas hoje: ${todayTasks.length}`,
    `Tarefas concluídas hoje: ${completed.length}`,
    `Tarefas atrasadas: ${overdue.length}`,
    completed.length > 0 ? `Concluídas: ${completed.map((t) => `"${t.title}" (${t.difficulty})`).join(", ")}` : "",
    overdue.length > 0 ? `Atrasadas: ${overdue.map((t) => `"${t.title}"`).join(", ")}` : ""
  ].filter(Boolean).join("\n");
  const text = await generate(
    apiKey,
    `Você é um coach de produtividade analisando o dia de trabalho de um usuário.
Gere uma análise motivadora em português com base nas tarefas do dia.
Responda apenas com JSON válido sem markdown:
{
  "score": número 0-100 (pontuação de produtividade),
  "summary": "análise do dia em 2-3 frases",
  "tips": ["sugestão 1 para amanhã", "sugestão 2"],
  "petMessage": "mensagem curta e encorajadora do pet (1 frase)",
  "petMood": "idle" | "happy" | "excited" | "tired" | "sad" | "celebrating"
}`,
    `Resumo do dia (${(/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR")}):
${tasksSummary}`
  );
  const parsed = JSON.parse(text);
  return {
    ...parsed,
    tasksCompleted: completed.length,
    tasksCreated: todayTasks.length,
    tasksOverdue: overdue.length
  };
}
async function buddySpeak(apiKey, ctx) {
  const period = ctx.hour < 12 ? "manhã" : ctx.hour < 18 ? "tarde" : "noite";
  const activityParts = [];
  if (ctx.completedToday > 0) activityParts.push(`${ctx.completedToday} tarefa(s) concluída(s) hoje`);
  if (ctx.inProgressCount > 0) activityParts.push(`${ctx.inProgressCount} em andamento`);
  if (ctx.overdueCount > 0) activityParts.push(`${ctx.overdueCount} atrasada(s)`);
  if (ctx.pendingCount > 0) activityParts.push(`${ctx.pendingCount} pendente(s)`);
  const activity = activityParts.length > 0 ? activityParts.join(", ") : "sem tarefas registradas";
  return generate(
    apiKey,
    `Você é ${ctx.name}, um pet virtual fofo de um desenvolvedor. Personalidade: carinhosa, espontânea, às vezes engraçada, nunca robótica.

Contexto real do usuário agora:
- Humor atual: ${ctx.mood}
- Nível: ${ctx.level}, streak: ${ctx.streak} dias, período: ${period}
- Atividade de hoje: ${activity}

Regras:
1. Comente DIRETAMENTE sobre o que o usuário fez ou precisa fazer — nunca fale de forma genérica.
2. Se concluiu muitas tarefas: celebre com entusiasmo específico.
3. Se tem tarefas atrasadas: mencione de forma gentil, motivadora.
4. Se está em andamento: incentive a finalizar.
5. Se não fez nada ainda: motive sem cobrar.
6. Máximo 12 palavras em português brasileiro.
7. Seja natural, varie o tom — evite sempre começar igual.
8. Responda APENAS com a frase, sem aspas.`,
    `Gere fala: mood=${ctx.mood}, hora=${ctx.hour}h, atividade="${activity}"`
  );
}
async function noteToTasks(apiKey, content) {
  const text = await generate(
    apiKey,
    `Você é um assistente que extrai tarefas acionáveis de notas em texto livre.
Identifique ações concretas, afazeres e compromissos no texto.
Responda apenas com JSON: array de strings com os títulos das tarefas em português, sem markdown.
Se não houver tarefas claras, retorne array vazio [].`,
    `Extraia tarefas desta nota:

${content}`
  );
  return JSON.parse(text);
}
async function summarizeNote(apiKey, content) {
  return generate(
    apiKey,
    `Você é um assistente de notas. Crie um resumo conciso em português da nota fornecida.
O resumo deve ter no máximo 3 frases e capturar os pontos principais.`,
    `Resuma esta nota:

${content}`
  );
}
function broadcast(event, data) {
  electron.BrowserWindow.getAllWindows().forEach((w) => w.webContents.send(event, data));
}
function getApiKey() {
  const settings = getSettings();
  const key = settings.geminiApiKey;
  if (!key) throw new Error("API key do Gemini não configurada. Acesse Configurações para adicionar.");
  return key;
}
function registerAiIpc() {
  electron.ipcMain.handle("ai:suggestTask", async (_, title, description) => {
    const apiKey = getApiKey();
    return suggestTask(apiKey, title, description);
  });
  electron.ipcMain.handle("ai:breakIntoSubtasks", async (_, taskTitle, taskDescription) => {
    const apiKey = getApiKey();
    const subtasks = await breakIntoSubtasks(apiKey, taskTitle, taskDescription);
    const unlocked = checkAfterSubtaskBreak();
    unlocked.forEach((a) => broadcast("achievement:unlocked", a));
    return subtasks;
  });
  electron.ipcMain.handle("ai:analyzeCommits", async (_, repoPath, limit) => {
    const apiKey = getApiKey();
    const result = await analyzeCommits(apiKey, repoPath, limit);
    const unlocked = checkAfterCommitAnalysis();
    unlocked.forEach((a) => broadcast("achievement:unlocked", a));
    return result;
  });
  electron.ipcMain.handle("ai:dailyReview", async () => {
    const apiKey = getApiKey();
    const tasks = getTasks();
    const result = await dailyReview(apiKey, tasks);
    const unlocked = checkAfterDailyReview();
    unlocked.forEach((a) => broadcast("achievement:unlocked", a));
    return result;
  });
  electron.ipcMain.handle("ai:noteToTasks", async (_, content) => {
    const apiKey = getApiKey();
    return noteToTasks(apiKey, content);
  });
  electron.ipcMain.handle("ai:summarizeNote", async (_, content) => {
    const apiKey = getApiKey();
    return summarizeNote(apiKey, content);
  });
  electron.ipcMain.handle("ai:buddySpeak", async (_, ctx) => {
    const settings = getSettings();
    if (!settings.geminiApiKey) return null;
    return buddySpeak(settings.geminiApiKey, ctx);
  });
}
let activeSessionId = null;
let focusStartTime = null;
let awayStartTime = null;
function onWindowFocus(mainWindow2) {
  awayStartTime = null;
  if (!activeSessionId) {
    const session = startFocusSession();
    activeSessionId = session.id;
    focusStartTime = /* @__PURE__ */ new Date();
  }
  mainWindow2.webContents.send("focus:regained");
}
function onWindowBlur(mainWindow2) {
  awayStartTime = /* @__PURE__ */ new Date();
  if (activeSessionId) {
    endFocusSession(activeSessionId);
    activeSessionId = null;
    focusStartTime = null;
  }
  mainWindow2.webContents.send("focus:lost");
}
function getAwaySeconds() {
  if (!awayStartTime) return 0;
  return Math.round((Date.now() - awayStartTime.getTime()) / 1e3);
}
function getCurrentSessionDurationSeconds() {
  if (!focusStartTime) return 0;
  return Math.round((Date.now() - focusStartTime.getTime()) / 1e3);
}
function getActiveSessionId() {
  return activeSessionId;
}
function checkDistractionAlert(mainWindow2) {
  const awaySecs = getAwaySeconds();
  const ALERT_THRESHOLD = 30 * 60;
  if (awaySecs >= ALERT_THRESHOLD) {
    mainWindow2.webContents.send("focus:distraction-alert", { awaySeconds: awaySecs });
    awayStartTime = /* @__PURE__ */ new Date();
  }
}
function registerFocusIpc() {
  electron.ipcMain.handle("focus:getSummaries", (_, days) => {
    return getFocusSummaries(days);
  });
  electron.ipcMain.handle("focus:getCurrentSession", () => {
    const id = getActiveSessionId();
    if (!id) return null;
    const sessions = getFocusSessions();
    const session = sessions.find((s) => s.id === id);
    if (!session) return null;
    return {
      ...session,
      durationSeconds: getCurrentSessionDurationSeconds()
    };
  });
}
function registerAchievementsIpc() {
  electron.ipcMain.handle("achievements:getAll", () => {
    checkRetroactive();
    return getAllAchievements();
  });
  electron.ipcMain.handle("achievements:unlock", (_, id) => {
    const def = ACHIEVEMENT_DEFS[id];
    if (!def) throw new Error(`Unknown achievement: ${id}`);
    return unlockAchievement(id, def);
  });
}
function registerSettingsIpc() {
  electron.ipcMain.handle("tagColors:get", () => getTagColors());
  electron.ipcMain.handle("tagColors:set", (_, colors) => setTagColors(colors));
}
function registerProjectsIpc() {
  electron.ipcMain.handle("projects:getAll", () => getProjects());
  electron.ipcMain.handle("projects:create", (_e, data) => createProject(data));
  electron.ipcMain.handle("projects:update", (_e, id, data) => updateProject(id, data));
  electron.ipcMain.handle("projects:delete", (_e, id) => deleteProject(id));
}
function registerAllIpc() {
  registerTasksIpc();
  registerNotesIpc();
  registerPetIpc();
  registerAiIpc();
  registerFocusIpc();
  registerAchievementsIpc();
  registerSettingsIpc();
  registerProjectsIpc();
}
electron.app.setName("ClearUp");
let mainWindow = null;
let floatWindow = null;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 880,
    minHeight: 580,
    backgroundColor: "#0F0F1A",
    title: "Buddy",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    trafficLightPosition: process.platform === "darwin" ? { x: 12, y: 7 } : void 0,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    show: false,
    icon: path.join(__dirname, process.platform === "darwin" ? "../../resources/icon.icns" : "../../resources/icon.png")
  });
  mainWindow.on("ready-to-show", () => mainWindow?.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    electron.shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.on("focus", () => {
    if (mainWindow) onWindowFocus(mainWindow);
  });
  mainWindow.on("blur", () => {
    if (mainWindow) onWindowBlur(mainWindow);
  });
  if (process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
function createFloatWindow() {
  floatWindow = new electron.BrowserWindow({
    width: 160,
    height: 200,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  floatWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  if (process.env["ELECTRON_RENDERER_URL"]) {
    floatWindow.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}?window=float`);
  } else {
    floatWindow.loadFile(path.join(__dirname, "../renderer/index.html"), {
      query: { window: "float" }
    });
  }
  floatWindow.on("closed", () => {
    floatWindow = null;
  });
}
function registerFloatIpc() {
  electron.ipcMain.handle("float:show", () => {
    if (!floatWindow) createFloatWindow();
    floatWindow?.show();
  });
  electron.ipcMain.handle("float:hide", () => {
    floatWindow?.hide();
  });
  electron.ipcMain.handle("float:toggle", () => {
    if (!floatWindow || floatWindow.isDestroyed()) {
      createFloatWindow();
    } else if (floatWindow.isVisible()) {
      floatWindow.hide();
    } else {
      floatWindow.show();
    }
  });
  electron.ipcMain.handle("float:focusMain", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  electron.ipcMain.handle("float:exportPdf", async () => {
    if (!mainWindow) return "";
    const data = await mainWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: "A4"
    });
    const { dialog } = await import("electron");
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `clearup-report-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }]
    });
    if (!result.canceled && result.filePath) {
      const { writeFile } = await import("fs/promises");
      await writeFile(result.filePath, data);
      return result.filePath;
    }
    return "";
  });
}
function sendPetStateToFloat(petState) {
  if (floatWindow && !floatWindow.isDestroyed()) {
    floatWindow.webContents.send("pet:state-update", petState);
  }
}
function startFocusCheckInterval() {
  setInterval(() => {
    if (mainWindow) checkDistractionAlert(mainWindow);
    const summaries = getFocusSummaries(1);
    const today = summaries[0];
    if (today && today.totalFocusSeconds >= 3600) {
      const unlocked = checkAfterFocusHour();
      unlocked.forEach(
        (a) => electron.BrowserWindow.getAllWindows().forEach((w) => w.webContents.send("achievement:unlocked", a))
      );
    }
  }, 5 * 60 * 1e3);
}
function registerDialogIpc() {
  electron.ipcMain.handle("dialog:openDirectory", async () => {
    const { dialog } = await import("electron");
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    });
    return result.canceled ? null : result.filePaths[0];
  });
}
electron.app.whenReady().then(() => {
  registerAllIpc();
  registerFloatIpc();
  registerDialogIpc();
  createWindow();
  startFocusCheckInterval();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
exports.sendPetStateToFloat = sendPetStateToFloat;
