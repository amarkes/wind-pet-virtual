import { registerTasksIpc } from './tasks'
import { registerNotesIpc } from './notes'
import { registerPetIpc } from './pet'
import { registerAiIpc } from './ai'
import { registerFocusIpc } from './focus'
import { registerAchievementsIpc } from './achievements'

export function registerAllIpc(): void {
  registerTasksIpc()
  registerNotesIpc()
  registerPetIpc()
  registerAiIpc()
  registerFocusIpc()
  registerAchievementsIpc()
}
