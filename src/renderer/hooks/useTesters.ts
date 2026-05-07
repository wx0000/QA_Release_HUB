import { useState, useEffect } from 'react'

const FALLBACK_TESTERS = ['Tester A', 'Tester B']

export function useTesters() {
  const [testers, setTesters] = useState<string[]>(FALLBACK_TESTERS)

  useEffect(() => {
    window.electronAPI?.store
      .get('config.json')
      .then((config) => {
        const c = config as { testers?: string[] } | null
        if (c?.testers?.length) setTesters(c.testers)
      })
      .catch(() => {})
  }, [])

  const addTester = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || testers.includes(trimmed)) return
    const updated = [...testers, trimmed]
    setTesters(updated)
    window.electronAPI?.store
      .get('config.json')
      .then((config) => {
        const c = (config as Record<string, unknown>) ?? {}
        return window.electronAPI.store.set('config.json', { ...c, testers: updated })
      })
      .catch(() => {})
  }

  return { testers, addTester }
}
