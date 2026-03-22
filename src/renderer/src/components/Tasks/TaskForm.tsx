import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { X, Sparkles, Loader2, Tag } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { useAIStore } from '../../stores/ai.store'
import type { CreateTaskInput, TaskPriority, TaskDifficulty } from '../../../../shared/types'

interface Props {
  onSubmit: (data: CreateTaskInput) => Promise<void>
  onCancel: () => void
}

const DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  easy: 'Fácil', medium: 'Média', hard: 'Difícil', epic: 'Épica',
}

export default function TaskForm({ onSubmit, onCancel }: Props) {
  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [priority, setPriority]         = useState<TaskPriority>('medium')
  const [difficulty, setDifficulty]     = useState<TaskDifficulty>('medium')
  const [estimated, setEstimated]       = useState('')
  const [dueDate, setDueDate]           = useState('')
  const [tags, setTags]                 = useState<string[]>([])
  const [tagInput, setTagInput]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [aiReasoning, setAiReasoning]   = useState('')

  const { suggestTask, isLoading: aiLoading } = useAIStore()

  async function handleSuggest() {
    if (!title.trim()) return
    const suggestion = await suggestTask(title.trim())
    if (suggestion) {
      setDifficulty(suggestion.difficulty)
      setEstimated(String(suggestion.estimatedMinutes))
      setAiReasoning(suggestion.reasoning)
    }
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
      dueDate: dueDate || undefined,
    })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 flex flex-col gap-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">Nova tarefa</span>
        <button type="button" onClick={onCancel} className="btn-ghost p-1 rounded">
          <X size={14} />
        </button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Título da tarefa..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          className="flex-1"
        />
        <button
          type="button"
          onClick={handleSuggest}
          disabled={!title.trim() || aiLoading}
          title="Sugerir dificuldade e tempo com IA"
          className="flex-shrink-0 px-2.5 py-1.5 rounded-lg border border-primary/30 bg-primary/10
                     text-primary-light text-xs font-medium flex items-center gap-1.5
                     hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          IA
        </button>
      </div>

      {aiReasoning && (
        <p className="text-[11px] text-primary-light bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
          💡 {aiReasoning}
        </p>
      )}

      <textarea
        placeholder="Descrição (opcional)..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="input-base resize-none"
      />

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
            {aiReasoning && <span className="ml-1 text-primary-light">✨</span>}
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

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={`Estimativa (min)${aiReasoning ? ' ✨' : ''}`}
          type="number"
          placeholder="ex: 60"
          value={estimated}
          onChange={(e) => setEstimated(e.target.value)}
          min="1"
        />
        <Input
          label="Vencimento"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-secondary font-medium flex items-center gap-1">
          <Tag size={11} /> Tags
        </label>
        <div className="input-base flex flex-wrap gap-1.5 min-h-[2.25rem] cursor-text"
          onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md
                         bg-primary/15 text-primary-light text-[11px] font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                className="hover:text-primary"
              >
                <X size={9} />
              </button>
            </span>
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
