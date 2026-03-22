# Arquitetura

## Visão geral

O ClearUp segue a arquitetura padrão do Electron com separação clara de responsabilidades entre os três contextos de execução.

```
┌─────────────────────────────────────────────────────────┐
│                    ELECTRON MAIN                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │  IPC Handlers│  │   Services   │  │  electron-    │ │
│  │  tasks.ts    │  │  store.svc   │  │  store (JSON) │ │
│  │  notes.ts    │  │  pet.svc     │  │               │ │
│  │  pet.ts      │  │  git.svc(V2) │  └───────────────┘ │
│  └──────┬───────┘  └──────────────┘                    │
└─────────┼───────────────────────────────────────────────┘
          │ IPC (ipcMain.handle / ipcRenderer.invoke)
┌─────────┼───────────────────────────────────────────────┐
│         │         PRELOAD (contextBridge)                │
│  window.api = { tasks, notes, pet, settings }           │
└─────────┼───────────────────────────────────────────────┘
          │
┌─────────┼───────────────────────────────────────────────┐
│         ▼         RENDERER (React)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Stores    │  │  Components  │  │    Pages      │  │
│  │  pet.store  │  │  Pet/        │  │  Dashboard    │  │
│  │ tasks.store │  │  Tasks/      │  │  Tasks        │  │
│  │ notes.store │  │  Notes/      │  │  Notes        │  │
│  └─────────────┘  │  Layout/     │  │  Settings     │  │
│                   │  ui/         │  └───────────────┘  │
│                   └──────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

## Fluxo de dados

### Leitura (ex: carregar tarefas)
```
Page mounted
  → store.loadTasks()
    → window.api.tasks.getAll()         [renderer]
      → ipcRenderer.invoke('tasks:getAll')  [preload]
        → ipcMain.handle('tasks:getAll')    [main]
          → storeService.get('tasks')
            → retorna Task[]
  ← store atualiza estado
  ← componentes re-renderizam
```

### Escrita (ex: criar tarefa)
```
TaskForm.submit(data)
  → store.createTask(data)
    → window.api.tasks.create(data)
      → ipcMain.handle('tasks:create')
        → storeService.addTask(data)
        → petService.addXP(5)            ← pet ganha XP
        → retorna Task criada
  ← store adiciona tarefa ao estado local
  ← pet atualiza humor se necessário
```

## Segurança

- `contextIsolation: true` — renderer não tem acesso direto ao Node.js
- `nodeIntegration: false` — proteção contra XSS/RCE
- Preload expõe apenas métodos específicos via `contextBridge`
- Dados persistidos localmente apenas (sem servidor externo na V1)

## Persistência (V1 vs V2)

### V1 — electron-store (JSON)
```json
{
  "tasks": [...],
  "notes": [...],
  "pet": { "name": "Buddy", "mood": "idle", "xp": 0, "level": 1 },
  "settings": { "userName": "", "theme": "dark" }
}
```
**Limitação:** sem consultas complexas, sem histórico de eventos

### V2 — SQLite (better-sqlite3)
- Tabelas normalizadas (ver `DATABASE.md`)
- Consultas por período, prioridade, tags
- Histórico de eventos do pet
- Relatórios de produtividade

## Módulos futuros (V2/V3)

| Módulo | Processo | Descrição |
|--------|----------|-----------|
| `git.service.ts` | main | Analisa commits via `simple-git` |
| `claude.service.ts` | main | Chama Claude API para análises |
| `focus.service.ts` | main | Monitora app ativo via `active-win` |
| `timer.service.ts` | main | Gerencia timers Pomodoro com notificações |
| `widget.window.ts` | main | Janela flutuante do pet (sempre no topo) |

## Convenções de IPC

Canais seguem o padrão `namespace:action`:
- `tasks:getAll`, `tasks:create`, `tasks:update`, `tasks:delete`, `tasks:complete`
- `notes:getAll`, `notes:create`, `notes:update`, `notes:delete`
- `pet:getState`, `pet:addXP`
- `settings:get`, `settings:update`
