import { useEffect, useState } from 'react'
import { History, CheckCircle, XCircle, Trash2, Plus, Pencil } from 'lucide-react'
import type { AuditLog, AuditAction } from '../../../shared/types'

const ACTION_CONFIG: Record<AuditAction, { label: string; icon: typeof CheckCircle; color: string }> = {
  created:   { label: 'Criada',    icon: Plus,         color: 'text-accent-blue' },
  updated:   { label: 'Editada',   icon: Pencil,       color: 'text-text-secondary' },
  completed: { label: 'Concluída', icon: CheckCircle,  color: 'text-accent-green' },
  cancelled: { label: 'Cancelada', icon: XCircle,      color: 'text-accent-amber' },
  deleted:   { label: 'Deletada',  icon: Trash2,       color: 'text-accent-red' },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])

  useEffect(() => {
    window.api.audit.getAll().then(setLogs)
  }, [])

  return (
    <div className="flex flex-col gap-4 h-full animate-fade-in">
      <div className="flex items-center gap-3">
        <History size={20} className="text-primary-light" />
        <h1 className="text-xl font-bold text-text-primary">Auditoria</h1>
        <span className="text-xs text-text-muted ml-auto">{logs.length} eventos</span>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <History size={36} className="text-text-muted opacity-30" />
          <p className="text-text-muted text-sm">Nenhuma atividade registrada ainda.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5">
          {logs.map((log) => {
            const cfg = ACTION_CONFIG[log.action]
            const Icon = cfg.icon
            return (
              <div key={log.id} className="card px-3 py-2.5 flex items-center gap-3">
                <Icon size={14} className={`flex-shrink-0 ${cfg.color}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-text-primary truncate block">{log.taskTitle}</span>
                  {log.details && (
                    <span className="text-xs text-text-muted">{log.details}</span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-[10px] text-text-muted">{formatDate(log.timestamp)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
