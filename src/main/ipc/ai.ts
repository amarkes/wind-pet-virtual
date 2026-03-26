import { ipcMain, BrowserWindow } from 'electron'
import * as store from '../services/store.service'
import * as ai from '../services/ai.service'
import * as ach from '../services/achievements.service'

function broadcast(event: string, data: unknown): void {
  BrowserWindow.getAllWindows().forEach((w) => w.webContents.send(event, data))
}

function getApiKey(): string {
  const settings = store.getSettings()
  const key = settings.geminiApiKey
  if (!key) throw new Error('API key do Gemini não configurada. Acesse Configurações para adicionar.')
  return key
}

export function registerAiIpc(): void {
  ipcMain.handle('ai:suggestTask', async (_, title: string, description?: string) => {
    const apiKey = getApiKey()
    return ai.suggestTask(apiKey, title, description)
  })

  ipcMain.handle('ai:breakIntoSubtasks', async (_, taskTitle: string, taskDescription?: string) => {
    const apiKey = getApiKey()
    const subtasks = await ai.breakIntoSubtasks(apiKey, taskTitle, taskDescription)
    const unlocked = ach.checkAfterSubtaskBreak()
    unlocked.forEach((a) => broadcast('achievement:unlocked', a))
    return subtasks
  })

  ipcMain.handle('ai:analyzeCommits', async (_, repoPath: string, limit?: number) => {
    const apiKey = getApiKey()
    const result = await ai.analyzeCommits(apiKey, repoPath, limit)
    const unlocked = ach.checkAfterCommitAnalysis()
    unlocked.forEach((a) => broadcast('achievement:unlocked', a))
    return result
  })

  ipcMain.handle('ai:dailyReview', async () => {
    const apiKey = getApiKey()
    const tasks = store.getTasks()
    const result = await ai.dailyReview(apiKey, tasks)
    const unlocked = ach.checkAfterDailyReview()
    unlocked.forEach((a) => broadcast('achievement:unlocked', a))
    return result
  })

  ipcMain.handle('ai:noteToTasks', async (_, content: string) => {
    const apiKey = getApiKey()
    return ai.noteToTasks(apiKey, content)
  })

  ipcMain.handle('ai:summarizeNote', async (_, content: string) => {
    const apiKey = getApiKey()
    return ai.summarizeNote(apiKey, content)
  })
}
