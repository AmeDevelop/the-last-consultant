import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

export default function TitleScreen() {
  const setScene = useGameStore((s) => s.setScene)
  const resetGame = useGameStore((s) => s.resetGame)
  const flags = useGameStore((s) => s.flags)

  // A save exists if the player has visited at least one scene
  const hasSave = flags.visitedScenes.length > 0
  const saveScene = useGameStore((s) => s.currentScene)

  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300)
    return () => clearTimeout(t)
  }, [])

  function startNew() {
    resetGame()
    setScene('prologue_01')
  }

  function continueGame() {
    // The persist store already has the saved scene; just navigate to it
    if (saveScene && saveScene !== 'title') {
      setScene(saveScene)
    } else {
      setScene('prologue_01')
    }
  }

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #020617, #0c1445, #020617)' }}
    >
      {/* Particle-like dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-400 opacity-20"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>

      <div
        className="flex flex-col items-center gap-8 z-10"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 1s ease-in-out' }}
      >
        {/* Title */}
        <div className="text-center">
          <p className="text-cyan-400 text-sm tracking-widest mb-2 font-game">
            — AI台頭する近未来 —
          </p>
          <h1
            className="font-game font-bold text-white mb-1"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', textShadow: '0 0 30px rgba(34,211,238,0.6)' }}
          >
            The Last Consultant
          </h1>
          <p className="text-amber-400 text-lg tracking-widest font-game">
            〜 最後のコンサルタント 〜
          </p>
        </div>

        {/* Subtitle */}
        <p className="text-gray-400 text-sm font-game text-center max-w-md px-4 leading-relaxed">
          AIに母の仕事を奪われたコンサルタントが、<br />
          AI魔王との対決を通じて自らの在り方を問う——
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-64">
          <button
            onClick={startNew}
            className="px-8 py-3 bg-cyan-800 hover:bg-cyan-700 border border-cyan-500 text-cyan-100 font-game text-lg rounded transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/20"
          >
            ▶　はじめから
          </button>

          {hasSave && (
            <button
              onClick={continueGame}
              className="px-8 py-3 bg-amber-900 hover:bg-amber-800 border border-amber-600 text-amber-100 font-game text-lg rounded transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20"
            >
              ▶　つづきから
            </button>
          )}
        </div>

        {/* Version */}
        <p className="text-gray-600 text-xs font-game">v1.0 — Powered by React + Anthropic API</p>
      </div>
    </div>
  )
}
