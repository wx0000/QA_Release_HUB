import { describe, it, expect } from 'vitest'
import { parseSchedule } from './scheduleParser'

describe('scheduleParser', () => {
  it('detects Type A by Roman numeral first line', () => {
    const raw = `I. Database update (5 min)\n  0. Step one\nII. App deploy (10 min)`
    const result = parseSchedule(raw)
    expect(result.type).toBe('A')
    expect(result.components).toHaveLength(2)
    expect(result.components[0].name).toBe('Database update')
    expect(result.components[0].durationMin).toBe(5)
  })

  it('detects Type B by developer header', () => {
    const raw = `Developer A\n1. Component X (10 min) - some note\n2. Component Y (5 min)`
    const result = parseSchedule(raw)
    expect(result.type).toBe('B')
    expect(result.people).toHaveLength(1)
    expect(result.people[0].name).toBe('Developer A')
    expect(result.people[0].components).toHaveLength(2)
  })

  it('extracts notes in Type B', () => {
    const raw = `Dev A\n1. ComponentZ (3 min) - hotfix note`
    const result = parseSchedule(raw)
    expect(result.people[0].components[0].notes).toBe('hotfix note')
  })
})
