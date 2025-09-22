export type Player = {
  id: string;
  name: string;
};

export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

export type LoreEntry = {
  playerId: string;
  playerName: string;
  season: Season;
  turn: number;
  text: string;
  timestamp: number;
};

export type FeatureTypeId =
  | 'npcs'
  | 'monsters'
  | 'magic-items'
  | 'deities'
  | 'locations'
  | 'unassigned';

export type BuiltFeature = {
  playerId: string;
  playerName: string;
  description: string;
  lore: string;
  featureType: FeatureTypeId;
  season: Season;
  turn: number;
  loreHistory: LoreEntry[];
};

export type GameState = {
  players: Player[];
  currentPlayerIndex: number;
  currentSeason: Season;
  globalTurnCount: number; // Sequential turn number across the entire game
  seasonTurnCount: number; // tracks how many total turns in current season
  turnsPerPlayer: number; // number of turns each player gets per season
  year: number; // track the current year
  prompts: Record<Season, string[]>;
  builtFeatures: Record<string, BuiltFeature>;
};
