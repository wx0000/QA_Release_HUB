import { useScheduleStore } from '../../store/scheduleStore'
import { parseSchedule } from '../../modules/parser/scheduleParser'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'

export function ScheduleInput() {
  const rawInput = useScheduleStore(s => s.rawInput)
  const setRawInput = useScheduleStore(s => s.setRawInput)
  const setParsed = useScheduleStore(s => s.setParsed)
  const parsed = useScheduleStore(s => s.parsed)

  function handleParse() {
    const result = parseSchedule(rawInput)
    setParsed(result)
  }

  return (
    <div className="space-y-3">
      <Textarea
        label="Schedule"
        value={rawInput}
        onChange={e => setRawInput(e.target.value)}
        placeholder="Paste your schedule here (Type A — Roman numerals, or Type B — per-person)..."
        rows={8}
      />
      <div className="flex items-center gap-3">
        <Button onClick={handleParse} disabled={!rawInput.trim()}>
          Parse schedule
        </Button>
        {parsed && (
          <span className="text-xs text-text-muted">
            Type {parsed.type}
            {' · '}{parsed.components.length} component{parsed.components.length !== 1 ? 's' : ''}
            {parsed.people.length > 0 && (
              <>{' · '}{parsed.people.length} developer{parsed.people.length !== 1 ? 's' : ''} detected</>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
