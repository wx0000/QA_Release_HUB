import { ipcMain } from 'electron'
import { readJson, writeJson } from '../store/jsonStore'

export function registerStoreHandlers(): void {
  ipcMain.handle('store:get', (_event, key: string) => {
    return readJson(key, null)
  })

  ipcMain.handle('store:set', (_event, key: string, value: unknown) => {
    writeJson(key, value)
    return true
  })
}
