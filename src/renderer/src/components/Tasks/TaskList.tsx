import { AnimatePresence } from 'framer-motion'
import { CheckSquare } from 'lucide-react'
import { useTasksStore } from '../../stores/tasks.store'
import TaskItem from './TaskItem'
import type { Task } from '../../../../shared/types'

export default function TaskList() {
  const { complete, remove, cancel, update, getFiltered } = useTasksStore()
  const tasks = getFiltered()

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <CheckSquare size={36} className="text-text-muted opacity-30" />
        <p className="text-text-muted text-sm">Nenhuma tarefa aqui.</p>
        <p className="text-text-muted text-xs">Crie sua primeira tarefa! 🎯</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onComplete={complete}
            onDelete={remove}
            onCancel={cancel}
            onEdit={(id: string, data: Partial<Task>) => update(id, data)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
