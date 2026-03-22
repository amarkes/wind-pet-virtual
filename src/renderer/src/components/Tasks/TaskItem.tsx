import { useState } from 'react'
import { Check, Trash2, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Task } from '../../../../shared/types'

interface Props {
  task: Task
  onComplete: (id: string) => void
  onDelete: (id: string) => void
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica',
}
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Fácil', medium: 'Média', hard: 'Difícil', epic: 'Épica',
}

export default function TaskItem({ task, onComplete, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const done = task.status === 'completed'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`card p-3 transition-opacity ${done ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => !done && onComplete(task.id)}
          disabled={done}
          className={`
            mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors
            ${done
              ? 'bg-accent-green/20 border border-accent-green/30'
              : 'border border-bg-border hover:border-primary hover:bg-primary/10'
            }
          `}
        >
          {done && <Check size={12} className="text-accent-green" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${done ? 'line-through text-text-muted' : 'text-text-primary'}`}>
              {task.title}
            </span>
            <span className={`priority-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
            <span className={`difficulty-${task.difficulty}`}>{DIFFICULTY_LABELS[task.difficulty]}</span>
          </div>

          {task.estimatedMinutes && (
            <div className="flex items-center gap-1 mt-1">
              <Clock size={11} className="text-text-muted" />
              <span className="text-[11px] text-text-muted">{task.estimatedMinutes} min</span>
            </div>
          )}

          {/* Expandable description */}
          <AnimatePresence>
            {expanded && task.description && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="text-xs text-text-secondary mt-2 overflow-hidden"
              >
                {task.description}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {task.description && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="btn-ghost p-1 rounded"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
          {!done && (
            <button onClick={() => onDelete(task.id)} className="btn-danger p-1 rounded">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
