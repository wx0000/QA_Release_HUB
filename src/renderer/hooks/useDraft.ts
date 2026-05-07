import { useEffect, useRef } from 'react'
import { useReportStore } from '../store/reportStore'

const DRAFT_KEY = 'drafts/current.json'
const AUTOSAVE_INTERVAL_MS = 30_000

export function useDraft() {
  const { meta, rawScope, changes, checklist, setMeta, setRawScope, setChanges } = useReportStore()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const saveDraft = () => {
    const draft = {
      meta,
      rawScope,
      changes,
      checklist,
      savedAt: new Date().toISOString()
    }
    window.electronAPI?.store.set(DRAFT_KEY, draft).catch(() => {})
  }

  const loadDraft = async () => {
    const draft = (await window.electronAPI?.store.get(DRAFT_KEY)) as {
      meta?: typeof meta
      rawScope?: string
      changes?: typeof changes
    } | null
    if (!draft) return false
    if (draft.meta) setMeta(draft.meta)
    if (draft.rawScope) setRawScope(draft.rawScope)
    if (draft.changes) setChanges(draft.changes)
    return true
  }

  useEffect(() => {
    timerRef.current = setInterval(saveDraft, AUTOSAVE_INTERVAL_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  })

  return { saveDraft, loadDraft }
}
