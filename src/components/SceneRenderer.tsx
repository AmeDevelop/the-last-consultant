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
      className="w-full h-full flex flex-col relative cursor-pointer select-none"
      style={{ background: getBackground(scene.background) }}
      onClick={!showChoices ? advance : undefined}
    >
      {/* Scene illustration area (decorative) */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <SceneIllustration background={scene.background} />
      </div>

      {/* Text box */}
      <div className="relative">
        {/* Speaker name */}
        {scene.speaker && (
          <div className="absolute -top-7 left-4 px-3 py-1 bg-cyan-900 border border-cyan-600 rounded text-cyan-300 text-sm font-game font-bold z-10">
            {scene.speaker}
          </div>
        )}

        <div className="bg-gray-900/95 border-t border-gray-600 p-4 min-h-[120px] flex flex-col justify-between">
          <p className="text-gray-100 font-game text-base leading-relaxed">
            {displayedText}
            {isTyping && <span className="animate-blink text-cyan-400">▌</span>}
          </p>

          {!showChoices && (
            <div className="flex justify-end mt-2">
              {allLinesShown && scene.next && !scene.choices && (
                <span className="text-cyan-400 text-xs font-game animate-bounce">▼ タップして進む</span>
              )}
              {!allLinesShown && (
                <span className="text-gray-600 text-xs font-game">タップしてスキップ</span>
              )}
              {allLinesShown && scene.choices && scene.choices.length > 0 && (
                <span className="text-amber-400 text-xs font-game animate-bounce">▼ 選択してください</span>
              )}
            </div>
          )}
        </div>

        {/* Choices */}
        {showChoices && (
          <div className="bg-gray-950/98 border-t border-amber-800 p-3 space-y-2">
            {visibleChoices.map((choice, i) => (
              <button
                key={i}
                onClick={() => applyChoice(choice)}
                className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-amber-500 rounded text-gray-100 font-game text-sm transition-all duration-150 hover:shadow-md"
              >
                <span className="text-amber-400 mr-2">{i + 1}.</span>
                {choice.label}
              </button>
            ))}
          </div>
        )}
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
