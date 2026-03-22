import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Focus, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import type { DayFocusSummary } from '../../../shared/types'

function fmt(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function DayBar({ summary, maxSeconds }: { summary: DayFocusSummary; maxSeconds: number }) {
  const focusPct  = maxSeconds > 0 ? (summary.totalFocusSeconds / maxSeconds) * 100 : 0
  const awayPct   = maxSeconds > 0 ? (summary.totalAwaySeconds  / maxSeconds) * 100 : 0
  const date      = new Date(summary.date + 'T12:00:00')
  const label     = date.toLocaleDateString('pt-BR', { weekday: 'short' })
  const isToday   = summary.date === new Date().toISOString().split('T')[0]

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="relative w-full h-28 flex flex-col justify-end gap-0.5">
        {awayPct > 0 && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${awayPct}%` }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full rounded-t bg-accent-red/40"
            title={`Away: ${fmt(summary.totalAwaySeconds)}`}
          />
        )}
        {focusPct > 0 && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${focusPct}%` }}
            transition={{ duration: 0.6 }}
            className="w-full rounded-t bg-primary/70"
            title={`Foco: ${fmt(summary.totalFocusSeconds)}`}
          />
        )}
        {focusPct === 0 && awayPct === 0 && (
          <div className="w-full h-1 rounded bg-bg-border" />
        )}
      </div>
      <span className={`text-[10px] ${isToday ? 'text-primary-light font-semibold' : 'text-text-muted'}`}>
        {isToday ? 'hoje' : label}
      </span>
    </div>
  )
}

export default function FocusPage() {
  const [summaries, setSummaries] = useState<DayFocusSummary[]>([])
  const [loading, setLoading]     = useState(true)
  const [focused, setFocused]     = useState(false)

  useEffect(() => {
    window.api.focus.getSummaries(7).then((s) => {
      setSummaries(s)
      setLoading(false)
    })

    // Listen for focus events
    const offLost     = window.api.events.onFocusLost(()     => setFocused(false))
    const offRegained = window.api.events.onFocusRegained(() => setFocused(true))
    return () => { offLost(); offRegained() }
  }, [])

  const today       = summaries.find((s) => s.date === new Date().toISOString().split('T')[0])
  const totalFocus  = summaries.reduce((acc, s) => acc + s.totalFocusSeconds, 0)
  const maxSeconds  = Math.max(...summaries.map((s) => s.totalFocusSeconds + s.totalAwaySeconds), 1)
  const todayFocus  = today?.totalFocusSeconds ?? 0
  const todaySessions = today?.sessions ?? 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/20">
          <Focus size={20} className="text-primary-light" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Monitoramento de Foco</h1>
          <p className="text-sm text-text-muted">Últimos 7 dias de atividade</p>
        </div>
        {/* Live status badge */}
        <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
          ${focused ? 'bg-accent-green/15 text-accent-green' : 'bg-bg-card text-text-muted'}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${focused ? 'bg-accent-green animate-pulse' : 'bg-text-muted'}`} />
          {focused ? 'Em foco' : 'Fora de foco'}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Clock, label: 'Foco hoje',    value: fmt(todayFocus),     color: 'text-primary-light' },
          { icon: TrendingUp, label: 'Total 7d', value: fmt(totalFocus),   color: 'text-accent-blue'  },
          { icon: Focus, label: 'Sessões hoje',  value: String(todaySessions), color: 'text-accent-green' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-4">
            <Icon size={16} className={`${color} mb-2`} />
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">Foco por dia</h2>
        {loading ? (
          <div className="h-28 flex items-center justify-center text-text-muted text-sm">
            Carregando...
          </div>
        ) : summaries.length === 0 ? (
          <div className="h-28 flex items-center justify-center text-text-muted text-sm">
            Nenhum dado ainda. Use o app para acumular tempo de foco.
          </div>
        ) : (
          <>
            <div className="flex items-end gap-2 px-2">
              {summaries.map((s) => (
                <DayBar key={s.date} summary={s} maxSeconds={maxSeconds} />
              ))}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-primary/70" />
                <span className="text-[10px] text-text-muted">Foco</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-accent-red/40" />
                <span className="text-[10px] text-text-muted">Away</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tips */}
      <div className="card p-4 flex gap-3">
        <AlertTriangle size={16} className="text-accent-amber flex-shrink-0 mt-0.5" />
        <div className="text-sm text-text-secondary space-y-1">
          <p className="font-medium text-text-primary">Dica de produtividade</p>
          <p>O app monitora o tempo que você passa focado na janela. Use o timer Pomodoro para maximizar sessões de foco e evite trocar de janela com frequência.</p>
        </div>
      </div>
    </div>
  )
}
