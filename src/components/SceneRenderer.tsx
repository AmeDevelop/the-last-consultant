import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import type { Scene } from '../types'
import { getBackground } from '../utils/backgrounds'

interface Props {
  scene: Scene
}

export default function SceneRenderer({ scene }: Props) {
  const applyChoice = useGameStore((s) => s.applyChoice)
  const setScene = useGameStore((s) => s.setScene)
  const markSceneVisited = useGameStore((s) => s.markSceneVisited)
  const flags = useGameStore((s) => s.flags)
  const player = useGameStore((s) => s.player)

  const [lineIndex, setLineIndex] = useState(0)
  const [showChoices, setShowChoices] = useState(false)
  const [charIndex, setCharIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)

  const currentLine = scene.text[lineIndex] ?? ''
  const displayedText = currentLine.slice(0, charIndex)
  const allLinesShown = lineIndex >= scene.text.length - 1 && charIndex >= currentLine.length

  useEffect(() => {
    setLineIndex(0)
    setCharIndex(0)
    setIsTyping(true)
    setShowChoices(false)
    markSceneVisited(scene.sceneId)
  }, [scene.sceneId, markSceneVisited])

  // Typewriter effect
  useEffect(() => {
    if (!isTyping) return
    if (charIndex >= currentLine.length) {
      setIsTyping(false)
      return
    }
    const speed = currentLine[charIndex] === '。' || currentLine[charIndex] === '——' ? 60 : 30
    const t = setTimeout(() => setCharIndex((i) => i + 1), speed)
    return () => clearTimeout(t)
  }, [charIndex, currentLine, isTyping])

  const advance = useCallback(() => {
    if (isTyping) {
      // Skip to end of current line
      setCharIndex(currentLine.length)
      setIsTyping(false)
      return
    }

    if (lineIndex < scene.text.length - 1) {
      setLineIndex((i) => i + 1)
      setCharIndex(0)
      setIsTyping(true)
    } else {
      // All text shown
      if (scene.choices && scene.choices.length > 0) {
        setShowChoices(true)
      } else if (scene.next) {
        setScene(scene.next)
      }
    }
  }, [isTyping, lineIndex, scene, currentLine.length, setScene])

  // Auto-route scenes
  useEffect(() => {
    if (scene.type === 'auto_route' && scene.routes) {
      const target = flags.routeFlag ? scene.routes[flags.routeFlag] : undefined
      if (target) {
        setScene(target)
      }
    }
  }, [scene, flags.routeFlag, setScene])

  function checkCondition(condition?: string): boolean {
    if (!condition) return true
    if (condition === 'routeFlag_set') return flags.routeFlag !== null
    if (condition === 'route_not_good_true') return flags.routeFlag !== 'good' && flags.routeFlag !== 'true'
    if (condition === 'route_not_bad_true') return flags.routeFlag !== 'bad' && flags.routeFlag !== 'true'
    if (condition === 'route_not_bad_good') return flags.routeFlag !== 'bad' && flags.routeFlag !== 'good'
    if (condition === 'has_skill_stakeholder') return player.skills.includes('stakeholder_negotiation')
    return true
  }

  if (scene.type === 'auto_route') {
    return (
      <div className="w-full h-full flex items-center justify-center"
        style={{ background: getBackground(scene.background) }}>
        <p className="text-gray-400 font-game animate-pulse">Loading...</p>
      </div>
    )
  }

  const visibleChoices = (scene.choices ?? []).filter((c) => checkCondition(c.condition))

  return (
    <div
      className="w-full h-full flex flex-col select-none"
      style={{ background: getBackground(scene.background) }}
    >
      {/* シーンエリア — flex-1で上部を埋める、タップで進む */}
      <div
        className="flex-1 min-h-0 flex items-center justify-center cursor-pointer"
        onClick={!showChoices ? advance : undefined}
      >
        <SceneIllustration background={scene.background} />
      </div>

      {/* テキストパネル — 常に下35%固定、位置がブレない */}
      <div
        className="shrink-0 flex flex-col bg-gray-900/95 border-t border-gray-600"
        style={{ height: '38%', minHeight: '220px', maxHeight: '320px' }}
      >
        {/* 話者名 — 固定行 */}
        <div className="h-8 shrink-0 flex items-center px-4 border-b border-gray-800">
          {scene.speaker && (
            <span className="px-2 py-0.5 bg-cyan-900 border border-cyan-700 rounded text-cyan-300 text-xs font-bold font-game">
              {scene.speaker}
            </span>
          )}
        </div>

        {/* テキスト行 — 固定高さ、ここがズレない */}
        <div
          className="shrink-0 px-4 py-3 cursor-pointer overflow-hidden"
          style={{ height: '5.5rem' }}
          onClick={!showChoices ? advance : undefined}
        >
          <p className="text-gray-100 font-game text-sm leading-relaxed">
            {displayedText}
            {isTyping && <span className="animate-blink text-cyan-400">▌</span>}
          </p>
        </div>

        {/* 下部エリア — 選択肢 or 進むヒント */}
        <div className="flex-1 min-h-0 overflow-y-auto border-t border-gray-800">
          {showChoices ? (
            <div className="p-2 space-y-1.5">
              {visibleChoices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => applyChoice(choice)}
                  className="w-full text-left px-3 py-2.5 bg-gray-800 active:bg-gray-700 border border-gray-700 active:border-amber-500 rounded text-gray-100 font-game text-sm"
                >
                  <span className="text-amber-400 mr-2">{i + 1}.</span>
                  {choice.label}
                </button>
              ))}
            </div>
          ) : (
            <div
              className="h-full flex items-center justify-end px-4 cursor-pointer"
              onClick={advance}
            >
              {allLinesShown ? (
                <span className="text-cyan-400 text-xs font-game animate-bounce">
                  {scene.choices && scene.choices.length > 0 ? '▼ 選択してください' : '▼ タップして進む'}
                </span>
              ) : (
                <span className="text-gray-600 text-xs font-game">タップでスキップ</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SceneIllustration({ background }: { background?: string }) {
  const icons: Record<string, string> = {
    city_night: '🌃',
    apartment: '🏠',
    hospital: '🏥',
    dark_castle: '🏰',
    throne_room: '👾',
    inn_exterior: '🏨',
    inn_room: '🛏️',
    town: '🏘️',
    library: '📚',
    bar: '🍺',
    shop: '🏪',
    gym: '💪',
    sage_house: '🔮',
    outskirts: '🌿',
    town_exit: '🚶',
    training_ground_bad: '⚡',
    training_ground_good: '✨',
    training_ground_true: '🌱',
    datacenter: '💻',
  }

  const icon = icons[background ?? ''] ?? '⚔️'

  return (
    <div className="flex flex-col items-center justify-center opacity-20">
      <span style={{ fontSize: '5rem' }}>{icon}</span>
    </div>
  )
}
