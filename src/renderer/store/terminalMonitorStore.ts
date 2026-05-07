import { create } from 'zustand'
import type { UpdatePackage, MonitorQueryParams, MonitorHistoryEntry } from '../types/terminalMonitor.types'

interface MonitorConfig {
  baseUrl: string
  login: string
}

interface TerminalMonitorStore {
  config: MonitorConfig
  token: string | null
  isConnected: boolean
  updates: UpdatePackage[]
  lastFetch: string | null
  history: MonitorHistoryEntry[]
  autoRefresh: boolean
  autoRefreshInterval: 10 | 30 | 60

  setConfig: (config: Partial<MonitorConfig>) => void
  setToken: (token: string | null) => void
  setUpdates: (updates: UpdatePackage[], tid: number, params: MonitorQueryParams) => void
  clearToken: () => void
  setAutoRefresh: (enabled: boolean, interval?: 10 | 30 | 60) => void
}

const MAX_HISTORY = 10

export const useTerminalMonitorStore = create<TerminalMonitorStore>((set) => ({
  config: { baseUrl: '', login: '' },
  token: null,
  isConnected: false,
  updates: [],
  lastFetch: null,
  history: [],
  autoRefresh: false,
  autoRefreshInterval: 30,

  setConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),

  setToken: (token) => set({ token, isConnected: token !== null }),

  setUpdates: (updates, tid, params) =>
    set((s) => {
      const entry: MonitorHistoryEntry = {
        tid,
        timestamp: new Date().toISOString(),
        resultCount: updates.length,
        params
      }
      const history = [entry, ...s.history].slice(0, MAX_HISTORY)
      return { updates, lastFetch: new Date().toISOString(), history }
    }),

  clearToken: () => set({ token: null, isConnected: false }),

  setAutoRefresh: (autoRefresh, interval) =>
    set((s) => ({
      autoRefresh,
      autoRefreshInterval: interval ?? s.autoRefreshInterval
    }))
}))
