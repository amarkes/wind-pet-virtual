import { LayoutDashboard, CheckSquare, FileText, Timer, Settings } from 'lucide-react'
import Pet from '../Pet/Pet'

type Page = 'dashboard' | 'tasks' | 'notes' | 'timer' | 'settings'

interface Props {
  current: Page
  onChange: (page: Page) => void
}

const NAV_ITEMS: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'tasks',     label: 'Tarefas',    icon: CheckSquare },
  { id: 'notes',     label: 'Notas',      icon: FileText },
  { id: 'timer',     label: 'Timer',      icon: Timer },
  { id: 'settings',  label: 'Config',     icon: Settings },
]

export default function Sidebar({ current, onChange }: Props) {
  return (
    <aside className="w-52 flex-shrink-0 bg-bg-base border-r border-bg-border flex flex-col h-full">
      {/* Pet area */}
      <div className="border-b border-bg-border">
        <Pet />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = current === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left
                transition-all duration-150
                ${active
                  ? 'bg-primary/15 text-primary-light border border-primary/20'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }
              `}
            >
              <Icon size={16} className="flex-shrink-0" />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-bg-border">
        <p className="text-[10px] text-text-muted text-center">ClearUp v0.1.0</p>
      </div>
    </aside>
  )
}
