"use strict";
const electron = require("electron");
const api = {
  tasks: {
    getAll: () => electron.ipcRenderer.invoke("tasks:getAll"),
    create: (data) => electron.ipcRenderer.invoke("tasks:create", data),
    update: (id, data) => electron.ipcRenderer.invoke("tasks:update", id, data),
    delete: (id) => electron.ipcRenderer.invoke("tasks:delete", id),
    complete: (id) => electron.ipcRenderer.invoke("tasks:complete", id),
    cancel: (id) => electron.ipcRenderer.invoke("tasks:cancel", id),
    addSubtask: (taskId, title) => electron.ipcRenderer.invoke("tasks:addSubtask", taskId, title),
    toggleSubtask: (taskId, subtaskId) => electron.ipcRenderer.invoke("tasks:toggleSubtask", taskId, subtaskId),
    removeSubtask: (taskId, subtaskId) => electron.ipcRenderer.invoke("tasks:removeSubtask", taskId, subtaskId)
  },
  notes: {
    getAll: () => electron.ipcRenderer.invoke("notes:getAll"),
    create: (data) => electron.ipcRenderer.invoke("notes:create", data),
    update: (id, data) => electron.ipcRenderer.invoke("notes:update", id, data),
    delete: (id) => electron.ipcRenderer.invoke("notes:delete", id)
  },
  pet: {
    getState: () => electron.ipcRenderer.invoke("pet:getState"),
    addXP: (action) => electron.ipcRenderer.invoke("pet:addXP", action),
    updateStreak: () => electron.ipcRenderer.invoke("pet:updateStreak"),
    setMood: (mood) => electron.ipcRenderer.invoke("pet:setMood", mood)
  },
  settings: {
    get: () => electron.ipcRenderer.invoke("settings:get"),
    update: (data) => electron.ipcRenderer.invoke("settings:update", data)
  },
  audit: {
    getAll: () => electron.ipcRenderer.invoke("audit:getAll")
  },
  tagColors: {
    get: () => electron.ipcRenderer.invoke("tagColors:get"),
    set: (colors) => electron.ipcRenderer.invoke("tagColors:set", colors)
  },
  ai: {
    suggestTask: (title) => electron.ipcRenderer.invoke("ai:suggestTask", title),
    breakIntoSubtasks: (title, description) => electron.ipcRenderer.invoke("ai:breakIntoSubtasks", title, description),
    analyzeCommits: (repoPath, limit) => electron.ipcRenderer.invoke("ai:analyzeCommits", repoPath, limit),
    dailyReview: () => electron.ipcRenderer.invoke("ai:dailyReview"),
    noteToTasks: (content) => electron.ipcRenderer.invoke("ai:noteToTasks", content),
    summarizeNote: (content) => electron.ipcRenderer.invoke("ai:summarizeNote", content)
  },
  focus: {
    getSummaries: (days) => electron.ipcRenderer.invoke("focus:getSummaries", days),
    getCurrentSession: () => electron.ipcRenderer.invoke("focus:getCurrentSession")
  },
  achievements: {
    getAll: () => electron.ipcRenderer.invoke("achievements:getAll"),
    unlock: (id) => electron.ipcRenderer.invoke("achievements:unlock", id)
  },
  float: {
    show: () => electron.ipcRenderer.invoke("float:show"),
    hide: () => electron.ipcRenderer.invoke("float:hide"),
    toggle: () => electron.ipcRenderer.invoke("float:toggle"),
    focusMain: () => electron.ipcRenderer.invoke("float:focusMain"),
    exportPdf: () => electron.ipcRenderer.invoke("float:exportPdf")
  },
  dialog: {
    openDirectory: () => electron.ipcRenderer.invoke("dialog:openDirectory")
  },
  events: {
    onAchievementUnlocked: (cb) => {
      const handler = (_, a) => cb(a);
      electron.ipcRenderer.on("achievement:unlocked", handler);
      return () => electron.ipcRenderer.removeListener("achievement:unlocked", handler);
    },
    onPetStateUpdate: (cb) => {
      const handler = (_, s) => cb(s);
      electron.ipcRenderer.on("pet:state-update", handler);
      return () => electron.ipcRenderer.removeListener("pet:state-update", handler);
    },
    onDistractionAlert: (cb) => {
      const handler = (_, d) => cb(d);
      electron.ipcRenderer.on("focus:distraction-alert", handler);
      return () => electron.ipcRenderer.removeListener("focus:distraction-alert", handler);
    },
    onFocusLost: (cb) => {
      electron.ipcRenderer.on("focus:lost", cb);
      return () => electron.ipcRenderer.removeListener("focus:lost", cb);
    },
    onFocusRegained: (cb) => {
      electron.ipcRenderer.on("focus:regained", cb);
      return () => electron.ipcRenderer.removeListener("focus:regained", cb);
    }
  }
};
electron.contextBridge.exposeInMainWorld("api", {
  ...api,
  platform: process.platform
});
