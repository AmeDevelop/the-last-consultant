export interface PlayerStats {
  kashikosa: number  // かしこさ
  chikara: number    // ちから
  kyokan: number     // 共感力
  tekio: number      // 適応力
}

export interface Player {
  name: string
  level: number
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  stats: PlayerStats
  items: string[]
  skills: string[]
  party: string[]
}

export interface Flags {
  routeFlag: 'bad' | 'good' | 'true' | null
  defeatedBoss: boolean
  魔物使い加入: boolean
  visitedScenes: string[]
}

export interface ScoringData {
  choices: { questionId: string; selectedOption: string }[]
  finalScore: number | null
  peaceYears: number | null
  summary: string | null
  breakdown: ScoringBreakdown[] | null
}

export interface GameState {
  player: Player
  flags: Flags
  scoring: ScoringData
  currentScene: string
  saveTimestamp: number
}

export interface SceneChoice {
  label: string
  effect?: Partial<PlayerStats>
  hpEffect?: number
  mpEffect?: number
  levelUp?: number
  maxHpUp?: number
  maxMpUp?: number
  itemGain?: string
  skillGain?: string
  skillGains?: string[]
  partyGain?: string
  flagEffect?: Partial<Omit<Flags, 'visitedScenes'>>
  trueScoreQuestion?: boolean
  questionId?: string
  next: string
  condition?: string
}

export interface BattleSpecialTrigger {
  condition: 'enemy_hp_percent'
  threshold: number
  scene: string
  text: string
}

export interface BattleConfig {
  enemyId: string
  enemyName: string
  enemyHp: number
  enemyMaxHp: number
  enemyAttack: number
  enemyDefense: number
  forced?: boolean
  forcedLossHpThreshold?: number
  winScene: string
  loseScene: string
  winCondition?: 'kashikosa' | 'chikara' | 'any'
  winStatThreshold?: number
  specialTrigger?: BattleSpecialTrigger
  bgm?: string
}

export type SceneType = 'dialogue' | 'battle' | 'choice' | 'event' | 'ending' | 'scoring' | 'auto_route'

export interface Scene {
  sceneId: string
  type: SceneType
  background?: string
  text: string[]
  speaker?: string
  choices?: SceneChoice[]
  battle?: BattleConfig
  next?: string
  routes?: Record<string, string>
  statDisplay?: boolean
}

export interface ScoringRequest {
  choices: {
    questionId: string
    questionText: string
    selectedOption: string
  }[]
}

export interface ScoringBreakdown {
  axis: string
  score: number
  comment: string
}

export interface ScoringResponse {
  score: number
  peaceYears: number
  breakdown: ScoringBreakdown[]
  summary: string
}

export interface ItemDef {
  id: string
  name: string
  description: string
  effect: 'hp' | 'mp' | 'stat_temp'
  value: number
  stat?: keyof PlayerStats
}

export interface SkillDef {
  id: string
  name: string
  description: string
  mpCost: number
  effect: 'damage' | 'heal_hp' | 'heal_mp' | 'buff' | 'negotiate' | 'special'
  value: number
  stat?: keyof PlayerStats
}
