import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  platform: process.platform,

  // Store (JSON userData)
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value)
  },

  // PDF generation
  pdf: {
    generateReport: (data: unknown) => ipcRenderer.invoke('pdf:generate-report', data),
    generateChecklist: (data: unknown) => ipcRenderer.invoke('pdf:generate-checklist', data)
  },

  // Terminal monitor API
  terminalMonitor: {
    login: (baseUrl: string, login: string, password: string) =>
      ipcRenderer.invoke('monitor:login', baseUrl, login, password),
    fetchUpdates: (baseUrl: string, token: string, params: unknown) =>
      ipcRenderer.invoke('monitor:fetch-updates', baseUrl, token, params)
  }
})
