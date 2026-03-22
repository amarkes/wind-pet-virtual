import { useState, useEffect } from 'react'
import { Save, Eye, EyeOff, FolderOpen } from 'lucide-react'
import { usePetStore } from '../stores/pet.store'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import type { AppSettings } from '../../../shared/types'

export default function SettingsPage() {
  const { pet } = usePetStore()
  const [settings, setSettings] = useState<AppSettings>({
    userName: '',
    geminiApiKey: '',
    workingDirectory: '',
    commitAnalysisLimit: 1,
  })
  const [petName, setPetName]   = useState(pet?.name ?? 'Buddy')
  const [saved, setSaved]       = useState(false)
  const [showKey, setShowKey]   = useState(false)

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

      {/* Anthropic AI */}
      <section className="card p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-text-secondary">Inteligência Artificial</h2>
          <p className="text-xs text-text-muted mt-1">
            Necessária para sugestões de tarefas, análise de commits e review diário.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary font-medium">Gemini API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              className="input-base pr-10 font-mono text-xs"
              placeholder="AIza..."
              value={settings.geminiApiKey ?? ''}
              onChange={(e) => set('geminiApiKey', e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <p className="text-[10px] text-text-muted">
            A chave fica salva localmente e nunca é enviada a servidores externos.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary font-medium">Diretório do repositório Git</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="input-base flex-1 text-xs font-mono"
              placeholder="/Users/você/projetos/meu-repo"
              value={settings.workingDirectory ?? ''}
              onChange={(e) => set('workingDirectory', e.target.value)}
            />
            <button
              type="button"
              onClick={async () => {
                const dir = await window.api.dialog.openDirectory()
                if (dir) set('workingDirectory', dir)
              }}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-bg-border bg-bg-card
                         text-text-secondary hover:text-text-primary hover:border-primary/40
                         transition-colors"
              title="Selecionar pasta"
            >
              <FolderOpen size={13} />
            </button>
          </div>
          <p className="text-[10px] text-text-muted">
            Usado na análise de commits da página Commits.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary font-medium">Commits a analisar</label>
          <input
            type="number"
            className="input-base w-24"
            min="1"
            max="50"
            value={settings.commitAnalysisLimit}
            onChange={(e) => set('commitAnalysisLimit', parseInt(e.target.value) || 1)}
          />
          <p className="text-[10px] text-text-muted">
            Padrão 1 (último commit). Aumente para analisar mais — cada commit adicional consome mais tokens.
          </p>
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
