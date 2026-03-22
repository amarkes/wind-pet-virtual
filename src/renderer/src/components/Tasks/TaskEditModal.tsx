import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import TaskEditForm from './TaskEditForm'
import type { Task } from '../../../../shared/types'

interface Props {
  task: Task | null
  onSubmit: (data: Partial<Task>) => Promise<void>
  onClose: () => void
}

export default function TaskEditModal({ task, onSubmit, onClose }: Props) {
  return createPortal(
    <AnimatePresence>
      {task && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="w-full max-w-lg pointer-events-auto">
              <TaskEditForm
                task={task}
                onSubmit={async (data) => {
                  await onSubmit(data)
                  onClose()
                }}
                onCancel={onClose}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
