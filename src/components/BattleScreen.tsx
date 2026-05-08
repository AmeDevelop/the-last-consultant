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

  const [phase, setPhase] = useState<Phase>(introText && introText.length > 0 ? 'intro' : 'player_turn')
  const [introIndex, setIntroIndex] = useState(0)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [enemyHp, setEnemyHp] = useState(battle.enemyHp)
  const [playerBattleHp, setPlayerBattleHp] = useState(player.hp)
  const [playerBattleMp, setPlayerBattleMp] = useState(player.mp)
  const [subMenu, setSubMenu] = useState<SubMenu>('none')
  const [swotBuff, setSwotBuff] = useState(false)
  const [shake, setShake] = useState<'player' | 'enemy' | null>(null)
  const [specialTriggered, setSpecialTriggered] = useState(false)

  function addLog(msg: string) {
    setBattleLog((prev) => [...prev.slice(-3), msg])
  }

  function triggerShake(target: 'player' | 'enemy') {
    setShake(target)
    setTimeout(() => setShake(null), 350)
  }

  function calcPlayerDmg() {
    const base = 15 + Math.floor(player.stats.chikara / 2) + Math.floor(Math.random() * 6) - 3
    return Math.max(1, base - Math.floor(battle.enemyDefense / 3))
  }

  function calcEnemyDmg() {
    const def = Math.floor(player.stats.chikara / 8)
    return Math.max(2, battle.enemyAttack - def + Math.floor(Math.random() * 6) - 3)
  }

  const checkWinCondition = useCallback(() => {
    if (!battle.winCondition || battle.winCondition === 'any') return true
    if (battle.winCondition === 'kashikosa') return player.stats.kashikosa >= (battle.winStatThreshold ?? 25)
    if (battle.winCondition === 'chikara') return player.stats.chikara >= (battle.winStatThreshold ?? 20)
    return true
  }, [battle, player.stats])

  // Special trigger check
  useEffect(() => {
    if (specialTriggered || !battle.specialTrigger || phase !== 'player_turn') return
    const pct = (enemyHp / battle.enemyMaxHp) * 100
    if (pct <= battle.specialTrigger.threshold) {
      setSpecialTriggered(true)
      setPhase('special')
      addLog(battle.specialTrigger.text)
    }
  }, [enemyHp, battle, specialTriggered, phase])

  // Forced loss check
  useEffect(() => {
    if (!battle.forced) return
    const pct = (playerBattleHp / player.maxHp) * 100
    if (pct <= (battle.forcedLossHpThreshold ?? 20)) {
      addLog('力の差は歴然……')
      setPhase('defeat')
    }
  }, [playerBattleHp, player.maxHp, battle])

  // Scene transitions
  useEffect(() => {
    if (phase === 'victory') {
      const t = setTimeout(() => setScene(battle.winScene), 1500)
      return () => clearTimeout(t)
    }
    if (phase === 'defeat') {
      const t = setTimeout(() => setScene(battle.loseScene), 1800)
      return () => clearTimeout(t)
    }
    if (phase === 'special' && battle.specialTrigger) {
      const t = setTimeout(() => setScene(battle.specialTrigger!.scene), 2000)
      return () => clearTimeout(t)
    }
  }, [phase, battle, setScene])

  function handleIntroTap() {
    if (introText && introIndex < introText.length - 1) {
      setIntroIndex((i) => i + 1)
    } else {
      setPhase('player_turn')
      addLog('戦闘開始！')
    }
  }

  function resolveAfterEnemy() {
    setTimeout(() => {
      setPhase('enemy_turn')
      const dmg = calcEnemyDmg()
      setPlayerBattleHp((prev) => {
        const newHp = Math.max(0, prev - dmg)
        damagePlayer(dmg)
        triggerShake('player')
        addLog(`${battle.enemyName}の攻撃！ ${dmg}ダメージ！`)
        if (newHp <= 0) setPhase('defeat')
        else setTimeout(() => setPhase('player_turn'), 600)
        return newHp
      })
    }, 700)
  }

  function doAttack() {
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
    addLog(crit ? `クリティカル！ ${dmg}ダメージ！` : `攻撃！ ${dmg}ダメージ！`)

    if (newEnemyHp <= 0) {
      setPhase(checkWinCondition() ? 'victory' : 'player_turn')
      if (!checkWinCondition()) {
        setEnemyHp(Math.floor(battle.enemyMaxHp * 0.1))
        addLog('まだ力が足りない……')
      }
      return
    }
    resolveAfterEnemy()
  }

  function doSkill(skillId: string) {
    const skill = SKILLS[skillId]
    if (!skill || playerBattleMp < skill.mpCost) { addLog('MPが足りない！'); return }
    setSubMenu('none')
    setPhase('player_action')
    setPlayerBattleMp((m) => { spendMp(skill.mpCost); return m - skill.mpCost })

    if (skill.effect === 'heal_hp') {
      setPlayerBattleHp((h) => { const n = Math.min(player.maxHp, h + skill.value); healPlayer(n - h); return n })
      addLog(`${skill.name}！ HP+${skill.value}！`)
      setTimeout(() => setPhase('player_turn'), 600)
      return
    }
    if (skill.effect === 'buff') {
      setSwotBuff(true)
      addLog(`${skill.name}！ 次の攻撃クリティカル確定！`)
      setTimeout(() => setPhase('player_turn'), 600)
      return
    }
    if (skill.effect === 'damage') {
      const bonus = skill.stat ? player.stats[skill.stat as keyof typeof player.stats] : 0
      const dmg = skill.value + Math.floor(bonus * 0.8)
      const newEnemyHp = Math.max(0, enemyHp - dmg)
      setEnemyHp(newEnemyHp)
      triggerShake('enemy')
      addLog(`${skill.name}！ ${dmg}ダメージ！`)
      if (newEnemyHp <= 0) { setPhase('victory'); return }
      resolveAfterEnemy()
      return
    }
    if (skill.effect === 'negotiate') {
      const chance = Math.min(0.7, player.stats.kyokan / 50)
      if (Math.random() < chance) { addLog('交渉成功！'); setPhase('victory') }
      else { addLog('交渉失敗……'); resolveAfterEnemy() }
      return
    }
  }

  function doItem(itemId: string) {
    const item = ITEMS[itemId]
    if (!item) return
    setSubMenu('none')
    setPhase('player_action')
    if (item.effect === 'hp') {
      setPlayerBattleHp((h) => { const n = Math.min(player.maxHp, h + item.value); healPlayer(n - h); return n })
      addLog(`${item.name}使用！ HP+${item.value}！`)
    } else if (item.effect === 'mp') {
      const restored = player.maxMp - playerBattleMp
      setPlayerBattleMp(player.maxMp)
      restoreMp(restored)
      addLog(`${item.name}使用！ MP全回復！`)
    }
    setTimeout(() => setPhase('player_turn'), 600)
  }

  const hpPct = (playerBattleHp / player.maxHp) * 100
  const mpPct = (playerBattleMp / player.maxMp) * 100
  const enemyHpPct = (enemyHp / battle.enemyMaxHp) * 100
  const hpLow = hpPct < 30

  const usableSkills = player.skills.filter((s) => s !== 'monster_tamer' && SKILLS[s])
  const usableItems = player.items.filter((i) => i !== 'power_cord' && ITEMS[i])

  const isActive = phase === 'player_turn'

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: getBackground(background) }}
    >
      {/* ── 上部：敵エリア（flex-1） ── */}
      <div className={`flex-1 min-h-0 flex flex-col items-center justify-center gap-2 p-4 ${shake === 'enemy' ? 'shake' : ''}`}>
        <div className="text-5xl">👾</div>
        <p className="text-red-300 font-game font-bold text-base">{battle.enemyName}</p>
        <div className="w-44 h-2.5 bg-gray-700 rounded overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-700 to-red-400 rounded transition-all duration-500"
            style={{ width: `${enemyHpPct}%` }}
          />
        </div>
        <p className="text-red-400 text-xs font-game">{enemyHp} / {battle.enemyMaxHp}</p>
        {battle.forced && <p className="text-yellow-600 text-xs font-game">（圧倒的な力の差を感じる……）</p>}
      </div>

      {/* ── 下部：固定パネル ── */}
      <div
        className="shrink-0 flex flex-col bg-gray-900/95 border-t border-gray-700"
        style={{ height: '48%', minHeight: '260px', maxHeight: '360px' }}
      >
        {/* バトルログ */}
        <div className="shrink-0 px-3 py-2 border-b border-gray-800" style={{ height: '5.5rem' }}>
          {battleLog.length === 0 && phase === 'intro' && introText && (
            <p className="text-gray-300 font-game text-sm">{introText[introIndex]}</p>
          )}
          {battleLog.map((log, i) => (
            <p key={i} className="text-gray-300 font-game text-xs leading-relaxed">{log}</p>
          ))}
          {(phase === 'victory' || phase === 'defeat' || phase === 'special') && (
            <p className="text-amber-400 font-game text-sm font-bold animate-pulse">
              {phase === 'victory' && '✨ 勝利！'}
              {phase === 'defeat' && '💀 力尽きた……'}
              {phase === 'special' && (battle.specialTrigger?.text ?? '特殊イベント発動！')}
            </p>
          )}
        </div>

        {/* プレイヤー HP/MP */}
        <div className={`shrink-0 flex gap-4 px-3 py-2 border-b border-gray-800 ${shake === 'player' ? 'shake' : ''}`}>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-gray-400 text-xs font-game shrink-0">HP</span>
            <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
              <div
                className={`h-full rounded transition-all duration-500 ${hpLow ? 'bar-hp-low' : 'bar-hp'}`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
            <span className={`text-xs font-game shrink-0 ${hpLow ? 'text-red-400' : 'text-green-400'}`}>
              {playerBattleHp}/{player.maxHp}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-gray-400 text-xs font-game shrink-0">MP</span>
            <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
              <div className="bar-mp h-full rounded" style={{ width: `${mpPct}%` }} />
            </div>
            <span className="text-blue-400 text-xs font-game shrink-0">{playerBattleMp}/{player.maxMp}</span>
          </div>
        </div>

        {/* コマンドエリア（flex-1 で残りを埋める） */}
        <div className="flex-1 min-h-0 overflow-y-auto">

          {/* イントロ */}
          {phase === 'intro' && (
            <button
              onClick={handleIntroTap}
              className="w-full h-full flex items-center justify-center text-cyan-400 font-game text-sm animate-pulse"
            >
              ▼ タップして開始
            </button>
          )}

          {/* メインコマンド */}
          {isActive && subMenu === 'none' && (
            <div className="grid grid-cols-4 gap-1.5 p-2 h-full">
              {[
                { label: '⚔️\nこうげき', action: doAttack },
                { label: '✨\nスキル', action: () => setSubMenu('skill'), disabled: usableSkills.length === 0 },
                { label: '🎒\nアイテム', action: () => setSubMenu('item'), disabled: usableItems.length === 0 },
                { label: '🏃\nにげる', action: () => setScene('pre_final'), disabled: !!battle.forced },
              ].map((cmd) => (
                <button
                  key={cmd.label}
                  onClick={cmd.disabled ? undefined : cmd.action}
                  className={`rounded font-game text-xs font-bold whitespace-pre-line flex items-center justify-center transition-all ${
                    cmd.disabled
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-700 active:bg-gray-600 text-gray-100 border border-gray-600 active:border-cyan-500'
                  }`}
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          )}

          {/* スキルサブメニュー */}
          {isActive && subMenu === 'skill' && (
            <div className="p-2 space-y-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-amber-400 font-game text-xs font-bold">スキル選択</span>
                <button onClick={() => setSubMenu('none')} className="text-gray-500 font-game text-xs px-2">← 戻る</button>
              </div>
              {usableSkills.map((skillId) => {
                const skill = SKILLS[skillId]
                const canUse = playerBattleMp >= skill.mpCost
                return (
                  <button key={skillId} onClick={canUse ? () => doSkill(skillId) : undefined}
                    className={`w-full text-left px-3 py-2 rounded font-game text-xs ${canUse ? 'bg-gray-700 active:bg-gray-600 text-gray-100' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>
                    <span className="font-bold">{skill.name}</span>
                    <span className="text-gray-400 ml-1">{skill.description}</span>
                    <span className="text-blue-400 ml-1">MP:{skill.mpCost}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* アイテムサブメニュー */}
          {isActive && subMenu === 'item' && (
            <div className="p-2 space-y-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-amber-400 font-game text-xs font-bold">アイテム使用</span>
                <button onClick={() => setSubMenu('none')} className="text-gray-500 font-game text-xs px-2">← 戻る</button>
              </div>
              {usableItems.length === 0 && <p className="text-gray-500 font-game text-xs px-2">アイテムなし</p>}
              {usableItems.map((itemId, idx) => (
                <button key={idx} onClick={() => doItem(itemId)}
                  className="w-full text-left px-3 py-2 rounded bg-gray-700 active:bg-gray-600 text-gray-100 font-game text-xs">
                  <span className="font-bold">{ITEMS[itemId].name}</span>
                  <span className="text-gray-400 ml-1">{ITEMS[itemId].description}</span>
                </button>
              ))}
            </div>
          )}

          {/* 行動中表示 */}
          {(phase === 'enemy_turn' || phase === 'player_action') && (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400 font-game text-sm animate-pulse">
                {phase === 'enemy_turn' ? `${battle.enemyName}の行動中……` : '行動中……'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
