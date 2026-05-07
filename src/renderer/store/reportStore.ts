import { create } from 'zustand'
import type { ReportMeta, ParsedChange, ChecklistItem } from '../types/report.types'

interface ReportStore {
  meta: ReportMeta
  rawScope: string
  changes: ParsedChange[]
  checklist: ChecklistItem[]

  setMeta: (patch: Partial<ReportMeta>) => void
  setRawScope: (raw: string) => void
  setChanges: (changes: ParsedChange[]) => void
  updateChecklist: (nr: number, patch: Partial<ChecklistItem>) => void
  resetReport: () => void
}

const DEFAULT_META: ReportMeta = {
  deploymentSuffix: '',
  dateFrom: '',
  dateTo: '',
  environmentTest: false,
  environmentStage: false,
  tester: ''
}

export const useReportStore = create<ReportStore>((set) => ({
  meta: DEFAULT_META,
  rawScope: '',
  changes: [],
  checklist: [],

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
      }))
    }),

  updateChecklist: (nr, patch) =>
    set((s) => ({
      checklist: s.checklist.map((item) =>
        item.nr === nr ? { ...item, ...patch } : item
      )
    })),

  resetReport: () =>
    set({ meta: DEFAULT_META, rawScope: '', changes: [], checklist: [] })
}))
