import { LayoutDashboard, CheckSquare, FileText, Timer, Settings, History, GitCommit, BarChart2, Focus, Trophy } from 'lucide-react'
import Pet from '../Pet/Pet'

type Page = 'dashboard' | 'tasks' | 'notes' | 'timer' | 'settings' | 'audit' | 'commits' | 'review' | 'focus' | 'achievements'

interface Props {
  current: Page
  onChange: (page: Page) => void
}

const NAV_ITEMS: { id: Page; label: string; icon: typeof LayoutDashboard; section: 'main' | 'v2' | 'v3' }[] = [
  { id: 'dashboard',    label: 'Dashboard',   icon: LayoutDashboard, section: 'main' },
  { id: 'tasks',        label: 'Tarefas',     icon: CheckSquare,     section: 'main' },
  { id: 'notes',        label: 'Notas',       icon: FileText,        section: 'main' },
  { id: 'timer',        label: 'Timer',       icon: Timer,           section: 'main' },
  { id: 'commits',      label: 'Commits',     icon: GitCommit,       section: 'v2'   },
  { id: 'review',       label: 'Review',      icon: BarChart2,       section: 'v2'   },
  { id: 'audit',        label: 'Auditoria',   icon: History,         section: 'v2'   },
  { id: 'focus',        label: 'Foco',        icon: Focus,           section: 'v3'   },
  { id: 'achievements', label: 'Conquistas',  icon: Trophy,          section: 'v3'   },
  { id: 'settings',     label: 'Config',      icon: Settings,        section: 'main' },
]

export default function Sidebar({ current, onChange }: Props) {
  const mainItems = NAV_ITEMS.filter((i) => i.section === 'main')
  const v2Items   = NAV_ITEMS.filter((i) => i.section === 'v2')
  const v3Items   = NAV_ITEMS.filter((i) => i.section === 'v3')

  return (
    <aside className="w-52 flex-shrink-0 bg-bg-base border-r border-bg-border flex flex-col h-full">
      {/* Pet area */}
      <div className="border-b border-bg-border">
        <Pet />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        {mainItems.map(({ id, label, icon: Icon }) => (
          <NavButton key={id} id={id} label={label} Icon={Icon} active={current === id} onChange={onChange} />
        ))}

        {/* V2 — IA section */}
        <div className="mt-3 mb-1 px-2">
          <span className="text-[9px] font-semibold text-text-muted uppercase tracking-widest flex items-center gap-1">
            ✨ IA
          </span>
        </div>
        {v2Items.map(({ id, label, icon: Icon }) => (
          <NavButton key={id} id={id} label={label} Icon={Icon} active={current === id} onChange={onChange} />
        ))}

        {/* V3 — Produtividade section */}
        <div className="mt-3 mb-1 px-2">
          <span className="text-[9px] font-semibold text-text-muted uppercase tracking-widest flex items-center gap-1">
            🏆 Pro
          </span>
        </div>
        {v3Items.map(({ id, label, icon: Icon }) => (
          <NavButton key={id} id={id} label={label} Icon={Icon} active={current === id} onChange={onChange} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-bg-border">
        <p className="text-[10px] text-text-muted text-center">ClearUp v0.3.0</p>
      </div>
    </aside>
  )
}

function NavButton({
  id, label, Icon, active, onChange,
}: {
  id: string
  label: string
  Icon: typeof LayoutDashboard
  active: boolean
  onChange: (p: Page) => void
}) {
  return (
    <button
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
}
