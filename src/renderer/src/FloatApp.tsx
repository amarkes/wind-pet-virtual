import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PetSprite from './components/Pet/PetSprite'
import type { PetMood, PetStateWithProgress } from '../../shared/types'

const PET_MESSAGES: Record<PetMood, string[]> = {
  idle:        ['Pronto para trabalhar!', 'O que faremos hoje?'],
  happy:       ['Ótimo trabalho!', 'Continue assim!'],
  excited:     ['Uau, produtivo!', 'Que dia incrível!'],
  tired:       ['Preciso de uma pausa...', 'Cansado... 😴'],
  sad:         ['Sinto sua falta...', 'Volte logo!'],
  focused:     ['Foco total!', 'No modo produção 💪'],
  celebrating: ['Parabéns!!', '🎉 Conquistamos!'],
}

export default function FloatApp() {
  const [pet, setPet] = useState<PetStateWithProgress | null>(null)
  const [msgIndex, setMsgIndex] = useState(0)

  // Load initial pet state
  useEffect(() => {
    window.api.pet.getState().then(setPet).catch(console.error)
  }, [])

  // Listen for live pet state updates from main process
  useEffect(() => {
    const unsub = window.api.events.onPetStateUpdate((state) => {
      setPet(state)
    })
    return unsub
  }, [])

  // Rotate messages every 4s
  useEffect(() => {
    const mood = pet?.mood ?? 'idle'
    const msgs = PET_MESSAGES[mood]
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % msgs.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [pet?.mood])

  const mood = pet?.mood ?? 'idle'
  const messages = PET_MESSAGES[mood]
  const message = messages[msgIndex % messages.length]

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-between select-none overflow-hidden"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Close button */}
      <div
        className="w-full flex justify-end px-2 pt-1.5"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => window.api.float.hide()}
          className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/25 text-white/60 hover:text-white
                     flex items-center justify-center text-xs transition-colors leading-none"
          title="Fechar"
        >
          ×
        </button>
      </div>

      {/* Pet sprite — click opens main window */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="cursor-pointer"
        onClick={() => window.api.float.focusMain()}
        title="Abrir ClearUp"
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PetSprite mood={mood} size={90} />
        </motion.div>
      </div>

      {/* Message bubble */}
      <div className="w-full px-2 pb-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5 text-center"
          >
            <p className="text-[10px] text-white/90 leading-tight">{message}</p>
            {pet && (
              <p className="text-[9px] text-white/50 mt-0.5">
                Lv.{pet.level} · {pet.xpProgress.current}/{pet.xpProgress.needed} XP
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
