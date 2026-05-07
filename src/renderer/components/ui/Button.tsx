import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-accent text-bg-primary font-semibold hover:bg-accent-hover focus:ring-2 focus:ring-accent/50',
  secondary:
    'bg-bg-secondary text-text-primary border border-border-light hover:bg-[#263548] focus:ring-2 focus:ring-accent/30',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-secondary',
  danger: 'bg-status-danger/10 text-status-danger border border-status-danger/30 hover:bg-status-danger/20'
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base'
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center gap-2 rounded-md transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed outline-none
        ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}
