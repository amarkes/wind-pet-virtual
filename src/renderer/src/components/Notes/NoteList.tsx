import { FileText, Pin } from 'lucide-react'
import { useNotesStore } from '../../stores/notes.store'

export default function NoteList() {
  const { getFiltered, selectedId, select } = useNotesStore()
  const notes = getFiltered()

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
        <FileText size={28} className="text-text-muted opacity-30" />
        <p className="text-xs text-text-muted">Nenhuma nota ainda.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {notes.map((note) => {
        const active = note.id === selectedId
        const preview = note.content.slice(0, 80).replace(/\n/g, ' ')

        return (
          <button
            key={note.id}
            onClick={() => select(note.id)}
            className={`
              w-full text-left p-3 rounded-lg transition-colors duration-150
              ${active ? 'bg-primary/10 border border-primary/20' : 'hover:bg-bg-hover'}
            `}
          >
            <div className="flex items-center gap-1.5 mb-1">
              {note.pinned && <Pin size={10} className="text-accent-amber flex-shrink-0" />}
              <span className="text-sm font-medium text-text-primary truncate">
                {note.title || 'Sem título'}
              </span>
            </div>
            <p className="text-xs text-text-muted truncate">{preview || 'Nota vazia...'}</p>
            <p className="text-[10px] text-text-muted mt-1">
              {new Date(note.updatedAt).toLocaleDateString('pt-BR')}
            </p>
          </button>
        )
      })}
    </div>
  )
}
