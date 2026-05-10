import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  prefix?: string
  suffix?: string
  required?: boolean
}

export function Input({ label, error, required, prefix, suffix, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          {label}
          {required && <span className="text-status-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="flex items-center rounded-md border border-border-light bg-bg-secondary focus-within:border-accent transition-colors">
        {prefix && (
          <span className="px-3 py-2 text-sm text-text-muted border-r border-border-light select-none whitespace-nowrap">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={`
            flex-1 bg-transparent px-3 py-2 text-sm text-text-primary placeholder-text-muted
            outline-none min-w-0
            ${className}
          `}
          {...props}
        />
        {suffix && (
          <span className="px-3 py-2 text-sm text-text-muted border-l border-border-light select-none whitespace-nowrap">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-status-danger">{error}</p>}
    </div>
  )
}
