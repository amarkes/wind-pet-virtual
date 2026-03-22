import { Plus, Search } from 'lucide-react'
import { useNotesStore } from '../stores/notes.store'
import NoteList from '../components/Notes/NoteList'
import NoteEditor from '../components/Notes/NoteEditor'

export default function NotesPage() {
  const { create, search, setSearch } = useNotesStore()

  async function handleNew() {
    await create({ title: '', content: '', tags: [], pinned: false })
  }

  return (
    <div className="flex h-full gap-0 animate-fade-in -mx-6 -my-6">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-bg-border flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-bg-border flex items-center justify-between">
          <h1 className="text-sm font-bold text-text-primary">Notas</h1>
          <button
            onClick={handleNew}
            className="w-7 h-7 rounded-lg bg-primary hover:bg-primary-light flex items-center justify-center transition-colors"
          >
            <Plus size={14} className="text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-bg-border">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className="input-base pl-8 text-xs py-1.5"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          <NoteList />
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0 bg-bg-base">
        <NoteEditor />
      </div>
    </div>
  )
}
