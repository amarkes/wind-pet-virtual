import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { X, Tag } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import type { Task, TaskPriority, TaskDifficulty } from '../../../../shared/types'

interface Props {
  task: Task
  onSubmit: (data: Partial<Task>) => Promise<void>
  onCancel: () => void
}

export default function TaskEditForm({ task, onSubmit, onCancel }: Props) {
  const [title, setTitle]             = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [priority, setPriority]       = useState<TaskPriority>(task.priority)
  const [difficulty, setDifficulty]   = useState<TaskDifficulty>(task.difficulty)
  const [estimated, setEstimated]     = useState(task.estimatedMinutes?.toString() ?? '')
  const [dueDate, setDueDate]         = useState(task.dueDate ?? '')
  const [tags, setTags]               = useState<string[]>(task.tags ?? [])
  const [tagInput, setTagInput]       = useState('')
  const [loading, setLoading]         = useState(false)

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
      estimatedMinutes: estimated ? parseInt(estimated) : undefined,
      dueDate: dueDate || undefined,
      tags,
    })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 flex flex-col gap-3 animate-slide-up mt-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">Editar tarefa</span>
        <button type="button" onClick={onCancel} className="btn-ghost p-1 rounded">
          <X size={14} />
        </button>
      </div>

      <Input
        placeholder="Título da tarefa..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />

      <textarea
        placeholder="Descrição (opcional)..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="input-base resize-none"
      />

      <div className="grid grid-cols-2 gap-3">
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

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary font-medium">Dificuldade</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as TaskDifficulty)}
            className="input-base"
          >
            <option value="easy">Fácil</option>
            <option value="medium">Média</option>
            <option value="hard">Difícil</option>
            <option value="epic">Épica</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Estimativa (minutos)"
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
        <div
          className="input-base flex flex-wrap gap-1.5 min-h-[2.25rem] cursor-text"
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
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
