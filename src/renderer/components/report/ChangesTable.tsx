import { useReportStore } from '../../store/reportStore'
import type { ChangeType, ChangeStatus } from '../../types/report.types'

const TYPE_CLASSES: Record<ChangeType, string> = {
  MOD: 'bg-accent/10 text-accent border-accent/30',
  FIX: 'bg-status-warning/10 text-status-warning border-status-warning/30'
}

const STATUS_OPTIONS: ChangeStatus[] = ['Done', 'In Review', 'In Progress', 'Waiting for test', 'Documentation', '']

const CELL_INPUT =
  'w-full bg-transparent text-text-primary text-sm px-1 py-0.5 rounded ' +
  'focus:outline-none focus:bg-bg-primary/40 focus:ring-1 focus:ring-accent/40 transition-all'

export function ChangesTable() {
  const changes = useReportStore(state => state.changes)
  const updateChange = useReportStore(state => state.updateChange)
  const vendor = useReportStore(state => state.meta.vendor)

  if (changes.length === 0) {
    return (
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">
          Components &amp; changes
        </h2>
        <div className="rounded-xl border border-dashed border-border-light p-8 text-center">
          <p className="text-text-muted text-sm">Parse scope above to populate this table</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">
        Components &amp; changes{' '}
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
                <th className="px-3 py-2.5 text-left w-40">Status</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c, i) => (
                <tr
                  key={c.nr}
                  className={`border-t border-border transition-colors hover:bg-[#263548] ${
                    i % 2 === 0 ? 'bg-bg-secondary' : 'bg-bg-secondary/60'
                  }`}
                >
                  <td className="px-3 py-2 text-right text-text-muted tabular-nums">{c.nr}</td>

                  <td className="px-2 py-1.5">
                    <input
                      value={c.component}
                      onChange={(e) => updateChange(c.nr, { component: e.target.value })}
                      className={CELL_INPUT}
                    />
                  </td>

                  <td className="px-2 py-1.5">
                    <input
                      value={c.version}
                      onChange={(e) => updateChange(c.nr, { version: e.target.value })}
                      className={`${CELL_INPUT} font-mono`}
                    />
                  </td>

                  <td className="px-2 py-1.5">
                    <select
                      value={c.type}
                      onChange={(e) => updateChange(c.nr, { type: e.target.value as ChangeType })}
                      className={`text-xs font-semibold px-2 py-0.5 rounded border cursor-pointer outline-none appearance-none ${TYPE_CLASSES[c.type]}`}
                    >
                      <option value="MOD" className="bg-bg-secondary text-text-primary font-normal">MOD</option>
                      <option value="FIX" className="bg-bg-secondary text-text-primary font-normal">FIX</option>
                    </select>
                  </td>

                  <td className="px-2 py-1.5">
                    <input
                      value={c.changeDescription}
                      onChange={(e) => updateChange(c.nr, { changeDescription: e.target.value })}
                      className={CELL_INPUT}
                    />
                  </td>

                  <td className="px-2 py-1.5">
                    {c.ticket && vendor ? (
                      <a
                        href={`https://www.${vendor}.com/issue/${c.ticket}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-accent underline px-1"
                      >
                        {c.ticket}
                      </a>
                    ) : (
                      <input
                        value={c.ticket}
                        onChange={(e) => updateChange(c.nr, { ticket: e.target.value })}
                        className={`${CELL_INPUT} font-mono`}
                      />
                    )}
                  </td>

                  <td className="px-2 py-1.5">
                    <select
                      value={c.status}
                      onChange={(e) => updateChange(c.nr, { status: e.target.value as ChangeStatus })}
                      className="w-full bg-transparent text-text-secondary text-xs px-1 py-0.5 rounded focus:outline-none cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s} className="bg-bg-secondary text-text-primary">
                          {s || '—'}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
