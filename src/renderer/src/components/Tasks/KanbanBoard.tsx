import { useState } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { CalendarClock, Clock, Tag, GripVertical } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTasksStore } from '../../stores/tasks.store'
import type { Task, TaskStatus } from '../../../../shared/types'

// ── Column config ──────────────────────────────────────────────────────────

const COLUMNS: { id: TaskStatus; label: string; accent: string; dot: string }[] = [
  { id: 'pending',     label: 'Pendentes',    accent: 'border-t-bg-border',     dot: 'bg-text-muted' },
  { id: 'in_progress', label: 'Em Andamento', accent: 'border-t-primary',       dot: 'bg-primary' },
  { id: 'completed',   label: 'Concluídas',   accent: 'border-t-accent-green',  dot: 'bg-accent-green' },
  { id: 'cancelled',   label: 'Canceladas',   accent: 'border-t-bg-border',     dot: 'bg-bg-border' },
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

// ── Draggable card ─────────────────────────────────────────────────────────

function KanbanCard({ task, overlay = false }: { task: Task; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })

  const style = transform && !overlay
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  const dueBadge = task.dueDate ? getDueDateBadge(task.dueDate, task.status) : null
  const subtasks = task.subtasks ?? []
  const subtasksDone = subtasks.filter((s) => s.completed).length

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-bg-card border border-bg-border rounded-xl p-3 flex flex-col gap-2
        select-none transition-shadow
        ${isDragging && !overlay ? 'opacity-40' : ''}
        ${overlay ? 'shadow-2xl rotate-1 scale-105' : 'hover:border-primary/30 hover:shadow-md'}
      `}
    >
      {/* Drag handle + title */}
      <div className="flex items-start gap-1.5">
        <button
          {...listeners}
          {...attributes}
          className="mt-0.5 flex-shrink-0 text-text-muted hover:text-text-secondary cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={13} />
        </button>
        <span className={`text-xs font-medium leading-snug flex-1 ${
          task.status === 'completed' ? 'line-through text-text-muted' :
          task.status === 'cancelled' ? 'text-text-muted' : 'text-text-primary'
        }`}>
          {task.title}
        </span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1 ml-5">
        <span className={`priority-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
        <span className={`difficulty-${task.difficulty}`}>{DIFFICULTY_LABELS[task.difficulty]}</span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 ml-5">
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
          <span className="text-[10px] text-text-muted">{subtasksDone}/{subtasks.length}</span>
        )}
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 ml-5 items-center">
          <Tag size={9} className="text-text-muted" />
          {task.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-1 py-0.5 rounded bg-bg-border/50 text-text-muted border border-bg-border/60">
              {tag}
            </span>
          ))}
        </div>
      )}
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
      <div className={`flex items-center gap-2 mb-3 px-1`}>
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
  const { tasks, update, search } = useTasksStore()
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
      update(taskId, {
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
      })
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
