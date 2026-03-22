"use strict";
const electron = require("electron");
const path = require("path");
const Store = require("electron-store");
const crypto = require("crypto");
const store = new Store({
  defaults: {
    tasks: [],
    notes: [],
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
      longBreakMinutes: 15
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
function registerTasksIpc() {
  electron.ipcMain.handle("tasks:getAll", () => {
    return getTasks();
  });
  electron.ipcMain.handle("tasks:create", (_, data) => {
    const task = createTask(data);
    addXP("task_created");
    return task;
  });
  electron.ipcMain.handle("tasks:update", (_, id, data) => {
    return updateTask(id, data);
  });
  electron.ipcMain.handle("tasks:delete", (_, id) => {
    return deleteTask(id);
  });
  electron.ipcMain.handle("tasks:complete", (_, id) => {
    const tasks = getTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;
    const completed = completeTask(id);
    addXP("task_completed", task.difficulty);
    return completed;
  });
}
function registerNotesIpc() {
  electron.ipcMain.handle("notes:getAll", () => {
    return getNotes();
  });
  electron.ipcMain.handle("notes:create", (_, data) => {
    const note = createNote(data);
    addXP("note_created");
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
function registerAllIpc() {
  registerTasksIpc();
  registerNotesIpc();
  registerPetIpc();
}
let mainWindow = null;
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
  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    electron.shell.openExternal(url);
    return { action: "deny" };
  });
  if (process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  registerAllIpc();
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
