import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export default function Input({ label, className = '', id, ...props }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs text-text-secondary font-medium">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`input-base ${className}`}
        {...props}
      />
    </div>
  )
}
