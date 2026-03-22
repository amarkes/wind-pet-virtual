import { useState } from 'react'
import { Plus, Search, ArrowUpDown, LayoutList, Columns3 } from 'lucide-react'
import { useTasksStore, type TaskSort } from '../stores/tasks.store'
import TaskList from '../components/Tasks/TaskList'
import KanbanBoard from '../components/Tasks/KanbanBoard'
import TaskForm from '../components/Tasks/TaskForm'
import Button from '../components/ui/Button'
import type { TaskStatus } from '../../../shared/types'

type ViewMode = 'list' | 'kanban'

const FILTERS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all',         label: 'Todas' },
  { value: 'pending',     label: 'Pendentes' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed',   label: 'Concluídas' },
  { value: 'cancelled',   label: 'Canceladas' },
]

const SORT_OPTIONS: { value: TaskSort; label: string }[] = [
  { value: 'created',  label: 'Data de criação' },
  { value: 'priority', label: 'Prioridade' },
  { value: 'dueDate',  label: 'Vencimento' },
]

export default function TasksPage() {
  const { create, filter, setFilter, search, setSearch, sort, setSort, tasks } = useTasksStore()
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<ViewMode>('list')

  const counts: Record<string, number> = {
    all:         tasks.length,
    pending:     tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed:   tasks.filter((t) => t.status === 'completed').length,
    cancelled:   tasks.filter((t) => t.status === 'cancelled').length,
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
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus size={15} />
            Nova tarefa
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <TaskForm
          onSubmit={async (data) => {
            await create(data)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Search + Sort (list only) */}
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

      {/* Filters (list only) */}
      {view === 'list' && (
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(({ value, label }) => (
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
    </div>
  )
}
