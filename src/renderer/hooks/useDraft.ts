import { useEffect, useRef, useCallback } from 'react'
import type { ReportMeta, ParsedChange } from '../types/report.types'
import { useReportStore } from '../store/reportStore'

const DRAFT_KEY = 'drafts/current.json'
const AUTOSAVE_INTERVAL_MS = 30_000

interface DraftData {
  meta?: ReportMeta
  rawScope?: string
  changes?: ParsedChange[]
  testResults?: Record<number, string>
  savedAt?: string
}

export function useDraft() {
  const setMeta = useReportStore(state => state.setMeta)
  const setRawScope = useReportStore(state => state.setRawScope)
  const setChanges = useReportStore(state => state.setChanges)
  const setTestResults = useReportStore(state => state.setTestResults)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const saveDraft = useCallback(() => {
    const { meta, rawScope, changes, checklist, testResults } = useReportStore.getState()
    const draft = {
      meta,
      rawScope,
      changes,
      checklist,
      testResults,
      savedAt: new Date().toISOString(),
    }
    window.electronAPI?.store.set(DRAFT_KEY, draft).catch(() => {})
  }, [])

  // Returns savedAt if a meaningful draft exists, null otherwise
  const peekDraft = useCallback(async (): Promise<string | null> => {
    const raw = await window.electronAPI?.store.get(DRAFT_KEY)
    const draft = raw as DraftData | null
    if (!draft?.savedAt) return null
    if (!draft.rawScope && (!draft.changes || draft.changes.length === 0)) return null
    return draft.savedAt
  }, [])

  const loadDraft = useCallback(async (): Promise<boolean> => {
    const raw = await window.electronAPI?.store.get(DRAFT_KEY)
    const draft = raw as DraftData | null
    if (!draft) return false
    if (draft.meta) setMeta(draft.meta)
    if (draft.rawScope) setRawScope(draft.rawScope)
    if (draft.changes) setChanges(draft.changes)
    if (draft.testResults) setTestResults(draft.testResults)
    return true
  }, [setMeta, setRawScope, setChanges, setTestResults])

  const clearDraft = useCallback(async (): Promise<void> => {
    await window.electronAPI?.store.set(DRAFT_KEY, null).catch(() => {})
  }, [])

  useEffect(() => {
    timerRef.current = setInterval(saveDraft, AUTOSAVE_INTERVAL_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [saveDraft])

  return { saveDraft, peekDraft, loadDraft, clearDraft }
}
