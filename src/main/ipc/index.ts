import { registerTasksIpc } from './tasks'
import { registerNotesIpc } from './notes'
import { registerPetIpc } from './pet'

export function registerAllIpc(): void {
  registerTasksIpc()
  registerNotesIpc()
  registerPetIpc()
}
