import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  value: string           // YYYY-MM-DD
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function toLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function todayYMD(): string {
  return toYMD(new Date())
}

export default function DatePicker({ value, onChange, label, placeholder = 'Selecionar data' }: Props) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear]   = useState(() => value ? toLocal(value).getFullYear()  : new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => value ? toLocal(value).getMonth()     : new Date().getMonth())
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const d = toLocal(value)
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [value])

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const today = todayYMD()

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  function selectDay(day: number) {
    const date = new Date(viewYear, viewMonth, day)
    onChange(toYMD(date))
    setOpen(false)
  }

  function formatDisplay(ymd: string) {
    if (!ymd) return ''
    const d = toLocal(ymd)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  function getDayClass(day: number | null): string {
    if (day === null) return ''
    const ymd = toYMD(new Date(viewYear, viewMonth, day))
    const isSelected = ymd === value
    const isToday    = ymd === today
    const isPast     = ymd < today && !isSelected

    if (isSelected) return 'bg-primary text-white font-bold rounded-lg'
    if (isToday)    return 'border border-primary/60 text-primary-light rounded-lg font-semibold'
    if (isPast)     return 'text-text-muted/50'
    return 'text-text-primary hover:bg-primary/10 rounded-lg transition-colors'
  }

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      {label && (
        <label className="text-xs text-text-secondary font-medium">{label}</label>
      )}

      <div className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`
            input-base w-full flex items-center gap-2 text-left text-xs cursor-pointer
            ${!value ? 'text-text-muted' : 'text-text-primary'}
          `}
        >
          <Calendar size={13} className="text-text-muted flex-shrink-0" />
          <span className="flex-1">{value ? formatDisplay(value) : placeholder}</span>
          {value && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange('') }}
              className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
            >
              <X size={12} />
            </button>
          )}
        </button>

        {/* Calendar popover */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 top-full mt-1.5 left-0 w-64
                         bg-bg-card border border-bg-border rounded-xl shadow-2xl p-3"
            >
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 rounded-lg hover:bg-bg-base text-text-muted hover:text-text-primary transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-semibold text-text-primary">
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 rounded-lg hover:bg-bg-base text-text-muted hover:text-text-primary transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-medium text-text-muted py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-y-0.5">
                {cells.map((day, i) => (
                  <div key={i} className="aspect-square flex items-center justify-center">
                    {day !== null && (
                      <button
                        type="button"
                        onClick={() => selectDay(day)}
                        className={`w-7 h-7 text-[11px] flex items-center justify-center ${getDayClass(day)}`}
                      >
                        {day}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick shortcuts */}
              <div className="flex gap-1.5 mt-3 pt-2.5 border-t border-bg-border">
                <button
                  type="button"
                  onClick={() => { onChange(today); setOpen(false) }}
                  className="flex-1 text-[10px] py-1 rounded-lg bg-bg-base hover:bg-primary/10
                             text-text-muted hover:text-primary-light transition-colors font-medium"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(); d.setDate(d.getDate() + 1)
                    onChange(toYMD(d)); setOpen(false)
                  }}
                  className="flex-1 text-[10px] py-1 rounded-lg bg-bg-base hover:bg-primary/10
                             text-text-muted hover:text-primary-light transition-colors font-medium"
                >
                  Amanhã
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(); d.setDate(d.getDate() + 7)
                    onChange(toYMD(d)); setOpen(false)
                  }}
                  className="flex-1 text-[10px] py-1 rounded-lg bg-bg-base hover:bg-primary/10
                             text-text-muted hover:text-primary-light transition-colors font-medium"
                >
                  +7 dias
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
