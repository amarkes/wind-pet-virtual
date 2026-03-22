import { useState, useEffect } from 'react'
import { Trash2, Pin, PinOff } from 'lucide-react'
import { useNotesStore } from '../../stores/notes.store'
import Button from '../ui/Button'

export default function NoteEditor() {
  const { getSelected, update, remove } = useNotesStore()
  const note = getSelected()

  const [title,   setTitle]   = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    setTitle(note?.title ?? '')
    setContent(note?.content ?? '')
  }, [note?.id])

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
        Selecione ou crie uma nota
      </div>
    )
  }

  function handleBlurTitle() {
    if (title !== note!.title) update(note!.id, { title: title || undefined })
  }

  function handleBlurContent() {
    if (content !== note!.content) update(note!.id, { content })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-bg-border">
        <span className="text-[11px] text-text-muted">
          {new Date(note.updatedAt).toLocaleString('pt-BR')}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => update(note.id, { pinned: !note.pinned })}
            title={note.pinned ? 'Desafixar' : 'Fixar'}
          >
            {note.pinned ? <PinOff size={13} /> : <Pin size={13} />}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => remove(note.id)}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-h-0 p-5 gap-3">
        <input
          className="bg-transparent text-lg font-semibold text-text-primary outline-none placeholder:text-text-muted"
          placeholder="Título da nota..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleBlurTitle}
        />
        <textarea
          className="flex-1 bg-transparent text-sm text-text-primary outline-none resize-none
                     placeholder:text-text-muted leading-relaxed font-mono"
          placeholder="Escreva aqui... (suporta markdown)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlurContent}
        />
      </div>
    </div>
  )
}
