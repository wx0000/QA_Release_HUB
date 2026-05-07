import { ipcMain } from 'electron'

// Stub — full implementation in v0.3.0
export function registerPdfHandlers(): void {
  ipcMain.handle('pdf:generate-report', async () => {
    return { success: false, error: 'PDF generation not yet implemented (v0.3.0)' }
  })

  ipcMain.handle('pdf:generate-checklist', async () => {
    return { success: false, error: 'PDF generation not yet implemented (v0.3.0)' }
  })
}
