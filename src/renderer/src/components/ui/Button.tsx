import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  children: ReactNode
}

const VARIANTS = {
  primary: 'bg-primary hover:bg-primary-light text-white',
  ghost:   'hover:bg-bg-hover text-text-secondary hover:text-text-primary',
  danger:  'hover:bg-accent-red/10 text-text-muted hover:text-accent-red',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: Props) {
  return (
    <button
      className={`
        inline-flex items-center gap-2 rounded-lg font-medium
        transition-colors duration-150 flex-shrink-0
        disabled:opacity-40 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}
