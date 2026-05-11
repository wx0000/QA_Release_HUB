import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useScheduleStore } from '../../store/scheduleStore'
import type { SchedulePerson, ScheduleComponent } from '../../types/schedule.types'
import { Button } from '../ui/Button'
import { Checkbox } from '../ui/Checkbox'

interface PersonCardProps {
  person: SchedulePerson
  allComponents: ScheduleComponent[]
  showNotes: boolean
  onToggle: (component: ScheduleComponent) => void
  onNoteChange?: (componentName: string, notes: string) => void
  onRemove?: () => void
}

function PersonCard({ person, allComponents, showNotes, onToggle, onNoteChange, onRemove }: PersonCardProps) {
  return (
    <div className="rounded-lg border border-border-light bg-bg-secondary p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">{person.name}</span>
        {onRemove && (
          <button onClick={onRemove} className="text-text-muted hover:text-status-danger transition-colors">
            <X size={14} />
          </button>
        )}
      </div>
      <div className="space-y-2">
        {allComponents.map(comp => {
          const assigned = person.components.find(c => c.name === comp.name)
          return (
            <div key={comp.name} className="space-y-1">
              <Checkbox
                label={comp.durationMin > 0 ? `${comp.name} (${comp.durationMin} min)` : comp.name}
                checked={!!assigned}
                onChange={() => onToggle(comp)}
              />
              {showNotes && assigned && (
                <input
                  value={assigned.notes}
                  onChange={e => onNoteChange?.(comp.name, e.target.value)}
                  placeholder="Notes..."
                  className="ml-6 w-[calc(100%-1.5rem)] text-xs bg-bg-primary border border-border-light rounded px-2 py-1 text-text-secondary placeholder-text-muted focus:outline-none focus:border-accent"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ScheduleBuilder() {
  const parsed = useScheduleStore(s => s.parsed)
  const people = useScheduleStore(s => s.people)
  const setPeople = useScheduleStore(s => s.setPeople)
  const [newDevName, setNewDevName] = useState('')
  const [newTesterName, setNewTesterName] = useState('')

  if (!parsed) return null

  const developers = people.filter(p => p.role === 'developer')
  const testers = people.filter(p => p.role === 'tester')

  function handleToggleComponent(personName: string, component: ScheduleComponent) {
    const idx = people.findIndex(p => p.name === personName)
    if (idx === -1) return
    const person = people[idx]
    const has = person.components.some(c => c.name === component.name)
    const next = [...people]
    next[idx] = {
      ...person,
      components: has
        ? person.components.filter(c => c.name !== component.name)
        : [...person.components, { ...component }]
    }
    setPeople(next)
  }

  function handleNoteChange(personName: string, componentName: string, notes: string) {
    const idx = people.findIndex(p => p.name === personName)
    if (idx === -1) return
    const person = people[idx]
    const next = [...people]
    next[idx] = {
      ...person,
      components: person.components.map(c => c.name === componentName ? { ...c, notes } : c)
    }
    setPeople(next)
  }

  function handleRemovePerson(name: string) {
    setPeople(people.filter(p => p.name !== name))
  }

  function handleAddDeveloper() {
    const name = newDevName.trim()
    if (!name) return
    const newPerson: SchedulePerson = { name, role: 'developer', components: [] }
    setPeople([...people, newPerson])
    setNewDevName('')
  }

  function handleAddTester() {
    const name = newTesterName.trim()
    if (!name) return
    const newPerson: SchedulePerson = { name, role: 'tester', components: [] }
    setPeople([...people, newPerson])
    setNewTesterName('')
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Developers</h3>
          {parsed.type === 'A' && (
            <div className="flex items-center gap-2">
              <input
                value={newDevName}
                onChange={e => setNewDevName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddDeveloper()}
                placeholder="Developer name"
                className="text-xs bg-bg-secondary border border-border-light rounded-md px-3 py-1.5 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
              />
              <Button size="sm" variant="secondary" onClick={handleAddDeveloper} disabled={!newDevName.trim()}>
                <Plus size={13} /> Add
              </Button>
            </div>
          )}
        </div>
        {developers.length === 0 ? (
          <p className="text-xs text-text-muted py-2">
            {parsed.type === 'A' ? 'No developers yet — add above.' : 'No developers detected.'}
          </p>
        ) : (
          developers.map(dev => (
            <PersonCard
              key={dev.name}
              person={dev}
              allComponents={parsed.components}
              showNotes
              onToggle={comp => handleToggleComponent(dev.name, comp)}
              onNoteChange={(compName, notes) => handleNoteChange(dev.name, compName, notes)}
              onRemove={parsed.type === 'A' ? () => handleRemovePerson(dev.name) : undefined}
            />
          ))
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Testers</h3>
          <div className="flex items-center gap-2">
            <input
              value={newTesterName}
              onChange={e => setNewTesterName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTester()}
              placeholder="Tester name"
              className="text-xs bg-bg-secondary border border-border-light rounded-md px-3 py-1.5 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
            />
            <Button size="sm" variant="secondary" onClick={handleAddTester} disabled={!newTesterName.trim()}>
              <Plus size={13} /> Add
            </Button>
          </div>
        </div>
        {testers.length === 0 ? (
          <p className="text-xs text-text-muted py-2">No testers yet — add above.</p>
        ) : (
          testers.map(tester => (
            <PersonCard
              key={tester.name}
              person={tester}
              allComponents={parsed.components}
              showNotes={false}
              onToggle={comp => handleToggleComponent(tester.name, comp)}
              onRemove={() => handleRemovePerson(tester.name)}
            />
          ))
        )}
      </section>
    </div>
  )
}
