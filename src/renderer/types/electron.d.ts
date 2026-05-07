interface ElectronAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  platform: NodeJS.Platform

  store: {
    get: (key: string) => Promise<unknown>
    set: (key: string, value: unknown) => Promise<boolean>
  }

  pdf: {
    generateReport: (data: unknown) => Promise<{ success: boolean; path?: string; error?: string }>
    generateChecklist: (data: unknown) => Promise<{ success: boolean; path?: string; error?: string }>
  }

  terminalMonitor: {
    login: (
      baseUrl: string,
      login: string,
      password: string
    ) => Promise<{ success: boolean; token?: string; error?: string }>
    fetchUpdates: (
      baseUrl: string,
      token: string,
      params: unknown
    ) => Promise<{ success: boolean; data?: unknown; error?: string }>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
