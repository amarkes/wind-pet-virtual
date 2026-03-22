import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  confirmClassName: string
  onConfirm: () => void
  onClose: () => void
}

export default function TaskConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  confirmClassName,
  onConfirm,
  onClose,
}: Props) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="w-full max-w-sm pointer-events-auto rounded-2xl border border-bg-border bg-bg-card p-5 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl border border-accent-amber/20 bg-accent-amber/10 p-2">
                  <AlertTriangle size={16} className="text-accent-amber" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">{message}</p>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-ghost rounded-lg px-3 py-1.5 text-sm text-text-muted"
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${confirmClassName}`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
