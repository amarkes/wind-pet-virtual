import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'

app.setName('ClearUp')
import { registerAllIpc } from './ipc'
import * as focusSvc from './services/focus.service'
import * as store from './services/store.service'
import * as ach from './services/achievements.service'

let mainWindow: BrowserWindow | null = null
let floatWindow: BrowserWindow | null = null

// ── Main window ──────────────────────────────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 880,
    minHeight: 580,
    backgroundColor: '#0F0F1A',
    title: 'Buddy',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: process.platform === 'darwin' ? { x: 12, y: 7 } : undefined,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
    icon: join(__dirname, process.platform === 'darwin' ? '../../resources/icon.icns' : '../../resources/icon.png'),
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Focus monitoring
  mainWindow.on('focus', () => {
    if (mainWindow) focusSvc.onWindowFocus(mainWindow)
  })
  mainWindow.on('blur', () => {
    if (mainWindow) focusSvc.onWindowBlur(mainWindow)
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ── Float window ─────────────────────────────────────────────────────────────

function createFloatWindow(): void {
  floatWindow = new BrowserWindow({
    width: 160,
    height: 200,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  floatWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  if (process.env['ELECTRON_RENDERER_URL']) {
    floatWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?window=float`)
  } else {
    floatWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { window: 'float' },
    })
  }

  floatWindow.on('closed', () => {
    floatWindow = null
  })
}

// ── Float IPC ────────────────────────────────────────────────────────────────

function registerFloatIpc(): void {
  ipcMain.handle('float:show', () => {
    if (!floatWindow) createFloatWindow()
    floatWindow?.show()
  })

  ipcMain.handle('float:hide', () => {
    floatWindow?.hide()
  })

  ipcMain.handle('float:toggle', () => {
    if (!floatWindow || floatWindow.isDestroyed()) {
      createFloatWindow()
    } else if (floatWindow.isVisible()) {
      floatWindow.hide()
    } else {
      floatWindow.show()
    }
  })

  ipcMain.handle('float:focusMain', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  ipcMain.handle('float:exportPdf', async () => {
    if (!mainWindow) return ''
    const data = await mainWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
    })
    const { dialog } = await import('electron')
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `clearup-report-${new Date().toISOString().split('T')[0]}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })
    if (!result.canceled && result.filePath) {
      const { writeFile } = await import('fs/promises')
      await writeFile(result.filePath, data)
      return result.filePath
    }
    return ''
  })
}

// ── Push pet state to float window ───────────────────────────────────────────

export function sendPetStateToFloat(petState: object): void {
  if (floatWindow && !floatWindow.isDestroyed()) {
    floatWindow.webContents.send('pet:state-update', petState)
  }
}

// ── Periodic focus check (every 5 min) ───────────────────────────────────────

function startFocusCheckInterval(): void {
  setInterval(() => {
    if (mainWindow) focusSvc.checkDistractionAlert(mainWindow)
    // Check focus_hour achievement
    const summaries = store.getFocusSummaries(1)
    const today = summaries[0]
    if (today && today.totalFocusSeconds >= 3600) {
      const unlocked = ach.checkAfterFocusHour()
      unlocked.forEach((a) =>
        BrowserWindow.getAllWindows().forEach((w) => w.webContents.send('achievement:unlocked', a)),
      )
    }
  }, 5 * 60 * 1000)
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

function registerDialogIpc(): void {
  ipcMain.handle('dialog:openDirectory', async () => {
    const { dialog } = await import('electron')
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  })
}

app.whenReady().then(() => {
  registerAllIpc()
  registerFloatIpc()
  registerDialogIpc()
  createWindow()
  startFocusCheckInterval()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
