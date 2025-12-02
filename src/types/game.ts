export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type MarketState = 'slow' | 'average' | 'veteran' | 'heroes';

export type QuestStatus = 'active' | 'completed' | 'injured' | 'dead';

export type MercenaryStatus = 'available' | 'questing' | 'injured' | 'resting' | 'dead';

export interface Trait {
  name: string;
  description: string;
  isPositive: boolean;
  statModifier?: {
    stat: 'efficiency' | 'resilience' | 'skill';
    value: number;
  };
  valueModifier?: number; // percentage
}

export interface MercenaryCareer {
  hireDate: number;
  questsCompleted: number;
  questsAttempted: number;
  questGoldEarned: number;
  timesInjured: number;
  consecutiveSuccesses: number;
  totalQuestHours: number;
  lastQuestTime: number | null;
}

export interface Mercenary {
  id: string;
  name: string;
  rarity: Rarity;
  level: number;
  experience: number;
  stats: {
    efficiency: number;
    resilience: number;
    skill: number;
  };
  traits: Trait[];
  morale: string;
  isLocked: boolean;
  isStarter: boolean;
  isFavorite: boolean;
  status: MercenaryStatus;
  injuryRecoveryTime: number | null;
  restUntilTime: number | null;
  career: MercenaryCareer;
  hireCost: number;
  pullTimestamp: number;
}

export interface Quest {
  id: string;
  mercenaryId: string;
  startTime: number;
  duration: number; // hours
  endTime: number;
  baseGold: number;
  minGold: number;
  maxGold: number;
  injuryChance: number;
  deathChance: number;
  isFavoriteQuest: boolean;
  status: QuestStatus;
  resultGold: number | null;
}

export interface NewPlayerPhase {
  active: boolean;
  pullsRemaining: number;
}

export interface CollectionStats {
  traitsDiscovered: string[];
  highestStats: Record<Rarity, { efficiency: number; resilience: number; skill: number }>;
  careerRecords: {
    oldestMercenary: { id: string; days: number } | null;
    mostQuests: { id: string; count: number } | null;
    mostGoldEarned: { id: string; gold: number } | null;
  };
}

export interface GameStats {
  achievementsUnlocked: string[];
  totalGoldEarned: number;
  totalGoldSpent: number;
  totalPulls: number;
  totalQuestsSent: number;
  totalInjuries: number;
  totalDeaths: number;
  highestSellPrice: number;
  rarestPull: Rarity;
}

export interface GameState {
  gold: number;
  roster: Mercenary[];
  rosterSlots: number;
  questSlots: number;
  activeQuests: Quest[];
  fatigueMultiplier: number;
  lastPullTime: number | null;
  marketState: MarketState;
  marketStateEndTime: number;
  pityCounter: number;
  
  // Quest tracking
  totalQuestsCompleted: number;
  totalQuestGold: number;
  totalQuestTime: number;
  
  // Safety systems
  newPlayerPhase: NewPlayerPhase;
  dailyDiscountUsed: boolean;
  lastDailyReset: number;
  emergencyLiquidationAvailable: boolean;
  lastEmergencyUse: number | null;
  bankruptcyResetUsed: boolean;
  totalPulls: number;
  
  // Career & favorites
  favorites: string[];
  collection: CollectionStats;
  customNames: string[];
  stats: GameStats;
  
  // Meta
  lastSaveTime: number;
  gameStartTime: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  reward: number;
  condition: (state: GameState) => boolean;
}
