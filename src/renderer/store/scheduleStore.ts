import { create } from 'zustand'
import type { ParsedSchedule, SchedulePerson } from '../types/schedule.types'

interface ScheduleStore {
  rawInput: string
  parsed: ParsedSchedule | null
  people: SchedulePerson[]

  setRawInput: (raw: string) => void
  setParsed: (parsed: ParsedSchedule) => void
  setPeople: (people: SchedulePerson[]) => void
  reset: () => void
}

export const useScheduleStore = create<ScheduleStore>((set) => ({
  rawInput: '',
  parsed: null,
  people: [],

  setRawInput: (rawInput) => set({ rawInput }),
  setParsed: (parsed) => set({ parsed, people: parsed.people }),
  setPeople: (people) => set({ people }),
  reset: () => set({ rawInput: '', parsed: null, people: [] })
}))
