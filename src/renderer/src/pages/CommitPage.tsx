import { useState, useEffect } from 'react'
import { GitCommit, Loader2, Sparkles, AlertCircle, FolderOpen } from 'lucide-react'
import { useAIStore } from '../stores/ai.store'
import { usePetStore } from '../stores/pet.store'
import Button from '../components/ui/Button'
import type { CommitAnalysis } from '../../../shared/types'

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
        <h1 className="text-xl font-bold text-text-primary">Análise de Commits</h1>
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
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !repoPath.trim()}
          >
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
          {/* Score + feedback */}
          <div className="card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Análise Geral</h2>
              <ScoreBadge score={result.score} />
            </div>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
              {result.feedback}
            </p>
          </div>

          {/* Tips */}
          {result.tips.length > 0 && (
            <div className="card p-4 flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-text-primary">Dicas</h2>
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

          {/* Commits list */}
          <div className="card p-4 flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-text-primary">
              Commits analisados ({result.commits.length})
            </h2>
            <div className="flex flex-col gap-2">
              {result.commits.map((c) => (
                <div key={c.hash} className="flex items-start gap-3 py-2 border-b border-bg-border last:border-0">
                  <span className="font-mono text-[10px] text-text-muted bg-bg-border px-1.5 py-0.5 rounded flex-shrink-0">
                    {c.hash}
                  </span>
                  <span className="text-xs text-text-primary flex-1 min-w-0 truncate">{c.message}</span>
                  <span className="text-[10px] text-text-muted flex-shrink-0">
                    <span className="text-accent-green">+{c.additions}</span>
                    {' '}
                    <span className="text-accent-red">-{c.deletions}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!result && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <GitCommit size={40} className="text-text-muted opacity-30" />
          <p className="text-text-muted text-sm">Informe o caminho do repositório e clique em Analisar.</p>
          <p className="text-text-muted text-xs">O pet vai reagir à qualidade dos seus commits!</p>
        </div>
      )}
    </div>
  )
}
