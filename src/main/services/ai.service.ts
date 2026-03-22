import { GoogleGenAI } from '@google/genai'
import simpleGit from 'simple-git'
import type {
  AISuggestion,
  CommitAnalysis,
  CommitInfo,
  CommitReview,
  DailyReview,
  Task,
  TaskDifficulty,
  PetMood,
} from '../../shared/types'

const MODEL = 'gemini-2.5-flash'

function makeAI(apiKey: string) {
  return new GoogleGenAI({ apiKey })
}

async function generate(apiKey: string, system: string, prompt: string): Promise<string> {
  const ai = makeAI(apiKey)
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { systemInstruction: system },
  })
  return (response.text ?? '').trim().replace(/^```json\n?|\n?```$/g, '')
}

// ── Task Suggestion ────────────────────────────────────────────────────────

export async function suggestTask(apiKey: string, title: string, description?: string): Promise<AISuggestion> {
  const text = await generate(apiKey,
    `Você é um assistente de produtividade que analisa tarefas e sugere melhorias.
Analise o título e a descrição fornecidos e retorne um JSON com:
- difficulty: "easy" | "medium" | "hard" | "epic"
- estimatedMinutes: número inteiro positivo
- reasoning: breve explicação da dificuldade em português (max 1 frase)
- improvedTitle: título melhorado — mais claro, acionável e específico (em português)
- improvedDescription: prompt de desenvolvimento pronto para colar em ferramentas de IA (Cursor, Claude, ChatGPT) — deve ser imperativo ("Implemente...", "Corrija...", "Crie..."), incluir contexto técnico inferido do título, e terminar com critérios de aceite objetivos; máximo 3 frases em português; não use markdown
- suggestedTags: array de 2 a 4 tags em minúsculas (exemplos: "bug", "frontend", "backend", "docs", "reunião", "refactor", "fix", "feature", "ux", "teste")

Responda apenas com JSON válido, sem markdown.`,
    `Título: "${title}"${description ? `\nDescrição: ${description}` : ''}`,
  )

  const parsed = JSON.parse(text) as {
    difficulty: TaskDifficulty
    estimatedMinutes: number
    reasoning: string
    improvedTitle?: string
    improvedDescription?: string
    suggestedTags?: string[]
  }
  return {
    difficulty: parsed.difficulty ?? 'medium',
    estimatedMinutes: parsed.estimatedMinutes ?? 30,
    reasoning: parsed.reasoning ?? '',
    improvedTitle: parsed.improvedTitle,
    improvedDescription: parsed.improvedDescription,
    suggestedTags: parsed.suggestedTags ?? [],
  }
}

// ── Break Into Subtasks ────────────────────────────────────────────────────

export async function breakIntoSubtasks(
  apiKey: string,
  taskTitle: string,
  taskDescription?: string,
): Promise<string[]> {
  const text = await generate(apiKey,
    `Você é um assistente de produtividade. Quebre a tarefa fornecida em 3 a 6 subtarefas concretas e acionáveis.
Responda apenas com JSON: array de strings com os títulos das subtarefas em português, sem markdown.`,
    `Tarefa: "${taskTitle}"${taskDescription ? `\nDescrição: ${taskDescription}` : ''}`,
  )
  return JSON.parse(text) as string[]
}

// ── Commit Analysis ────────────────────────────────────────────────────────

export async function analyzeCommits(
  apiKey: string,
  repoPath: string,
  limit = 10,
): Promise<CommitAnalysis> {
  const git = simpleGit(repoPath)
  const log = await git.log({ maxCount: limit })

  const MAX_DIFF_CHARS = 3500

  const commitsWithDiff: (CommitInfo & { rawDiff: string })[] = await Promise.all(
    log.all.map(async (c) => {
      let additions = 0
      let deletions = 0
      let rawDiff = ''
      try {
        const summary = await git.diffSummary([`${c.hash}^`, c.hash])
        additions = summary.insertions
        deletions = summary.deletions
        const full = await git.diff([`${c.hash}^`, c.hash])
        rawDiff = full.length > MAX_DIFF_CHARS ? full.slice(0, MAX_DIFF_CHARS) + '\n... (diff truncado)' : full
      } catch {
        // first commit or merge commit — ignore diff error
      }
      return {
        hash: c.hash.slice(0, 7),
        message: c.message,
        author: c.author_name,
        date: c.date,
        additions,
        deletions,
        rawDiff,
      }
    }),
  )

  const commitsText = commitsWithDiff
    .map((c) =>
      `## Commit ${c.hash}: "${c.message}" (+${c.additions}/-${c.deletions})\n${c.rawDiff || '(sem diff disponível)'}`,
    )
    .join('\n\n---\n\n')

  const text = await generate(apiKey,
    `Você é um engenheiro de software sênior fazendo code review de commits.
Analise as mudanças reais de código (diffs), avaliando:
- Qualidade e clareza do código
- Boas práticas e padrões (SOLID, DRY, etc.)
- Possíveis bugs ou problemas de lógica
- Segurança (injeção, exposição de dados, etc.)
- Legibilidade e manutenibilidade
- Qualidade da mensagem do commit

Responda apenas com JSON válido sem markdown:
{
  "feedback": "análise geral do código em 2-3 parágrafos",
  "score": número 0-100,
  "tips": ["sugestão prática 1", "sugestão prática 2"],
  "commitReviews": {
    "HASH_7_CHARS": {
      "issues": ["problema encontrado no código"],
      "suggestions": ["melhoria sugerida"],
      "rating": "good" | "ok" | "needs_work"
    }
  },
  "petMood": "idle" | "happy" | "excited" | "tired" | "sad",
  "petMessage": "mensagem curta e animada do pet (1 frase)"
}`,
    `Faça code review destes ${commitsWithDiff.length} commits:\n\n${commitsText}`,
  )

  const parsed = JSON.parse(text) as {
    feedback: string
    score: number
    tips: string[]
    commitReviews?: Record<string, { issues: string[]; suggestions: string[]; rating: string }>
    petMood: PetMood
    petMessage: string
  }

  const commits: CommitInfo[] = commitsWithDiff.map((c) => {
    const raw = parsed.commitReviews?.[c.hash]
    const review: CommitReview | undefined = raw
      ? {
          issues: raw.issues ?? [],
          suggestions: raw.suggestions ?? [],
          rating: (raw.rating as CommitReview['rating']) ?? 'ok',
        }
      : undefined
    return { hash: c.hash, message: c.message, author: c.author, date: c.date, additions: c.additions, deletions: c.deletions, review }
  })

  return { feedback: parsed.feedback, score: parsed.score, tips: parsed.tips, petMood: parsed.petMood, petMessage: parsed.petMessage, commits }
}

// ── Daily Review ────────────────────────────────────────────────────────────

export async function dailyReview(apiKey: string, tasks: Task[]): Promise<DailyReview> {
  const today = new Date().toDateString()
  const todayTasks = tasks.filter((t) => new Date(t.createdAt).toDateString() === today)
  const completed  = todayTasks.filter((t) => t.status === 'completed')
  const overdue    = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed' && t.status !== 'cancelled',
  )

  const tasksSummary = [
    `Tarefas criadas hoje: ${todayTasks.length}`,
    `Tarefas concluídas hoje: ${completed.length}`,
    `Tarefas atrasadas: ${overdue.length}`,
    completed.length > 0 ? `Concluídas: ${completed.map((t) => `"${t.title}" (${t.difficulty})`).join(', ')}` : '',
    overdue.length > 0   ? `Atrasadas: ${overdue.map((t) => `"${t.title}"`).join(', ')}` : '',
  ].filter(Boolean).join('\n')

  const text = await generate(apiKey,
    `Você é um coach de produtividade analisando o dia de trabalho de um usuário.
Gere uma análise motivadora em português com base nas tarefas do dia.
Responda apenas com JSON válido sem markdown:
{
  "score": número 0-100 (pontuação de produtividade),
  "summary": "análise do dia em 2-3 frases",
  "tips": ["sugestão 1 para amanhã", "sugestão 2"],
  "petMessage": "mensagem curta e encorajadora do pet (1 frase)",
  "petMood": "idle" | "happy" | "excited" | "tired" | "sad" | "celebrating"
}`,
    `Resumo do dia (${new Date().toLocaleDateString('pt-BR')}):\n${tasksSummary}`,
  )

  const parsed = JSON.parse(text) as {
    score: number; summary: string; tips: string[]; petMessage: string; petMood: PetMood
  }
  return {
    ...parsed,
    tasksCompleted: completed.length,
    tasksCreated: todayTasks.length,
    tasksOverdue: overdue.length,
  }
}

// ── Note to Tasks ───────────────────────────────────────────────────────────

export async function noteToTasks(apiKey: string, content: string): Promise<string[]> {
  const text = await generate(apiKey,
    `Você é um assistente que extrai tarefas acionáveis de notas em texto livre.
Identifique ações concretas, afazeres e compromissos no texto.
Responda apenas com JSON: array de strings com os títulos das tarefas em português, sem markdown.
Se não houver tarefas claras, retorne array vazio [].`,
    `Extraia tarefas desta nota:\n\n${content}`,
  )
  return JSON.parse(text) as string[]
}

// ── Summarize Note ──────────────────────────────────────────────────────────

export async function summarizeNote(apiKey: string, content: string): Promise<string> {
  return generate(apiKey,
    `Você é um assistente de notas. Crie um resumo conciso em português da nota fornecida.
O resumo deve ter no máximo 3 frases e capturar os pontos principais.`,
    `Resuma esta nota:\n\n${content}`,
  )
}
