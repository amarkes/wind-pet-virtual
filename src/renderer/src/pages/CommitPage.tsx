import { useState, useEffect } from 'react'
import {
  GitCommit, Loader2, Sparkles, AlertCircle, FolderOpen,
  ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react'
import { useAIStore } from '../stores/ai.store'
import { usePetStore } from '../stores/pet.store'
import Button from '../components/ui/Button'
import type { CommitAnalysis, CommitInfo } from '../../../shared/types'

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-accent-green bg-accent-green/10 border-accent-green/20'
    : score >= 50 ? 'text-accent-amber bg-accent-amber/10 border-accent-amber/20'
    : 'text-accent-red bg-accent-red/10 border-accent-red/20'
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-bold text-sm ${color}`}>
      <Sparkles size={13} />
      {score}/100
    </div>
  )
}

const RATING_CONFIG = {
  good:       { icon: CheckCircle2, color: 'text-accent-green', bg: 'bg-accent-green/10 border-accent-green/20', label: 'Bom' },
  ok:         { icon: AlertTriangle, color: 'text-accent-amber', bg: 'bg-accent-amber/10 border-accent-amber/20', label: 'OK' },
  needs_work: { icon: XCircle,      color: 'text-accent-red',   bg: 'bg-accent-red/10 border-accent-red/20',     label: 'Precisa melhorar' },
}

function CommitCard({ commit }: { commit: CommitInfo }) {
  const [expanded, setExpanded] = useState(false)
  const rating = commit.review?.rating ?? 'ok'
  const cfg    = RATING_CONFIG[rating]
  const Icon   = cfg.icon
  const hasReview = commit.review && (
    (commit.review.issues?.length ?? 0) > 0 ||
    (commit.review.suggestions?.length ?? 0) > 0
  )

  return (
    <div className="border border-bg-border rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-start gap-3 p-3">
        <span className="font-mono text-[10px] text-text-muted bg-bg-border px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
          {commit.hash}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-primary font-medium leading-snug">{commit.message}</p>
          <p className="text-[10px] text-text-muted mt-0.5">
            <span className="text-accent-green">+{commit.additions}</span>
            {' '}
            <span className="text-accent-red">-{commit.deletions}</span>
            {' · '}
            {new Date(commit.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {commit.review && (
            <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
              <Icon size={10} />
              {cfg.label}
            </span>
          )}
          {hasReview && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="btn-ghost p-1 rounded"
              title={expanded ? 'Recolher review' : 'Ver code review'}
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable review */}
      {expanded && hasReview && (
        <div className="border-t border-bg-border/60 px-3 py-3 flex flex-col gap-3 bg-bg-secondary/30">
          {commit.review!.issues.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-accent-red uppercase tracking-wide flex items-center gap-1">
                <XCircle size={10} /> Problemas
              </span>
              <ul className="flex flex-col gap-1">
                {commit.review!.issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                    <span className="text-accent-red flex-shrink-0 mt-0.5">•</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {commit.review!.suggestions.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-primary-light uppercase tracking-wide flex items-center gap-1">
                <Sparkles size={10} /> Sugestões
              </span>
              <ul className="flex flex-col gap-1">
                {commit.review!.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                    <span className="text-primary-light flex-shrink-0 mt-0.5">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CommitPage() {
  const [repoPath, setRepoPath] = useState('')
  const [limit, setLimit]       = useState(1)
  const [result, setResult]     = useState<CommitAnalysis | null>(null)

  const { analyzeCommits, isLoading, error, clearError } = useAIStore()
  const { setMessage, triggerMoodTemporary } = usePetStore()

  useEffect(() => {
    window.api.settings.get().then((s) => {
      if (s.workingDirectory) setRepoPath(s.workingDirectory)
      if (s.commitAnalysisLimit) setLimit(s.commitAnalysisLimit)
    })
  }, [])

  async function handleAnalyze() {
    if (!repoPath.trim()) return
    clearError()
    const analysis = await analyzeCommits(repoPath.trim(), limit)
    if (analysis) {
      setResult(analysis)
      triggerMoodTemporary(analysis.petMood, 5000)
      setMessage(analysis.petMessage)
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full animate-fade-in">
      <div className="flex items-center gap-3">
        <GitCommit size={20} className="text-primary-light" />
        <h1 className="text-xl font-bold text-text-primary">Code Review de Commits</h1>
      </div>

      {/* Config */}
      <div className="card p-4 flex flex-col gap-3">
        <div className="flex gap-3 items-end">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary font-medium">Caminho do repositório</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input-base text-xs font-mono flex-1"
                placeholder="/Users/você/projetos/meu-repo"
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
              />
              <button
                type="button"
                onClick={async () => {
                  const dir = await window.api.dialog.openDirectory()
                  if (dir) setRepoPath(dir)
                }}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-bg-border bg-bg-card
                           text-text-secondary hover:text-text-primary hover:border-primary/40
                           transition-colors"
                title="Selecionar pasta"
              >
                <FolderOpen size={14} />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 w-20">
            <label className="text-xs text-text-secondary font-medium">Commits</label>
            <input
              type="number"
              className="input-base"
              min="1"
              max="50"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
            />
          </div>
          <Button onClick={handleAnalyze} disabled={isLoading || !repoPath.trim()}>
            {isLoading
              ? <><Loader2 size={14} className="animate-spin" /> Analisando...</>
              : <><Sparkles size={14} /> Analisar</>
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
      {result && (
        <div className="flex-1 overflow-y-auto flex flex-col gap-4">
          {/* Score + feedback geral */}
          <div className="card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Análise Geral do Código</h2>
              <ScoreBadge score={result.score} />
            </div>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
              {result.feedback}
            </p>
          </div>

          {/* Tips */}
          {result.tips.length > 0 && (
            <div className="card p-4 flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-text-primary">Sugestões Gerais</h2>
              <ul className="flex flex-col gap-1.5">
                {result.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                    <span className="text-primary-light flex-shrink-0">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Commits com review individual */}
          <div className="card p-4 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-text-primary">
              Commits revisados ({result.commits.length})
            </h2>
            <div className="flex flex-col gap-2">
              {result.commits.map((c) => (
                <CommitCard key={c.hash} commit={c} />
              ))}
            </div>
          </div>
        </div>
      )}

      {!result && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <GitCommit size={40} className="text-text-muted opacity-30" />
          <p className="text-text-muted text-sm">Informe o repositório e clique em Analisar.</p>
          <p className="text-text-muted text-xs">A IA vai revisar o código real de cada commit.</p>
        </div>
      )}
    </div>
  )
}
