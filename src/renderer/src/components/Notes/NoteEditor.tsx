import { useState, useEffect } from 'react'
import { Trash2, Pin, PinOff, Sparkles, Loader2, ListTodo, FileText } from 'lucide-react'
import { useNotesStore } from '../../stores/notes.store'
import { useTasksStore } from '../../stores/tasks.store'
import { useAIStore } from '../../stores/ai.store'
import Button from '../ui/Button'

export default function NoteEditor() {
  const { getSelected, update, remove } = useNotesStore()
  const { create: createTask } = useTasksStore()
  const { noteToTasks, summarizeNote, isLoading: aiLoading } = useAIStore()

  const note = getSelected()

  const [title,   setTitle]   = useState('')
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [aiMode, setAiMode]   = useState<null | 'summary' | 'tasks'>(null)
  const [extractedTasks, setExtractedTasks] = useState<string[]>([])

  useEffect(() => {
    setTitle(note?.title ?? '')
    setContent(note?.content ?? '')
    setSummary('')
    setAiMode(null)
    setExtractedTasks([])
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

  async function handleSummarize() {
    if (!content.trim()) return
    setAiMode('summary')
    const result = await summarizeNote(content)
    setSummary(result)
  }

  async function handleExtractTasks() {
    if (!content.trim()) return
    setAiMode('tasks')
    const titles = await noteToTasks(content)
    setExtractedTasks(titles)
  }

  async function handleCreateTask(taskTitle: string) {
    await createTask({
      title: taskTitle,
      status: 'pending',
      priority: 'medium',
      difficulty: 'medium',
      tags: [],
    })
    setExtractedTasks((prev) => prev.filter((t) => t !== taskTitle))
  }

  async function handleCreateAllTasks() {
    for (const t of extractedTasks) {
      await createTask({
        title: t,
        status: 'pending',
        priority: 'medium',
        difficulty: 'medium',
        tags: [],
      })
    }
    setExtractedTasks([])
    setAiMode(null)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-bg-border flex-wrap gap-2">
        <span className="text-[11px] text-text-muted">
          {new Date(note.updatedAt).toLocaleString('pt-BR')}
        </span>
        <div className="flex items-center gap-1">
          {/* AI: summarize */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSummarize}
            disabled={aiLoading || !content.trim()}
            title="Resumir nota com IA"
          >
            {aiLoading && aiMode === 'summary'
              ? <Loader2 size={13} className="animate-spin" />
              : <FileText size={13} />
            }
          </Button>

          {/* AI: extract tasks */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExtractTasks}
            disabled={aiLoading || !content.trim()}
            title="Extrair tarefas com IA"
          >
            {aiLoading && aiMode === 'tasks'
              ? <Loader2 size={13} className="animate-spin" />
              : <ListTodo size={13} />
            }
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => update(note.id, { pinned: !note.pinned })}
            title={note.pinned ? 'Desafixar' : 'Fixar'}
          >
            {note.pinned ? <PinOff size={13} /> : <Pin size={13} />}
          </Button>
          <Button variant="danger" size="sm" onClick={() => remove(note.id)}>
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {/* AI result panels */}
      {aiMode === 'summary' && summary && (
        <div className="mx-5 mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20 flex gap-2">
          <Sparkles size={14} className="text-primary-light flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-primary-light mb-1">Resumo da IA</p>
            <p className="text-xs text-text-secondary leading-relaxed">{summary}</p>
          </div>
          <button onClick={() => setAiMode(null)} className="text-text-muted hover:text-text-primary text-xs self-start">✕</button>
        </div>
      )}

      {aiMode === 'tasks' && extractedTasks.length > 0 && (
        <div className="mx-5 mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-primary-light flex items-center gap-1.5">
              <Sparkles size={12} /> {extractedTasks.length} tarefas encontradas
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={handleCreateAllTasks}
                className="text-[10px] text-primary-light hover:underline font-medium"
              >
                Criar todas
              </button>
              <button onClick={() => setAiMode(null)} className="text-text-muted hover:text-text-primary text-xs">✕</button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {extractedTasks.map((t) => (
              <div key={t} className="flex items-center gap-2">
                <span className="text-xs text-text-secondary flex-1 truncate">{t}</span>
                <button
                  onClick={() => handleCreateTask(t)}
                  className="text-[10px] text-primary-light hover:underline font-medium flex-shrink-0"
                >
                  + criar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {aiMode === 'tasks' && !aiLoading && extractedTasks.length === 0 && (
        <div className="mx-5 mt-4 p-3 rounded-lg bg-bg-card border border-bg-border">
          <p className="text-xs text-text-muted">Nenhuma tarefa encontrada na nota.</p>
        </div>
      )}

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
