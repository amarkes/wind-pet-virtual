import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePetStore } from '../../stores/pet.store'
import PetSprite from './PetSprite'

// Level 1 (bebê) → 55px … Level 8 (Lendário) → 135px
const MIN_SIZE = 55
const MAX_SIZE = 135
const MAX_LEVEL = 8

function petSizeForLevel(level: number): number {
  const clamped = Math.max(1, Math.min(level, MAX_LEVEL))
  return Math.round(MIN_SIZE + ((clamped - 1) / (MAX_LEVEL - 1)) * (MAX_SIZE - MIN_SIZE))
}

const MOOD_ANIMATION: Record<string, string> = {
  idle:        'animate-pet-idle',
  happy:       'animate-pet-happy',
  excited:     'animate-pet-excited',
  tired:       'animate-pet-tired',
  sad:         'animate-pet-sad',
  focused:     'animate-pet-focused',
  celebrating: 'animate-pet-celebrating',
  dancing:     'animate-pet-dancing',
}

// Refresh idle message every 3 minutes
const IDLE_REFRESH_MS = 3 * 60 * 1000

export default function Pet() {
  const { pet, message, refreshMessage, triggerMoodTemporary } = usePetStore()
  const mood       = pet?.mood ?? 'idle'
  const spriteSize = petSizeForLevel(pet?.level ?? 1)

  useEffect(() => {
    const id = setInterval(() => {
      if (usePetStore.getState().pet?.mood === 'idle') {
        refreshMessage()
      }
    }, IDLE_REFRESH_MS)
    return () => clearInterval(id)
  }, [refreshMessage])

  function handlePetClick() {
    if (mood !== 'dancing') triggerMoodTemporary('dancing', 6000)
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Speech bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="relative bg-bg-card border border-bg-border rounded-2xl rounded-bl-sm px-3 py-2 max-w-[160px]"
        >
          <p className="text-xs text-text-primary text-center leading-relaxed">{message}</p>
          {/* Bubble tail */}
          <div className="absolute -bottom-2 left-4 w-3 h-3 bg-bg-card border-b border-l border-bg-border rotate-45" />
        </motion.div>
      </AnimatePresence>

      {/* Pet sprite — size grows with level, click to dance */}
      <motion.div
        className={MOOD_ANIMATION[mood]}
        animate={{ width: spriteSize, height: spriteSize }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        onClick={handlePetClick}
        title="Clique para dançar!"
      >
        <PetSprite mood={mood} size={spriteSize} weight={pet?.weight ?? 1.0} />
      </motion.div>

      {/* Pet name + level */}
      {pet && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-semibold text-text-primary">{pet.name}</span>
          <span className="text-xs text-text-muted">Nível {pet.level}</span>

          {/* XP bar */}
          <div className="w-32 h-1.5 bg-bg-base rounded-full overflow-hidden mt-1">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent-pink rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pet.xpProgress?.percent ?? 0}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className="text-[10px] text-text-muted">
            {pet.xpProgress?.current ?? 0} / {pet.xpProgress?.needed ?? 100} XP
          </span>
        </div>
      )}

      {/* Streak */}
      {pet && pet.streak > 0 && (
        <div className="flex items-center gap-1 bg-accent-amber/10 border border-accent-amber/20 rounded-full px-2 py-0.5">
          <span className="text-xs">🔥</span>
          <span className="text-xs text-accent-amber font-medium">{pet.streak} dias</span>
        </div>
      )}
    </div>
  )
}
