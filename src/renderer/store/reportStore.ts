import { create } from 'zustand'
import type { ReportMeta, ParsedChange, ChecklistItem } from '../types/report.types'

interface ReportStore {
  meta: ReportMeta
  rawScope: string
  changes: ParsedChange[]
  checklist: ChecklistItem[]
  testResults: Record<number, string>

  setMeta: (patch: Partial<ReportMeta>) => void
  setRawScope: (raw: string) => void
  setChanges: (changes: ParsedChange[]) => void
  updateChange: (nr: number, patch: Partial<ParsedChange>) => void
  updateChecklist: (nr: number, patch: Partial<ChecklistItem>) => void
  setTestResult: (nr: number, content: string) => void
  resetReport: () => void
}

const DEFAULT_META: ReportMeta = {
  deploymentSuffix: '',
  dateFrom: '',
  dateTo: '',
  environmentTest: false,
  environmentStage: false,
  tester: '',
  vendor: ''
}

export const useReportStore = create<ReportStore>((set) => ({
  meta: DEFAULT_META,
  rawScope: '',
  changes: [],
  checklist: [],
  testResults: {},

  setMeta: (patch) =>
    set((s) => ({ meta: { ...s.meta, ...patch } })),

  setRawScope: (rawScope) => set({ rawScope }),

  setChanges: (changes) =>
    set({
      changes,
      checklist: changes.map((c) => ({
        nr: c.nr,
        checked: false,
        note: '',
        change: c
      })),
      testResults: {},
    }),

  updateChange: (nr, patch) =>
    set((s) => ({
      changes: s.changes.map((c) => (c.nr === nr ? { ...c, ...patch } : c)),
      checklist: s.checklist.map((item) =>
        item.nr === nr ? { ...item, change: { ...item.change, ...patch } } : item
      )
    })),

  updateChecklist: (nr, patch) =>
    set((s) => ({
      checklist: s.checklist.map((item) =>
        item.nr === nr ? { ...item, ...patch } : item
      )
    })),

  setTestResult: (nr, content) =>
    set((s) => ({ testResults: { ...s.testResults, [nr]: content } })),

  resetReport: () =>
    set({ meta: DEFAULT_META, rawScope: '', changes: [], checklist: [], testResults: {} })
}))
