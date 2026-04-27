import { useState, useEffect } from 'react'
import { Trash2, Pin, PinOff, Sparkles, Loader2, ListTodo, FileText, FolderOpen, AlertCircle, X } from 'lucide-react'
import { useNotesStore } from '../../stores/notes.store'
import { useTasksStore } from '../../stores/tasks.store'
import { useAIStore } from '../../stores/ai.store'
import { useProjectsStore } from '../../stores/projects.store'
import Button from '../ui/Button'
import type { AINoteTaskSuggestion, TaskDifficulty, TaskPriority } from '../../../../shared/types'

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
}

const DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Média',
  hard: 'Difícil',
  epic: 'Épica',
}

export default function NoteEditor() {
  const { getSelected, update, remove } = useNotesStore()
  const { create: createTask } = useTasksStore()
  const { noteToTasks, summarizeNote, isLoading: aiLoading, error: aiError, clearError } = useAIStore()
  const { projects } = useProjectsStore()

  const note = getSelected()

  const [title,   setTitle]   = useState('')
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [aiMode, setAiMode]   = useState<null | 'summary' | 'tasks'>(null)
  const [extractedTasks, setExtractedTasks] = useState<AINoteTaskSuggestion[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')

  useEffect(() => {
    setTitle(note?.title ?? '')
    setContent(note?.content ?? '')
    setSummary('')
    setAiMode(null)
    setExtractedTasks([])
    setSelectedProjectId('')
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
    const tasks = await noteToTasks(content)
    setExtractedTasks(tasks)
  }

  async function handleCreateTask(task: AINoteTaskSuggestion) {
    if (!selectedProjectId) return
    await createTask({
      title: task.title,
      description: task.description,
      status: 'pending',
      priority: task.priority,
      difficulty: task.difficulty,
      estimatedMinutes: task.estimatedMinutes,
      tags: task.tags,
      projectId: selectedProjectId,
    })
    setExtractedTasks((prev) => prev.filter((candidate) => candidate !== task))
  }

  async function handleCreateAllTasks() {
    if (!selectedProjectId) return
    for (const task of extractedTasks) {
      await createTask({
        title: task.title,
        description: task.description,
        status: 'pending',
        priority: task.priority,
        difficulty: task.difficulty,
        estimatedMinutes: task.estimatedMinutes,
        tags: task.tags,
        projectId: selectedProjectId,
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

      {/* AI error banner */}
      {aiError && (
        <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
          <AlertCircle size={13} className="mt-0.5 flex-shrink-0 text-red-400" />
          <p className="flex-1 text-[11px] text-red-300 leading-snug">{aiError}</p>
          <button type="button" onClick={clearError} className="flex-shrink-0 text-red-400 hover:text-red-200 transition-colors">
            <X size={12} />
          </button>
        </div>
      )}

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
          <div className="flex items-center justify-between mb-3 gap-2">
            <p className="text-xs font-medium text-primary-light flex items-center gap-1.5">
              <Sparkles size={12} /> {extractedTasks.length} tarefas encontradas
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={handleCreateAllTasks}
                disabled={!selectedProjectId || projects.length === 0}
                className="text-[10px] text-primary-light hover:underline font-medium disabled:opacity-40 disabled:no-underline"
              >
                Criar todas
              </button>
              <button onClick={() => setAiMode(null)} className="text-text-muted hover:text-text-primary text-xs">✕</button>
            </div>
          </div>

          <div className="mb-3 flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-text-secondary">Projeto de destino</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-text-muted">
                <FolderOpen size={13} />
              </div>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="input-base text-xs"
              >
                <option value="">Selecione um projeto antes de criar</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            {projects.length === 0 ? (
              <p className="text-[11px] text-accent-amber">Crie um projeto antes de transformar notas em tarefas.</p>
            ) : !selectedProjectId ? (
              <p className="text-[11px] text-text-muted">A criação individual e em lote fica habilitada depois que você escolher um projeto.</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            {extractedTasks.map((task, index) => (
              <div key={`${task.title}-${index}`} className="rounded-lg border border-primary/15 bg-bg-card/80 p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary">{task.title}</p>
                    {task.description && (
                      <p className="mt-1 text-[11px] text-text-secondary leading-relaxed">{task.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-border text-text-secondary">
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-border text-text-secondary">
                        {DIFFICULTY_LABELS[task.difficulty]}
                      </span>
                      {task.estimatedMinutes && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-border text-text-secondary">
                          {task.estimatedMinutes} min
                        </span>
                      )}
                      {task.tags.map((tag) => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary-light">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCreateTask(task)}
                    disabled={!selectedProjectId || projects.length === 0}
                    className="text-[10px] text-primary-light hover:underline font-medium flex-shrink-0 disabled:opacity-40 disabled:no-underline"
                  >
                    + criar
                  </button>
                </div>
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
