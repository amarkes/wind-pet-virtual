import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { usePetStore } from '../stores/pet.store'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import type { AppSettings } from '../../../shared/types'

export default function SettingsPage() {
  const { pet } = usePetStore()
  const [settings, setSettings] = useState<AppSettings>({
    userName: '',
    pomodoroMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
  })
  const [petName, setPetName] = useState(pet?.name ?? 'Buddy')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.settings.get().then(setSettings)
  }, [])

  useEffect(() => {
    if (pet) setPetName(pet.name)
  }, [pet?.name])

  async function handleSave() {
    await window.api.settings.update(settings)
    await window.api.pet.setMood('happy')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  return (
    <div className="flex flex-col gap-6 max-w-md animate-fade-in">
      <h1 className="text-xl font-bold text-text-primary">Configurações</h1>

      {/* Profile */}
      <section className="card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-text-secondary">Perfil</h2>
        <Input
          label="Seu nome"
          placeholder="Como devo te chamar?"
          value={settings.userName}
          onChange={(e) => set('userName', e.target.value)}
        />
        <Input
          label="Nome do pet"
          placeholder="Nome do seu pet"
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
        />
      </section>

      {/* Pomodoro */}
      <section className="card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-text-secondary">Pomodoro</h2>
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Foco (min)"
            type="number"
            min="1"
            max="120"
            value={settings.pomodoroMinutes}
            onChange={(e) => set('pomodoroMinutes', parseInt(e.target.value))}
          />
          <Input
            label="Pausa curta"
            type="number"
            min="1"
            max="30"
            value={settings.shortBreakMinutes}
            onChange={(e) => set('shortBreakMinutes', parseInt(e.target.value))}
          />
          <Input
            label="Pausa longa"
            type="number"
            min="1"
            max="60"
            value={settings.longBreakMinutes}
            onChange={(e) => set('longBreakMinutes', parseInt(e.target.value))}
          />
        </div>
      </section>

      {/* Pet info */}
      {pet && (
        <section className="card p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">Status do pet</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-text-muted text-xs">Nível</p>
              <p className="text-text-primary font-medium">{pet.level}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">XP total</p>
              <p className="text-text-primary font-medium">{pet.xp}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Streak</p>
              <p className="text-text-primary font-medium">{pet.streak} dias 🔥</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Humor</p>
              <p className="text-text-primary font-medium capitalize">{pet.mood}</p>
            </div>
          </div>
        </section>
      )}

      <Button onClick={handleSave} className="self-start">
        <Save size={14} />
        {saved ? 'Salvo! ✓' : 'Salvar configurações'}
      </Button>
    </div>
  )
}
