import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Achievement } from '../../../shared/types'

export default function AchievementToast() {
  const [queue, setQueue] = useState<Achievement[]>([])

  useEffect(() => {
    const unsub = window.api.events.onAchievementUnlocked((achievement) => {
      setQueue((prev) => [...prev, achievement])
    })
    return unsub
  }, [])

  function dismiss(id: string) {
    setQueue((prev) => prev.filter((a) => a.id !== id))
  }

  // Auto-dismiss after 5s
  useEffect(() => {
    if (queue.length === 0) return
    const timer = setTimeout(() => {
      setQueue((prev) => prev.slice(1))
    }, 5000)
    return () => clearTimeout(timer)
  }, [queue])

  const current = queue[0]

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <AnimatePresence>
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto card border-accent-amber/40 bg-bg-card/95 backdrop-blur
                       flex items-center gap-3 px-4 py-3 shadow-xl min-w-60"
          >
            <span className="text-2xl flex-shrink-0">{current.icon}</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-accent-amber">Conquista desbloqueada!</p>
              <p className="text-sm font-bold text-text-primary">{current.title}</p>
              <p className="text-xs text-text-muted">{current.description}</p>
            </div>
            <button
              onClick={() => dismiss(current.id)}
              className="text-text-muted hover:text-text-primary transition-colors text-lg leading-none ml-1"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
