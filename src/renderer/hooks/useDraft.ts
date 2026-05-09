import { useEffect, useRef } from 'react'
import type { ReportMeta, ParsedChange } from '../types/report.types'
import { useReportStore } from '../store/reportStore'

const DRAFT_KEY = 'drafts/current.json'
const AUTOSAVE_INTERVAL_MS = 30_000

export function useDraft() {
  const setMeta = useReportStore(state => state.setMeta)
  const setRawScope = useReportStore(state => state.setRawScope)
  const setChanges = useReportStore(state => state.setChanges)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const saveDraft = () => {
    // getState() reads current values at call time — no stale closure
    const { meta, rawScope, changes, checklist } = useReportStore.getState()
    const draft = { meta, rawScope, changes, checklist, savedAt: new Date().toISOString() }
    window.electronAPI?.store.set(DRAFT_KEY, draft).catch(() => {})
  }

  const loadDraft = async (): Promise<boolean> => {
    const draft = (await window.electronAPI?.store.get(DRAFT_KEY)) as {
      meta?: ReportMeta
      rawScope?: string
      changes?: ParsedChange[]
    } | null
    if (!draft) return false
    if (draft.meta) setMeta(draft.meta)
    if (draft.rawScope) setRawScope(draft.rawScope)
    if (draft.changes) setChanges(draft.changes)
    return true
  }

  // [] = only on mount/unmount — interval persists for the component lifetime
  useEffect(() => {
    timerRef.current = setInterval(saveDraft, AUTOSAVE_INTERVAL_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return { saveDraft, loadDraft }
}
