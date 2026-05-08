import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { evaluatePlayerChoices } from '../services/scoringApi'
import type { Scene } from '../types'
import { getBackground } from '../utils/backgrounds'

interface Props {
  scene: Scene
}

export default function ScoringScreen({ scene }: Props) {
  const scoring = useGameStore((s) => s.scoring)
  const setScoringResult = useGameStore((s) => s.setScoringResult)
  const setScene = useGameStore((s) => s.setScene)

  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [lineIndex, setLineIndex] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const result = await evaluatePlayerChoices(scoring.choices)
        if (cancelled) return
        setScoringResult(result.score, result.peaceYears, result.summary, result.breakdown)
        setStatus('done')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    run()
    return () => { cancelled = true }
  }, [scoring.choices, setScoringResult])

  // Show intro text then navigate
  useEffect(() => {
    if (status !== 'done') return
    if (lineIndex < scene.text.length) {
      const t = setTimeout(() => setLineIndex((i) => i + 1), 1500)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => setScene(scene.next ?? 'true_ending'), 1000)
      return () => clearTimeout(t)
    }
  }, [status, lineIndex, scene, setScene])

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-6"
      style={{ background: getBackground(scene.background) }}
    >
      {status === 'loading' && (
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⚙️</div>
          <p className="text-cyan-400 font-game text-lg animate-pulse">
            AI魔王があなたの回答を分析中……
          </p>
          <p className="text-gray-500 font-game text-sm mt-2">
            共創の可能性を評価しています
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center">
          <p className="text-red-400 font-game">スコアリングAPIに接続できませんでした</p>
          <p className="text-gray-500 font-game text-sm mt-1">ローカルスコアリングで代替します</p>
          <button
            className="mt-4 px-6 py-2 bg-cyan-800 text-cyan-100 font-game rounded"
            onClick={() => setScene(scene.next ?? 'true_ending')}
          >
            続ける
          </button>
        </div>
      )}

      {status === 'done' && (
        <div className="text-center max-w-sm px-6">
          {scene.text.slice(0, lineIndex).map((line, i) => (
            <p key={i} className="text-gray-100 font-game text-lg leading-relaxed mb-2">
              {line}
            </p>
          ))}
          {lineIndex >= scene.text.length && (
            <p className="text-cyan-400 font-game text-sm animate-pulse mt-4">
              エンディングへ……
            </p>
          )}
        </div>
      )}
    </div>
  )
}
