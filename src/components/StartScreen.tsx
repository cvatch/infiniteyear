import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../game/types';
import { GameEngine } from '../game/engine';

interface StartScreenProps {
  onStartGame: (players: Player[], numberOfTurns: number) => void;
  onImportGame?: (engine: GameEngine) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStartGame, onImportGame }) => {
  const [numPlayers, setNumPlayers] = useState(4);
  const [playerNames, setPlayerNames] = useState<string[]>(Array(6).fill(''));
  const [numberOfYears, setNumberOfYears] = useState(1); // Changed from numberOfTurns to numberOfYears
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate on initial load and when values change
  useEffect(() => {
    // No validation needed for years since any positive number is valid
    setErrorMessage('');
  }, [numPlayers, numberOfYears]);

  const handleNumPlayersChange = (num: number) => {
    setNumPlayers(num);
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newPlayerNames = [...playerNames];
    newPlayerNames[index] = name;
    setPlayerNames(newPlayerNames);
  };

  const handleYearsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setNumberOfYears(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate years
    if (numberOfYears <= 0) {
      setErrorMessage('Number of years must be greater than 0');
      return;
    }
    
    // Calculate total turns based on years
    // Each year = 4 seasons
    // Each season = 2 turns per player
    // So each year = 4 * 2 = 8 turns per player
    const turnsPerPlayer = numberOfYears * 8;
    
    // Create players array with only the selected number of players
    const players: Player[] = playerNames
      .slice(0, numPlayers)
      .map((name, index) => ({
        id: `${index + 1}`,
        name: name || `Player ${index + 1}`
      }));
    
    onStartGame(players, turnsPerPlayer);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportGame) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const engine = GameEngine.importGame(json);
          onImportGame(engine);
        } catch (error) {
          console.error('Error importing game:', error);
          alert('Error importing game: ' + (error as Error).message);
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="start-screen">
      <div className="start-screen-content">
        <h1>The Quiet Year</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="numPlayers">Number of Players:</label>
            <select
              id="numPlayers"
              value={numPlayers}
              onChange={(e) => handleNumPlayersChange(parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Player Names:</label>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="player-name-input" style={{ display: index < numPlayers ? 'flex' : 'none', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <label htmlFor={`player-${index}`} style={{ minWidth: '80px' }}>Player {index + 1}:</label>
                <input
                  id={`player-${index}`}
                  type="text"
                  value={playerNames[index]}
                  onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                  placeholder={`Player ${index + 1}`}
                />
              </div>
            ))}
          </div>
          
          <div className="form-group">
            <label htmlFor="numberOfYears">Number of Years:</label>
            <input
              id="numberOfYears"
              type="number"
              value={numberOfYears}
              onChange={handleYearsChange}
              min="1"
            />
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            <div className="hint">
              Each player gets 2 turns per season × 4 seasons per year
              {numberOfYears > 0 && (
                <div>
                  ({numberOfYears} year{numberOfYears !== 1 ? 's' : ''} = {numberOfYears * 8} total turns per player)
                </div>
              )}
            </div>
          </div>
          
          <button 
            type="submit" 
            className="start-button"
            disabled={!!errorMessage || numberOfYears <= 0}
          >
            Start New Game
          </button>
          
          <button 
            type="button" 
            className="import-button"
            onClick={handleImportClick}
          >
            Import Saved Game
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".json"
            style={{ display: 'none' }}
          />
        </form>
      </div>
    </div>
  );
};