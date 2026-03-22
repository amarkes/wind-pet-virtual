import { useState } from 'react'
import {
  Check, Trash2, ChevronDown, ChevronUp, Clock,
  Pencil, XCircle, Sparkles, Loader2, CheckSquare, Square, X,
  CalendarClock, Folder,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Task, Subtask } from '../../../../shared/types'
import TaskEditModal from './TaskEditModal'
import TagChip from '../ui/TagChip'
import { useAIStore } from '../../stores/ai.store'
import { useTasksStore } from '../../stores/tasks.store'
import { useProjectsStore } from '../../stores/projects.store'

interface Props {
  task: Task
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onCancel: (id: string) => void
  onEdit: (id: string, data: Partial<Task>) => Promise<void>
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica',
}
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Fácil', medium: 'Média', hard: 'Difícil', epic: 'Épica',
}

function parseDueDate(dueDate: string): Date {
  // If already has time component (YYYY-MM-DDTHH:MM), parse as-is (local time)
  // If date-only (YYYY-MM-DD), append T00:00:00 to avoid UTC interpretation
  return new Date(dueDate.includes('T') ? dueDate : dueDate + 'T00:00:00')
}

function getDueDateStatus(dueDate: string, status: string): 'overdue' | 'today' | 'soon' | 'future' | null {
  if (status === 'completed' || status === 'cancelled') return null
  const due = parseDueDate(dueDate)
  const now = new Date()
  if (due < now) return 'overdue'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'today'
  if (diff <= 2) return 'soon'
  return 'future'
}

function formatDueDate(dueDate: string): string {
  const due = parseDueDate(dueDate)
  return due.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function TaskItem({ task, onComplete, onDelete, onCancel, onEdit }: Props) {
  const [expanded, setExpanded]         = useState(false)
  const [editing, setEditing]           = useState(false)
  const [breakingDown, setBreakingDown] = useState(false)

  const done      = task.status === 'completed'
  const cancelled = task.status === 'cancelled'
  const editable  = !done && !cancelled

  const { breakIntoSubtasks, isLoading: aiLoading } = useAIStore()
  const { addSubtask, toggleSubtask, removeSubtask } = useTasksStore()
  const { getById: getProject } = useProjectsStore()
  const project = task.projectId ? getProject(task.projectId) : undefined

  const dueDateStatus = task.dueDate ? getDueDateStatus(task.dueDate, task.status) : null

  const dueDateColors: Record<string, string> = {
    overdue: 'text-red-400 bg-red-500/10 border-red-500/20',
    today:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
    soon:    'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    future:  'text-text-muted bg-bg-border/30 border-bg-border',
  }

  const dueDateLabels: Record<string, string> = {
    overdue: 'Atrasada',
    today:   'Hoje',
    soon:    formatDueDate(task.dueDate!),
    future:  formatDueDate(task.dueDate!),
  }

  async function handleBreakDown() {
    setBreakingDown(true)
    const titles = await breakIntoSubtasks(task.title, task.description)
    for (const title of titles) {
      await addSubtask(task.id, title)
    }
    setBreakingDown(false)
    setExpanded(true)
  }

  const subtasks = task.subtasks ?? []
  const subtasksDone = subtasks.filter((s) => s.completed).length
  const hasExpandable = task.description || subtasks.length > 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`card p-3 transition-opacity ${done || cancelled ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => editable && onComplete(task.id)}
          disabled={!editable}
          className={`
            mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors
            ${done
              ? 'bg-accent-green/20 border border-accent-green/30'
              : cancelled
                ? 'bg-bg-border/40 border border-bg-border'
                : 'border border-bg-border hover:border-primary hover:bg-primary/10'
            }
          `}
        >
          {done && <Check size={12} className="text-accent-green" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${done || cancelled ? 'line-through text-text-muted' : 'text-text-primary'}`}>
              {task.title}
            </span>
            {cancelled && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-border text-text-muted font-medium">
                Cancelada
              </span>
            )}
            {!cancelled && (
              <>
                <span className={`priority-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
                <span className={`difficulty-${task.difficulty}`}>{DIFFICULTY_LABELS[task.difficulty]}</span>
              </>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {project && (
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] font-medium"
                style={{ color: project.color, backgroundColor: project.color + '18', borderColor: project.color + '44' }}
              >
                <Folder size={10} />
                {project.name}
              </div>
            )}
            {task.estimatedMinutes && (
              <div className="flex items-center gap-1">
                <Clock size={11} className="text-text-muted" />
                <span className="text-[11px] text-text-muted">{task.estimatedMinutes} min</span>
              </div>
            )}
            {task.dueDate && dueDateStatus && (
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] font-medium ${dueDateColors[dueDateStatus]}`}>
                <CalendarClock size={10} />
                {dueDateLabels[dueDateStatus]}
              </div>
            )}
            {subtasks.length > 0 && (
              <span className="text-[11px] text-text-muted">
                {subtasksDone}/{subtasks.length} subtarefas
              </span>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {task.tags.map((tag) => (
                <TagChip key={tag} tag={tag} size="xs" />
              ))}
            </div>
          )}

          {/* Expandable: description + subtasks */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {task.description && (
                  <p className="text-xs text-text-secondary mt-2">{task.description}</p>
                )}

                {subtasks.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {subtasks.map((s: Subtask) => (
                      <div key={s.id} className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSubtask(task.id, s.id)}
                          disabled={!editable}
                          className="flex-shrink-0 text-text-muted hover:text-primary transition-colors disabled:opacity-40"
                        >
                          {s.completed
                            ? <CheckSquare size={13} className="text-accent-green" />
                            : <Square size={13} />
                          }
                        </button>
                        <span className={`text-xs flex-1 ${s.completed ? 'line-through text-text-muted' : 'text-text-secondary'}`}>
                          {s.title}
                        </span>
                        {editable && (
                          <button
                            onClick={() => removeSubtask(task.id, s.id)}
                            className="flex-shrink-0 btn-ghost p-0.5 rounded opacity-50 hover:opacity-100"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {hasExpandable && !editing && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="btn-ghost p-1 rounded"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}

          {/* Break into subtasks — only for epic tasks */}
          {editable && task.difficulty === 'epic' && !editing && (
            <button
              onClick={handleBreakDown}
              disabled={aiLoading || breakingDown}
              className="btn-ghost p-1 rounded text-primary-light hover:text-primary disabled:opacity-40"
              title="Quebrar em subtarefas (IA)"
            >
              {breakingDown ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            </button>
          )}

          {editable && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-ghost p-1 rounded"
              title="Editar tarefa"
            >
              <Pencil size={13} />
            </button>
          )}
          {editable && !editing && (
            <button
              onClick={() => onCancel(task.id)}
              className="btn-ghost p-1 rounded text-text-muted hover:text-accent-amber"
              title="Cancelar tarefa"
            >
              <XCircle size={13} />
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="btn-danger p-1 rounded"
            title="Deletar tarefa"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <TaskEditModal
        task={editing ? task : null}
        onSubmit={async (data) => { await onEdit(task.id, data) }}
        onClose={() => setEditing(false)}
      />
    </motion.div>
  )
}
