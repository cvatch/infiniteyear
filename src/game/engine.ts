import { BuiltFeature, FeatureTypeId, GameState, Player, Season, LoreEntry } from './types';
import { INITIAL_PROMPTS } from './prompts';

export class GameEngine {
  private state: GameState;

  constructor(players: Player[], turnsPerPlayer: number = 8) { // Default to 8 turns per player (1 year)
    this.state = {
      players,
      currentPlayerIndex: 0,
      currentSeason: 'Spring',
      globalTurnCount: 1, // Sequential turn number across the entire game
      seasonTurnCount: 0, // Tracks turns within the current season
      turnsPerPlayer, // Total turns per player for the entire game
      year: 1, // Track the current year
      prompts: INITIAL_PROMPTS,
      builtFeatures: {}
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  getCurrentPlayer(): Player {
    return this.state.players[this.state.currentPlayerIndex];
  }

  // Get the current turn information as a date format
  getCurrentTurnInfo(): { turn: number; season: Season; year: number } {
    return {
      turn: this.state.globalTurnCount,
      season: this.state.currentSeason,
      year: this.state.year
    };
  }

  getCurrentPrompt(): string {
    const seasonPrompts = this.state.prompts[this.state.currentSeason];
    // Alternate between the two prompts for each turn
    return seasonPrompts[this.state.seasonTurnCount % seasonPrompts.length];
  }

  endTurn(): void {
    // Increment the global turn count
    this.state.globalTurnCount++;
    
    // Increment the season turn count
    this.state.seasonTurnCount++;
    
    // Move to next player
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
    
    // Check if we've completed all turns for all players in this season
    // Each player gets 2 turns per season, so total turns per season = players * 2
    if (this.state.seasonTurnCount >= this.state.players.length * 2) {
      // Move to next season
      this.moveToNextSeason();
    }
  }

  private moveToNextSeason(): void {
    const seasons: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];
    const currentIndex = seasons.indexOf(this.state.currentSeason);
    this.state.currentSeason = seasons[(currentIndex + 1) % seasons.length];
    
    // Reset season turn count for new season
    this.state.seasonTurnCount = 0;
    
    // Check if we've completed all seasons (end of year)
    if (this.state.currentSeason === 'Spring' && currentIndex !== -1) {
      // We've completed a full cycle, increment year
      this.state.year++;
    }
  }

  upsertFeature(shapeId: string, data: {
    playerId: string;
    playerName: string;
    description: string;
    lore: string;
    featureType: FeatureTypeId;
  }): void {
    const existing = this.state.builtFeatures[shapeId];

    if (existing) {
      existing.description = data.description;
      existing.lore = data.lore;
      existing.featureType = data.featureType;
      existing.playerId = data.playerId;
      existing.playerName = data.playerName;
      return;
    }

    const turnInfo = this.getCurrentTurnInfo();

    this.state.builtFeatures[shapeId] = {
      playerId: data.playerId,
      playerName: data.playerName,
      description: data.description,
      lore: data.lore,
      featureType: data.featureType,
      season: turnInfo.season,
      turn: turnInfo.turn,
      loreHistory: [],
    };
  }

  addToLoreHistory(shapeId: string, text: string): void {
    let feature = this.state.builtFeatures[shapeId];
    if (!feature) {
      const turnInfo = this.getCurrentTurnInfo();
      const player = this.getCurrentPlayer();
      feature = this.state.builtFeatures[shapeId] = {
        playerId: player.id,
        playerName: player.name,
        description: '',
        lore: '',
        featureType: 'unassigned',
        season: turnInfo.season,
        turn: turnInfo.turn,
        loreHistory: [],
      };
    }

    const currentPlayer = this.getCurrentPlayer();

    const loreEntry: LoreEntry = {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      season: this.state.currentSeason,
      turn: this.state.globalTurnCount,
      text,
      timestamp: Date.now(),
    };

    feature.loreHistory.push(loreEntry);
  }

  getBuiltFeature(shapeId: string): BuiltFeature | null {
    return this.state.builtFeatures[shapeId] ?? null;
  }

  getBuiltFeatures(): Record<string, BuiltFeature> {
    return { ...this.state.builtFeatures };
  }

  // Export game state to JSON
  exportGame(): string {
    return JSON.stringify(this.state);
  }

  // Import game state from JSON
  static importGame(json: string): GameEngine {
    const state = JSON.parse(json) as GameState;
    
    // Handle backward compatibility for existing saved games
    // If playerName is missing, we'll add it based on the playerId
    Object.values(state.builtFeatures).forEach(feature => {
      const patchable = feature as BuiltFeature & {
        playerName?: string;
        loreHistory?: LoreEntry[];
        featureType?: FeatureTypeId;
      };

      if (!('playerName' in feature)) {
        patchable.playerName = `Player ${patchable.playerId}`;
      }
      if (!('loreHistory' in feature)) {
        patchable.loreHistory = [];
      }
      if (!('featureType' in feature)) {
        patchable.featureType = 'unassigned';
      }
    });
    
    // If year is missing, initialize it to 1
    if (!('year' in state)) {
      (state as any).year = 1;
    }
    
    // If globalTurnCount is missing, initialize it to 1
    if (!('globalTurnCount' in state)) {
      (state as any).globalTurnCount = 1;
    }
    
    const engine = new GameEngine(state.players, state.turnsPerPlayer);
    engine.state = state;
    return engine;
  }
}