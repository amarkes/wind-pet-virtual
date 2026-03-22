import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { usePetStore } from '../stores/pet.store'

type Phase = 'focus' | 'short_break' | 'long_break'

const DEFAULTS: Record<Phase, number> = {
  focus: 25,
  short_break: 5,
  long_break: 15,
}

const LABELS: Record<Phase, string> = {
  focus: 'Foco',
  short_break: 'Pausa curta',
  long_break: 'Pausa longa',
}

export default function TimerPage() {
  const { setMood, setMessage } = usePetStore()
  const [phase, setPhase]           = useState<Phase>('focus')
  const [seconds, setSeconds]       = useState(DEFAULTS.focus * 60)
  const [running, setRunning]       = useState(false)
  const [sessions, setSessions]     = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSeconds = DEFAULTS[phase] * 60
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  useEffect(() => {
    if (running) {
      setMood('focused')
      setMessage('Modo foco ativado! 🎯')
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            handlePhaseEnd()
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current!)
      if (phase === 'focus') setMood('idle')
    }
    return () => clearInterval(intervalRef.current!)
  }, [running])

  function handlePhaseEnd() {
    if (phase === 'focus') {
      const newSessions = sessions + 1
      setSessions(newSessions)
      setMood('happy')
      setMessage('Sessão concluída! Merece uma pausa ☕')
      const next: Phase = newSessions % 4 === 0 ? 'long_break' : 'short_break'
      switchPhase(next)
    } else {
      setMood('idle')
      setMessage('Pausa terminada! Vamos focar de novo? 💪')
      switchPhase('focus')
    }
  }

  function switchPhase(p: Phase) {
    setPhase(p)
    setSeconds(DEFAULTS[p] * 60)
    setRunning(false)
  }

  function reset() {
    setRunning(false)
    setSeconds(DEFAULTS[phase] * 60)
    setMood('idle')
  }

  const circumference = 2 * Math.PI * 88
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-8 py-8 animate-fade-in">
      <h1 className="text-xl font-bold text-text-primary">Pomodoro</h1>

      {/* Phase selector */}
      <div className="flex gap-2">
        {(['focus', 'short_break', 'long_break'] as Phase[]).map((p) => (
          <button
            key={p}
            onClick={() => !running && switchPhase(p)}
            disabled={running}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${phase === p
                ? 'bg-primary text-white'
                : 'bg-bg-card text-text-secondary border border-bg-border hover:text-text-primary'
              }
              disabled:cursor-not-allowed
            `}
          >
            {LABELS[p]}
          </button>
        ))}
      </div>

      {/* Circular timer */}
      <div className="relative w-56 h-56 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="88" fill="none" stroke="#1A1A2E" strokeWidth="8" />
          <circle
            cx="100" cy="100" r="88"
            fill="none"
            stroke={phase === 'focus' ? '#7C3AED' : '#10B981'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-5xl font-bold text-text-primary font-mono">{mm}:{ss}</span>
          <span className="text-sm text-text-muted mt-1">{LABELS[phase]}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={reset}
          className="w-11 h-11 rounded-full bg-bg-card border border-bg-border flex items-center justify-center
                     hover:bg-bg-hover transition-colors text-text-secondary hover:text-text-primary"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={() => setRunning((r) => !r)}
          className="w-16 h-16 rounded-full bg-primary hover:bg-primary-light flex items-center justify-center
                     transition-colors shadow-lg shadow-primary/20"
        >
          {running ? <Pause size={22} className="text-white" /> : <Play size={22} className="text-white ml-1" />}
        </button>
        <div className="w-11 h-11" />
      </div>

      {/* Sessions */}
      <div className="flex items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < (sessions % 4) ? 'bg-primary' : 'bg-bg-card border border-bg-border'
            }`}
          />
        ))}
        <span className="text-xs text-text-muted ml-2">{sessions} sessões hoje</span>
      </div>
    </div>
  )
}
