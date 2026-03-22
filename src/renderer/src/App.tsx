import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './components/Layout/Sidebar'
import Dashboard from './pages/Dashboard'
import TasksPage from './pages/TasksPage'
import NotesPage from './pages/NotesPage'
import TimerPage from './pages/TimerPage'
import SettingsPage from './pages/SettingsPage'
import AuditPage from './pages/AuditPage'
import CommitPage from './pages/CommitPage'
import DailyReviewPage from './pages/DailyReviewPage'
import FocusPage from './pages/FocusPage'
import AchievementsPage from './pages/AchievementsPage'
import AchievementToast from './components/AchievementToast'
import { usePetStore } from './stores/pet.store'
import { useTasksStore } from './stores/tasks.store'
import { useNotesStore } from './stores/notes.store'

type Page = 'dashboard' | 'tasks' | 'notes' | 'timer' | 'settings' | 'audit' | 'commits' | 'review' | 'focus' | 'achievements'

const PAGES: Record<Page, JSX.Element> = {
  dashboard:    <Dashboard />,
  tasks:        <TasksPage />,
  notes:        <NotesPage />,
  timer:        <TimerPage />,
  settings:     <SettingsPage />,
  audit:        <AuditPage />,
  commits:      <CommitPage />,
  review:       <DailyReviewPage />,
  focus:        <FocusPage />,
  achievements: <AchievementsPage />,
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const { load: loadPet } = usePetStore()
  const { load: loadTasks } = useTasksStore()
  const { load: loadNotes } = useNotesStore()

  useEffect(() => {
    Promise.all([loadPet(), loadTasks(), loadNotes()])
  }, [])

  const isNotes = page === 'notes'

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <AchievementToast />
      <Sidebar current={page} onChange={setPage} />

      <main className={`flex-1 overflow-hidden ${isNotes ? '' : 'overflow-y-auto p-6'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
            className={isNotes ? 'h-full' : ''}
          >
            {PAGES[page]}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
