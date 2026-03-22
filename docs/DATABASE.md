# Database

## V1 — electron-store (JSON)

Estrutura atual em `~/.config/clearup/config.json`:

```typescript
interface StoreSchema {
  tasks: Task[]
  notes: Note[]
  pet: PetState
  settings: AppSettings
}
```

### Exemplo de dados V1

```json
{
  "tasks": [
    {
      "id": "uuid-1",
      "title": "Implementar autenticação JWT",
      "description": "Usar bcrypt + refresh tokens",
      "priority": "high",
      "difficulty": "hard",
      "status": "in_progress",
      "tags": ["backend", "auth"],
      "estimatedMinutes": 120,
      "createdAt": "2026-03-22T10:00:00Z",
      "updatedAt": "2026-03-22T10:00:00Z"
    }
  ],
  "notes": [
    {
      "id": "uuid-2",
      "title": "Ideia: cache por usuário",
      "content": "Usar Redis com TTL de 15min por userId...",
      "tags": ["backend", "performance"],
      "pinned": false,
      "createdAt": "2026-03-22T11:00:00Z",
      "updatedAt": "2026-03-22T11:00:00Z"
    }
  ],
  "pet": {
    "name": "Buddy",
    "mood": "idle",
    "xp": 145,
    "level": 2,
    "streak": 3,
    "lastActive": "2026-03-22T09:00:00Z"
  },
  "settings": {
    "userName": "Antonio",
    "pomodoroMinutes": 25,
    "shortBreakMinutes": 5,
    "longBreakMinutes": 15
  }
}
```

---

## V2 — SQLite (better-sqlite3)

### Migração

A migração de electron-store → SQLite deve:
1. Ler todos os dados do JSON atual
2. Inserir nas tabelas SQLite
3. Mover o JSON para backup
4. Usar SQLite como fonte de verdade

### Schema completo

```sql
-- Tabela de tarefas
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,                        -- UUID
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',     -- pending|in_progress|completed|cancelled
  priority TEXT NOT NULL DEFAULT 'medium',    -- low|medium|high|critical
  difficulty TEXT NOT NULL DEFAULT 'medium',  -- easy|medium|hard|epic
  tags TEXT NOT NULL DEFAULT '[]',            -- JSON array
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  due_date TEXT,                              -- ISO 8601
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

-- Tabela de notas
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',            -- JSON array
  pinned INTEGER NOT NULL DEFAULT 0,          -- boolean
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Tabela de estado do pet (linha única)
CREATE TABLE pet (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT NOT NULL DEFAULT 'Buddy',
  mood TEXT NOT NULL DEFAULT 'idle',
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak INTEGER NOT NULL DEFAULT 0,
  last_active TEXT NOT NULL
);

-- Histórico de eventos do pet (para análises e gráficos)
CREATE TABLE pet_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,                         -- task_completed|note_created|commit_analyzed|level_up|...
  xp_gained INTEGER NOT NULL DEFAULT 0,
  metadata TEXT,                              -- JSON com dados extras
  created_at TEXT NOT NULL
);

-- Configurações (key-value)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Sessões Pomodoro
CREATE TABLE pomodoro_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT REFERENCES tasks(id),
  duration_minutes INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,       -- boolean
  started_at TEXT NOT NULL,
  ended_at TEXT
);

-- Commits analisados (V2 — integração Git)
CREATE TABLE git_commits (
  id TEXT PRIMARY KEY,                        -- hash do commit
  repo_path TEXT NOT NULL,
  message TEXT NOT NULL,
  lines_added INTEGER NOT NULL DEFAULT 0,
  lines_removed INTEGER NOT NULL DEFAULT 0,
  files_changed INTEGER NOT NULL DEFAULT 0,
  score INTEGER,                              -- 0-100 quality score
  feedback TEXT,                              -- feedback da IA
  committed_at TEXT NOT NULL,
  analyzed_at TEXT NOT NULL
);
```

### Índices recomendados

```sql
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_notes_created_at ON notes(created_at);
CREATE INDEX idx_pet_events_type ON pet_events(type);
CREATE INDEX idx_pet_events_created_at ON pet_events(created_at);
CREATE INDEX idx_pomodoro_started_at ON pomodoro_sessions(started_at);
```

### Consultas comuns

```sql
-- Tarefas do dia atual
SELECT * FROM tasks
WHERE DATE(created_at) = DATE('now')
ORDER BY priority DESC;

-- Score de produtividade semanal
SELECT
  DATE(created_at) as day,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) as total,
  SUM(xp_gained) as xp
FROM pet_events
WHERE created_at >= DATE('now', '-7 days')
GROUP BY day;

-- Tempo médio real vs estimado por dificuldade
SELECT
  difficulty,
  AVG(estimated_minutes) as avg_estimated,
  AVG(actual_minutes) as avg_actual
FROM tasks
WHERE status = 'completed' AND actual_minutes IS NOT NULL
GROUP BY difficulty;
```
