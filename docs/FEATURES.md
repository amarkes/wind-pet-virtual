# Features — Especificação Completa

## V1 — Core (atual)

### 🐱 Pet Virtual

**Estados do pet (PetMood):**

| Estado | Trigger | Comportamento visual |
|--------|---------|---------------------|
| `idle` | Padrão / sem atividade | Float suave (sobe e desce) |
| `happy` | Completou tarefa / criou nota | Pula e sorri |
| `excited` | Completou tarefa difícil / streak | Gira + pula + estrelas |
| `tired` | Mais de 2h sem atividade | Inclina + olhos meio fechados |
| `sad` | Tarefas atrasadas / nenhuma tarefa por 1 dia | Balança + franze sobrancelha |
| `focused` | Timer Pomodoro ativo | Olhos determinados, quieto |
| `celebrating` | Subiu de nível / milestone | Confetti + pulo alto |

**Sistema de XP:**

| Ação | XP |
|------|----|
| Criar tarefa | +5 |
| Completar tarefa fácil | +10 |
| Completar tarefa média | +20 |
| Completar tarefa difícil | +35 |
| Completar tarefa épica | +50 |
| Criar nota | +5 |
| Completar sessão Pomodoro | +15 |
| Streak diário (+1 dia) | +25 |

**Níveis:**

| Nível | XP necessário | Título |
|-------|--------------|--------|
| 1 | 0 | Iniciante |
| 2 | 100 | Aprendiz |
| 3 | 250 | Focado |
| 4 | 500 | Produtivo |
| 5 | 1.000 | Dedicado |
| 6 | 2.000 | Expert |
| 7 | 4.000 | Mestre |
| 8 | 8.000 | Lendário |

**Mensagens contextuais do pet:**
- Ao abrir o app: `"Bom dia! Pronto para arrasar hoje?"`
- Ao completar tarefa difícil: `"UAAAU! Você é incrível! 🎉"`
- Ao ficar idle >2h: `"Psst... ainda estou aqui..."`
- Ao criar nota: `"Boa ideia anotar isso!"`
- Ao iniciar Pomodoro: `"Modo foco ativado. Sem distrações!"`

---

### ✅ Gestão de Tarefas

**Campos de uma tarefa:**
- `title` — título obrigatório
- `description` — detalhe opcional
- `priority` — `low | medium | high | critical`
- `difficulty` — `easy | medium | hard | epic`
- `status` — `pending | in_progress | completed | cancelled`
- `dueDate` — data limite (opcional)
- `estimatedMinutes` — estimativa em minutos
- `tags` — array de strings

**Funcionalidades V1:**
- [ ] Criar tarefa com título e prioridade
- [ ] Marcar como concluída
- [ ] Editar tarefa
- [ ] Deletar tarefa
- [ ] Filtrar por status (all / pending / completed)
- [ ] Ordenar por prioridade

**Funcionalidades V2 (com IA):**
- [ ] Estimativa automática de tempo baseada em histórico
- [ ] Sugestão de dificuldade baseada no título
- [ ] Quebrar tarefa épica em subtarefas
- [ ] Detectar tarefas bloqueadas / atrasadas

---

### 📝 Notas

**Campos de uma nota:**
- `title` — título opcional
- `content` — texto livre (markdown suportado)
- `tags` — array de strings
- `pinned` — booleana

**Funcionalidades V1:**
- [ ] Criar nota rapidamente
- [ ] Editar nota
- [ ] Deletar nota
- [ ] Fixar nota (pinned)
- [ ] Busca por texto

**Funcionalidades V2:**
- [ ] IA transforma anotações soltas em tarefas
- [ ] Resumo automático de notas longas
- [ ] Captura via hotkey global (sem abrir o app)

---

### ⏱ Timer Pomodoro

**Configuração:**
- Foco: 25 min (padrão configurável)
- Pausa curta: 5 min
- Pausa longa: 15 min (a cada 4 pomodoros)

**Funcionalidades V1:**
- [ ] Iniciar / pausar / parar timer
- [ ] Contador visual
- [ ] Notificação ao fim de sessão
- [ ] Pet muda para modo `focused` durante sessão

---

### ⚙️ Configurações

- Nome do usuário (exibido no dashboard)
- Nome do pet
- Tema (dark / light — V2)
- Duração do Pomodoro

---

## V2 — Inteligência (Claude API)

### 🔍 Análise de Commits

**Trigger:** Usuário abre o app após fazer commits, ou clica em "Analisar commits"

**O que analisa:**
- Quantidade de linhas adicionadas/removidas
- Qualidade da mensagem do commit (convencional commits?)
- Frequência de commits no dia
- Detecta "big bang commits" (tudo de uma vez)
- Complexidade da mudança

**Feedback do pet:**
```
Commit pequeno e focado (+15 linhas, mensagem clara)
→ "Ótimo commit! Mudanças atômicas são o caminho! 💪"

Commit enorme sem descrição (+800 linhas, msg: "fix")
→ "Ei... esse commit ficou enorme. Tente quebrá-los menores da próxima vez 😬"
```

### 🧠 Estimativa Inteligente de Tarefas

- Claude analisa o título da tarefa + histórico pessoal
- Sugere: dificuldade, tempo estimado, dependências
- Aprende com o tempo (quando real ≠ estimado)

### 📊 Daily Review

- Ao final do dia (ou ao fechar), gera um resumo:
  - X tarefas completadas de Y criadas
  - Z horas em modo foco
  - Score de produtividade (0-100)
  - Mensagem personalizada do pet

---

## V3 — Avançado

### 🖥 Monitoramento de Foco

- Usa `active-win` para detectar qual app está em foco
- Pet fica "preocupado" se YouTube/redes sociais > 30min
- Relatório semanal: onde foi o seu tempo

### 🐾 Pet Flutuante

- Janela secundária sempre visível (no topo de outras janelas)
- Pet fica no canto da tela
- Clica nele para abrir o app principal
- Mostra notificações inline

### 🎮 Gamificação Avançada

- Conquistas desbloqueáveis
- Sequências semanais
- Comparação histórica ("melhor semana")
- Exportar relatório PDF semanal
