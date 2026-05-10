import { useState } from 'react'
import { useReportStore } from '../../store/reportStore'
import type { ChangeType } from '../../types/report.types'
import { ResultEditorModal } from './ResultEditorModal'

const TYPE_CLASSES: Record<ChangeType, string> = {
  MOD: 'bg-accent/10 text-accent border border-accent/30',
  FIX: 'bg-status-warning/10 text-status-warning border border-status-warning/30'
}

function extractPreview(json: string): string {
  if (!json) return ''
  try {
    const texts: string[] = []
    const walk = (node: Record<string, unknown>) => {
      if (typeof node.text === 'string') texts.push(node.text)
      if (Array.isArray(node.content)) {
        (node.content as Record<string, unknown>[]).forEach(walk)
      }
    }
    const doc = JSON.parse(json) as Record<string, unknown>
    if (Array.isArray(doc.content)) {
      (doc.content as Record<string, unknown>[]).forEach(walk)
    }
    const text = texts.join(' ').trim()
    if (text) return text.length > 55 ? text.slice(0, 52) + '…' : text
    return '🖼 Obraz'
  } catch {
    return ''
  }
}

export function TestCasesTable() {
  const changes = useReportStore(state => state.changes)
  const testResults = useReportStore(state => state.testResults)
  const setTestResult = useReportStore(state => state.setTestResult)
  const vendor = useReportStore(state => state.meta.vendor)
  const [openModalFor, setOpenModalFor] = useState<number | null>(null)

  if (changes.length === 0) {
    return (
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">
          Test cases
        </h2>
        <div className="rounded-xl border border-dashed border-border-light p-8 text-center">
          <p className="text-text-muted text-sm">Parse scope above to populate test cases</p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">
          Test cases{' '}
          <span className="ml-1 font-normal normal-case tracking-normal text-text-muted">
            ({changes.length})
          </span>
        </h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-bg-tertiary text-text-muted text-xs uppercase tracking-wider">
                  <th className="px-3 py-2.5 text-right w-10">No</th>
                  <th className="px-3 py-2.5 text-left">Component</th>
                  <th className="px-3 py-2.5 text-left w-24">Version</th>
                  <th className="px-3 py-2.5 text-left w-20">Type</th>
                  <th className="px-3 py-2.5 text-left">Description</th>
                  <th className="px-3 py-2.5 text-left w-28">Ticket</th>
                  <th className="px-3 py-2.5 text-left w-56">Current result</th>
                  <th className="px-3 py-2.5 text-left w-24">Result</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((c, i) => {
                  const preview = extractPreview(testResults[c.nr] ?? '')
                  return (
                    <tr
                      key={c.nr}
                      className={`border-t border-border ${
                        i % 2 === 0 ? 'bg-bg-secondary' : 'bg-bg-secondary/60'
                      }`}
                    >
                      <td className="px-3 py-2 text-right text-text-muted tabular-nums">{c.nr}</td>
                      <td className="px-3 py-2 text-text-primary">{c.component}</td>
                      <td className="px-3 py-2 text-text-primary font-mono text-xs">{c.version}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${TYPE_CLASSES[c.type]}`}>
                          {c.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-text-primary">{c.changeDescription}</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {c.ticket && vendor ? (
                          <a
                            href={`https://www.${vendor}.com/issue/${c.ticket}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-accent underline text-xs"
                          >
                            {c.ticket}
                          </a>
                        ) : (
                          <span className="font-mono text-xs">{c.ticket || '—'}</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => setOpenModalFor(c.nr)}
                          className="w-full text-left px-2 py-1.5 rounded text-xs min-h-[36px] transition-colors hover:bg-bg-primary/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
                        >
                          {preview
                            ? <span className="text-text-primary">{preview}</span>
                            : <span className="text-text-muted italic">Kliknij aby dodać…</span>
                          }
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-status-success/10 text-status-success border border-status-success/30">
                          POSITIVE
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {openModalFor !== null && (
        <ResultEditorModal
          initialContent={testResults[openModalFor] ?? ''}
          onSave={(content) => {
            setTestResult(openModalFor, content)
            setOpenModalFor(null)
          }}
          onClose={() => setOpenModalFor(null)}
        />
      )}
    </>
  )
}
