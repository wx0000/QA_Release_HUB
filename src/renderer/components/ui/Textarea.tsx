import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={textareaId} className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`
          w-full rounded-md border border-border-light bg-bg-secondary px-3 py-2
          text-sm text-text-primary placeholder-text-muted
          focus:outline-none focus:border-accent transition-colors
          resize-y min-h-[120px]
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-status-danger">{error}</p>}
    </div>
  )
}
