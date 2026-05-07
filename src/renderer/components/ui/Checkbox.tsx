import type { InputHTMLAttributes } from 'react'
import { Check } from 'lucide-react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export function Checkbox({ label, checked, onChange, className = '', ...props }: CheckboxProps) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer group ${className}`}>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        {...props}
      />
      <span className="w-4 h-4 rounded border border-border-light bg-bg-secondary flex items-center justify-center transition-colors peer-checked:bg-accent peer-checked:border-accent group-hover:border-accent/60">
        {checked && <Check size={10} className="text-bg-primary stroke-[3]" />}
      </span>
      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors select-none">
        {label}
      </span>
    </label>
  )
}
