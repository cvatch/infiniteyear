import type { Player, Season } from '../game/types'

interface GameDateBannerProps {
  turnInfo: { turn: number; season: Season; year: number } | null
  currentPlayer: Player | null
  prompt: string
  onEndTurn?: () => void
}

export function GameDateBanner({ turnInfo, currentPlayer, prompt, onEndTurn }: GameDateBannerProps) {
  const dateLabel = turnInfo
    ? `Turn ${turnInfo.turn} — ${turnInfo.season}, Year ${turnInfo.year}`
    : 'Awaiting first turn'

  return (
    <div className="game-banner">
      <div className="game-banner__inner">
        <div className="game-banner__date">{dateLabel}</div>
        <div className="game-banner__meta">
          <span className="game-banner__player">
            {currentPlayer ? `Current Player: ${currentPlayer.name}` : 'No active player'}
          </span>
          {onEndTurn && (
            <button type="button" className="game-banner__end-turn" onClick={onEndTurn}>
              End Turn
            </button>
          )}
        </div>
        {prompt && (
          <div className="game-banner__prompt" title={prompt}>
            {prompt}
          </div>
        )}
      </div>
    </div>
  )
}
