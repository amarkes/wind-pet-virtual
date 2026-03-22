import { CheckCircle, Clock, Flame, Trophy } from 'lucide-react'
import { usePetStore } from '../stores/pet.store'
import { useTasksStore } from '../stores/tasks.store'

function StatCard({ label, value, icon: Icon, color }: {
  label: string
  value: string | number
  icon: typeof CheckCircle
  color: string
}) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { pet } = usePetStore()
  const { tasks, getTodayCount } = useTasksStore()
  const today = getTodayCount()

  const pending = tasks.filter((t) => t.status === 'pending').length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length

  const LEVEL_TITLES = [
    '', 'Iniciante', 'Aprendiz', 'Focado', 'Produtivo',
    'Dedicado', 'Expert', 'Mestre', 'Lendário',
  ]
  const levelTitle = LEVEL_TITLES[pet?.level ?? 1] ?? 'Lendário+'

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">
          Bom dia{pet && ' — '}
          <span className="text-primary-light">{levelTitle}</span>
        </h1>
        <p className="text-sm text-text-muted mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Concluídas hoje"
          value={today.completed}
          icon={CheckCircle}
          color="bg-accent-green/10 text-accent-green"
        />
        <StatCard
          label="Streak atual"
          value={`${pet?.streak ?? 0} dias`}
          icon={Flame}
          color="bg-accent-amber/10 text-accent-amber"
        />
        <StatCard
          label="Pendentes"
          value={pending + inProgress}
          icon={Clock}
          color="bg-primary/10 text-primary-light"
        />
        <StatCard
          label="Nível do pet"
          value={pet?.level ?? 1}
          icon={Trophy}
          color="bg-accent-pink/10 text-accent-pink"
        />
      </div>

      {/* Today's tasks */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-3">Tarefas de hoje</h2>
        {today.total === 0 ? (
          <p className="text-sm text-text-muted">Nenhuma tarefa criada hoje ainda.</p>
        ) : (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-text-secondary">
                {today.completed} de {today.total} concluídas
              </span>
              <span className="text-sm font-medium text-primary-light">
                {Math.round((today.completed / today.total) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-bg-base rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent-pink rounded-full transition-all duration-500"
                style={{ width: `${Math.round((today.completed / today.total) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* XP progress */}
      {pet && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary mb-3">Progresso do pet</h2>
          <div className="card p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-text-primary font-medium">
                {pet.name} — Nível {pet.level}
              </span>
              <span className="text-xs text-text-muted">
                {pet.xpProgress?.current} / {pet.xpProgress?.needed} XP
              </span>
            </div>
            <div className="h-2.5 bg-bg-base rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary via-primary-light to-accent-pink rounded-full transition-all duration-700"
                style={{ width: `${pet.xpProgress?.percent ?? 0}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-2">
              {(pet.xpProgress?.needed ?? 0) - (pet.xpProgress?.current ?? 0)} XP para o próximo nível
            </p>
          </div>
        </div>
      )}

      {/* Recent tasks */}
      {tasks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary mb-3">Tarefas recentes</h2>
          <div className="flex flex-col gap-2">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="card px-4 py-2.5 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  task.status === 'completed' ? 'bg-accent-green' :
                  task.priority === 'critical' ? 'bg-accent-red' :
                  task.priority === 'high' ? 'bg-accent-amber' : 'bg-primary-light'
                }`} />
                <span className={`text-sm flex-1 truncate ${
                  task.status === 'completed' ? 'line-through text-text-muted' : 'text-text-primary'
                }`}>
                  {task.title}
                </span>
                <span className={`difficulty-${task.difficulty}`}>
                  {task.difficulty}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
