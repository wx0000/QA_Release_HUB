import { ipcMain, dialog } from 'electron'
import { writeFile } from 'fs/promises'

export function registerPdfHandlers(): void {
  ipcMain.handle(
    'pdf:generate-report',
    async (_event, pdfBase64: string, defaultFilename: string) => {
      try {
        const { filePath, canceled } = await dialog.showSaveDialog({
          title: 'Save QA Report',
          defaultPath: defaultFilename,
          filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
        })

        if (canceled || !filePath) {
          return { success: true, data: { path: null } }
        }

        await writeFile(filePath, Buffer.from(pdfBase64, 'base64'))
        return { success: true, data: { path: filePath } }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          code: 'UNKNOWN'
        }
      }
    }
  )

  ipcMain.handle('pdf:generate-checklist', async () => ({
    success: false,
    error: 'Not implemented',
    code: 'VALIDATION_ERROR'
  }))
}
