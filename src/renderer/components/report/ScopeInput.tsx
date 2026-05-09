import { useState } from 'react'
import { AlertTriangle, Check } from 'lucide-react'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import { useReportStore } from '../../store/reportStore'
import { parseScope } from '../../modules/parser/scopeParser'

export function ScopeInput() {
  const rawScope = useReportStore(state => state.rawScope)
  const setRawScope = useReportStore(state => state.setRawScope)
  const setChanges = useReportStore(state => state.setChanges)
  const [unparsed, setUnparsed] = useState<string[]>([])
  const [parseCount, setParseCount] = useState<number | null>(null)

  const handleParseScope = () => {
    const result = parseScope(rawScope)
    setChanges(result.changes)
    setUnparsed(result.unparsedLines)
    setParseCount(result.changes.length)
  }

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">
        Deployment scope
      </h2>
      <div className="bg-bg-secondary rounded-xl border border-border p-6 space-y-4">
        <Textarea
          label="Paste scope (Markdown format)"
          placeholder={"* ComponentA v1.2.3\n   * MOD - Description [PROJ-1234](https://...) Done"}
          value={rawScope}
          onChange={(e) => {
            setRawScope(e.target.value)
            setParseCount(null)
          }}
          className="min-h-[140px] font-mono text-xs"
        />

        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            size="md"
            onClick={handleParseScope}
            disabled={!rawScope.trim()}
          >
            Parse scope
          </Button>
          {parseCount !== null && (
            <span className="flex items-center gap-1.5 text-xs text-status-success">
              <Check size={13} />
              {parseCount} change{parseCount !== 1 ? 's' : ''} parsed
            </span>
          )}
        </div>

        {unparsed.length > 0 && (
          <div className="rounded-md border border-status-warning/30 bg-status-warning/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-status-warning shrink-0" />
              <span className="text-xs font-semibold text-status-warning">
                {unparsed.length} line{unparsed.length > 1 ? 's' : ''} could not be parsed
              </span>
            </div>
            <ul className="space-y-0.5">
              {unparsed.map((line, i) => (
                <li key={i} className="font-mono text-xs text-text-muted pl-4 truncate">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
