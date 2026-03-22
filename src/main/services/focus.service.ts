import { BrowserWindow } from 'electron'
import * as store from './store.service'

let activeSessionId: string | null = null
let focusStartTime: Date | null = null

// Accumulated away time since last focus — used to trigger pet reaction
let awayStartTime: Date | null = null

export function onWindowFocus(mainWindow: BrowserWindow): void {
  awayStartTime = null

  // Start a new focus session
  if (!activeSessionId) {
    const session = store.startFocusSession()
    activeSessionId = session.id
    focusStartTime = new Date()
  }

  // Notify renderer that focus was regained
  mainWindow.webContents.send('focus:regained')
}

export function onWindowBlur(mainWindow: BrowserWindow): void {
  awayStartTime = new Date()

  // End active focus session
  if (activeSessionId) {
    store.endFocusSession(activeSessionId)
    activeSessionId = null
    focusStartTime = null
  }

  // Notify renderer that window lost focus
  mainWindow.webContents.send('focus:lost')
}

export function getAwaySeconds(): number {
  if (!awayStartTime) return 0
  return Math.round((Date.now() - awayStartTime.getTime()) / 1000)
}

export function getCurrentSessionDurationSeconds(): number {
  if (!focusStartTime) return 0
  return Math.round((Date.now() - focusStartTime.getTime()) / 1000)
}

export function getActiveSessionId(): string | null {
  return activeSessionId
}

/** Called periodically to check if user has been away too long (30 min = 1800s) */
export function checkDistractionAlert(mainWindow: BrowserWindow): void {
  const awaySecs = getAwaySeconds()
  const ALERT_THRESHOLD = 30 * 60 // 30 minutes

  if (awaySecs >= ALERT_THRESHOLD) {
    mainWindow.webContents.send('focus:distraction-alert', { awaySeconds: awaySecs })
    // Reset so we don't spam
    awayStartTime = new Date()
  }
}
