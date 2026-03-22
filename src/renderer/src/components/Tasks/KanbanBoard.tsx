import { useState } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import {
  CalendarClock, Clock, Tag, GripVertical,
  ChevronDown, ChevronUp, Pencil, Trash2, XCircle,
  CheckSquare, Square, X, Sparkles, Loader2, AlertTriangle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTasksStore } from '../../stores/tasks.store'
import { useAIStore } from '../../stores/ai.store'
import TaskEditForm from './TaskEditForm'
import type { Task, TaskStatus, Subtask } from '../../../../shared/types'

// ── Column config ──────────────────────────────────────────────────────────

const COLUMNS: { id: TaskStatus; label: string; dot: string }[] = [
  { id: 'pending',     label: 'Pendentes',    dot: 'bg-text-muted' },
  { id: 'in_progress', label: 'Em Andamento', dot: 'bg-primary' },
  { id: 'completed',   label: 'Concluídas',   dot: 'bg-accent-green' },
  { id: 'cancelled',   label: 'Canceladas',   dot: 'bg-bg-border' },
]

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica',
}
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Fácil', medium: 'Média', hard: 'Difícil', epic: 'Épica',
}

// ── Due date helper ────────────────────────────────────────────────────────

function getDueDateBadge(dueDate: string, status: TaskStatus) {
  if (status === 'completed' || status === 'cancelled') return null
  const due = new Date(dueDate + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.floor((due.getTime() - today.getTime()) / 86400000)
  const label = diff < 0 ? 'Atrasada'
    : diff === 0 ? 'Hoje'
    : due.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const color = diff < 0 ? 'text-red-400 bg-red-500/10 border-red-500/20'
    : diff === 0 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    : 'text-text-muted bg-bg-border/30 border-bg-border'
  return { label, color }
}

// ── Inline confirmation ────────────────────────────────────────────────────

function ConfirmBar({
  message, confirmLabel, confirmClass, onConfirm, onCancel,
}: {
  message: string
  confirmLabel: string
  confirmClass: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary/60 border-t border-bg-border/50 rounded-b-xl">
      <AlertTriangle size={11} className="text-accent-amber flex-shrink-0" />
      <span className="text-[11px] text-text-secondary flex-1">{message}</span>
      <button
        onClick={onCancel}
        className="text-[11px] px-2 py-0.5 rounded btn-ghost text-text-muted"
      >
        Não
      </button>
      <button
        onClick={onConfirm}
        className={`text-[11px] px-2 py-0.5 rounded font-medium ${confirmClass}`}
      >
        {confirmLabel}
      </button>
    </div>
  )
}

// ── Draggable card ─────────────────────────────────────────────────────────

function KanbanCard({ task, overlay = false }: { task: Task; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  const { update, remove, complete, cancel, addSubtask, toggleSubtask, removeSubtask } = useTasksStore()
  const { breakIntoSubtasks, isLoading: aiLoading } = useAIStore()

  const [expanded, setExpanded]         = useState(false)
  const [editing, setEditing]           = useState(false)
  const [breakingDown, setBreakingDown] = useState(false)
  const [confirm, setConfirm]           = useState<'delete' | 'cancel' | null>(null)

  const style = transform && !overlay
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  const done      = task.status === 'completed'
  const cancelled = task.status === 'cancelled'
  const editable  = !done && !cancelled

  const dueBadge     = task.dueDate ? getDueDateBadge(task.dueDate, task.status) : null
  const subtasks     = task.subtasks ?? []
  const subtasksDone = subtasks.filter((s) => s.completed).length
  const hasExpandable = !!task.description || subtasks.length > 0

  async function handleBreakDown() {
    setBreakingDown(true)
    const titles = await breakIntoSubtasks(task.title, task.description)
    for (const title of titles) {
      await addSubtask(task.id, title)
    }
    setBreakingDown(false)
    setExpanded(true)
  }

  function handleDeleteConfirm() {
    remove(task.id)
    setConfirm(null)
  }

  function handleCancelConfirm() {
    cancel(task.id)
    setConfirm(null)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-bg-card border border-bg-border rounded-xl flex flex-col
        transition-shadow
        ${isDragging && !overlay ? 'opacity-40' : ''}
        ${overlay ? 'shadow-2xl rotate-1 scale-105' : 'hover:border-primary/30 hover:shadow-md'}
      `}
    >
      {/* ── Top bar: drag handle + action icons only ── */}
      <div className="flex items-center gap-1 px-2 pt-2 select-none">
        {/* Drag handle */}
        <button
          {...listeners}
          {...attributes}
          className="flex-shrink-0 text-text-muted hover:text-text-secondary cursor-grab active:cursor-grabbing p-0.5"
          tabIndex={-1}
        >
          <GripVertical size={13} />
        </button>

        <div className="flex-1" />

        {/* Action buttons */}
        {!confirm && (
          <>
            {hasExpandable && !editing && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="btn-ghost p-1 rounded"
                title={expanded ? 'Recolher' : 'Expandir'}
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}

            {editable && task.difficulty === 'epic' && !editing && (
              <button
                onClick={handleBreakDown}
                disabled={aiLoading || breakingDown}
                className="btn-ghost p-1 rounded text-primary-light hover:text-primary disabled:opacity-40"
                title="Quebrar em subtarefas (IA)"
              >
                {breakingDown ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              </button>
            )}

            {editable && !editing && (
              <button
                onClick={() => { setEditing(true); setExpanded(false) }}
                className="btn-ghost p-1 rounded"
                title="Editar tarefa"
              >
                <Pencil size={12} />
              </button>
            )}

            {editable && !editing && (
              <button
                onClick={() => setConfirm('cancel')}
                className="btn-ghost p-1 rounded text-text-muted hover:text-accent-amber"
                title="Cancelar tarefa"
              >
                <XCircle size={12} />
              </button>
            )}

            {!editing && (
              <button
                onClick={() => setConfirm('delete')}
                className="btn-danger p-1 rounded"
                title="Deletar tarefa"
              >
                <Trash2 size={12} />
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Title ── */}
      <div className="px-3 pt-1.5 pb-2">
        <span className={`text-xs font-semibold leading-snug break-words ${
          done      ? 'line-through text-text-muted' :
          cancelled ? 'text-text-muted'              : 'text-text-primary'
        }`}>
          {task.title}
        </span>
      </div>

      {/* ── Priority + Difficulty badges ── */}
      {!cancelled && (
        <div className="px-3 pb-2 select-none">
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-text-muted uppercase tracking-wide">Prior.</span>
            <span className={`text-[9px] priority-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-text-muted uppercase tracking-wide">Dific.</span>
            <span className={`text-[9px] difficulty-${task.difficulty}`}>{DIFFICULTY_LABELS[task.difficulty]}</span>
          </div>
        </div>
      )}
      {cancelled && (
        <div className="px-3 pb-2 select-none">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-border text-text-muted font-medium">
            Cancelada
          </span>
        </div>
      )}

      {/* ── Meta row ── */}
      {(task.estimatedMinutes || dueBadge || subtasks.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 px-3 pb-2 select-none">
          {task.estimatedMinutes && (
            <div className="flex items-center gap-1">
              <Clock size={10} className="text-text-muted" />
              <span className="text-[10px] text-text-muted">{task.estimatedMinutes}m</span>
            </div>
          )}
          {dueBadge && (
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${dueBadge.color}`}>
              <CalendarClock size={9} />
              {dueBadge.label}
            </div>
          )}
          {subtasks.length > 0 && (
            <span className="text-[10px] text-text-muted">{subtasksDone}/{subtasks.length} subtarefas</span>
          )}
        </div>
      )}

      {/* ── Tags ── */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pb-3 items-center select-none">
          <Tag size={9} className="text-text-muted" />
          {task.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-1 py-0.5 rounded bg-bg-border/50 text-text-muted border border-bg-border/60">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Expandable: description + subtasks ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 flex flex-col gap-2 border-t border-bg-border/50 pt-2">
              {task.description && (
                <p className="text-xs text-text-secondary leading-relaxed select-text cursor-text">
                  {task.description}
                </p>
              )}
              {subtasks.length > 0 && (
                <div className="flex flex-col gap-1">
                  {subtasks.map((s: Subtask) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <button
                        onClick={() => editable && toggleSubtask(task.id, s.id)}
                        disabled={!editable}
                        className="flex-shrink-0 text-text-muted hover:text-primary transition-colors disabled:opacity-40"
                      >
                        {s.completed
                          ? <CheckSquare size={12} className="text-accent-green" />
                          : <Square size={12} />
                        }
                      </button>
                      <span className={`text-xs flex-1 select-text cursor-text ${s.completed ? 'line-through text-text-muted' : 'text-text-secondary'}`}>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Inline edit form ── */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">
              <TaskEditForm
                task={task}
                onSubmit={async (data) => {
                  await update(task.id, data)
                  setEditing(false)
                }}
                onCancel={() => setEditing(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirmation bars ── */}
      <AnimatePresence>
        {confirm === 'delete' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <ConfirmBar
              message="Deletar permanentemente?"
              confirmLabel="Deletar"
              confirmClass="bg-red-500/20 text-red-400 hover:bg-red-500/30"
              onConfirm={handleDeleteConfirm}
              onCancel={() => setConfirm(null)}
            />
          </motion.div>
        )}
        {confirm === 'cancel' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <ConfirmBar
              message="Cancelar esta tarefa?"
              confirmLabel="Cancelar tarefa"
              confirmClass="bg-accent-amber/20 text-accent-amber hover:bg-accent-amber/30"
              onConfirm={handleCancelConfirm}
              onCancel={() => setConfirm(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Droppable column ───────────────────────────────────────────────────────

function KanbanColumn({ column, tasks }: {
  column: typeof COLUMNS[number]
  tasks: Task[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex flex-col min-w-0 flex-1">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${column.dot}`} />
        <span className="text-xs font-semibold text-text-secondary">{column.label}</span>
        <span className="ml-auto text-[11px] text-text-muted bg-bg-border/50 px-1.5 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 flex flex-col gap-2 min-h-[120px] rounded-xl p-2 border-2 border-dashed transition-colors
          ${isOver
            ? 'border-primary/40 bg-primary/5'
            : 'border-transparent bg-bg-card/30'
          }
        `}
      >
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && !isOver && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[11px] text-text-muted/50">Solte aqui</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Kanban board ───────────────────────────────────────────────────────────

export default function KanbanBoard() {
  const { tasks, update, complete, cancel, search } = useTasksStore()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const filtered = search.trim()
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.description?.toLowerCase().includes(search.toLowerCase()) ||
          t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())),
      )
    : tasks

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as TaskStatus
    const task = tasks.find((t) => t.id === taskId)

    if (task && task.status !== newStatus) {
      if (newStatus === 'completed') {
        complete(taskId)
      } else if (newStatus === 'cancelled') {
        cancel(taskId)
      } else {
        update(taskId, { status: newStatus })
      }
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-3 h-full overflow-x-auto pb-2"
      >
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={filtered.filter((t) => t.status === column.id)}
          />
        ))}
      </motion.div>

      <DragOverlay>
        {activeTask && <KanbanCard task={activeTask} overlay />}
      </DragOverlay>
    </DndContext>
  )
}
