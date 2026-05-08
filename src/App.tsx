import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import TitleScreen from './components/TitleScreen'
import SceneRenderer from './components/SceneRenderer'
import BattleScreen from './components/BattleScreen'
import ScoringScreen from './components/ScoringScreen'
import EndingScreen from './components/EndingScreen'
import StatusBar from './components/StatusBar'
import scenesData from './data/scenes.json'
import type { Scene } from './types'

const scenes = scenesData.scenes as Record<string, Scene>

export default function App() {
  const currentScene = useGameStore((s) => s.currentScene)
  const setScene = useGameStore((s) => s.setScene)

  // Sync HP/MP after battle (full restore at inn)
  const player = useGameStore((s) => s.player)
  const healPlayer = useGameStore((s) => s.healPlayer)
  const restoreMp = useGameStore((s) => s.restoreMp)

  useEffect(() => {
    // Full restore at inn_recovery
    if (currentScene === 'inn_recovery') {
      healPlayer(player.maxHp - player.hp)
      restoreMp(player.maxMp - player.mp)
    }
  }, [currentScene, healPlayer, restoreMp, player.maxHp, player.hp, player.maxMp, player.mp])

  if (currentScene === 'title') {
    return (
      <div className="w-screen h-screen overflow-hidden">
        <TitleScreen />
      </div>
    )
  }

  const scene = scenes[currentScene]

  if (!scene) {
    return (
      <div className="w-screen h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 font-game">シーンが見つかりません: {currentScene}</p>
        <button
          className="px-4 py-2 bg-gray-800 text-gray-100 font-game rounded"
          onClick={() => setScene('title')}
        >
          タイトルへ戻る
        </button>
      </div>
    )
  }

  const isEnding = scene.type === 'ending'
  const isBattle = scene.type === 'battle'
  const isScoring = scene.type === 'scoring'

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col">
      {!isEnding && <StatusBar />}

      <div className="flex-1 overflow-hidden relative">
        {isBattle && scene.battle ? (
          <BattleScreen
            battle={scene.battle}
            background={scene.background}
            introText={scene.text}
          />
        ) : isScoring ? (
          <ScoringScreen scene={scene} />
        ) : isEnding ? (
          <EndingScreen scene={scene} />
        ) : (
          <SceneRenderer scene={scene} />
        )}
      </div>
    </div>
  )
}
