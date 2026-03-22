import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './components/Layout/Sidebar'
import Dashboard from './pages/Dashboard'
import TasksPage from './pages/TasksPage'
import NotesPage from './pages/NotesPage'
import SettingsPage from './pages/SettingsPage'
import AuditPage from './pages/AuditPage'
import CommitPage from './pages/CommitPage'
import DailyReviewPage from './pages/DailyReviewPage'
import FocusPage from './pages/FocusPage'
import AchievementsPage from './pages/AchievementsPage'
import ProjectsPage from './pages/ProjectsPage'
import AchievementToast from './components/AchievementToast'
import { usePetStore } from './stores/pet.store'
import { useTasksStore } from './stores/tasks.store'
import { useNotesStore } from './stores/notes.store'
import { useTagColorsStore } from './stores/tagColors.store'
import { useProjectsStore } from './stores/projects.store'

type Page = 'dashboard' | 'tasks' | 'projects' | 'notes' | 'settings' | 'audit' | 'commits' | 'review' | 'focus' | 'achievements'

const PAGES: Record<Page, JSX.Element> = {
  dashboard:    <Dashboard />,
  tasks:        <TasksPage />,
  projects:     <ProjectsPage />,
  notes:        <NotesPage />,
  settings:     <SettingsPage />,
  audit:        <AuditPage />,
  commits:      <CommitPage />,
  review:       <DailyReviewPage />,
  focus:        <FocusPage />,
  achievements: <AchievementsPage />,
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const { load: loadPet }        = usePetStore()
  const { load: loadTasks }      = useTasksStore()
  const { load: loadNotes }      = useNotesStore()
  const { load: loadTagColors }  = useTagColorsStore()
  const { load: loadProjects }   = useProjectsStore()

  useEffect(() => {
    Promise.all([loadPet(), loadTasks(), loadNotes(), loadTagColors(), loadProjects()])
  }, [])

  const isNotes = page === 'notes'

  const isMac = window.api.platform === 'darwin'

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-base">
      {/* macOS drag region — needed because titleBarStyle:'hiddenInset' covers the native bar */}
      {isMac && (
        <div
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
          className="h-7 flex-shrink-0 bg-bg-base border-b border-bg-border/40"
        />
      )}

      <div className="flex flex-1 overflow-hidden">
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
    </div>
  )
}
