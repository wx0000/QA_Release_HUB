export interface ReportMeta {
  deploymentSuffix: string // the "XX" part of R_01.00.XX.00
  dateFrom: string // ISO date string
  dateTo: string
  environmentTest: boolean
  environmentStage: boolean
  tester: string
}

export type ChangeType = 'MOD' | 'FIX'
export type ChangeStatus = 'Done' | 'In Review' | 'Waiting for test' | ''

export interface ParsedChange {
  nr: number
  component: string
  version: string
  type: ChangeType
  changeDescription: string
  ticket: string
  status: ChangeStatus
}

export interface TestCaseResult {
  nr: number
  component: string
  version: string
  type: ChangeType
  changeDescription: string
  ticket: string
  currentResult: string // TipTap JSON (v0.3.0+)
  result: 'POSITIVE'
}

export interface ChecklistItem {
  nr: number
  checked: boolean
  note: string
  change: ParsedChange
}

export interface ReportDraft {
  meta: ReportMeta
  rawScope: string
  changes: ParsedChange[]
  checklist: ChecklistItem[]
  savedAt: string
}

export interface ReportData {
  meta: ReportMeta
  changes: ParsedChange[]
  testResults?: Record<number, string> // nr → currentResult text (v0.3.0A+)
}
