import React, { useState, useEffect } from 'react';
import { GameEngine } from '../game/engine';

interface GameUIProps {
  gameEngine: GameEngine;
  onEndTurn: () => void;
}

export const GameUI: React.FC<GameUIProps> = ({ gameEngine, onEndTurn }) => {
  const [currentPrompt, setCurrentPrompt] = useState('');

  useEffect(() => {
    // Update prompt when game state changes
    setCurrentPrompt(gameEngine.getCurrentPrompt());
  }, [gameEngine]);

  const gameState = gameEngine.getState();
  const currentPlayer = gameEngine.getCurrentPlayer();

  return (
    <div className="game-ui">
      <div className="game-info">
        <h2>The Quiet Year</h2>
        <div className="season-display">
          <span className="season-label">Season:</span>
          <span className="season-value">{gameState.currentSeason}</span>
        </div>
        <div className="turn-info">
          <div className="player-turn">
            <span className="player-label">Current Player:</span>
            <span className="player-value">{currentPlayer.name}</span>
          </div>
          <div className="turn-count">
            <span className="turn-label">Turn:</span>
            <span className="turn-value">{gameState.turnCount + 1} of 2</span>
          </div>
        </div>
      </div>
      
      <div className="prompt-section">
        <h3>Your Prompt:</h3>
        <div className="prompt-text">
          {currentPrompt}
        </div>
      </div>
      
      <div className="actions">
        <button className="end-turn-button" onClick={onEndTurn}>
          End Turn
        </button>
      </div>
    </div>
  );
};