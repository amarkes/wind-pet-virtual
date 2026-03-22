# ClearUp — Virtual Pet de Produtividade

> Um assistente inteligente em formato de pet virtual que monitora, analisa e melhora sua produtividade no dia a dia.

## O que é?

ClearUp é um app desktop (Electron) que vive no seu computador como um pet virtual. Ele observa suas atividades — commits, tarefas, tempo focado — e te dá feedback em tempo real através do pet, que reage com humor baseado em sua produtividade.

## Por que?

Ferramentas de produtividade são chatas. Um pet que fica feliz quando você termina tarefas difíceis e triste quando você procrastina cria um laço emocional que aumenta o engajamento naturalmente.

## Features principais (roadmap completo em `FEATURES.md`)

| Feature | V1 | V2 | V3 |
|---|---|---|---|
| Pet com estados visuais | ✅ | | |
| Gestão de tarefas | ✅ | | |
| Notas rápidas | ✅ | | |
| Timer Pomodoro | ✅ | | |
| Análise de commits (Git) | | ✅ | |
| Estimativa de tempo com IA | | ✅ | |
| Integração Claude API | | ✅ | |
| Pet flutuante (widget) | | | ✅ |
| Histórico e relatórios | | ✅ | |
| Detecção de app em foco | | | ✅ |

## Como rodar

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Estrutura do projeto

```
pet/
├── docs/              # Documentação completa
├── src/
│   ├── main/          # Processo principal Electron (Node.js)
│   │   ├── ipc/       # Handlers IPC (comunicação main ↔ renderer)
│   │   └── services/  # Lógica de negócio (store, pet, git)
│   ├── preload/       # Bridge segura entre main e renderer
│   └── renderer/      # App React
│       └── src/
│           ├── components/  # Componentes reutilizáveis
│           ├── pages/       # Páginas da aplicação
│           ├── stores/      # Estado global (Zustand)
│           ├── types/       # TypeScript types
│           └── styles/      # CSS global
├── resources/         # Ícones e assets estáticos
└── electron.vite.config.ts
```

## Stack técnica

- **Electron 29** — Framework desktop cross-platform
- **React 18 + TypeScript** — UI declarativa com tipos
- **electron-vite** — Build moderno (Vite para renderer, Rollup para main)
- **Tailwind CSS** — Utility-first CSS
- **Framer Motion** — Animações fluidas do pet
- **Zustand** — State management leve
- **electron-store** — Persistência local (JSON) — migrar para SQLite na V2
- **Lucide React** — Ícones consistentes

## Convenções

- Componentes: PascalCase, um componente por arquivo
- Stores: `[nome].store.ts`
- IPC handlers: `[nome].ts` dentro de `src/main/ipc/`
- Tipos: centralizados em `src/renderer/src/types/index.ts`
- Máximo ~150 linhas por arquivo — extrair se ultrapassar
