import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, isValid, parseISO } from 'date-fns'
import { Calendar, X } from 'lucide-react'

interface DatePickerProps {
  label?: string
  value: string // ISO date string yyyy-MM-dd
  onChange: (isoDate: string) => void
  placeholder?: string
}

export function DatePicker({ label, value, onChange, placeholder = 'YYYY-MM-DD' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = value && isValid(parseISO(value)) ? parseISO(value) : undefined

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  const handleSelect = (day: Date | undefined) => {
    onChange(day ? format(day, 'yyyy-MM-dd') : '')
    setIsOpen(false)
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      {label && (
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="
            w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md
            border border-border-light bg-bg-secondary
            text-left transition-colors
            hover:border-accent/60 focus:outline-none focus:border-accent
          "
        >
          <Calendar size={14} className="text-text-muted shrink-0" />
          <span className={selected ? 'text-text-primary' : 'text-text-muted'}>
            {selected ? format(selected, 'yyyy-MM-dd') : placeholder}
          </span>
          {selected && (
            <span
              role="button"
              onClick={clear}
              className="ml-auto text-text-muted hover:text-text-primary"
            >
              <X size={13} />
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute z-50 top-full mt-1 left-0 rounded-lg border border-border-light bg-bg-secondary shadow-xl shadow-black/40">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              defaultMonth={selected}
              showOutsideDays
              classNames={{
                root: 'rdp-slate p-3',
                months: 'flex flex-col',
                month: 'space-y-2',
                caption: 'flex justify-center items-center relative mb-1',
                caption_label: 'text-sm font-semibold text-text-primary',
                nav: 'flex items-center gap-1',
                nav_button:
                  'h-7 w-7 rounded flex items-center justify-center text-text-secondary hover:bg-bg-primary hover:text-text-primary transition-colors',
                nav_button_previous: 'absolute left-0',
                nav_button_next: 'absolute right-0',
                table: 'w-full border-collapse',
                head_row: 'flex',
                head_cell: 'w-9 text-center text-xs font-medium text-text-muted py-1',
                row: 'flex w-full',
                cell: 'relative p-0',
                day: 'h-9 w-9 text-sm rounded flex items-center justify-center text-text-secondary hover:bg-bg-primary hover:text-text-primary transition-colors cursor-pointer',
                day_selected:
                  '!bg-accent !text-bg-primary font-semibold hover:!bg-accent-hover',
                day_today: 'font-bold text-accent',
                day_outside: 'text-text-muted opacity-50',
                day_disabled: 'text-text-muted opacity-30 cursor-not-allowed'
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
