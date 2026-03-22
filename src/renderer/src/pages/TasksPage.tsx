import { useEffect, useState } from 'react'
import { Plus, Search, ArrowUpDown, LayoutList, Columns3, SlidersHorizontal, X, Folder, ChevronDown } from 'lucide-react'
import { UNASSIGNED_PROJECT_FILTER, useTasksStore, type TaskSort, type TaskDueDateFilter } from '../stores/tasks.store'
import { useProjectsStore } from '../stores/projects.store'
import TaskList from '../components/Tasks/TaskList'
import KanbanBoard from '../components/Tasks/KanbanBoard'
import TaskForm from '../components/Tasks/TaskForm'
import Button from '../components/ui/Button'
import type { TaskStatus, TaskPriority } from '../../../shared/types'

type ViewMode = 'list' | 'kanban'

const STATUS_FILTERS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all',         label: 'Todas' },
  { value: 'pending',     label: 'Pendentes' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed',   label: 'Concluídas' },
  { value: 'cancelled',   label: 'Canceladas' },
]

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; cls: string }[] = [
  { value: 'low',      label: 'Baixa',   cls: 'priority-low' },
  { value: 'medium',   label: 'Média',   cls: 'priority-medium' },
  { value: 'high',     label: 'Alta',    cls: 'priority-high' },
  { value: 'critical', label: 'Crítica', cls: 'priority-critical' },
]

const DUE_DATE_OPTIONS: { value: NonNullable<TaskDueDateFilter>; label: string }[] = [
  { value: 'overdue', label: 'Vencidas' },
  { value: 'today',   label: 'Hoje' },
  { value: 'week',    label: 'Próximos 7 dias' },
]

const SORT_OPTIONS: { value: TaskSort; label: string }[] = [
  { value: 'created',  label: 'Data de criação' },
  { value: 'priority', label: 'Prioridade' },
  { value: 'dueDate',  label: 'Vencimento' },
]

export default function TasksPage() {
  const {
    create, filter, setFilter, search, setSearch, sort, setSort, tasks,
    priorityFilter, setPriorityFilter, dueDateFilter, setDueDateFilter,
    projectFilter, setProjectFilter,
  } = useTasksStore()
  const { projects } = useProjectsStore()
  const [showForm, setShowForm] = useState(false)
  const [view, setView]         = useState<ViewMode>('kanban')

  const isUnassignedScope = projectFilter === UNASSIGNED_PROJECT_FILTER
  const selectedProject = projects.find((p) => p.id === projectFilter) ?? null
  const hasProjectScope = projectFilter !== null

  const scopedTasks = !hasProjectScope
    ? []
    : isUnassignedScope
      ? tasks.filter((t) => !t.projectId)
      : selectedProject
        ? tasks.filter((t) => t.projectId === selectedProject.id)
        : []

  useEffect(() => {
    if (projectFilter !== null && projectFilter !== UNASSIGNED_PROJECT_FILTER && !selectedProject) {
      setProjectFilter(null)
    }
  }, [projectFilter, selectedProject, setProjectFilter])

  function handleProjectChange(nextProjectId: string | null) {
    setProjectFilter(nextProjectId)
    setShowForm(false)
  }

  const counts: Record<string, number> = {
    all:         scopedTasks.length,
    pending:     scopedTasks.filter((t) => t.status === 'pending').length,
    in_progress: scopedTasks.filter((t) => t.status === 'in_progress').length,
    completed:   scopedTasks.filter((t) => t.status === 'completed').length,
    cancelled:   scopedTasks.filter((t) => t.status === 'cancelled').length,
  }

  function togglePriority(p: TaskPriority) {
    setPriorityFilter(
      priorityFilter.includes(p)
        ? priorityFilter.filter((x) => x !== p)
        : [...priorityFilter, p],
    )
  }

  const hasActiveFilters = priorityFilter.length > 0 || dueDateFilter !== null

  function clearFilters() {
    setPriorityFilter([])
    setDueDateFilter(null)
  }

  return (
    <div className="flex flex-col gap-4 h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Tarefas</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-bg-border overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`p-1.5 transition-colors ${view === 'list' ? 'bg-primary text-white' : 'bg-bg-card text-text-muted hover:text-text-primary'}`}
              title="Visualização em lista"
            >
              <LayoutList size={14} />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`p-1.5 transition-colors ${view === 'kanban' ? 'bg-primary text-white' : 'bg-bg-card text-text-muted hover:text-text-primary'}`}
              title="Visualização Kanban"
            >
              <Columns3 size={14} />
            </button>
          </div>
          <Button onClick={() => setShowForm((v) => !v)} disabled={!hasProjectScope}>
            <Plus size={15} />
            Nova tarefa
          </Button>
        </div>
      </div>

      {/* Project selector */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Folder
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={selectedProject ? { color: selectedProject.color } : { color: 'var(--text-muted)' }}
          />
          <select
            value={projectFilter ?? ''}
            onChange={(e) => handleProjectChange(e.target.value || null)}
            className="input-base pl-8 pr-7 w-full text-sm appearance-none cursor-pointer"
          >
            <option value="">Selecione um projeto...</option>
            <option value={UNASSIGNED_PROJECT_FILTER}>Sem projeto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
        {hasProjectScope && (
          <button
            onClick={() => handleProjectChange(null)}
            className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={11} /> Limpar
          </button>
        )}
      </div>

      {/* Empty state: no project selected */}
      {!hasProjectScope ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <Folder size={36} className="text-text-muted opacity-30" />
          <p className="text-sm text-text-secondary">Selecione um projeto ou a lista Sem projeto para ver as tarefas.</p>
          {projects.length === 0 && (
            <p className="text-xs text-text-muted">Nenhum projeto criado ainda. Crie um na aba Projetos.</p>
          )}
        </div>
      ) : (
        <>
          {/* Form */}
          {showForm && (
            <TaskForm
              onSubmit={async (data) => {
                await create({
                  ...data,
                  projectId: isUnassignedScope ? undefined : selectedProject?.id,
                })
                setShowForm(false)
              }}
              onCancel={() => setShowForm(false)}
              fixedProjectId={selectedProject?.id}
              lockProject
            />
          )}

          {/* Search + Sort */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por título, descrição ou tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-base pl-8 w-full text-xs"
              />
            </div>
            {view === 'list' && (
              <div className="relative flex-shrink-0">
                <ArrowUpDown size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as TaskSort)}
                  className="input-base pl-7 text-xs appearance-none pr-3 cursor-pointer"
                >
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Priority + Due date filters — both views */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] text-text-muted flex-shrink-0">
              <SlidersHorizontal size={11} />
              Filtros:
            </div>

            {/* Priority chips */}
            {PRIORITY_OPTIONS.map(({ value, label, cls }) => {
              const active = priorityFilter.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => togglePriority(value)}
                  className={`
                    px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border
                    ${active
                      ? 'bg-primary/20 border-primary/40 text-primary-light'
                      : 'bg-bg-card border-bg-border text-text-muted hover:text-text-primary hover:border-bg-border/80'
                    }
                  `}
                >
                  <span className={active ? '' : cls}>{label}</span>
                </button>
              )
            })}

            {/* Divider */}
            <div className="w-px h-4 bg-bg-border flex-shrink-0" />

            {/* Due date chips */}
            {DUE_DATE_OPTIONS.map(({ value, label }) => {
              const active = dueDateFilter === value
              return (
                <button
                  key={value}
                  onClick={() => setDueDateFilter(active ? null : value)}
                  className={`
                    px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border
                    ${active
                      ? value === 'overdue'
                        ? 'bg-red-500/15 border-red-500/30 text-red-400'
                        : value === 'today'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : 'bg-primary/20 border-primary/40 text-primary-light'
                      : 'bg-bg-card border-bg-border text-text-muted hover:text-text-primary hover:border-bg-border/80'
                    }
                  `}
                >
                  {label}
                </button>
              )
            })}

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={10} /> Limpar
              </button>
            )}
          </div>

          {/* Status filters (list only) */}
          {view === 'list' && (
            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${filter === value
                      ? 'bg-primary text-white'
                      : 'bg-bg-card text-text-secondary hover:text-text-primary border border-bg-border'
                    }
                  `}
                >
                  {label}
                  <span className={`ml-1.5 ${filter === value ? 'text-white/70' : 'text-text-muted'}`}>
                    {counts[value]}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {view === 'list' ? (
              <div className="h-full overflow-y-auto">
                <TaskList />
              </div>
            ) : (
              <KanbanBoard />
            )}
          </div>
        </>
      )}
    </div>
  )
}
