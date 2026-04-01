import { useEffect, useMemo, useState } from 'react'
import {
  Bomb,
  Coins,
  Crosshair,
  Gauge,
  Heart,
  Pause,
  Play,
  RotateCcw,
  Snowflake,
  Sparkles,
  Swords,
  Waves,
} from 'lucide-react'
import Button from '../components/ui/Button'

type TowerTypeId = 'pulse' | 'laser' | 'nova' | 'cryo' | 'cannon'
type Phase = 'build' | 'battle' | 'victory' | 'gameOver'
type DifficultyId = 'casual' | 'normal' | 'hard'
type EnemyKind = 'drone' | 'scout' | 'tank' | 'boss'
type AbilityId = 'pulseBlast' | 'deepFreeze'

interface GridPoint {
  x: number
  y: number
}

interface BoardPoint {
  x: number
  y: number
}

interface TowerConfig {
  label: string
  cost: number
  range: number
  damage: number
  cooldownMs: number
  color: string
  description: string
  splashRadius?: number
  slowFactor?: number
  slowMs?: number
}

interface DifficultyConfig {
  label: string
  startMoney: number
  baseHp: number
  enemyHpMultiplier: number
  enemySpeedMultiplier: number
  rewardMultiplier: number
  description: string
}

interface EnemyTemplate {
  kind: EnemyKind
  hp: number
  speed: number
  reward: number
  color: string
  size: number
  spawnDelayMs: number
}

interface WavePreview {
  title: string
  units: EnemyTemplate[]
}

interface Enemy {
  id: number
  kind: EnemyKind
  progress: number
  hp: number
  maxHp: number
  speed: number
  reward: number
  color: string
  size: number
  slowMs: number
  slowFactor: number
}

interface Tower {
  id: number
  padId: string
  type: TowerTypeId
  level: number
  cooldownRemainingMs: number
  flashMs: number
  targetEnemyId: number | null
}

interface AbilityCooldowns {
  pulseBlast: number
  deepFreeze: number
}

interface GameState {
  phase: Phase
  wave: number
  money: number
  baseHp: number
  score: number
  towers: Tower[]
  enemies: Enemy[]
  spawnQueue: EnemyTemplate[]
  spawnCooldownMs: number
  nextEnemyId: number
  nextTowerId: number
  speedMultiplier: 1 | 2 | 3
  paused: boolean
  difficulty: DifficultyId
  abilityCooldowns: AbilityCooldowns
  message: string
}

const GRID_COLS = 12
const GRID_ROWS = 6
const CELL_SIZE = 56
const BOARD_WIDTH = GRID_COLS * CELL_SIZE
const BOARD_HEIGHT = GRID_ROWS * CELL_SIZE
const TICK_MS = 50
const FINAL_WAVE = 10
const MAX_TOWER_LEVEL = 3

const PATH_CELLS: GridPoint[] = [
  { x: 0, y: 2 },
  { x: 1, y: 2 },
  { x: 2, y: 2 },
  { x: 2, y: 1 },
  { x: 3, y: 1 },
  { x: 4, y: 1 },
  { x: 5, y: 1 },
  { x: 5, y: 2 },
  { x: 5, y: 3 },
  { x: 6, y: 3 },
  { x: 7, y: 3 },
  { x: 7, y: 2 },
  { x: 8, y: 2 },
  { x: 9, y: 2 },
  { x: 10, y: 2 },
  { x: 10, y: 3 },
  { x: 10, y: 4 },
  { x: 11, y: 4 },
]

const BUILD_PADS: Array<GridPoint & { id: string }> = [
  { id: 'p1', x: 1, y: 1 },
  { id: 'p2', x: 1, y: 3 },
  { id: 'p3', x: 3, y: 2 },
  { id: 'p4', x: 4, y: 3 },
  { id: 'p5', x: 6, y: 1 },
  { id: 'p6', x: 6, y: 4 },
  { id: 'p7', x: 8, y: 1 },
  { id: 'p8', x: 8, y: 4 },
  { id: 'p9', x: 9, y: 3 },
  { id: 'p10', x: 11, y: 3 },
]

const TOWER_TYPES: Record<TowerTypeId, TowerConfig> = {
  pulse: {
    label: 'Pulso',
    cost: 35,
    range: 98,
    damage: 16,
    cooldownMs: 540,
    color: '#7C5CFF',
    description: 'Torre barata e estável para segurar o começo.',
  },
  laser: {
    label: 'Laser',
    cost: 55,
    range: 138,
    damage: 10,
    cooldownMs: 180,
    color: '#32D1FF',
    description: 'Alcance alto e pressão constante na linha.',
  },
  nova: {
    label: 'Nova',
    cost: 78,
    range: 108,
    damage: 34,
    cooldownMs: 920,
    color: '#FF7AB6',
    description: 'Explode alvos prioritários com dano alto.',
  },
  cryo: {
    label: 'Cryo',
    cost: 62,
    range: 120,
    damage: 8,
    cooldownMs: 280,
    color: '#67E8F9',
    description: 'Dá pouco dano, mas desacelera a rota.',
    slowFactor: 0.48,
    slowMs: 1300,
  },
  cannon: {
    label: 'Canhão',
    cost: 90,
    range: 116,
    damage: 26,
    cooldownMs: 760,
    color: '#F59E0B',
    description: 'Acerta grupos com dano em área.',
    splashRadius: 44,
  },
}

const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  casual: {
    label: 'Casual',
    startMoney: 155,
    baseHp: 16,
    enemyHpMultiplier: 0.9,
    enemySpeedMultiplier: 0.92,
    rewardMultiplier: 1.15,
    description: 'Mais moedas e base mais resistente.',
  },
  normal: {
    label: 'Normal',
    startMoney: 120,
    baseHp: 12,
    enemyHpMultiplier: 1,
    enemySpeedMultiplier: 1,
    rewardMultiplier: 1,
    description: 'Equilíbrio padrão entre pressão e economia.',
  },
  hard: {
    label: 'Hard',
    startMoney: 105,
    baseHp: 9,
    enemyHpMultiplier: 1.18,
    enemySpeedMultiplier: 1.08,
    rewardMultiplier: 1.05,
    description: 'Menos margem de erro, ondas mais agressivas.',
  },
}

const ABILITY_META: Record<AbilityId, { label: string; cooldownMs: number; description: string }> = {
  pulseBlast: {
    label: 'Pulso Global',
    cooldownMs: 13000,
    description: 'Acerta todos os inimigos vivos com dano instantâneo.',
  },
  deepFreeze: {
    label: 'Congelar',
    cooldownMs: 17000,
    description: 'Prende a onda em slow pesado por alguns segundos.',
  },
}

const ENEMY_LABELS: Record<EnemyKind, string> = {
  drone: 'Drone',
  scout: 'Scout',
  tank: 'Tank',
  boss: 'Boss',
}

const TOTAL_PATH_DISTANCE = (PATH_CELLS.length - 1) * CELL_SIZE

function cellCenter(cell: GridPoint): BoardPoint {
  return {
    x: cell.x * CELL_SIZE + CELL_SIZE / 2,
    y: cell.y * CELL_SIZE + CELL_SIZE / 2,
  }
}

function getEnemyPosition(progress: number): BoardPoint {
  const clamped = Math.max(0, Math.min(progress, TOTAL_PATH_DISTANCE))
  const segmentIndex = Math.min(Math.floor(clamped / CELL_SIZE), PATH_CELLS.length - 2)
  const segmentProgress = (clamped - segmentIndex * CELL_SIZE) / CELL_SIZE
  const from = cellCenter(PATH_CELLS[segmentIndex])
  const to = cellCenter(PATH_CELLS[segmentIndex + 1])

  return {
    x: from.x + (to.x - from.x) * segmentProgress,
    y: from.y + (to.y - from.y) * segmentProgress,
  }
}

function distance(a: BoardPoint, b: BoardPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function scaleTemplate(template: EnemyTemplate, difficulty: DifficultyId): EnemyTemplate {
  const config = DIFFICULTIES[difficulty]
  return {
    ...template,
    hp: Math.round(template.hp * config.enemyHpMultiplier),
    speed: Math.round(template.speed * config.enemySpeedMultiplier),
    reward: Math.round(template.reward * config.rewardMultiplier),
  }
}

function buildWave(waveNumber: number, difficulty: DifficultyId): WavePreview {
  const units: EnemyTemplate[] = []
  const baseCount = 7 + waveNumber * 3

  for (let index = 0; index < baseCount; index += 1) {
    units.push(scaleTemplate({
      kind: 'drone',
      hp: 34 + waveNumber * 14,
      speed: 48 + waveNumber * 4,
      reward: 8 + waveNumber,
      color: '#8B5CF6',
      size: 18,
      spawnDelayMs: Math.max(250, 720 - waveNumber * 42),
    }, difficulty))
  }

  if (waveNumber >= 2) {
    for (let index = 0; index < waveNumber + 3; index += 1) {
      units.splice(Math.min(units.length, 1 + index * 2), 0, scaleTemplate({
        kind: 'scout',
        hp: 24 + waveNumber * 10,
        speed: 82 + waveNumber * 5,
        reward: 11 + waveNumber,
        color: '#22D3EE',
        size: 14,
        spawnDelayMs: 220,
      }, difficulty))
    }
  }

  if (waveNumber >= 3) {
    for (let index = 0; index < Math.max(2, waveNumber - 1); index += 1) {
      units.splice(Math.min(units.length, 2 + index * 3), 0, scaleTemplate({
        kind: 'tank',
        hp: 126 + waveNumber * 34,
        speed: 36 + waveNumber * 2,
        reward: 19 + waveNumber * 3,
        color: '#F59E0B',
        size: 24,
        spawnDelayMs: 520,
      }, difficulty))
    }
  }

  const bossCount =
    waveNumber === FINAL_WAVE ? 2 :
    waveNumber >= 8 ? 1 :
    waveNumber >= 5 ? 1 : 0

  for (let index = 0; index < bossCount; index += 1) {
    units.push(scaleTemplate({
      kind: 'boss',
      hp: 300 + waveNumber * 92 + index * 120,
      speed: 34 + Math.floor(waveNumber / 3),
      reward: 65 + waveNumber * 8,
      color: '#EF4444',
      size: waveNumber === FINAL_WAVE ? 34 : 30,
      spawnDelayMs: waveNumber === FINAL_WAVE ? 680 : 860,
    }, difficulty))
  }

  const title =
    waveNumber === FINAL_WAVE ? 'Assalto final com boss duplo' :
    waveNumber >= 8 ? 'Cerco pesado' :
    waveNumber >= 5 ? 'Ruptura blindada' :
    waveNumber >= 3 ? 'Pressão mista' :
    waveNumber >= 2 ? 'Linha acelerada' :
    'Abertura simples'

  return { title, units }
}

function createInitialState(difficulty: DifficultyId = 'normal'): GameState {
  const config = DIFFICULTIES[difficulty]
  return {
    phase: 'build',
    wave: 0,
    money: config.startMoney,
    baseHp: config.baseHp,
    score: 0,
    towers: [],
    enemies: [],
    spawnQueue: [],
    spawnCooldownMs: 0,
    nextEnemyId: 1,
    nextTowerId: 1,
    speedMultiplier: 1,
    paused: false,
    difficulty,
    abilityCooldowns: {
      pulseBlast: 0,
      deepFreeze: 0,
    },
    message: 'Agora há mais ferramentas. Monte a defesa e teste combinações.',
  }
}

function getTowerDamage(tower: Tower): number {
  return Math.round(TOWER_TYPES[tower.type].damage * (1 + (tower.level - 1) * 0.42))
}

function getTowerRange(tower: Tower): number {
  return TOWER_TYPES[tower.type].range + (tower.level - 1) * 12
}

function getTowerCooldown(tower: Tower): number {
  return Math.max(120, Math.round(TOWER_TYPES[tower.type].cooldownMs * (1 - (tower.level - 1) * 0.08)))
}

function getTowerSplashRadius(tower: Tower): number {
  return (TOWER_TYPES[tower.type].splashRadius ?? 0) + (tower.level - 1) * 6
}

function getTowerSlowFactor(tower: Tower): number {
  const baseSlow = TOWER_TYPES[tower.type].slowFactor
  if (!baseSlow) return 1
  return Math.max(0.18, baseSlow - (tower.level - 1) * 0.06)
}

function getTowerSlowMs(tower: Tower): number {
  const baseDuration = TOWER_TYPES[tower.type].slowMs
  if (!baseDuration) return 0
  return baseDuration + (tower.level - 1) * 250
}

function getUpgradeCost(tower: Tower): number {
  return Math.round(TOWER_TYPES[tower.type].cost * (0.84 + tower.level * 0.4))
}

function getSellValue(tower: Tower): number {
  return Math.round(TOWER_TYPES[tower.type].cost * (0.72 + (tower.level - 1) * 0.24))
}

function startWave(state: GameState): GameState {
  if (state.phase === 'battle' || state.wave >= FINAL_WAVE) return state
  const nextWave = state.wave + 1
  const preview = buildWave(nextWave, state.difficulty)

  return {
    ...state,
    phase: 'battle',
    wave: nextWave,
    paused: false,
    spawnQueue: preview.units,
    spawnCooldownMs: 0,
    message: `Onda ${nextWave} iniciada: ${preview.title.toLowerCase()}.`,
  }
}

function applyDamage(enemy: Enemy, amount: number): Enemy {
  return {
    ...enemy,
    hp: enemy.hp - amount,
  }
}

function tickGame(state: GameState, deltaMs: number): GameState {
  if (state.phase !== 'battle' || state.paused) return state

  let nextEnemyId = state.nextEnemyId
  let money = state.money
  let score = state.score
  let baseHp = state.baseHp
  let spawnCooldownMs = state.spawnCooldownMs - deltaMs
  let spawnQueue = [...state.spawnQueue]

  const abilityCooldowns: AbilityCooldowns = {
    pulseBlast: Math.max(0, state.abilityCooldowns.pulseBlast - deltaMs),
    deepFreeze: Math.max(0, state.abilityCooldowns.deepFreeze - deltaMs),
  }

  const enemies = state.enemies.map((enemy) => ({ ...enemy }))
  const towers = state.towers.map((tower) => ({
    ...tower,
    cooldownRemainingMs: Math.max(0, tower.cooldownRemainingMs - deltaMs),
    flashMs: Math.max(0, tower.flashMs - deltaMs),
    targetEnemyId: tower.flashMs - deltaMs <= 0 ? null : tower.targetEnemyId,
  }))

  while (spawnQueue.length > 0 && spawnCooldownMs <= 0) {
    const [nextUnit, ...rest] = spawnQueue
    spawnQueue = rest
    enemies.push({
      id: nextEnemyId,
      kind: nextUnit.kind,
      progress: 0,
      hp: nextUnit.hp,
      maxHp: nextUnit.hp,
      speed: nextUnit.speed,
      reward: nextUnit.reward,
      color: nextUnit.color,
      size: nextUnit.size,
      slowMs: 0,
      slowFactor: 1,
    })
    nextEnemyId += 1
    spawnCooldownMs += nextUnit.spawnDelayMs
  }

  const livingAfterMove: Enemy[] = []
  for (const enemy of enemies) {
    const nextSlowMs = Math.max(0, enemy.slowMs - deltaMs)
    const speedFactor = nextSlowMs > 0 ? enemy.slowFactor : 1
    enemy.slowMs = nextSlowMs
    if (nextSlowMs === 0) enemy.slowFactor = 1
    enemy.progress += enemy.speed * speedFactor * (deltaMs / 1000)

    if (enemy.progress >= TOTAL_PATH_DISTANCE) {
      baseHp -= enemy.kind === 'boss' ? 3 : enemy.kind === 'tank' ? 2 : 1
      continue
    }
    livingAfterMove.push(enemy)
  }

  for (const tower of towers) {
    const pad = BUILD_PADS.find((item) => item.id === tower.padId)
    if (!pad || tower.cooldownRemainingMs > 0) continue

    const origin = cellCenter(pad)
    const range = getTowerRange(tower)
    let bestTarget: Enemy | null = null

    for (const enemy of livingAfterMove) {
      if (enemy.hp <= 0) continue
      if (distance(origin, getEnemyPosition(enemy.progress)) > range) continue
      if (!bestTarget || enemy.progress > bestTarget.progress) {
        bestTarget = enemy
      }
    }

    if (!bestTarget) continue

    const towerDamage = getTowerDamage(tower)

    if (tower.type === 'cannon') {
      const blastCenter = getEnemyPosition(bestTarget.progress)
      const splashRadius = getTowerSplashRadius(tower)

      for (let index = 0; index < livingAfterMove.length; index += 1) {
        const enemy = livingAfterMove[index]
        if (distance(blastCenter, getEnemyPosition(enemy.progress)) <= splashRadius) {
          livingAfterMove[index] = applyDamage(enemy, towerDamage)
        }
      }
    } else {
      const targetIndex = livingAfterMove.findIndex((enemy) => enemy.id === bestTarget.id)
      if (targetIndex >= 0) {
        const enemy = applyDamage(livingAfterMove[targetIndex], towerDamage)
        if (tower.type === 'cryo') {
          enemy.slowMs = Math.max(enemy.slowMs, getTowerSlowMs(tower))
          enemy.slowFactor = Math.min(enemy.slowFactor, getTowerSlowFactor(tower))
        }
        livingAfterMove[targetIndex] = enemy
      }
    }

    tower.cooldownRemainingMs = getTowerCooldown(tower)
    tower.flashMs = 140
    tower.targetEnemyId = bestTarget.id
  }

  const survivors: Enemy[] = []
  for (const enemy of livingAfterMove) {
    if (enemy.hp <= 0) {
      money += enemy.reward
      score += enemy.reward * 5 + (enemy.kind === 'boss' ? 100 : enemy.kind === 'tank' ? 18 : 0)
      continue
    }
    survivors.push(enemy)
  }

  if (baseHp <= 0) {
    return {
      ...state,
      phase: 'gameOver',
      baseHp: 0,
      money,
      score,
      towers,
      enemies: survivors,
      spawnQueue,
      spawnCooldownMs,
      nextEnemyId,
      abilityCooldowns,
      message: 'A trilha caiu. Tente outra estratégia ou mude a dificuldade.',
    }
  }

  if (spawnQueue.length === 0 && survivors.length === 0) {
    if (state.wave >= FINAL_WAVE) {
      return {
        ...state,
        phase: 'victory',
        money: money + 50,
        score: score + 180,
        towers,
        enemies: [],
        spawnQueue: [],
        spawnCooldownMs: 0,
        nextEnemyId,
        abilityCooldowns,
        message: 'Vitória. A linha segurou até o assalto final.',
      }
    }

    return {
      ...state,
      phase: 'build',
      money: money + 18,
      score,
      towers,
      enemies: [],
      spawnQueue: [],
      spawnCooldownMs: 0,
      nextEnemyId,
      abilityCooldowns,
      message: `Onda ${state.wave} concluída. Você recebeu 18 moedas de reforço.`,
    }
  }

  return {
    ...state,
    money,
    score,
    baseHp,
    towers,
    enemies: survivors,
    spawnQueue,
    spawnCooldownMs,
    nextEnemyId,
    abilityCooldowns,
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Heart
  label: string
  value: string | number
  tone: string
}) {
  return (
    <div className="card p-4">
      <Icon size={16} className={tone} />
      <p className="text-2xl font-bold text-text-primary mt-3">{value}</p>
      <p className="text-xs text-text-muted mt-1">{label}</p>
    </div>
  )
}

export default function TowerDefensePage() {
  const [game, setGame] = useState<GameState>(() => createInitialState('normal'))
  const [selectedBuild, setSelectedBuild] = useState<TowerTypeId>('pulse')
  const [selectedTowerId, setSelectedTowerId] = useState<number | null>(null)

  useEffect(() => {
    if (game.phase !== 'battle' || game.paused) return undefined

    const interval = window.setInterval(() => {
      setGame((current) => tickGame(current, TICK_MS * current.speedMultiplier))
    }, TICK_MS)

    return () => window.clearInterval(interval)
  }, [game.phase, game.paused])

  const selectedTower = game.towers.find((tower) => tower.id === selectedTowerId) ?? null
  const canStartWave = game.phase === 'build' && game.wave < FINAL_WAVE
  const nextWaveNumber = Math.min(FINAL_WAVE, game.phase === 'battle' ? game.wave : game.wave + 1)

  const nextWavePreview = useMemo(() => {
    if (game.phase === 'victory' || game.phase === 'gameOver') return null
    if (game.wave >= FINAL_WAVE && game.phase !== 'battle') return null
    return buildWave(nextWaveNumber, game.difficulty)
  }, [game.difficulty, game.phase, game.wave, nextWaveNumber])

  function resetGame(difficulty: DifficultyId = game.difficulty) {
    setGame(createInitialState(difficulty))
    setSelectedTowerId(null)
  }

  function handleDifficultyChange(difficulty: DifficultyId) {
    resetGame(difficulty)
  }

  function handleStartWave() {
    setGame((current) => startWave(current))
  }

  function handlePauseToggle() {
    setGame((current) => (
      current.phase === 'battle'
        ? { ...current, paused: !current.paused, message: current.paused ? 'Combate retomado.' : 'Combate pausado.' }
        : current
    ))
  }

  function handleSpeedChange(speedMultiplier: 1 | 2 | 3) {
    setGame((current) => ({
      ...current,
      speedMultiplier,
      message: `Velocidade ajustada para ${speedMultiplier}x.`,
    }))
  }

  function handlePadClick(padId: string) {
    const existingTower = game.towers.find((tower) => tower.padId === padId)
    if (existingTower) {
      setSelectedTowerId(existingTower.id)
      return
    }

    const build = TOWER_TYPES[selectedBuild]
    if (game.money < build.cost) return
    if (game.phase === 'gameOver' || game.phase === 'victory') return

    const newTowerId = game.nextTowerId
    setGame((current) => ({
      ...current,
      money: current.money - build.cost,
      towers: [
        ...current.towers,
        {
          id: current.nextTowerId,
          padId,
          type: selectedBuild,
          level: 1,
          cooldownRemainingMs: 0,
          flashMs: 0,
          targetEnemyId: null,
        },
      ],
      nextTowerId: current.nextTowerId + 1,
      message: `${build.label} posicionada na rota.`,
    }))
    setSelectedTowerId(newTowerId)
  }

  function handleUpgradeTower() {
    if (!selectedTower) return
    if (selectedTower.level >= MAX_TOWER_LEVEL) return

    const cost = getUpgradeCost(selectedTower)
    if (game.money < cost) return

    setGame((current) => ({
      ...current,
      money: current.money - cost,
      towers: current.towers.map((tower) => (
        tower.id === selectedTower.id
          ? { ...tower, level: tower.level + 1 }
          : tower
      )),
      message: `${TOWER_TYPES[selectedTower.type].label} melhorada para nível ${selectedTower.level + 1}.`,
    }))
  }

  function handleSellTower() {
    if (!selectedTower) return
    const refund = getSellValue(selectedTower)

    setGame((current) => ({
      ...current,
      money: current.money + refund,
      towers: current.towers.filter((tower) => tower.id !== selectedTower.id),
      message: `${TOWER_TYPES[selectedTower.type].label} removida. ${refund} moedas recuperadas.`,
    }))
    setSelectedTowerId(null)
  }

  function handlePulseBlast() {
    if (game.abilityCooldowns.pulseBlast > 0 || game.enemies.length === 0) return

    setGame((current) => ({
      ...current,
      enemies: current.enemies.map((enemy) => ({ ...enemy, hp: enemy.hp - 22 })),
      abilityCooldowns: {
        ...current.abilityCooldowns,
        pulseBlast: ABILITY_META.pulseBlast.cooldownMs,
      },
      message: 'Pulso global disparado. A onda inteira sofreu dano.',
    }))
  }

  function handleDeepFreeze() {
    if (game.abilityCooldowns.deepFreeze > 0 || game.enemies.length === 0) return

    setGame((current) => ({
      ...current,
      enemies: current.enemies.map((enemy) => ({
        ...enemy,
        slowMs: Math.max(enemy.slowMs, 2600),
        slowFactor: Math.min(enemy.slowFactor, 0.2),
      })),
      abilityCooldowns: {
        ...current.abilityCooldowns,
        deepFreeze: ABILITY_META.deepFreeze.cooldownMs,
      },
      message: 'Congelamento ativado. A rota inteira ficou lenta.',
    }))
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/15 border border-primary/20">
            <Swords size={20} className="text-primary-light" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Tower Defense</h1>
            <p className="text-sm text-text-muted">Mais opções, mais caos controlado e mais espaço para testar combinações.</p>
          </div>
        </div>

        <div className="card px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-text-secondary">{game.message}</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => resetGame()}>
              <RotateCcw size={14} />
              Reiniciar
            </Button>
            <Button variant="ghost" onClick={handlePauseToggle} disabled={game.phase !== 'battle'}>
              {game.paused ? <Play size={14} /> : <Pause size={14} />}
              {game.paused ? 'Retomar' : 'Pausar'}
            </Button>
            <Button onClick={handleStartWave} disabled={!canStartWave}>
              <Play size={14} />
              {game.wave === 0 ? 'Começar' : 'Próxima onda'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Heart} label="Base" value={game.baseHp} tone="text-accent-red" />
        <StatCard icon={Coins} label="Moedas" value={game.money} tone="text-accent-amber" />
        <StatCard icon={Waves} label="Onda" value={`${game.wave}/${FINAL_WAVE}`} tone="text-accent-blue" />
        <StatCard icon={Crosshair} label="Score" value={game.score} tone="text-primary-light" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="card p-4 overflow-x-auto">
          <div
            className="relative rounded-2xl border border-bg-border overflow-hidden"
            style={{
              width: BOARD_WIDTH,
              height: BOARD_HEIGHT,
              background:
                'radial-gradient(circle at top, rgba(124,92,255,0.14), transparent 35%), radial-gradient(circle at bottom right, rgba(34,211,238,0.12), transparent 30%), linear-gradient(180deg, rgba(19,23,38,0.96), rgba(10,13,24,0.98))',
            }}
          >
            <div
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(82, 97, 142, 0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(82, 97, 142, 0.18) 1px, transparent 1px)',
                backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
              }}
            />

            {PATH_CELLS.map((cell, index) => (
              <div
                key={`${cell.x}-${cell.y}`}
                className={`absolute rounded-2xl border ${
                  index === 0
                    ? 'bg-accent-green/15 border-accent-green/25'
                    : index === PATH_CELLS.length - 1
                      ? 'bg-accent-red/15 border-accent-red/25'
                      : 'bg-bg-card/70 border-bg-border'
                }`}
                style={{
                  left: cell.x * CELL_SIZE + 4,
                  top: cell.y * CELL_SIZE + 4,
                  width: CELL_SIZE - 8,
                  height: CELL_SIZE - 8,
                }}
              />
            ))}

            {BUILD_PADS.map((pad) => {
              const tower = game.towers.find((item) => item.padId === pad.id)
              const isSelected = tower?.id === selectedTowerId
              return (
                <button
                  key={pad.id}
                  type="button"
                  onClick={() => handlePadClick(pad.id)}
                  className={`absolute rounded-2xl border transition-all ${
                    tower
                      ? isSelected
                        ? 'border-white/50 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.14)]'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                      : 'border-dashed border-primary/35 bg-primary/5 hover:bg-primary/10'
                  }`}
                  style={{
                    left: pad.x * CELL_SIZE + 8,
                    top: pad.y * CELL_SIZE + 8,
                    width: CELL_SIZE - 16,
                    height: CELL_SIZE - 16,
                  }}
                  title={tower ? 'Selecionar torre' : `Construir ${TOWER_TYPES[selectedBuild].label}`}
                >
                  {tower ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <div
                        className="w-7 h-7 rounded-full border-2"
                        style={{
                          backgroundColor: `${TOWER_TYPES[tower.type].color}33`,
                          borderColor: TOWER_TYPES[tower.type].color,
                        }}
                      />
                      <span className="absolute -top-1 -right-1 text-[10px] px-1 rounded-full bg-bg-base border border-bg-border text-text-primary">
                        {tower.level}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-semibold text-primary-light/80">+</span>
                  )}
                </button>
              )
            })}

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {game.towers.map((tower) => {
                if (tower.flashMs <= 0 || tower.targetEnemyId === null) return null
                const target = game.enemies.find((enemy) => enemy.id === tower.targetEnemyId)
                const pad = BUILD_PADS.find((item) => item.id === tower.padId)
                if (!target || !pad) return null

                const origin = cellCenter(pad)
                const destination = getEnemyPosition(target.progress)
                return (
                  <line
                    key={`beam-${tower.id}-${tower.targetEnemyId}`}
                    x1={origin.x}
                    y1={origin.y}
                    x2={destination.x}
                    y2={destination.y}
                    stroke={TOWER_TYPES[tower.type].color}
                    strokeWidth={tower.type === 'cannon' ? '5' : '3'}
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                )
              })}
            </svg>

            {game.towers.map((tower) => {
              if (tower.id !== selectedTowerId) return null
              const pad = BUILD_PADS.find((item) => item.id === tower.padId)
              if (!pad) return null

              const center = cellCenter(pad)
              return (
                <div
                  key={`range-${tower.id}`}
                  className="absolute rounded-full border border-primary/35 bg-primary/5 pointer-events-none"
                  style={{
                    width: getTowerRange(tower) * 2,
                    height: getTowerRange(tower) * 2,
                    left: center.x - getTowerRange(tower),
                    top: center.y - getTowerRange(tower),
                  }}
                />
              )
            })}

            {game.enemies.map((enemy) => {
              const position = getEnemyPosition(enemy.progress)
              const hpPercent = Math.max(0, enemy.hp / enemy.maxHp) * 100
              return (
                <div
                  key={enemy.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: position.x,
                    top: position.y,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-black/35 overflow-hidden">
                    <div className="h-full rounded-full bg-accent-green" style={{ width: `${hpPercent}%` }} />
                  </div>
                  <div
                    className="rounded-full border-2 shadow-[0_0_18px_rgba(255,255,255,0.16)]"
                    style={{
                      width: enemy.size,
                      height: enemy.size,
                      backgroundColor: `${enemy.color}44`,
                      borderColor: enemy.color,
                      boxShadow: enemy.slowMs > 0 ? '0 0 16px rgba(103,232,249,0.35)' : undefined,
                    }}
                  />
                </div>
              )
            })}

            {(game.phase === 'victory' || game.phase === 'gameOver') && (
              <div className="absolute inset-0 bg-bg-base/85 backdrop-blur-[2px] flex items-center justify-center">
                <div className="text-center max-w-sm px-6">
                  <p className={`text-sm font-semibold mb-2 ${game.phase === 'victory' ? 'text-accent-green' : 'text-accent-red'}`}>
                    {game.phase === 'victory' ? 'Vitória' : 'Derrota'}
                  </p>
                  <h2 className="text-2xl font-bold text-text-primary">
                    {game.phase === 'victory'
                      ? 'A defesa ficou de pé até o fim.'
                      : 'A rota foi rompida antes da última onda.'}
                  </h2>
                  <p className="text-sm text-text-muted mt-3">{game.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-[1.35fr_1fr] gap-4 items-start">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-primary-light" />
              <h2 className="text-sm font-semibold text-text-primary">Torres</h2>
              <span className="ml-auto text-[11px] text-text-muted">Escolha e construa sem sair do foco da partida</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(TOWER_TYPES) as Array<[TowerTypeId, TowerConfig]>).map(([id, tower]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedBuild(id)}
                  className={`text-left p-3 rounded-xl border transition-colors ${
                    selectedBuild === id
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-bg-border bg-bg-card hover:bg-bg-hover'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tower.color }} />
                      <span className="text-sm font-medium text-text-primary">{tower.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-accent-amber">{tower.cost}g</span>
                  </div>
                  <p className="text-xs text-text-muted mt-2">{tower.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4 min-h-[210px]">
            <div className="flex items-center gap-2 mb-3">
              <Bomb size={15} className="text-accent-pink" />
              <h2 className="text-sm font-semibold text-text-primary">Upgrade Rápido</h2>
            </div>
            {selectedTower ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {TOWER_TYPES[selectedTower.type].label} Lv. {selectedTower.level}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    Dano {getTowerDamage(selectedTower)} • Alcance {getTowerRange(selectedTower)} • Cadência {Math.round(getTowerCooldown(selectedTower))}ms
                  </p>
                  {selectedTower.type === 'cryo' && (
                    <p className="text-xs text-text-muted mt-1">
                      Slow {Math.round((1 - getTowerSlowFactor(selectedTower)) * 100)}% por {Math.round(getTowerSlowMs(selectedTower) / 1000)}s
                    </p>
                  )}
                  {selectedTower.type === 'cannon' && (
                    <p className="text-xs text-text-muted mt-1">
                      Área de explosão {getTowerSplashRadius(selectedTower)}px
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleUpgradeTower}
                    disabled={selectedTower.level >= MAX_TOWER_LEVEL || game.money < getUpgradeCost(selectedTower)}
                  >
                    Upgrade ({selectedTower.level >= MAX_TOWER_LEVEL ? 'max' : `${getUpgradeCost(selectedTower)}g`})
                  </Button>
                  <Button variant="ghost" onClick={handleSellTower}>
                    Vender ({getSellValue(selectedTower)}g)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-text-muted leading-relaxed">
                Selecione uma torre no tabuleiro para abrir upgrade, venda e alcance. A ideia aqui é deixar essa ação colada no mapa durante a onda.
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 items-start">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gauge size={15} className="text-primary-light" />
              <h2 className="text-sm font-semibold text-text-primary">Dificuldade</h2>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {(Object.entries(DIFFICULTIES) as Array<[DifficultyId, DifficultyConfig]>).map(([id, config]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleDifficultyChange(id)}
                  className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                    game.difficulty === id ? 'border-primary/40 bg-primary/10' : 'border-bg-border bg-bg-card hover:bg-bg-hover'
                  }`}
                >
                  <p className="text-sm font-medium text-text-primary">{config.label}</p>
                  <p className="text-[10px] text-text-muted mt-1">{config.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Snowflake size={15} className="text-accent-blue" />
              <h2 className="text-sm font-semibold text-text-primary">Habilidades</h2>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handlePulseBlast}
                disabled={game.abilityCooldowns.pulseBlast > 0 || game.enemies.length === 0}
              >
                Pulso Global {game.abilityCooldowns.pulseBlast > 0 ? `(${Math.ceil(game.abilityCooldowns.pulseBlast / 1000)}s)` : ''}
              </Button>
              <Button
                variant="ghost"
                onClick={handleDeepFreeze}
                disabled={game.abilityCooldowns.deepFreeze > 0 || game.enemies.length === 0}
              >
                Congelar {game.abilityCooldowns.deepFreeze > 0 ? `(${Math.ceil(game.abilityCooldowns.deepFreeze / 1000)}s)` : ''}
              </Button>
              <p className="text-xs text-text-muted">
                Ficam embaixo para não disputar espaço com build e upgrade.
              </p>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Ritmo</h2>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => handleSpeedChange(speed as 1 | 2 | 3)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    game.speedMultiplier === speed
                      ? 'border-primary/40 bg-primary/10 text-primary-light'
                      : 'border-bg-border bg-bg-card text-text-secondary hover:bg-bg-hover'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {nextWavePreview ? (
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-1">Preview da onda</h2>
              <p className="text-xs text-text-muted mb-3">
                {game.phase === 'battle' ? `Onda ${game.wave} em andamento` : `Próxima onda: ${game.wave + 1}`} • {nextWavePreview.title}
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(nextWavePreview.units.map((unit) => unit.kind))).map((kind) => {
                  const count = nextWavePreview.units.filter((unit) => unit.kind === kind).length
                  const sample = nextWavePreview.units.find((unit) => unit.kind === kind)
                  return (
                    <div key={kind} className="px-2.5 py-1.5 rounded-lg bg-bg-base border border-bg-border">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sample?.color ?? '#fff' }} />
                        <span className="text-xs text-text-primary">{ENEMY_LABELS[kind]}</span>
                        <span className="text-[10px] text-text-muted">x{count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-1">Preview da onda</h2>
              <p className="text-sm text-text-muted">Sem novas ondas pendentes nesta partida.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
