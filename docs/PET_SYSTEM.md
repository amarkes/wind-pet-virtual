# Sistema do Pet

## Filosofia

O pet não é decoração — é um espelho da sua produtividade. Quando você trabalha bem, ele fica feliz. Quando você negligencia suas tarefas, ele fica triste. Essa conexão emocional cria responsabilidade de forma leve e divertida.

## Estados de humor (PetMood)

```typescript
type PetMood = 'idle' | 'happy' | 'excited' | 'tired' | 'sad' | 'focused' | 'celebrating'
```

### Regras de transição de humor

```
idle (padrão)
  ├── +ação → happy (por 30s)
  ├── +tarefa difícil completada → excited (por 60s)
  ├── +2h sem atividade → tired
  ├── +tarefas atrasadas → sad
  └── +pomodoro iniciado → focused

happy
  └── timer 30s → idle

excited
  └── timer 60s → happy

tired
  ├── +qualquer ação → idle
  └── persiste enquanto inativo

sad
  ├── +tarefa completada → happy
  └── persiste enquanto há atraso

focused
  ├── +pomodoro pausado/parado → idle
  └── persiste durante pomodoro ativo

celebrating
  └── timer 3s → happy (após level up)
```

## Sistema de XP e Níveis

### Cálculo de XP por ação

```typescript
const XP_REWARDS = {
  task_created: 5,
  task_completed_easy: 10,
  task_completed_medium: 20,
  task_completed_hard: 35,
  task_completed_epic: 50,
  note_created: 5,
  pomodoro_completed: 15,
  daily_streak: 25,
  commit_small: 10,     // V2 - até 50 linhas
  commit_medium: 20,    // V2 - 51-200 linhas
  commit_large: 30,     // V2 - 201+ linhas (qualidade extra)
} as const
```

### Fórmula de nível

```typescript
function getLevel(xp: number): number {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000]
  return thresholds.filter(t => xp >= t).length
}

function xpToNextLevel(xp: number): { current: number; needed: number; percent: number } {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000, Infinity]
  const level = getLevel(xp)
  const currentThreshold = thresholds[level - 1]
  const nextThreshold = thresholds[level]
  return {
    current: xp - currentThreshold,
    needed: nextThreshold - currentThreshold,
    percent: ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100
  }
}
```

## Mensagens contextuais

O pet fala com você baseado em contexto. As mensagens são curtas, divertidas e em português.

### Pool de mensagens por contexto

```typescript
const PET_MESSAGES = {
  greeting_morning:    ["Bom dia! ☀️ Pronto para arrasar?", "Que dia incrível para ser produtivo!"],
  greeting_afternoon:  ["Boa tarde! Ainda há muito a fazer 💪", "Como está o ritmo hoje?"],
  greeting_evening:    ["Boa noite! Últimas tarefas do dia?", "Quase lá! Finalize com chave de ouro"],

  task_created:        ["Boa ideia! Vamos lá! 🎯", "Mais uma missão aceita!", "Anotei! Foco nessa agora?"],
  task_completed_easy: ["Feito! 👏", "Mais uma riscada da lista!", "Simples mas importante!"],
  task_completed_hard: ["INCRÍVEL! Tarefa difícil concluída! 🔥", "Você deu muito trabalho nisso! Parabéns!"],
  task_completed_epic: ["LENDÁRIO! 👑 Isso foi épico!", "Missão ÉPICA completa!! Você é fora de série!"],

  note_created:        ["Boa ideia anotar! 📝", "Guardado com carinho!", "Não ia esquecer, né? 😄"],

  pomodoro_start:      ["Modo foco ativado! 🎯 Sem distrações!", "25 min de puro foco. Você consegue!"],
  pomodoro_end:        ["Sessão concluída! Merece uma pausa ☕", "Ótimo trabalho! Descanse um pouco"],
  pomodoro_break:      ["Pausa merecida! Estique as pernas 🚶", "Hidrate-se! Volto em breve"],

  idle_long:           ["Psst... ainda estou aqui... 👀", "Saudades de você! Tudo bem?", "Hora de trabalhar? 🥺"],
  tasks_overdue:       ["Ei... algumas tarefas estão atrasadas 😰", "Tem coisa acumulando aqui..."],

  level_up:            ["LEVEL UP! 🎉 Você subiu para o nível {level}!", "Novo nível desbloqueado! Cada vez mais incrível!"],
  streak:              ["Dia {n} em sequência! Você é consistente! 🔥", "{n} dias seguidos! Hábito formado!"],

  commit_good:         ["Commit limpo e focado! Assim se faz! 💻", "Mudanças atômicas = código feliz!"],  // V2
  commit_big:          ["Esse commit ficou grandão... 😅 Tente quebrar menores", "Muitas mudanças de uma vez, hein?"],  // V2
}
```

## Animações CSS

Cada estado tem uma animação CSS associada:

```css
/* idle — float suave */
@keyframes pet-idle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* happy — pulo */
@keyframes pet-happy {
  0%, 100% { transform: translateY(0) scale(1); }
  30% { transform: translateY(-20px) scale(1.05); }
  60% { transform: translateY(-10px) scale(1.02); }
}

/* excited — giro + pulo */
@keyframes pet-excited {
  0% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-25px) rotate(-10deg); }
  75% { transform: translateY(-25px) rotate(10deg); }
  100% { transform: translateY(0) rotate(0deg); }
}

/* tired — balanço lento */
@keyframes pet-tired {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}

/* sad — balanço */
@keyframes pet-sad {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* focused — respiração suave */
@keyframes pet-focused {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}
```

## Expressões por humor (SVG)

O pet é um gato roxo SVG com expressões dinâmicas:

| Humor | Olhos | Boca |
|-------|-------|------|
| idle | Círculos normais | Linha neutra |
| happy | Arcos curvados para cima | Sorriso aberto |
| excited | Estrelas / olhos grandes | Boca aberta |
| tired | Meio fechados (rect sobre) | Linha fina |
| sad | Arcos curvados para baixo | Franze |
| focused | Olhos em squint (menores) | Linha reta |
| celebrating | Olhos em arco + estrelas | Sorriso enorme |

## Streak diário

- Incrementa quando o usuário abre o app ou completa uma tarefa no dia
- Reseta se passar um dia sem atividade
- Guardado em `pet.streak` + `pet.lastActive`

```typescript
function updateStreak(lastActive: string): { streak: number; gained: boolean } {
  const last = new Date(lastActive)
  const today = new Date()
  const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return { streak: current, gained: false }      // mesmo dia
  if (diffDays === 1) return { streak: current + 1, gained: true }   // dia seguinte
  return { streak: 1, gained: false }                                  // pulou dias
}
```
