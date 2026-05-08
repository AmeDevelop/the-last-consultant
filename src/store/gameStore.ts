import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, Player, Flags, ScoringData, SceneChoice, PlayerStats, ScoringBreakdown } from '../types'

const initialPlayer: Player = {
  name: '勇者コンサル',
  level: 1,
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  stats: {
    kashikosa: 10,
    chikara: 10,
    kyokan: 10,
    tekio: 10,
  },
  items: ['energy_drink'],
  skills: ['logic_tree'],
  party: [],
}

const initialFlags: Flags = {
  routeFlag: null,
  defeatedBoss: false,
  魔物使い加入: false,
  visitedScenes: [],
}

const initialScoring: ScoringData = {
  choices: [],
  finalScore: null,
  peaceYears: null,
  summary: null,
  breakdown: null,
}

interface GameStore extends GameState {
  setScene: (sceneId: string) => void
  applyChoice: (choice: SceneChoice) => void
  setScoringResult: (score: number, peaceYears: number, summary: string, breakdown: ScoringBreakdown[]) => void
  resetGame: () => void
  markSceneVisited: (sceneId: string) => void
  gainItem: (itemId: string) => void
  gainSkill: (skillId: string) => void
  gainPartyMember: (characterId: string) => void
  damagePlayer: (amount: number) => void
  healPlayer: (amount: number) => void
  spendMp: (amount: number) => void
  restoreMp: (amount: number) => void
  applyStatBonus: (stats: Partial<PlayerStats>) => void
  setDefeatedBoss: () => void
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      player: { ...initialPlayer, items: ['energy_drink'], skills: ['logic_tree'], party: [] },
      flags: { ...initialFlags, visitedScenes: [] },
      scoring: { ...initialScoring, choices: [] },
      currentScene: 'title',
      saveTimestamp: Date.now(),

      setScene: (sceneId) =>
        set({ currentScene: sceneId, saveTimestamp: Date.now() }),

      applyChoice: (choice) => {
        const state = get()
        let player = { ...state.player }
        let flags = { ...state.flags }
        let scoring = { ...state.scoring }

        if (choice.effect) {
          player = {
            ...player,
            stats: {
              kashikosa: player.stats.kashikosa + (choice.effect.kashikosa ?? 0),
              chikara: player.stats.chikara + (choice.effect.chikara ?? 0),
              kyokan: player.stats.kyokan + (choice.effect.kyokan ?? 0),
              tekio: player.stats.tekio + (choice.effect.tekio ?? 0),
            },
          }
        }

        if (choice.hpEffect) {
          player = {
            ...player,
            hp: Math.min(player.maxHp, Math.max(0, player.hp + choice.hpEffect)),
          }
        }

        if (choice.mpEffect) {
          player = {
            ...player,
            mp: Math.min(player.maxMp, Math.max(0, player.mp + choice.mpEffect)),
          }
        }

        if (choice.levelUp) {
          player = { ...player, level: player.level + choice.levelUp }
        }

        if (choice.maxHpUp) {
          player = {
            ...player,
            maxHp: player.maxHp + choice.maxHpUp,
            hp: player.hp + choice.maxHpUp,
          }
        }

        if (choice.maxMpUp) {
          player = {
            ...player,
            maxMp: player.maxMp + choice.maxMpUp,
            mp: player.mp + choice.maxMpUp,
          }
        }

        if (choice.itemGain && !player.items.includes(choice.itemGain)) {
          player = { ...player, items: [...player.items, choice.itemGain] }
        }

        if (choice.skillGain && !player.skills.includes(choice.skillGain)) {
          player = { ...player, skills: [...player.skills, choice.skillGain] }
        }

        if (choice.skillGains) {
          for (const sk of choice.skillGains) {
            if (!player.skills.includes(sk)) {
              player = { ...player, skills: [...player.skills, sk] }
            }
          }
        }

        if (choice.partyGain && !player.party.includes(choice.partyGain)) {
          player = { ...player, party: [...player.party, choice.partyGain] }
        }

        if (choice.flagEffect) {
          flags = { ...flags, ...choice.flagEffect }
        }

        if (choice.trueScoreQuestion && choice.questionId) {
          scoring = {
            ...scoring,
            choices: [
              ...scoring.choices,
              { questionId: choice.questionId, selectedOption: choice.label },
            ],
          }
        }

        set({ player, flags, scoring, currentScene: choice.next, saveTimestamp: Date.now() })
      },

      setScoringResult: (score, peaceYears, summary, breakdown) => {
        const state = get()
        set({
          scoring: { ...state.scoring, finalScore: score, peaceYears, summary, breakdown },
          flags: { ...state.flags, defeatedBoss: true },
          saveTimestamp: Date.now(),
        })
      },

      markSceneVisited: (sceneId) => {
        const state = get()
        if (!state.flags.visitedScenes.includes(sceneId)) {
          set({
            flags: {
              ...state.flags,
              visitedScenes: [...state.flags.visitedScenes, sceneId],
            },
          })
        }
      },

      gainItem: (itemId) => {
        const state = get()
        set({ player: { ...state.player, items: [...state.player.items, itemId] } })
      },

      gainSkill: (skillId) => {
        const state = get()
        if (!state.player.skills.includes(skillId)) {
          set({ player: { ...state.player, skills: [...state.player.skills, skillId] } })
        }
      },

      gainPartyMember: (characterId) => {
        const state = get()
        if (!state.player.party.includes(characterId)) {
          set({ player: { ...state.player, party: [...state.player.party, characterId] } })
        }
      },

      damagePlayer: (amount) => {
        const state = get()
        set({ player: { ...state.player, hp: Math.max(0, state.player.hp - amount) } })
      },

      healPlayer: (amount) => {
        const state = get()
        set({ player: { ...state.player, hp: Math.min(state.player.maxHp, state.player.hp + amount) } })
      },

      spendMp: (amount) => {
        const state = get()
        set({ player: { ...state.player, mp: Math.max(0, state.player.mp - amount) } })
      },

      restoreMp: (amount) => {
        const state = get()
        set({ player: { ...state.player, mp: Math.min(state.player.maxMp, state.player.mp + amount) } })
      },

      applyStatBonus: (stats) => {
        const state = get()
        set({
          player: {
            ...state.player,
            stats: {
              kashikosa: state.player.stats.kashikosa + (stats.kashikosa ?? 0),
              chikara: state.player.stats.chikara + (stats.chikara ?? 0),
              kyokan: state.player.stats.kyokan + (stats.kyokan ?? 0),
              tekio: state.player.stats.tekio + (stats.tekio ?? 0),
            },
          },
        })
      },

      setDefeatedBoss: () => {
        const state = get()
        set({ flags: { ...state.flags, defeatedBoss: true } })
      },

      resetGame: () => {
        set({
          player: { ...initialPlayer, items: ['energy_drink'], skills: ['logic_tree'], party: [] },
          flags: { ...initialFlags, visitedScenes: [] },
          scoring: { ...initialScoring, choices: [] },
          currentScene: 'title',
          saveTimestamp: Date.now(),
        })
      },
    }),
    {
      name: 'the-last-consultant-save',
      version: 1,
    }
  )
)
