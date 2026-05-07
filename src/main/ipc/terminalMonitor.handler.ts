import { ipcMain } from 'electron'

// Stub — full implementation in v0.6.0
export function registerTerminalMonitorHandlers(): void {
  ipcMain.handle('monitor:login', async () => {
    return { success: false, error: 'Terminal Monitor not yet implemented (v0.6.0)' }
  })

  ipcMain.handle('monitor:fetch-updates', async () => {
    return { success: false, error: 'Terminal Monitor not yet implemented (v0.6.0)' }
  })
}
