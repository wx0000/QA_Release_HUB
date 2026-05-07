import { useState } from 'react'
import { Plus, User } from 'lucide-react'
import { Input } from '../ui/Input'
import { DatePicker } from '../ui/DatePicker'
import { Checkbox } from '../ui/Checkbox'
import { Button } from '../ui/Button'
import { useReportStore } from '../../store/reportStore'
import { useTesters } from '../../hooks/useTesters'

export function MetaForm() {
  const { meta, setMeta } = useReportStore()
  const { testers, addTester } = useTesters()
  const [showAddTester, setShowAddTester] = useState(false)
  const [newTesterName, setNewTesterName] = useState('')

  const handleAddTester = () => {
    if (!newTesterName.trim()) return
    addTester(newTesterName.trim())
    setMeta({ tester: newTesterName.trim() })
    setNewTesterName('')
    setShowAddTester(false)
  }

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">
        Deployment metadata
      </h2>

      <div className="bg-bg-secondary rounded-xl border border-border p-6 space-y-5">
        {/* Deployment number */}
        <Input
          label="Deployment number"
          prefix="R_01.00."
          suffix=".00"
          placeholder="XX"
          value={meta.deploymentSuffix}
          onChange={(e) => setMeta({ deploymentSuffix: e.target.value })}
          maxLength={6}
          className="font-mono text-center"
        />

        {/* Date range */}
        <div className="grid grid-cols-2 gap-4">
          <DatePicker
            label="Date from"
            value={meta.dateFrom}
            onChange={(d) => setMeta({ dateFrom: d })}
            placeholder="YYYY-MM-DD"
          />
          <DatePicker
            label="Date to"
            value={meta.dateTo}
            onChange={(d) => setMeta({ dateTo: d })}
            placeholder="YYYY-MM-DD"
          />
        </div>

        {/* Environment */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            Environment
          </span>
          <div className="flex items-center gap-6 py-1">
            <Checkbox
              label="TEST"
              checked={meta.environmentTest}
              onChange={(e) => setMeta({ environmentTest: e.target.checked })}
            />
            <Checkbox
              label="STAGE"
              checked={meta.environmentStage}
              onChange={(e) => setMeta({ environmentStage: e.target.checked })}
            />
          </div>
        </div>

        {/* Tester */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            Tester
          </span>
          <div className="flex gap-2">
            <div className="flex items-center flex-1 rounded-md border border-border-light bg-bg-secondary focus-within:border-accent transition-colors overflow-hidden">
              <User size={14} className="text-text-muted ml-3 shrink-0" />
              <select
                value={meta.tester}
                onChange={(e) => setMeta({ tester: e.target.value })}
                className="flex-1 bg-transparent px-3 py-2 text-sm text-text-primary outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  Select tester…
                </option>
                {testers.map((t) => (
                  <option key={t} value={t} className="bg-bg-secondary text-text-primary">
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setShowAddTester((v) => !v)}
              title="Add new tester"
            >
              <Plus size={16} />
            </Button>
          </div>

          {showAddTester && (
            <div className="flex gap-2 mt-1">
              <input
                autoFocus
                type="text"
                placeholder="New tester name…"
                value={newTesterName}
                onChange={(e) => setNewTesterName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTester()
                  if (e.key === 'Escape') setShowAddTester(false)
                }}
                className="flex-1 rounded-md border border-border-light bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
              />
              <Button variant="primary" size="sm" onClick={handleAddTester}>
                Add
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAddTester(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Deployment number preview */}
      {meta.deploymentSuffix && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-text-muted">Deployment:</span>
          <span className="font-mono text-sm text-accent">
            R_01.00.{meta.deploymentSuffix}.00
          </span>
        </div>
      )}
    </section>
  )
}
