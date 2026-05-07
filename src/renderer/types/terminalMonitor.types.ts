export type UpdateStatus = 'added' | 'generating' | 'ready' | 'downloading' | 'downloaded'

export interface UpdateStatusEntry {
  status: UpdateStatus
  date: string
}

export interface UpdateFile {
  fileParameterName: string
  nativeVersion?: string
  size?: number
  fileStatus?: string
}

export interface UpdatePackage {
  updateId: string
  addDateTime: string
  status: UpdateStatusEntry[]
  updateType: string[]
  files: UpdateFile[]
}

export interface MonitorQueryParams {
  deviceId: number
  dateFrom?: string
  dateTo?: string
  limit: number
  offset: number
  sort: string
}

export interface MonitorHistoryEntry {
  tid: number
  timestamp: string
  resultCount: number
  params: MonitorQueryParams
}
