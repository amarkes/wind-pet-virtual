import { useState } from 'react'
import { Plus, Folder, Pencil, Trash2, X, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectsStore } from '../stores/projects.store'
import { useTasksStore } from '../stores/tasks.store'
import type { Project, Task } from '../../../shared/types'
import TagChip from '../components/ui/TagChip'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#64748b', '#a3a3a3',
]

const PRIORITY_LABELS: Record<string, string> = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica' }

function ProjectForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Project>
  onSubmit: (name: string, description: string, color: string) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName]               = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [color, setColor]             = useState(initial?.color ?? PRESET_COLORS[0])
  const [loading, setLoading]         = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await onSubmit(name.trim(), description.trim(), color)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 flex flex-col gap-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">
          {initial?.id ? 'Editar projeto' : 'Novo projeto'}
        </span>
        <button type="button" onClick={onCancel} className="btn-ghost p-1 rounded">
          <X size={14} />
        </button>
      </div>

      <input
        autoFocus
        placeholder="Nome do projeto..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input-base"
      />

      <textarea
        placeholder="Descrição (opcional)..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="input-base resize-none"
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-secondary font-medium">Cor</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: color === c ? 'white' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost px-3 py-1.5 rounded-lg text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!name.trim() || loading}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-40 transition-colors"
          style={{ backgroundColor: color }}
        >
          {loading ? 'Salvando...' : initial?.id ? 'Salvar' : 'Criar projeto'}
        </button>
      </div>
    </form>
  )
}

function TaskRow({ task }: { task: Task }) {
  const PRIORITY_COLORS: Record<string, string> = {
    low: 'text-text-muted', medium: 'text-accent-blue', high: 'text-accent-amber', critical: 'text-red-400',
  }
  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente', in_progress: 'Em progresso', completed: 'Concluída', cancelled: 'Cancelada',
  }
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-bg-hover transition-colors">
      <div
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          task.status === 'completed' ? 'bg-accent-green' :
          task.status === 'cancelled' ? 'bg-bg-border' :
          task.status === 'in_progress' ? 'bg-accent-blue' : 'bg-text-muted'
        }`}
      />
      <span className={`text-sm flex-1 min-w-0 truncate ${task.status === 'completed' || task.status === 'cancelled' ? 'line-through text-text-muted' : 'text-text-primary'}`}>
        {task.title}
      </span>
      <span className={`text-[11px] flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`}>
        {PRIORITY_LABELS[task.priority]}
      </span>
      <span className="text-[11px] text-text-muted flex-shrink-0">{STATUS_LABELS[task.status]}</span>
      {task.tags.length > 0 && (
        <div className="flex gap-1 flex-shrink-0">
          {task.tags.slice(0, 2).map((tag) => <TagChip key={tag} tag={tag} size="xs" />)}
          {task.tags.length > 2 && <span className="text-[10px] text-text-muted">+{task.tags.length - 2}</span>}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const { update, remove } = useProjectsStore()
  const { tasks, update: updateTask } = useTasksStore()
  const [editing, setEditing]     = useState(false)
  const [expanded, setExpanded]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const projectTasks = tasks.filter((t) => t.projectId === project.id)
  const done = projectTasks.filter((t) => t.status === 'completed').length

  async function handleUpdate(name: string, description: string, color: string) {
    await update(project.id, { name, description: description || undefined, color })
    setEditing(false)
  }

  async function handleDelete() {
    // Disassociate tasks before deleting
    for (const t of projectTasks) {
      await updateTask(t.id, { projectId: undefined })
    }
    await remove(project.id)
    setConfirmDelete(false)
  }

  if (editing) {
    return (
      <ProjectForm
        initial={project}
        onSubmit={handleUpdate}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="card overflow-hidden"
    >
      {/* Header bar with project color */}
      <div className="h-1.5" style={{ backgroundColor: project.color }} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: project.color + '22', border: `1px solid ${project.color}44` }}
          >
            <Folder size={15} style={{ color: project.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-text-primary truncate">{project.name}</h3>
              <span className="text-[11px] text-text-muted flex-shrink-0">
                {done}/{projectTasks.length} tarefas
              </span>
            </div>
            {project.description && (
              <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{project.description}</p>
            )}

            {/* Progress bar */}
            {projectTasks.length > 0 && (
              <div className="mt-2 h-1 bg-bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(done / projectTasks.length) * 100}%`,
                    backgroundColor: project.color,
                  }}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {projectTasks.length > 0 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="btn-ghost p-1 rounded"
                title={expanded ? 'Ocultar tarefas' : 'Ver tarefas'}
              >
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}
            <button onClick={() => setEditing(true)} className="btn-ghost p-1 rounded" title="Editar">
              <Pencil size={13} />
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button onClick={handleDelete} className="p-1 rounded text-red-400 hover:bg-red-500/10" title="Confirmar exclusão">
                  <Check size={13} />
                </button>
                <button onClick={() => setConfirmDelete(false)} className="btn-ghost p-1 rounded">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="btn-danger p-1 rounded" title="Excluir projeto">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Tasks list */}
        <AnimatePresence>
          {expanded && projectTasks.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 border-t border-bg-border pt-3 flex flex-col gap-0.5">
                {projectTasks.map((t) => <TaskRow key={t.id} task={t} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {projectTasks.length === 0 && (
          <p className="text-xs text-text-muted mt-3">Nenhuma tarefa vinculada ainda.</p>
        )}
      </div>
    </motion.div>
  )
}

export default function ProjectsPage() {
  const { projects, create } = useProjectsStore()
  const [showForm, setShowForm] = useState(false)

  async function handleCreate(name: string, description: string, color: string) {
    await create({ name, description: description || undefined, color })
    setShowForm(false)
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Projetos</h1>
          <p className="text-sm text-text-secondary mt-0.5">{projects.length} projeto{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/15 border border-primary/20
                     text-primary-light text-sm font-medium hover:bg-primary/25 transition-colors"
        >
          <Plus size={14} /> Novo projeto
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <ProjectForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project cards */}
      {projects.length === 0 && !showForm ? (
        <div className="card p-10 flex flex-col items-center gap-3 text-center">
          <Folder size={32} className="text-text-muted opacity-40" />
          <p className="text-sm text-text-secondary">Nenhum projeto criado ainda.</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-primary-light hover:text-primary transition-colors"
          >
            Criar primeiro projeto →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
