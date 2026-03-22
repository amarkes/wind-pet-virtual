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
const Store = require("electron-store");
const crypto = require("crypto");
const genai = require("@google/genai");
const simpleGit = require("simple-git");
const store = new Store({
  defaults: {
    tasks: [],
    notes: [],
    auditLogs: [],
    focusSessions: [],
    achievements: [],
    pet: {
      name: "Buddy",
      mood: "idle",
      xp: 0,
      level: 1,
      streak: 0,
      lastActive: (/* @__PURE__ */ new Date()).toISOString()
    },
    settings: {
      userName: "",
      pomodoroMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      geminiApiKey: "",
      workingDirectory: "",
      commitAnalysisLimit: 1
    }
  }
});
function getTasks() {
  return store.get("tasks");
}
function createTask(data) {
  const task = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const tasks = store.get("tasks");
  store.set("tasks", [...tasks, task]);
  return task;
}
function updateTask(id, data) {
  const tasks = store.get("tasks");
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;
  const updated = { ...tasks[index], ...data, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  tasks[index] = updated;
  store.set("tasks", tasks);
  return updated;
}
function deleteTask(id) {
  const tasks = store.get("tasks");
  const filtered = tasks.filter((t) => t.id !== id);
  if (filtered.length === tasks.length) return false;
  store.set("tasks", filtered);
  return true;
}
function completeTask(id) {
  return updateTask(id, {
    status: "completed",
    completedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
function cancelTask(id) {
  return updateTask(id, { status: "cancelled" });
}
function addSubtask(taskId, title) {
  const tasks = getTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;
  const subtask = { id: crypto.randomUUID(), title, completed: false };
  const subtasks = [...task.subtasks ?? [], subtask];
  return updateTask(taskId, { subtasks });
}
function toggleSubtask(taskId, subtaskId) {
  const tasks = getTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;
  const subtasks = (task.subtasks ?? []).map(
    (s) => s.id === subtaskId ? { ...s, completed: !s.completed } : s
  );
  return updateTask(taskId, { subtasks });
}
function removeSubtask(taskId, subtaskId) {
  const tasks = getTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;
  const subtasks = (task.subtasks ?? []).filter((s) => s.id !== subtaskId);
  return updateTask(taskId, { subtasks });
}
function getAuditLogs() {
  return store.get("auditLogs");
}
function addAuditLog(taskId, taskTitle, action, details) {
  const entry = {
    id: crypto.randomUUID(),
    taskId,
    taskTitle,
    action,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    details
  };
  const logs = store.get("auditLogs");
  store.set("auditLogs", [entry, ...logs]);
  return entry;
}
function getNotes() {
  return store.get("notes");
}
function createNote(data) {
  const note = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const notes = store.get("notes");
  store.set("notes", [note, ...notes]);
  return note;
}
function updateNote(id, data) {
  const notes = store.get("notes");
  const index = notes.findIndex((n) => n.id === id);
  if (index === -1) return null;
  const updated = { ...notes[index], ...data, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  notes[index] = updated;
  store.set("notes", notes);
  return updated;
}
function deleteNote(id) {
  const notes = store.get("notes");
  const filtered = notes.filter((n) => n.id !== id);
  if (filtered.length === notes.length) return false;
  store.set("notes", filtered);
  return true;
}
function getPetState() {
  return store.get("pet");
}
function updatePetState(data) {
  const pet = store.get("pet");
  const updated = { ...pet, ...data };
  store.set("pet", updated);
  return updated;
}
function getSettings() {
  return store.get("settings");
}
function updateSettings(data) {
  const settings = store.get("settings");
  const updated = { ...settings, ...data };
  store.set("settings", updated);
  return updated;
}
function getFocusSessions() {
  return store.get("focusSessions");
}
function startFocusSession() {
  const session = { id: crypto.randomUUID(), startedAt: (/* @__PURE__ */ new Date()).toISOString() };
  const sessions = store.get("focusSessions");
  store.set("focusSessions", [session, ...sessions]);
  return session;
}
function endFocusSession(id) {
  const sessions = store.get("focusSessions");
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const endedAt = (/* @__PURE__ */ new Date()).toISOString();
  const durationSeconds = Math.round(
    (new Date(endedAt).getTime() - new Date(sessions[idx].startedAt).getTime()) / 1e3
  );
  sessions[idx] = { ...sessions[idx], endedAt, durationSeconds };
  store.set("focusSessions", sessions);
  return sessions[idx];
}
function getFocusSummaries(days = 7) {
  const sessions = store.get("focusSessions").filter((s) => s.durationSeconds !== void 0);
  const result = /* @__PURE__ */ new Map();
  const today = /* @__PURE__ */ new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split("T")[0];
    result.set(key, { date: key, totalFocusSeconds: 0, totalAwaySeconds: 0, sessions: 0 });
  }
  for (const s of sessions) {
    const key = s.startedAt.split("T")[0];
    const entry = result.get(key);
    if (entry && s.durationSeconds !== void 0) {
      entry.totalFocusSeconds += s.durationSeconds;
      entry.sessions += 1;
    }
  }
  return Array.from(result.values()).sort((a, b) => a.date.localeCompare(b.date));
}
function getAchievements() {
  return store.get("achievements");
}
function unlockAchievement(id, meta) {
  const achievements = store.get("achievements");
  const existing = achievements.find((a) => a.id === id);
  if (existing?.unlockedAt) return existing;
  const achievement = { ...meta, id, unlockedAt: (/* @__PURE__ */ new Date()).toISOString() };
  if (existing) {
    const idx = achievements.findIndex((a) => a.id === id);
    achievements[idx] = achievement;
    store.set("achievements", achievements);
  } else {
    store.set("achievements", [...achievements, achievement]);
  }
  return achievement;
}
function isAchievementUnlocked(id) {
  return store.get("achievements").some((a) => a.id === id && !!a.unlockedAt);
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
- improvedDescription: descrição melhorada e detalhada (max 2 frases em português); se não houver descrição original, crie uma relevante
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
  const commits = await Promise.all(
    log.all.map(async (c) => {
      let additions = 0;
      let deletions = 0;
      try {
        const diff = await git.diffSummary([`${c.hash}^`, c.hash]);
        additions = diff.insertions;
        deletions = diff.deletions;
      } catch {
      }
      return {
        hash: c.hash.slice(0, 7),
        message: c.message,
        author: c.author_name,
        date: c.date,
        additions,
        deletions
      };
    })
  );
  const commitsText = commits.map((c) => `- ${c.hash} "${c.message}" (+${c.additions}/-${c.deletions} linhas)`).join("\n");
  const text = await generate(
    apiKey,
    `Você é um mentor de engenharia de software analisando commits de um desenvolvedor.
Avalie a qualidade dos commits e dê feedback construtivo em português.
Responda apenas com JSON válido sem markdown:
{
  "feedback": "texto de análise geral (2-3 parágrafos)",
  "score": número 0-100,
  "tips": ["dica 1", "dica 2", ...],
  "petMood": "idle" | "happy" | "excited" | "tired" | "sad",
  "petMessage": "mensagem curta e animada do pet (1 frase)"
}`,
    `Analise estes ${commits.length} commits recentes:
${commitsText}`
  );
  const parsed = JSON.parse(text);
  return { ...parsed, commits };
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
    tasksOverdue: overdue.length,
    pomodoroSessions: 0
  };
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
    return getAllAchievements();
  });
  electron.ipcMain.handle("achievements:unlock", (_, id) => {
    const def = ACHIEVEMENT_DEFS[id];
    if (!def) throw new Error(`Unknown achievement: ${id}`);
    return unlockAchievement(id, def);
  });
}
function registerAllIpc() {
  registerTasksIpc();
  registerNotesIpc();
  registerPetIpc();
  registerAiIpc();
  registerFocusIpc();
  registerAchievementsIpc();
}
let mainWindow = null;
let floatWindow = null;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 880,
    minHeight: 580,
    backgroundColor: "#0F0F1A",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    show: false,
    icon: path.join(__dirname, "../../resources/icon.png")
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
