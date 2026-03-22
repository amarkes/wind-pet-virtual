import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import type { Task, TaskPriority, TaskDifficulty } from '../../../../shared/types'

interface Props {
  task: Task
  onSubmit: (data: Partial<Task>) => Promise<void>
  onCancel: () => void
}

export default function TaskEditForm({ task, onSubmit, onCancel }: Props) {
  const [title, setTitle]           = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [priority, setPriority]     = useState<TaskPriority>(task.priority)
  const [difficulty, setDifficulty] = useState<TaskDifficulty>(task.difficulty)
  const [estimated, setEstimated]   = useState(task.estimatedMinutes?.toString() ?? '')
  const [loading, setLoading]       = useState(false)

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

      <Input
        label="Estimativa (minutos)"
        type="number"
        placeholder="ex: 60"
        value={estimated}
        onChange={(e) => setEstimated(e.target.value)}
        min="1"
      />

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
