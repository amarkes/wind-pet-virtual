import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { useTagColorsStore } from '../../stores/tagColors.store'

const PALETTE = [
  '#6b7280', '#ef4444', '#f97316', '#f59e0b',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899',
]

interface Props {
  tag: string
  onRemove?: () => void
  /** Mostra o swatch clicável para trocar cor (usar nos formulários) */
  editable?: boolean
  size?: 'xs' | 'sm'
}

export default function TagChip({ tag, onRemove, editable = false, size = 'sm' }: Props) {
  const { colors, setColor } = useTagColorsStore()
  const [showPalette, setShowPalette] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  const color = colors[tag]
  const pad   = size === 'xs' ? 'px-1.5 py-0.5' : 'px-1.5 py-0.5'
  const text  = size === 'xs' ? 'text-[10px]'   : 'text-[11px]'

  useEffect(() => {
    if (!showPalette) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowPalette(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showPalette])

  const chipStyle = color
    ? {
        backgroundColor: color + '22',
        borderColor:      color + '55',
        color,
      }
    : undefined

  const chipClass = `
    inline-flex items-center gap-1 rounded-md font-medium border transition-colors
    ${pad} ${text}
    ${color ? '' : 'bg-bg-border/50 text-text-muted border-bg-border/60'}
  `

  return (
    <span ref={ref} className="relative inline-flex">
      <span className={chipClass} style={chipStyle}>
        {/* Color swatch — clicável nos formulários, decorativo nas views */}
        <button
          type="button"
          onClick={editable ? () => setShowPalette((v) => !v) : undefined}
          className={`w-2 h-2 rounded-full flex-shrink-0 border border-current/20 transition-transform
            ${editable ? 'hover:scale-125 cursor-pointer' : 'cursor-default pointer-events-none'}
          `}
          style={{ backgroundColor: color ?? '#6b7280' }}
          tabIndex={editable ? 0 : -1}
          aria-label={editable ? `Cor da tag ${tag}` : undefined}
        />

        {tag}

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            <X size={9} />
          </button>
        )}
      </span>

      {showPalette && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-44 bg-bg-card border border-bg-border rounded-xl p-2.5 shadow-2xl">
          <p className="text-[10px] text-text-muted mb-2 font-medium">Cor da tag</p>
          <div className="grid grid-cols-6 gap-1.5">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setColor(tag, c); setShowPalette(false) }}
                className="w-5 h-5 rounded-full transition-transform hover:scale-110 border-2"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? 'white' : 'transparent',
                  outline: color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: '1px',
                }}
              />
            ))}
          </div>
          {color && (
            <button
              type="button"
              onClick={() => { setColor(tag, ''); setShowPalette(false) }}
              className="mt-2 w-full text-[10px] text-text-muted hover:text-text-primary transition-colors text-center"
            >
              Remover cor
            </button>
          )}
        </div>
      )}
    </span>
  )
}
