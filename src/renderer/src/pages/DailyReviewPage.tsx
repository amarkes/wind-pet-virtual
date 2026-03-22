import { useState } from 'react'
import { BarChart2, Loader2, Sparkles, AlertCircle, CheckCircle, Clock, TrendingUp, FileDown } from 'lucide-react'
import { useAIStore } from '../stores/ai.store'
import { usePetStore } from '../stores/pet.store'
import Button from '../components/ui/Button'

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? '#10B981'
    : score >= 50 ? '#F59E0B'
    : '#EF4444'

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-bg-border" />
        <circle
          cx="40" cy="40" r="34"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 34}`}
          strokeDashoffset={`${2 * Math.PI * 34 * (1 - score / 100)}`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold" style={{ color }}>{score}</span>
        <span className="text-[9px] text-text-muted">score</span>
      </div>
    </div>
  )
}

export default function DailyReviewPage() {
  const [exporting, setExporting] = useState(false)
  const { dailyReview, isLoading, error, clearError, lastDailyReview: review, lastDailyReviewAt: reviewedAt } = useAIStore()
  const { setMessage, triggerMoodTemporary } = usePetStore()

  async function handleGenerate() {
    clearError()
    const result = await dailyReview()
    if (result) {
      triggerMoodTemporary(result.petMood, 6000)
      setMessage(result.petMessage)
    }
  }

  async function handleExportPdf() {
    setExporting(true)
    try {
      await window.api.float.exportPdf()
    } finally {
      setExporting(false)
    }
  }

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="flex flex-col gap-4 h-full animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart2 size={20} className="text-primary-light" />
          <div>
            <h1 className="text-xl font-bold text-text-primary">Review Diário</h1>
            <p className="text-xs text-text-muted capitalize">{today}</p>
            {reviewedAt && (
              <p className="text-[10px] text-text-muted">
                Gerado em{' '}
                {new Date(reviewedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {review && (
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="btn-ghost text-xs"
              title="Exportar PDF"
            >
              {exporting
                ? <Loader2 size={14} className="animate-spin" />
                : <FileDown size={14} />
              }
              PDF
            </button>
          )}
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading
              ? <><Loader2 size={14} className="animate-spin" /> Gerando...</>
              : <><Sparkles size={14} /> Gerar review</>
            }
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-3 flex items-start gap-2 border-accent-red/30 bg-accent-red/5">
          <AlertCircle size={14} className="text-accent-red flex-shrink-0 mt-0.5" />
          <p className="text-xs text-accent-red">{error}</p>
        </div>
      )}

      {/* Results */}
      {review && (
        <div className="flex-1 overflow-y-auto flex flex-col gap-4">
          {/* Score + summary */}
          <div className="card p-4 flex gap-4 items-start">
            <ScoreRing score={review.score} />
            <div className="flex-1">
              <p className="text-sm text-text-secondary leading-relaxed">{review.summary}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3 flex flex-col gap-1 items-center text-center">
              <CheckCircle size={18} className="text-accent-green" />
              <span className="text-xl font-bold text-text-primary">{review.tasksCompleted}</span>
              <span className="text-[10px] text-text-muted">concluídas</span>
            </div>
            <div className="card p-3 flex flex-col gap-1 items-center text-center">
              <TrendingUp size={18} className="text-accent-blue" />
              <span className="text-xl font-bold text-text-primary">{review.tasksCreated}</span>
              <span className="text-[10px] text-text-muted">criadas</span>
            </div>
            <div className="card p-3 flex flex-col gap-1 items-center text-center">
              <Clock size={18} className={review.tasksOverdue > 0 ? 'text-accent-red' : 'text-text-muted'} />
              <span className={`text-xl font-bold ${review.tasksOverdue > 0 ? 'text-accent-red' : 'text-text-primary'}`}>
                {review.tasksOverdue}
              </span>
              <span className="text-[10px] text-text-muted">atrasadas</span>
            </div>
          </div>

          {/* Tips */}
          {review.tips.length > 0 && (
            <div className="card p-4 flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Sparkles size={14} className="text-primary-light" />
                Sugestões para amanhã
              </h2>
              <ul className="flex flex-col gap-2">
                {review.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                    <span className="text-primary-light flex-shrink-0 font-bold">{i + 1}.</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pet message */}
          <div className="card p-4 flex items-start gap-3 border-primary/20 bg-primary/5">
            <span className="text-2xl">🐱</span>
            <p className="text-sm text-text-secondary italic">"{review.petMessage}"</p>
          </div>
        </div>
      )}

      {!review && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <BarChart2 size={40} className="text-text-muted opacity-30" />
          <p className="text-text-muted text-sm">Clique em "Gerar review" para ver sua análise do dia.</p>
          <p className="text-text-muted text-xs">O pet vai resumir suas conquistas e dar dicas para amanhã!</p>
        </div>
      )}
    </div>
  )
}
