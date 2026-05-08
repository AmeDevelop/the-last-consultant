import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import type { Scene } from '../types'
import { getBackground } from '../utils/backgrounds'

interface Props {
  scene: Scene
}

export default function EndingScreen({ scene }: Props) {
  const resetGame = useGameStore((s) => s.resetGame)
  const setScene = useGameStore((s) => s.setScene)
  const scoring = useGameStore((s) => s.scoring)
  const flags = useGameStore((s) => s.flags)

  const [lineIndex, setLineIndex] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [showButtons, setShowButtons] = useState(false)

  const isTrue = scene.sceneId === 'true_ending'
  const isBad = scene.sceneId === 'bad_ending'
  const isGood = scene.sceneId === 'good_ending'
  const isGameOver = scene.sceneId === 'game_over'

  useEffect(() => {
    setLineIndex(0)
    setShowResult(false)
    setShowButtons(false)
  }, [scene.sceneId])

  useEffect(() => {
    if (lineIndex < scene.text.length) {
      const t = setTimeout(() => setLineIndex((i) => i + 1), 1800)
      return () => clearTimeout(t)
    } else {
      const t1 = setTimeout(() => setShowResult(true), 500)
      const t2 = setTimeout(() => setShowButtons(true), 1500)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [lineIndex, scene.text.length])

  const endingLabel =
    isTrue    ? '✨ TRUE ENDING — 共創' :
    isGood    ? '🏆 GOOD ENDING — スカウト' :
    isBad     ? '💀 BAD ENDING — テロリスト' :
    isGameOver ? '💀 GAME OVER' : '— ENDING —'

  const endingColor =
    isTrue    ? 'text-cyan-400' :
    isGood    ? 'text-amber-400' :
    isBad     ? 'text-red-400' :
    'text-gray-400'

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center"
      style={{ background: getBackground(scene.background) }}
    >
      <div className="max-w-md w-full px-6 flex flex-col items-center gap-6">
        {/* Ending label */}
        <div
          className={`font-game font-bold text-xl tracking-widest ${endingColor}`}
          style={{ opacity: lineIndex > 0 ? 1 : 0, transition: 'opacity 1s' }}
        >
          {endingLabel}
        </div>

        {/* Story text */}
        <div className="text-center space-y-3">
          {scene.text.slice(0, lineIndex).map((line, i) => (
            <p
              key={i}
              className="text-gray-100 font-game text-base leading-relaxed"
              style={{ animation: 'fadeIn 0.8s ease-in-out' }}
            >
              {line}
            </p>
          ))}
        </div>

        {/* True Ending score display */}
        {isTrue && showResult && scoring.finalScore !== null && (
          <div className="w-full bg-gray-900/90 border border-cyan-800 rounded-lg p-4 space-y-3">
            <p className="text-cyan-400 font-game font-bold text-center text-sm">— AI魔王の評価 —</p>

            <div className="text-center">
              <span className="text-5xl font-bold font-game text-amber-400">
                {scoring.finalScore}
              </span>
              <span className="text-amber-600 font-game text-xl ml-1">点</span>
            </div>

            {scoring.peaceYears !== null && scoring.peaceYears > 0 && (
              <p className="text-center text-cyan-300 font-game text-sm">
                🕊️ {scoring.peaceYears}年の平和が続いた
              </p>
            )}
            {scoring.peaceYears === 0 && (
              <p className="text-center text-gray-400 font-game text-sm">
                平和は訪れたが、長くは続かなかった……
              </p>
            )}

            {scoring.summary && (
              <p className="text-center text-gray-300 font-game text-sm italic">
                「{scoring.summary}」
              </p>
            )}

            {scoring.breakdown && scoring.breakdown.length > 0 && (
              <div className="space-y-2 mt-2">
                {scoring.breakdown.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-gray-400 font-game text-xs flex-1">{item.axis}</span>
                    <div className="w-20 h-1.5 bg-gray-700 rounded overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded"
                        style={{ width: `${Math.min(100, (item.score / 34) * 100)}%` }}
                      />
                    </div>
                    <span className="text-cyan-400 font-game text-xs w-6 text-right">{item.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Good ending special */}
        {isGood && showResult && (
          <div className="text-center bg-gray-900/80 border border-amber-800 rounded p-4">
            <p className="text-amber-400 font-game text-sm">🏆 Anthropicにスカウトされた！</p>
            <p className="text-gray-400 font-game text-xs mt-1">論理の力でAI時代を切り拓いた</p>
          </div>
        )}

        {/* Bad ending special */}
        {isBad && showResult && (
          <div className="text-center bg-gray-900/80 border border-red-900 rounded p-4">
            <p className="text-red-400 font-game text-sm">💀 指名手配：AI基幹インフラ破壊未遂</p>
            <p className="text-gray-400 font-game text-xs mt-1">力で勝ったが、社会から追われる身に</p>
          </div>
        )}

        {/* Flags display */}
        {showResult && !isGameOver && (
          <div className="flex gap-4 text-xs font-game text-gray-500">
            {flags.defeatedBoss && <span>✓ AI魔王と対決</span>}
            {flags.魔物使い加入 && <span>✓ Ryu加入</span>}
          </div>
        )}

        {/* Buttons */}
        {showButtons && (
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => {
                resetGame()
                setScene('title')
              }}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-100 font-game rounded transition-all"
            >
              ▶ タイトルへ戻る
            </button>
            {!isGameOver && (
              <button
                onClick={() => {
                  resetGame()
                  setScene('prologue_01')
                }}
                className="px-6 py-3 bg-cyan-900 hover:bg-cyan-800 border border-cyan-700 text-cyan-100 font-game rounded transition-all"
              >
                🔄 もう一度プレイ（別ルートへ）
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
