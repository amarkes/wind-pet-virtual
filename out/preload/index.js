"use strict";
const electron = require("electron");
const api = {
  tasks: {
    getAll: () => electron.ipcRenderer.invoke("tasks:getAll"),
    create: (data) => electron.ipcRenderer.invoke("tasks:create", data),
    update: (id, data) => electron.ipcRenderer.invoke("tasks:update", id, data),
    delete: (id) => electron.ipcRenderer.invoke("tasks:delete", id),
    complete: (id) => electron.ipcRenderer.invoke("tasks:complete", id)
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
  }
};
electron.contextBridge.exposeInMainWorld("api", api);
