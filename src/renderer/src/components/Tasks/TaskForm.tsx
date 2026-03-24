import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { X, Sparkles, Loader2, Tag, Check, Wand2, ChevronDown, ChevronUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import Button from '../ui/Button'
import Input from '../ui/Input'
import DatePicker from '../ui/DatePicker'
import TagChip from '../ui/TagChip'
import { useAIStore } from '../../stores/ai.store'
import { useProjectsStore } from '../../stores/projects.store'
import type { AISuggestion, CreateTaskInput, TaskPriority, TaskDifficulty } from '../../../../shared/types'

function todayYMD() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface Props {
  onSubmit: (data: CreateTaskInput) => Promise<void>
  onCancel: () => void
  fixedProjectId?: string
  lockProject?: boolean
}

const DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  easy: 'Fácil', medium: 'Média', hard: 'Difícil', epic: 'Épica',
}

export default function TaskForm({ onSubmit, onCancel, fixedProjectId, lockProject = false }: Props) {
  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [priority, setPriority]         = useState<TaskPriority>('medium')
  const [difficulty, setDifficulty]     = useState<TaskDifficulty>('medium')
  const [estimated, setEstimated]       = useState('')
  const [dueDate, setDueDate]           = useState(todayYMD())
  const [dueTime, setDueTime]           = useState('18:00')
  const [tags, setTags]                 = useState<string[]>([])
  const [tagInput, setTagInput]         = useState('')
  const [projectId, setProjectId]       = useState<string>(fixedProjectId ?? '')
  const [loading, setLoading]           = useState(false)
  const [suggestion, setSuggestion]     = useState<AISuggestion | null>(null)
  const [descPreview, setDescPreview]   = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)

  const { suggestTask, isLoading: aiLoading } = useAIStore()
  const { projects } = useProjectsStore()

  async function handleSuggest() {
    if (!title.trim()) return
    const s = await suggestTask(title.trim(), description.trim() || undefined)
    if (s) {
      setSuggestion(s)
      setDifficulty(s.difficulty)
      setEstimated(String(s.estimatedMinutes))
    }
  }

  function applyTitle() {
    if (suggestion?.improvedTitle) setTitle(suggestion.improvedTitle)
  }
  function applyDescription() {
    if (suggestion?.improvedDescription) setDescription(suggestion.improvedDescription)
  }
  function applyTag(tag: string) {
    if (!tags.includes(tag)) setTags((prev) => [...prev, tag])
  }
  function applyAllTags() {
    const newTags = (suggestion?.suggestedTags ?? []).filter((t) => !tags.includes(t))
    setTags((prev) => [...prev, ...newTags])
  }

  function addTag() {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
    }
    setTagInput('')
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      difficulty,
      status: 'pending',
      tags,
      estimatedMinutes: estimated ? parseInt(estimated) : undefined,
      dueDate: dueDate ? `${dueDate}T${dueTime}` : undefined,
      projectId: (lockProject ? fixedProjectId : (fixedProjectId ?? projectId)) || undefined,
    })
    setLoading(false)
  }

  const hasSuggestedTitle = suggestion?.improvedTitle && suggestion.improvedTitle !== title
  const pendingSuggestedTags = (suggestion?.suggestedTags ?? []).filter((t) => !tags.includes(t))

  return (
    <form onSubmit={handleSubmit} className="card p-4 flex flex-col gap-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">Nova tarefa</span>
        <button type="button" onClick={onCancel} className="btn-ghost p-1 rounded">
          <X size={14} />
        </button>
      </div>

      {/* Title + AI button */}
      <div className="flex gap-2">
        <Input
          placeholder="Título da tarefa..."
          value={title}
          onChange={(e) => { setTitle(e.target.value); setSuggestion(null) }}
          autoFocus
          className="flex-1"
        />
        <button
          type="button"
          onClick={handleSuggest}
          disabled={!title.trim() || aiLoading}
          title="Analisar com IA"
          className="flex-shrink-0 px-2.5 py-1.5 rounded-lg border border-primary/30 bg-primary/10
                     text-primary-light text-xs font-medium flex items-center gap-1.5
                     hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          IA
        </button>
      </div>

      {/* AI suggestions panel */}
      {suggestion && (
        <div className="flex flex-col gap-2 bg-primary/5 border border-primary/20 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary-light">
            <Wand2 size={12} /> Sugestões da IA
          </div>

          {/* Reasoning */}
          <p className="text-[11px] text-text-secondary">💡 {suggestion.reasoning}</p>

          {/* Improved title */}
          {hasSuggestedTitle && (
            <div className="flex items-start gap-2 bg-bg-card rounded-lg p-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-text-muted font-medium mb-0.5">Título melhorado</p>
                <p className="text-xs text-text-primary leading-snug">{suggestion.improvedTitle}</p>
              </div>
              <button
                type="button"
                onClick={applyTitle}
                className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md
                           bg-primary/15 text-primary-light hover:bg-primary/25 transition-colors text-[11px] font-medium"
              >
                <Check size={10} /> Aplicar
              </button>
            </div>
          )}

          {/* Improved description */}
          {suggestion.improvedDescription && (
            <div className="flex items-start gap-2 bg-bg-card rounded-lg p-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-text-muted font-medium mb-0.5">Prompt sugerido ✦</p>
                <p className="text-xs text-text-secondary leading-snug">{suggestion.improvedDescription}</p>
              </div>
              <button
                type="button"
                onClick={applyDescription}
                className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md
                           bg-primary/15 text-primary-light hover:bg-primary/25 transition-colors text-[11px] font-medium"
              >
                <Check size={10} /> Aplicar
              </button>
            </div>
          )}

          {/* Suggested tags */}
          {pendingSuggestedTags.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-text-muted font-medium">Tags sugeridas</p>
                <button
                  type="button"
                  onClick={applyAllTags}
                  className="text-[10px] text-primary-light hover:text-primary transition-colors font-medium"
                >
                  Adicionar todas
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pendingSuggestedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => applyTag(tag)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                               bg-bg-card border border-bg-border text-[11px] text-text-secondary
                               hover:border-primary/40 hover:text-primary-light transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Description with markdown + expand */}
      <div className="flex flex-col gap-0 rounded-lg border border-bg-border overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-bg-card border-b border-bg-border">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setDescPreview(false)}
              className={`px-2.5 py-0.5 text-[11px] font-medium rounded transition-colors ${
                !descPreview ? 'bg-primary/20 text-primary-light' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Escrever
            </button>
            <button
              type="button"
              onClick={() => setDescPreview(true)}
              className={`px-2.5 py-0.5 text-[11px] font-medium rounded transition-colors ${
                descPreview ? 'bg-primary/20 text-primary-light' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Pré-visualizar
            </button>
          </div>
          <button
            type="button"
            onClick={() => setDescExpanded((v) => !v)}
            className="p-0.5 text-text-muted hover:text-text-primary transition-colors rounded"
            title={descExpanded ? 'Recolher' : 'Expandir'}
          >
            {descExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
        {/* Content */}
        {descPreview ? (
          <div
            className={`markdown-preview px-3 py-2 overflow-y-auto transition-all
              ${descExpanded ? 'min-h-[8rem]' : 'min-h-[3.5rem]'}`}
          >
            {description.trim() ? (
              <ReactMarkdown>{description}</ReactMarkdown>
            ) : (
              <span className="text-text-muted italic">Nenhuma descrição.</span>
            )}
          </div>
        ) : (
          <textarea
            placeholder="Descrição (opcional)... Suporta Markdown"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={descExpanded ? 8 : 2}
            className="w-full bg-bg-base px-3 py-2 text-text-primary placeholder:text-text-muted text-sm outline-none resize-y min-h-[3.5rem]"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Priority */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary font-medium">Prioridade</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="input-base"
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica</option>
          </select>
        </div>

        {/* Difficulty */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary font-medium">
            Dificuldade
            {suggestion && <span className="ml-1 text-primary-light">✨</span>}
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as TaskDifficulty)}
            className="input-base"
          >
            {(Object.keys(DIFFICULTY_LABELS) as TaskDifficulty[]).map((d) => (
              <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            label={`Estimativa (min)${suggestion ? ' ✨' : ''}`}
            type="number"
            placeholder="ex: 60"
            value={estimated}
            onChange={(e) => setEstimated(e.target.value)}
            min="1"
          />
        </div>
        <div className="flex-1">
          <DatePicker
            label="Vencimento"
            value={dueDate}
            onChange={setDueDate}
          />
        </div>
        <div className="flex flex-col gap-1.5 w-24">
          <label className="text-xs text-text-secondary font-medium">Hora</label>
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className="input-base text-xs"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-secondary font-medium flex items-center gap-1">
          <Tag size={11} /> Tags
        </label>
        <div
          className="input-base flex flex-wrap gap-1.5 min-h-[2.25rem] cursor-text"
          onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}
        >
          {tags.map((tag) => (
            <TagChip
              key={tag}
              tag={tag}
              editable
              onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))}
            />
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTag}
            placeholder={tags.length === 0 ? 'Adicionar tag...' : ''}
            className="flex-1 min-w-[80px] bg-transparent outline-none text-xs text-text-primary
                       placeholder:text-text-muted"
          />
        </div>
        <p className="text-[10px] text-text-muted">Enter ou vírgula para adicionar</p>
      </div>

      {/* Project */}
      {projects.length > 0 && !lockProject && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary font-medium">Projeto</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="input-base"
          >
            <option value="">Sem projeto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button size="sm" type="submit" disabled={!title.trim() || loading}>
          {loading ? 'Criando...' : 'Criar tarefa'}
        </Button>
      </div>
    </form>
  )
}
