import { useScheduleStore } from '../store/scheduleStore'
import { parseSchedule } from '../modules/parser/scheduleParser'

export function useSchedule() {
  const { rawInput, parsed, people, setRawInput, setParsed, setPeople, reset } = useScheduleStore()

  const parse = () => {
    if (!rawInput.trim()) return
    const result = parseSchedule(rawInput)
    setParsed(result)
  }

  return { rawInput, parsed, people, setRawInput, parse, setPeople, reset }
}
