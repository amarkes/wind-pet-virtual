import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import type { Achievement } from '../../../shared/types'

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    window.api.achievements.getAll().then((a) => {
      setAchievements(a)
      setLoading(false)
    })

    const unsub = window.api.events.onAchievementUnlocked((newA) => {
      setAchievements((prev) =>
        prev.map((a) => (a.id === newA.id ? newA : a))
      )
    })
    return unsub
  }, [])

  const unlocked = achievements.filter((a) => a.unlockedAt).length

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-accent-amber/20">
          <Trophy size={20} className="text-accent-amber" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Conquistas</h1>
          <p className="text-sm text-text-muted">{unlocked}/{achievements.length} desbloqueadas</p>
        </div>

        {/* Progress bar */}
        <div className="ml-auto flex-1 max-w-36">
          <div className="h-2 bg-bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent-amber rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${achievements.length > 0 ? (unlocked / achievements.length) * 100 : 0}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-text-muted py-12">Carregando...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {achievements.map((a, i) => (
            <AchievementCard key={a.id} achievement={a} delay={i * 0.04} />
          ))}
        </div>
      )}
    </div>
  )
}

function AchievementCard({ achievement, delay }: { achievement: Achievement; delay: number }) {
  const unlocked = !!achievement.unlockedAt

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`card p-4 flex flex-col gap-2 transition-all duration-200
        ${unlocked
          ? 'border-accent-amber/30 bg-accent-amber/5'
          : 'opacity-50 grayscale'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <span className="text-2xl">{achievement.icon}</span>
        {unlocked && (
          <span className="text-[9px] font-semibold text-accent-amber bg-accent-amber/10
                           px-1.5 py-0.5 rounded-full">
            ✓
          </span>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-text-primary">{achievement.title}</p>
        <p className="text-xs text-text-muted mt-0.5 leading-snug">{achievement.description}</p>
      </div>

      {unlocked && achievement.unlockedAt && (
        <p className="text-[9px] text-text-muted mt-auto">
          {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
        </p>
      )}
    </motion.div>
  )
}
