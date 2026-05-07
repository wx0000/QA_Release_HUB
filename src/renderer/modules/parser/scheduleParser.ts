import type { ParsedSchedule, ScheduleComponent, SchedulePerson } from '../../types/schedule.types'

const ROMAN_RE = /^[IVX]+\./
const DURATION_RE = /\((\d+)\s*min\)/i
const COMPONENT_NOTE_RE = /^(\d+)\.\s+(.+?)(?:\s+-\s+(.+))?$/

function extractDuration(text: string): { name: string; durationMin: number } {
  const match = text.match(DURATION_RE)
  const durationMin = match ? parseInt(match[1], 10) : 0
  const name = text.replace(DURATION_RE, '').replace(/\s*-\s*$/, '').trim()
  return { name, durationMin }
}

function parseTypeA(lines: string[]): ParsedSchedule {
  const components: ScheduleComponent[] = []
  let current: ScheduleComponent | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (ROMAN_RE.test(trimmed)) {
      if (current) components.push(current)
      const rest = trimmed.replace(/^[IVX]+\.\s*/, '')
      const { name, durationMin } = extractDuration(rest)
      current = { name, durationMin, notes: '', steps: [] }
    } else if (current && /^\d+\./.test(trimmed)) {
      current.steps = current.steps ?? []
      current.steps.push(trimmed.replace(/^\d+\.\s*/, ''))
    }
  }
  if (current) components.push(current)

  return { type: 'A', people: [], components }
}

function parseTypeB(lines: string[]): ParsedSchedule {
  const people: SchedulePerson[] = []
  let currentPerson: SchedulePerson | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const componentMatch = trimmed.match(COMPONENT_NOTE_RE)
    if (componentMatch && currentPerson) {
      const rawName = componentMatch[2]
      const notes = componentMatch[3] ?? ''
      const { name, durationMin } = extractDuration(rawName)
      currentPerson.components.push({ name, durationMin, notes, developer: currentPerson.name })
    } else if (!ROMAN_RE.test(trimmed) && !/^\d+\./.test(trimmed)) {
      if (currentPerson) people.push(currentPerson)
      currentPerson = { name: trimmed, role: 'developer', components: [] }
    }
  }
  if (currentPerson) people.push(currentPerson)

  const components = people.flatMap((p) => p.components)
  return { type: 'B', people, components }
}

export function parseSchedule(raw: string): ParsedSchedule {
  const lines = raw.split('\n')
  const firstNonEmpty = lines.find((l) => l.trim())?.trim() ?? ''
  const isTypeA = ROMAN_RE.test(firstNonEmpty)
  return isTypeA ? parseTypeA(lines) : parseTypeB(lines)
}
