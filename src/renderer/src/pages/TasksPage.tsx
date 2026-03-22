import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTasksStore } from '../stores/tasks.store'
import TaskList from '../components/Tasks/TaskList'
import TaskForm from '../components/Tasks/TaskForm'
import Button from '../components/ui/Button'
import type { TaskStatus } from '../../../shared/types'

const FILTERS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all',        label: 'Todas' },
  { value: 'pending',    label: 'Pendentes' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed',  label: 'Concluídas' },
]

export default function TasksPage() {
  const { create, filter, setFilter, tasks } = useTasksStore()
  const [showForm, setShowForm] = useState(false)

  const counts: Record<string, number> = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  }

  return (
    <div className="flex flex-col gap-4 h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Tarefas</h1>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus size={15} />
          Nova tarefa
        </Button>
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

      {/* Filters */}
      <div className="flex gap-2">
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

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <TaskList />
      </div>
    </div>
  )
}
