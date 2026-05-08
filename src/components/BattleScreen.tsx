import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import type { BattleConfig } from '../types'
import { getBackground } from '../utils/backgrounds'
import { SKILLS, ITEMS } from '../utils/constants'

interface Props {
  battle: BattleConfig
  background?: string
  introText?: string[]
}

type Phase = 'intro' | 'player_turn' | 'player_action' | 'enemy_turn' | 'victory' | 'defeat' | 'special'
type SubMenu = 'none' | 'skill' | 'item'

export default function BattleScreen({ battle, background, introText }: Props) {
  const player = useGameStore((s) => s.player)
  const setScene = useGameStore((s) => s.setScene)
  const damagePlayer = useGameStore((s) => s.damagePlayer)
  const healPlayer = useGameStore((s) => s.healPlayer)
  const spendMp = useGameStore((s) => s.spendMp)
  const restoreMp = useGameStore((s) => s.restoreMp)

  const [phase, setPhase] = useState<Phase>('intro')
  const [introIndex, setIntroIndex] = useState(0)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [enemyHp, setEnemyHp] = useState(battle.enemyHp)
  const [playerBattleHp, setPlayerBattleHp] = useState(player.hp)
  const [playerBattleMp, setPlayerBattleMp] = useState(player.mp)
  const [subMenu, setSubMenu] = useState<SubMenu>('none')
  const [swotBuff, setSwotBuff] = useState(false)
  const [shake, setShake] = useState<'player' | 'enemy' | null>(null)
  const [specialTriggered, setSpecialTriggered] = useState(false)

  function calcPlayerDmg() {
    const base = 15 + Math.floor(player.stats.chikara / 2) + Math.floor(Math.random() * 6) - 3
    return Math.max(1, base - Math.floor(battle.enemyDefense / 3))
  }

  function calcEnemyDmg() {
    const def = Math.floor(player.stats.chikara / 8)
    return Math.max(2, battle.enemyAttack - def + Math.floor(Math.random() * 6) - 3)
  }

  function addLog(msg: string) {
    setBattleLog((prev) => [...prev.slice(-4), msg])
  }

  function triggerShake(target: 'player' | 'enemy') {
    setShake(target)
    setTimeout(() => setShake(null), 350)
  }

  const checkWinCondition = useCallback(() => {
    if (!battle.winCondition || battle.winCondition === 'any') return true
    if (battle.winCondition === 'kashikosa') return player.stats.kashikosa >= (battle.winStatThreshold ?? 25)
    if (battle.winCondition === 'chikara') return player.stats.chikara >= (battle.winStatThreshold ?? 20)
    return true
  }, [battle, player.stats])

  // Check special trigger
  useEffect(() => {
    if (specialTriggered) return
    if (!battle.specialTrigger) return
    const pct = (enemyHp / battle.enemyMaxHp) * 100
    if (pct <= battle.specialTrigger.threshold) {
      setSpecialTriggered(true)
      setPhase('special')
      addLog(battle.specialTrigger.text)
    }
  }, [enemyHp, battle, specialTriggered])

  // Forced loss check
  useEffect(() => {
    if (!battle.forced) return
    const pct = (playerBattleHp / player.maxHp) * 100
    if (pct <= (battle.forcedLossHpThreshold ?? 20)) {
      setPhase('defeat')
    }
  }, [playerBattleHp, player.maxHp, battle])

  function doPlayerAttack() {
    if (phase !== 'player_turn') return
    setSubMenu('none')
    setPhase('player_action')

    const crit = swotBuff
    const base = calcPlayerDmg()
    const dmg = crit ? (base + Math.floor(player.stats.kashikosa / 2)) * 2 : base
    setSwotBuff(false)

    const newEnemyHp = Math.max(0, enemyHp - dmg)
    setEnemyHp(newEnemyHp)
    triggerShake('enemy')
    addLog(crit ? `クリティカル！ ${dmg}のダメージ！` : `${dmg}のダメージを与えた！`)

    if (newEnemyHp <= 0) {
      if (checkWinCondition()) {
        setPhase('victory')
      } else {
        addLog('しかし、まだ力が足りない……')
        setPhase('player_turn')
        setEnemyHp(Math.floor(battle.enemyMaxHp * 0.1))
      }
      return
    }

    setTimeout(() => doEnemyTurn(newEnemyHp), 800)
  }

  function doSkill(skillId: string) {
    const skill = SKILLS[skillId]
    if (!skill) return
    if (playerBattleMp < skill.mpCost) {
      addLog('MPが足りない！')
      return
    }
    setSubMenu('none')
    setPhase('player_action')

    const newMp = playerBattleMp - skill.mpCost
    setPlayerBattleMp(newMp)
    spendMp(skill.mpCost)

    if (skill.effect === 'heal_hp') {
      const healed = Math.min(player.maxHp - playerBattleHp, skill.value)
      setPlayerBattleHp((h) => Math.min(player.maxHp, h + skill.value))
      healPlayer(healed)
      addLog(`${skill.name}！ HP${skill.value}回復！`)
      setTimeout(() => setPhase('player_turn'), 600)
      return
    }

    if (skill.effect === 'buff') {
      setSwotBuff(true)
      addLog(`${skill.name}！ 次の攻撃がクリティカル確定！`)
      setTimeout(() => setPhase('player_turn'), 600)
      return
    }

    if (skill.effect === 'damage') {
      const statBonus = skill.stat ? player.stats[skill.stat as keyof typeof player.stats] : 0
      const dmg = skill.value + Math.floor(statBonus * 0.8)
      const newEnemyHp = Math.max(0, enemyHp - dmg)
      setEnemyHp(newEnemyHp)
      triggerShake('enemy')
      addLog(`${skill.name}！ ${dmg}のダメージ！`)

      if (newEnemyHp <= 0) {
        if (checkWinCondition()) {
          setPhase('victory')
        } else {
          addLog('しかし、まだ力が足りない……')
          setPhase('player_turn')
          setEnemyHp(Math.floor(battle.enemyMaxHp * 0.1))
        }
        return
      }
      setTimeout(() => doEnemyTurn(newEnemyHp), 800)
      return
    }

    if (skill.effect === 'negotiate') {
      const chance = Math.min(0.7, (player.stats.kyokan / 50))
      if (Math.random() < chance) {
        addLog('交渉成功！ 戦闘を終わらせた！')
        setPhase('victory')
      } else {
        addLog('交渉失敗……相手は怒りをあらわにした！')
        setTimeout(() => doEnemyTurn(enemyHp), 800)
      }
      return
    }
  }

  function doItem(itemId: string) {
    const item = ITEMS[itemId]
    if (!item) return
    setSubMenu('none')
    setPhase('player_action')

    if (item.effect === 'hp') {
      const healed = Math.min(player.maxHp - playerBattleHp, item.value)
      setPlayerBattleHp((h) => Math.min(player.maxHp, h + item.value))
      healPlayer(healed)
      addLog(`${item.name}を使った！ HP${item.value}回復！`)
    } else if (item.effect === 'mp') {
      const restored = player.maxMp - playerBattleMp
      setPlayerBattleMp(player.maxMp)
      restoreMp(restored)
      addLog(`${item.name}を使った！ MP全回復！`)
    }

    setTimeout(() => setPhase('player_turn'), 600)
  }

  function doEnemyTurn(currentEnemyHp: number) {
    if (currentEnemyHp <= 0) return
    setPhase('enemy_turn')
    const dmg = calcEnemyDmg()
    const newHp = Math.max(0, playerBattleHp - dmg)
    setPlayerBattleHp(newHp)
    damagePlayer(dmg)
    triggerShake('player')
    addLog(`${battle.enemyName}の攻撃！ ${dmg}のダメージを受けた！`)

    if (newHp <= 0) {
      setPhase('defeat')
      return
    }

    setTimeout(() => setPhase('player_turn'), 600)
  }

  function doRun() {
    addLog('逃げ出した……')
    setTimeout(() => setScene('pre_final'), 800)
  }

  useEffect(() => {
    if (phase === 'victory') {
      setTimeout(() => {
        setScene(battle.winScene)
      }, 1500)
    }
    if (phase === 'defeat') {
      setTimeout(() => {
        setScene(battle.loseScene)
      }, 1500)
    }
    if (phase === 'special' && battle.specialTrigger) {
      setTimeout(() => {
        setScene(battle.specialTrigger!.scene)
      }, 2000)
    }
  }, [phase, battle, setScene])

  const hpPct = (playerBattleHp / player.maxHp) * 100
  const enemyHpPct = (enemyHp / battle.enemyMaxHp) * 100
  const mpPct = (playerBattleMp / player.maxMp) * 100

  const usableSkills = player.skills.filter(
    (s) => s !== 'monster_tamer' && SKILLS[s]
  )
  const usableItems = player.items.filter(
    (i) => i !== 'power_cord' && ITEMS[i]
  )

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: getBackground(background) }}
    >
      {/* Intro text overlay */}
      {phase === 'intro' && introText && introText.length > 0 && (
        <div
          className="absolute inset-0 bg-gray-950/80 flex items-center justify-center z-50 cursor-pointer"
          onClick={() => {
            if (introIndex < introText.length - 1) {
              setIntroIndex((i) => i + 1)
            } else {
              setPhase('player_turn')
            }
          }}
        >
          <div className="max-w-md text-center px-8">
            <p className="text-gray-100 font-game text-lg leading-relaxed mb-4">
              {introText[introIndex]}
            </p>
            <p className="text-gray-500 text-xs font-game animate-bounce">▼ タップして続ける</p>
          </div>
        </div>
      )}

      {/* Enemy area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        {/* Enemy status */}
        <div className={`text-center ${shake === 'enemy' ? 'shake' : ''}`}>
          <div className="text-6xl mb-3">👾</div>
          <p className="text-red-300 font-game font-bold text-lg mb-2">{battle.enemyName}</p>
          <div className="w-48 h-3 bg-gray-700 rounded overflow-hidden mx-auto">
            <div
              className="h-full bg-gradient-to-r from-red-700 to-red-400 rounded transition-all duration-500"
              style={{ width: `${enemyHpPct}%` }}
            />
          </div>
          <p className="text-red-400 text-xs font-game mt-1">{enemyHp} / {battle.enemyMaxHp}</p>
          {battle.forced && (
            <p className="text-yellow-600 text-xs font-game mt-1">（圧倒的な力の差を感じる……）</p>
          )}
        </div>

        {/* Battle log */}
        <div className="w-full max-w-sm bg-gray-900/80 border border-gray-700 rounded p-3 min-h-[80px]">
          {battleLog.slice(-3).map((log, i) => (
            <p key={i} className="text-gray-300 font-game text-sm leading-relaxed">{log}</p>
          ))}
          {(phase === 'victory' || phase === 'defeat' || phase === 'special') && (
            <p className="text-amber-400 font-game text-sm font-bold animate-pulse mt-1">
              {phase === 'victory' && '勝利！ 次のシーンへ……'}
              {phase === 'defeat' && '力尽きた……'}
              {phase === 'special' && (battle.specialTrigger?.text ?? '特殊イベント発動！')}
            </p>
          )}
        </div>
      </div>

      {/* Player area + commands */}
      <div className="bg-gray-900/95 border-t border-gray-700">
        {/* Player HP/MP */}
        <div className={`flex gap-4 px-4 py-2 border-b border-gray-800 ${shake === 'player' ? 'shake' : ''}`}>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-gray-400 text-xs font-game">HP</span>
            <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
              <div
                className={`h-full rounded transition-all duration-500 ${hpPct < 30 ? 'bar-hp-low' : 'bar-hp'}`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
            <span className={`text-xs font-game ${hpPct < 30 ? 'text-red-400' : 'text-green-400'}`}>
              {playerBattleHp}/{player.maxHp}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-gray-400 text-xs font-game">MP</span>
            <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
              <div className="bar-mp h-full rounded" style={{ width: `${mpPct}%` }} />
            </div>
            <span className="text-blue-400 text-xs font-game">{playerBattleMp}/{player.maxMp}</span>
          </div>
        </div>

        {/* Command menu */}
        {phase === 'player_turn' && subMenu === 'none' && (
          <div className="grid grid-cols-4 gap-2 p-3">
            {[
              { label: '⚔️ こうげき', action: doPlayerAttack },
              { label: '✨ スキル', action: () => setSubMenu('skill'), disabled: usableSkills.length === 0 },
              { label: '🎒 アイテム', action: () => setSubMenu('item'), disabled: usableItems.length === 0 },
              { label: '🏃 にげる', action: doRun, disabled: battle.forced },
            ].map((cmd) => (
              <button
                key={cmd.label}
                onClick={cmd.disabled ? undefined : cmd.action}
                className={`py-2 rounded font-game text-xs font-bold transition-all duration-150 ${
                  cmd.disabled
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600 hover:border-cyan-500'
                }`}
              >
                {cmd.label}
              </button>
            ))}
          </div>
        )}

        {/* Skill submenu */}
        {phase === 'player_turn' && subMenu === 'skill' && (
          <div className="p-3 space-y-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-amber-400 font-game text-sm font-bold">スキルを選ぶ</span>
              <button onClick={() => setSubMenu('none')} className="text-gray-500 text-xs font-game">← 戻る</button>
            </div>
            {usableSkills.map((skillId) => {
              const skill = SKILLS[skillId]
              const canUse = playerBattleMp >= skill.mpCost
              return (
                <button
                  key={skillId}
                  onClick={canUse ? () => doSkill(skillId) : undefined}
                  className={`w-full text-left px-3 py-2 rounded font-game text-sm transition-all ${
                    canUse
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <span className="font-bold">{skill.name}</span>
                  <span className="text-gray-400 ml-2 text-xs">{skill.description}</span>
                  <span className="text-blue-400 ml-2 text-xs">MP:{skill.mpCost}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Item submenu */}
        {phase === 'player_turn' && subMenu === 'item' && (
          <div className="p-3 space-y-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-amber-400 font-game text-sm font-bold">アイテムを使う</span>
              <button onClick={() => setSubMenu('none')} className="text-gray-500 text-xs font-game">← 戻る</button>
            </div>
            {usableItems.length === 0 && (
              <p className="text-gray-500 font-game text-sm">アイテムがない</p>
            )}
            {usableItems.map((itemId, idx) => {
              const item = ITEMS[itemId]
              return (
                <button
                  key={idx}
                  onClick={() => doItem(itemId)}
                  className="w-full text-left px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-100 font-game text-sm transition-all"
                >
                  <span className="font-bold">{item.name}</span>
                  <span className="text-gray-400 ml-2 text-xs">{item.description}</span>
                </button>
              )
            })}
          </div>
        )}

        {(phase === 'enemy_turn' || phase === 'player_action') && (
          <div className="p-3 text-center">
            <p className="text-gray-400 font-game text-sm animate-pulse">
              {phase === 'enemy_turn' ? `${battle.enemyName}の行動……` : '行動中……'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
