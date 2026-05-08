import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { STAT_LABELS } from '../utils/constants'

export default function StatusBar() {
  const player = useGameStore((s) => s.player)
  const flags = useGameStore((s) => s.flags)
  const setScene = useGameStore((s) => s.setScene)
  const [showMenu, setShowMenu] = useState(false)

  const hpPct = (player.hp / player.maxHp) * 100
  const mpPct = (player.mp / player.maxMp) * 100
  const hpLow = hpPct < 30

  const routeLabel =
    flags.routeFlag === 'bad'  ? '💪 力ルート' :
    flags.routeFlag === 'good' ? '📚 知ルート' :
    flags.routeFlag === 'true' ? '🤝 共創ルート' : ''

  return (
    <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-1.5 bg-gray-900/90 border-b border-gray-700 text-xs font-game">
      {/* Name & Level */}
      <div className="text-amber-400 font-bold whitespace-nowrap">
        Lv{player.level} {player.name}
      </div>

      {/* HP */}
      <div className="flex items-center gap-1 min-w-[120px]">
        <span className="text-gray-400">HP</span>
        <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
          <div
            className={`h-full rounded transition-all duration-500 ${hpLow ? 'bar-hp-low' : 'bar-hp'}`}
            style={{ width: `${hpPct}%` }}
          />
        </div>
        <span className={hpLow ? 'text-red-400' : 'text-green-400'}>
          {player.hp}/{player.maxHp}
        </span>
      </div>

      {/* MP */}
      <div className="flex items-center gap-1 min-w-[100px]">
        <span className="text-gray-400">MP</span>
        <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
          <div className="bar-mp h-full rounded" style={{ width: `${mpPct}%` }} />
        </div>
        <span className="text-blue-400">{player.mp}/{player.maxMp}</span>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-3 text-gray-400">
        {(Object.entries(player.stats) as [string, number][]).map(([k, v]) => (
          <span key={k}>
            <span className="text-gray-500">{STAT_LABELS[k] ?? k}</span>
            <span className="text-cyan-400 ml-1">{v}</span>
          </span>
        ))}
      </div>

      {/* Route badge */}
      <div className="ml-auto flex items-center gap-2">
        {routeLabel && (
          <span className="text-xs text-gray-500 whitespace-nowrap hidden sm:inline">{routeLabel}</span>
        )}
        <div className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="text-gray-500 hover:text-gray-300 px-2 py-0.5 rounded transition-colors"
            title="メニュー"
          >
            ☰
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-50 min-w-[140px]">
              <button
                onClick={() => { setShowMenu(false); setScene('title') }}
                className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 font-game text-xs rounded"
              >
                タイトルへ戻る
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
