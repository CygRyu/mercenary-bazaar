import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { GameState, Mercenary, Quest, Rarity, MarketState, Trait } from '@/types/game';
import { POSITIVE_TRAITS, NEGATIVE_TRAITS, MORALE_STATES, FIRST_NAMES, EPITHETS } from '@/data/traits';
import { ACHIEVEMENTS } from '@/data/achievements';

const STORAGE_KEY = 'mercenary-gacha-hunter-save';

// Market state configurations
const MARKET_CONFIGS: Record<MarketState, { common: number; uncommon: number; rare: number; epic: number; legendary: number }> = {
  slow: { common: 70, uncommon: 22, rare: 7, epic: 0.8, legendary: 0.2 },
  average: { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 },
  veteran: { common: 35, uncommon: 35, rare: 20, epic: 7, legendary: 3 },
  heroes: { common: 25, uncommon: 30, rare: 25, epic: 15, legendary: 5 },
};

const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

function createInitialState(): GameState {
  const now = Date.now();
  const marketStateEndTime = now + 8 * 60 * 60 * 1000; // 8 hours

  const starterMerc: Mercenary = {
    id: 'starter',
    name: 'Ralen the Reliable',
    rarity: 'uncommon',
    level: 3,
    experience: 0,
    stats: { efficiency: 8, resilience: 7, skill: 9 },
    traits: [
      { name: 'Team Player', description: 'Works well with others', isPositive: true, valueModifier: 15 },
      { name: 'Tough', description: 'Resistant to injury', isPositive: true, statModifier: { stat: 'resilience', value: 5 }, valueModifier: 20 },
    ],
    morale: 'Loyal',
    isLocked: true,
    isStarter: true,
    isFavorite: true,
    status: 'available',
    injuryRecoveryTime: null,
    restUntilTime: null,
    career: {
      hireDate: now,
      questsCompleted: 0,
      questsAttempted: 0,
      questGoldEarned: 0,
      timesInjured: 0,
      consecutiveSuccesses: 0,
      totalQuestHours: 0,
      lastQuestTime: null,
    },
    hireCost: 0,
    pullTimestamp: now,
  };

  return {
    gold: 600,
    roster: [starterMerc],
    rosterSlots: 15,
    questSlots: 3,
    questSlotExpansions: 0,
    activeQuests: [],
    fatigueMultiplier: 1.0,
    lastPullTime: null,
    marketState: 'average',
    marketStateEndTime,
    pityCounter: 0,
    totalQuestsCompleted: 0,
    totalQuestGold: 0,
    totalQuestTime: 0,
    newPlayerPhase: { active: true, pullsRemaining: 3 },
    dailyDiscountUsed: false,
    lastDailyReset: now,
    lastWagePayment: now,
    emergencyLiquidationAvailable: false,
    lastEmergencyUse: null,
    bankruptcyResetUsed: false,
    totalPulls: 0,
    favorites: ['starter'],
    collection: {
      traitsDiscovered: ['Team Player', 'Tough'],
      highestStats: {
        common: { efficiency: 0, resilience: 0, skill: 0 },
        uncommon: { efficiency: 8, resilience: 7, skill: 9 },
        rare: { efficiency: 0, resilience: 0, skill: 0 },
        epic: { efficiency: 0, resilience: 0, skill: 0 },
        legendary: { efficiency: 0, resilience: 0, skill: 0 },
      },
      careerRecords: {
        oldestMercenary: null,
        mostQuests: null,
        mostGoldEarned: null,
      },
    },
    customNames: [],
    stats: {
      achievementsUnlocked: [],
      totalGoldEarned: 600,
      totalGoldSpent: 0,
      totalPulls: 0,
      totalQuestsSent: 0,
      totalInjuries: 0,
      totalDeaths: 0,
      highestSellPrice: 0,
      rarestPull: 'common',
    },
    lastSaveTime: now,
    gameStartTime: now,
  };
}

type GameAction =
  | { type: 'PULL_MERCENARY' }
  | { type: 'SELL_MERCENARY'; mercenaryId: string }
  | { type: 'TOGGLE_LOCK'; mercenaryId: string }
  | { type: 'TOGGLE_FAVORITE'; mercenaryId: string }
  | { type: 'SEND_QUEST'; mercenaryId: string; duration: number }
  | { type: 'COMPLETE_QUEST'; questId: string }
  | { type: 'UPDATE_TIMERS' }
  | { type: 'EMERGENCY_LIQUIDATION' }
  | { type: 'BANKRUPTCY_RESET' }
  | { type: 'LOAD_SAVE'; state: GameState }
  | { type: 'EXPAND_ROSTER' }
  | { type: 'EXPAND_QUEST_SLOTS' }
  | { type: 'RENAME_MERCENARY'; mercenaryId: string; newName: string }
  | { type: 'RESET_GAME' }
  | { type: 'CLAIM_ACHIEVEMENT'; achievementId: string };

function generateMercenaryName(): string {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const useEpithet = Math.random() > 0.5;
  if (useEpithet) {
    const epithet = EPITHETS[Math.floor(Math.random() * EPITHETS.length)];
    return `${firstName} ${epithet}`;
  }
  return firstName;
}

function rollRarity(state: GameState): Rarity {
  const config = MARKET_CONFIGS[state.marketState];
  let roll = Math.random() * 100;

  // Apply pity bonus
  if (state.pityCounter >= 40) {
    // Double epic/legendary chances
    const epicChance = config.epic * 2;
    const legendaryChance = config.legendary * 2;
    
    if (roll < legendaryChance) return 'legendary';
    roll -= legendaryChance;
    if (roll < epicChance) return 'epic';
    roll -= epicChance;
    if (roll < config.rare) return 'rare';
    roll -= config.rare;
    if (roll < config.uncommon) return 'uncommon';
    return 'common';
  }

  // New player protection
  if (state.newPlayerPhase.active && state.newPlayerPhase.pullsRemaining > 0) {
    const pullNumber = 4 - state.newPlayerPhase.pullsRemaining;
    if (pullNumber === 1) {
      // First pull: guaranteed uncommon or better
      if (roll < config.legendary) return 'legendary';
      roll -= config.legendary;
      if (roll < config.epic) return 'epic';
      roll -= config.epic;
      if (roll < config.rare) return 'rare';
      return 'uncommon';
    } else {
      // Pulls 2-3: no commons
      const weights = { uncommon: 70, rare: 25, epic: 5, legendary: 0 };
      if (roll < weights.legendary) return 'legendary';
      roll -= weights.legendary;
      if (roll < weights.epic) return 'epic';
      roll -= weights.epic;
      if (roll < weights.rare) return 'rare';
      return 'uncommon';
    }
  }

  // Normal roll
  if (roll < config.legendary) return 'legendary';
  roll -= config.legendary;
  if (roll < config.epic) return 'epic';
  roll -= config.epic;
  if (roll < config.rare) return 'rare';
  roll -= config.rare;
  if (roll < config.uncommon) return 'uncommon';
  return 'common';
}

function generateStats(rarity: Rarity): { efficiency: number; resilience: number; skill: number } {
  const baseRanges: Record<Rarity, [number, number]> = {
    common: [2, 8],
    uncommon: [4, 12],
    rare: [8, 18],
    epic: [15, 30],
    legendary: [25, 45],
  };

  const [min, max] = baseRanges[rarity];
  return {
    efficiency: Math.floor(Math.random() * (max - min + 1)) + min,
    resilience: Math.floor(Math.random() * (max - min + 1)) + min,
    skill: Math.floor(Math.random() * (max - min + 1)) + min,
  };
}

function generateTraits(rarity: Rarity): Trait[] {
  const traitCounts: Record<Rarity, { total: number; positive: number }> = {
    common: { total: 2, positive: 1 },
    uncommon: { total: 3, positive: 2 },
    rare: { total: 4, positive: 3 },
    epic: { total: 5, positive: 4 },
    legendary: { total: 5, positive: 5 },
  };

  const config = traitCounts[rarity];
  const traits: Trait[] = [];
  
  // Add positive traits
  const availablePositive = [...POSITIVE_TRAITS];
  for (let i = 0; i < config.positive; i++) {
    if (availablePositive.length === 0) break;
    const index = Math.floor(Math.random() * availablePositive.length);
    traits.push(availablePositive.splice(index, 1)[0]);
  }

  // Add negative traits
  const negativeCount = config.total - config.positive;
  const availableNegative = [...NEGATIVE_TRAITS];
  for (let i = 0; i < negativeCount; i++) {
    if (availableNegative.length === 0) break;
    const index = Math.floor(Math.random() * availableNegative.length);
    traits.push(availableNegative.splice(index, 1)[0]);
  }

  return traits;
}

function calculateMercWage(merc: Mercenary): number {
  // Wage based on total stats: ~1g per stat point per day
  const totalStats = merc.stats.efficiency + merc.stats.resilience + merc.stats.skill;
  const rarityMultiplier: Record<Rarity, number> = {
    common: 0.5,
    uncommon: 0.7,
    rare: 1.0,
    epic: 1.3,
    legendary: 1.5,
  };
  return Math.floor(totalStats * rarityMultiplier[merc.rarity]);
}

function calculateLevel(stats: { efficiency: number; resilience: number; skill: number }): number {
  const sum = stats.efficiency + stats.resilience + stats.skill;
  return Math.min(30, 1 + Math.floor((sum - 6) / 10));
}

function calculateSellValue(merc: Mercenary): number {
  const baseValue = 100 + (merc.level * 20) + 
    ((merc.stats.efficiency + merc.stats.resilience + merc.stats.skill) * 3);

  let traitMultiplier = 1;
  for (const trait of merc.traits) {
    if (trait.valueModifier) {
      traitMultiplier += trait.valueModifier / 100;
    }
  }

  const rarityMultipliers: Record<Rarity, number> = {
    common: 1.0,
    uncommon: 1.3,
    rare: 1.8,
    epic: 2.5,
    legendary: 4.0,
  };

  let careerMultiplier = 1;
  if (merc.career.questsAttempted > 0) {
    const successRate = merc.career.questsCompleted / merc.career.questsAttempted;
    if (successRate > 0.9) careerMultiplier += 0.1;
  }
  if (merc.career.timesInjured === 0 && merc.career.questsCompleted > 0) {
    careerMultiplier += 0.05;
  }
  if (merc.career.totalQuestHours > 0) {
    const goldPerHour = merc.career.questGoldEarned / merc.career.totalQuestHours;
    if (goldPerHour > 100) careerMultiplier += 0.08;
  }

  let injuryPenalty = 1;
  if (merc.status === 'injured') injuryPenalty = 0.9;
  else if (merc.career.timesInjured > 0) injuryPenalty = 0.95;

  const calculatedValue = Math.floor(
    baseValue * traitMultiplier * rarityMultipliers[merc.rarity] * careerMultiplier * injuryPenalty * 0.4
  );

  const minimumValue = Math.floor(merc.hireCost * 0.3);
  return Math.max(calculatedValue, minimumValue, 20);
}

function generateMercenary(state: GameState): Mercenary {
  const now = Date.now();
  const rarity = rollRarity(state);
  const stats = generateStats(rarity);
  const traits = generateTraits(rarity);
  const level = calculateLevel(stats);

  // Apply trait stat modifiers
  for (const trait of traits) {
    if (trait.statModifier) {
      stats[trait.statModifier.stat] = Math.max(1, Math.min(75, 
        stats[trait.statModifier.stat] + trait.statModifier.value
      ));
    }
  }

  const pullCost = state.dailyDiscountUsed 
    ? Math.floor(100 * state.fatigueMultiplier)
    : 50;

  const merc: Mercenary = {
    id: `merc-${now}-${Math.random().toString(36).substr(2, 9)}`,
    name: generateMercenaryName(),
    rarity,
    level,
    experience: 0,
    stats,
    traits,
    morale: MORALE_STATES[Math.floor(Math.random() * MORALE_STATES.length)],
    isLocked: false,
    isStarter: false,
    isFavorite: false,
    status: 'available',
    injuryRecoveryTime: null,
    restUntilTime: null,
    career: {
      hireDate: now,
      questsCompleted: 0,
      questsAttempted: 0,
      questGoldEarned: 0,
      timesInjured: 0,
      consecutiveSuccesses: 0,
      totalQuestHours: 0,
      lastQuestTime: null,
    },
    hireCost: pullCost,
    pullTimestamp: now,
  };

  return merc;
}

function calculatePullCost(state: GameState): number {
  if (!state.dailyDiscountUsed) return 50;
  return Math.floor(100 * state.fatigueMultiplier);
}

function updateMarketState(state: GameState): { marketState: MarketState; marketStateEndTime: number } {
  const now = Date.now();
  if (now < state.marketStateEndTime) {
    return { marketState: state.marketState, marketStateEndTime: state.marketStateEndTime };
  }

  const states: MarketState[] = ['slow', 'average', 'veteran', 'heroes'];
  const weights = [30, 40, 20, 10];
  let roll = Math.random() * 100;
  let newState: MarketState = 'average';
  
  for (let i = 0; i < states.length; i++) {
    if (roll < weights[i]) {
      newState = states[i];
      break;
    }
    roll -= weights[i];
  }

  return {
    marketState: newState,
    marketStateEndTime: now + 8 * 60 * 60 * 1000,
  };
}

function calculateQuestReward(duration: number, isFavorite: boolean): { base: number; min: number; max: number } {
  const base = duration * 25;
  const variance = duration * 15;
  let min = base - variance;
  let max = base + variance;
  
  if (isFavorite) {
    min = Math.floor(min * 1.1);
    max = Math.floor(max * 1.1);
  }
  
  return { base, min, max };
}

function calculateQuestRisks(merc: Mercenary): { injury: number; death: number } {
  const baseRisks: Record<Rarity, { injury: number; death: number }> = {
    common: { injury: 10, death: 2 },
    uncommon: { injury: 8, death: 1.5 },
    rare: { injury: 7, death: 1 },
    epic: { injury: 6, death: 0.8 },
    legendary: { injury: 5, death: 0.5 },
  };

  let { injury, death } = baseRisks[merc.rarity];

  // Level reduction
  if (merc.level >= 21) {
    injury *= 0.6;
    death *= 0.6;
  } else if (merc.level >= 11) {
    injury *= 0.8;
    death *= 0.8;
  }

  // Favorite bonus
  if (merc.isFavorite) {
    injury *= 0.8;
    death = 0; // Favorites cannot die
  }

  return { injury, death };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PULL_MERCENARY': {
      const cost = calculatePullCost(state);
      if (state.gold < cost) return state;
      if (state.roster.length >= state.rosterSlots) return state;

      const now = Date.now();
      const merc = generateMercenary(state);
      const usedDiscount = !state.dailyDiscountUsed;

      // Update new player phase
      let newPlayerPhase = { ...state.newPlayerPhase };
      if (newPlayerPhase.active) {
        newPlayerPhase.pullsRemaining--;
        if (newPlayerPhase.pullsRemaining <= 0 || merc.rarity === 'epic' || merc.rarity === 'legendary') {
          newPlayerPhase.active = false;
        }
      }

      // Update fatigue
      const fatigueIncrease = state.totalPulls < 10 ? 0.20 : 0.25;
      const newFatigue = Math.min(5.0, state.fatigueMultiplier + fatigueIncrease);

      // Update pity
      let newPity = state.pityCounter;
      if (merc.rarity !== 'epic' && merc.rarity !== 'legendary') {
        newPity++;
      } else {
        newPity = 0;
      }

      // Update collection
      const newTraits = merc.traits
        .map(t => t.name)
        .filter(name => !state.collection.traitsDiscovered.includes(name));

      const highestStats = { ...state.collection.highestStats };
      highestStats[merc.rarity] = {
        efficiency: Math.max(highestStats[merc.rarity].efficiency, merc.stats.efficiency),
        resilience: Math.max(highestStats[merc.rarity].resilience, merc.stats.resilience),
        skill: Math.max(highestStats[merc.rarity].skill, merc.stats.skill),
      };

      // Update rarest pull
      const rarityIndex = RARITY_ORDER.indexOf(merc.rarity);
      const currentRarestIndex = RARITY_ORDER.indexOf(state.stats.rarestPull);
      const newRarestPull = rarityIndex > currentRarestIndex ? merc.rarity : state.stats.rarestPull;

      return {
        ...state,
        gold: state.gold - cost,
        roster: [...state.roster, merc],
        fatigueMultiplier: newFatigue,
        lastPullTime: now,
        pityCounter: newPity,
        dailyDiscountUsed: usedDiscount ? true : state.dailyDiscountUsed,
        totalPulls: state.totalPulls + 1,
        newPlayerPhase,
        emergencyLiquidationAvailable: state.totalPulls + 1 >= 10,
        collection: {
          ...state.collection,
          traitsDiscovered: [...state.collection.traitsDiscovered, ...newTraits],
          highestStats,
        },
        stats: {
          ...state.stats,
          totalGoldSpent: state.stats.totalGoldSpent + cost,
          totalPulls: state.stats.totalPulls + 1,
          rarestPull: newRarestPull,
        },
      };
    }

    case 'SELL_MERCENARY': {
      const merc = state.roster.find(m => m.id === action.mercenaryId);
      if (!merc || merc.isLocked || merc.isStarter || merc.status === 'questing') return state;

      const sellValue = calculateSellValue(merc);

      return {
        ...state,
        gold: state.gold + sellValue,
        roster: state.roster.filter(m => m.id !== action.mercenaryId),
        favorites: state.favorites.filter(id => id !== action.mercenaryId),
        stats: {
          ...state.stats,
          totalGoldEarned: state.stats.totalGoldEarned + sellValue,
          highestSellPrice: Math.max(state.stats.highestSellPrice, sellValue),
        },
      };
    }

    case 'TOGGLE_LOCK': {
      const merc = state.roster.find(m => m.id === action.mercenaryId);
      if (!merc || merc.isStarter) return state;

      return {
        ...state,
        roster: state.roster.map(m =>
          m.id === action.mercenaryId ? { ...m, isLocked: !m.isLocked } : m
        ),
      };
    }

    case 'TOGGLE_FAVORITE': {
      const merc = state.roster.find(m => m.id === action.mercenaryId);
      if (!merc || merc.isStarter) return state;

      const nonStarterFavorites = state.favorites.filter(id => {
        const m = state.roster.find(r => r.id === id);
        return m && !m.isStarter;
      });

      if (!merc.isFavorite && nonStarterFavorites.length >= 3) return state;

      const newFavorites = merc.isFavorite
        ? state.favorites.filter(id => id !== action.mercenaryId)
        : [...state.favorites, action.mercenaryId];

      return {
        ...state,
        roster: state.roster.map(m =>
          m.id === action.mercenaryId ? { ...m, isFavorite: !m.isFavorite } : m
        ),
        favorites: newFavorites,
      };
    }

    case 'SEND_QUEST': {
      const merc = state.roster.find(m => m.id === action.mercenaryId);
      if (!merc || merc.status !== 'available') return state;
      if (state.activeQuests.length >= state.questSlots) return state;

      const now = Date.now();
      const risks = calculateQuestRisks(merc);
      const rewards = calculateQuestReward(action.duration, merc.isFavorite);

      const quest: Quest = {
        id: `quest-${now}-${Math.random().toString(36).substr(2, 9)}`,
        mercenaryId: merc.id,
        startTime: now,
        duration: action.duration,
        endTime: now + action.duration * 60 * 60 * 1000,
        baseGold: rewards.base,
        minGold: rewards.min,
        maxGold: rewards.max,
        injuryChance: risks.injury,
        deathChance: risks.death,
        isFavoriteQuest: merc.isFavorite,
        status: 'active',
        resultGold: null,
      };

      return {
        ...state,
        roster: state.roster.map(m =>
          m.id === action.mercenaryId
            ? {
                ...m,
                status: 'questing' as const,
                career: {
                  ...m.career,
                  questsAttempted: m.career.questsAttempted + 1,
                },
              }
            : m
        ),
        activeQuests: [...state.activeQuests, quest],
        stats: {
          ...state.stats,
          totalQuestsSent: state.stats.totalQuestsSent + 1,
        },
      };
    }

    case 'COMPLETE_QUEST': {
      const quest = state.activeQuests.find(q => q.id === action.questId);
      if (!quest) return state;

      const now = Date.now();
      const merc = state.roster.find(m => m.id === quest.mercenaryId);
      if (!merc) {
        return {
          ...state,
          activeQuests: state.activeQuests.filter(q => q.id !== action.questId),
        };
      }

      // Roll for outcome
      const injuryRoll = Math.random() * 100;
      const deathRoll = Math.random() * 100;
      
      const died = deathRoll < quest.deathChance;
      const injured = !died && injuryRoll < quest.injuryChance;

      // Calculate gold reward
      const goldReward = died || injured
        ? Math.floor(quest.minGold * 0.5)
        : Math.floor(Math.random() * (quest.maxGold - quest.minGold + 1)) + quest.minGold;

      // Update mercenary
      const updatedMerc: Mercenary = {
        ...merc,
        status: died ? 'dead' : injured ? 'injured' : 'resting',
        injuryRecoveryTime: injured ? now + 2 * 60 * 60 * 1000 : null,
        restUntilTime: !died && !injured ? now + 60 * 60 * 1000 : null,
        experience: merc.experience + (died ? 0 : quest.duration * 3),
        career: {
          ...merc.career,
          questsCompleted: died ? merc.career.questsCompleted : merc.career.questsCompleted + 1,
          questGoldEarned: merc.career.questGoldEarned + goldReward,
          timesInjured: injured ? merc.career.timesInjured + 1 : merc.career.timesInjured,
          consecutiveSuccesses: died || injured ? 0 : merc.career.consecutiveSuccesses + 1,
          totalQuestHours: merc.career.totalQuestHours + quest.duration,
          lastQuestTime: now,
        },
      };

      // Level up check
      const xpNeeded = updatedMerc.level * 100;
      if (updatedMerc.experience >= xpNeeded && updatedMerc.level < 30) {
        updatedMerc.level++;
        updatedMerc.experience -= xpNeeded;
        updatedMerc.stats = {
          efficiency: Math.min(75, updatedMerc.stats.efficiency + 1),
          resilience: Math.min(75, updatedMerc.stats.resilience + 1),
          skill: Math.min(75, updatedMerc.stats.skill + 1),
        };
      }

      return {
        ...state,
        gold: state.gold + goldReward,
        roster: state.roster.map(m => m.id === merc.id ? updatedMerc : m),
        activeQuests: state.activeQuests.filter(q => q.id !== action.questId),
        totalQuestsCompleted: died ? state.totalQuestsCompleted : state.totalQuestsCompleted + 1,
        totalQuestGold: state.totalQuestGold + goldReward,
        totalQuestTime: state.totalQuestTime + quest.duration,
        stats: {
          ...state.stats,
          totalGoldEarned: state.stats.totalGoldEarned + goldReward,
          totalInjuries: injured ? state.stats.totalInjuries + 1 : state.stats.totalInjuries,
          totalDeaths: died ? state.stats.totalDeaths + 1 : state.stats.totalDeaths,
        },
      };
    }

    case 'UPDATE_TIMERS': {
      const now = Date.now();
      
      // Update fatigue decay
      let newFatigue = state.fatigueMultiplier;
      if (state.lastPullTime) {
        const minutesSincePull = (now - state.lastPullTime) / 60000;
        const decayFactor = Math.pow(0.985, minutesSincePull);
        newFatigue = 1.0 + (state.fatigueMultiplier - 1.0) * decayFactor;
        newFatigue = Math.max(1.0, newFatigue);
      }

      // Check daily reset
      const today = new Date(now).toDateString();
      const lastReset = new Date(state.lastDailyReset).toDateString();
      const dailyReset = today !== lastReset;

      // Update market state
      const { marketState, marketStateEndTime } = updateMarketState(state);

      // Update mercenary statuses
      let updatedRoster = state.roster.map(merc => {
        if (merc.status === 'injured' && merc.injuryRecoveryTime && now >= merc.injuryRecoveryTime) {
          return { ...merc, status: 'available' as const, injuryRecoveryTime: null };
        }
        if (merc.status === 'resting' && merc.restUntilTime && now >= merc.restUntilTime) {
          return { ...merc, status: 'available' as const, restUntilTime: null };
        }
        return merc;
      });

      // Handle daily wage payment
      let newGold = state.gold;
      let wagesPaid = false;
      const lastWageDay = new Date(state.lastWagePayment).toDateString();
      
      if (today !== lastWageDay) {
        // Calculate total wages
        const aliveMercs = updatedRoster.filter(m => m.status !== 'dead');
        const totalWages = aliveMercs.reduce((sum, m) => sum + calculateMercWage(m), 0);
        
        if (newGold >= totalWages) {
          // Can pay all wages
          newGold -= totalWages;
          wagesPaid = true;
        } else {
          // Can't pay - each merc has 1-15% chance to leave
          const mercsThatLeft: string[] = [];
          updatedRoster = updatedRoster.filter(merc => {
            if (merc.isStarter || merc.isLocked || merc.isFavorite || merc.status === 'dead' || merc.status === 'questing') {
              return true; // Protected mercs don't leave
            }
            const leaveChance = Math.random() * 14 + 1; // 1-15%
            const roll = Math.random() * 100;
            if (roll < leaveChance) {
              mercsThatLeft.push(merc.id);
              return false;
            }
            return true;
          });
          // Spend whatever gold we have
          newGold = 0;
          wagesPaid = true;
        }
      }

      return {
        ...state,
        gold: newGold,
        fatigueMultiplier: newFatigue,
        dailyDiscountUsed: dailyReset ? false : state.dailyDiscountUsed,
        lastDailyReset: dailyReset ? now : state.lastDailyReset,
        lastWagePayment: wagesPaid ? now : state.lastWagePayment,
        marketState,
        marketStateEndTime,
        roster: updatedRoster,
        favorites: state.favorites.filter(id => updatedRoster.some(m => m.id === id)),
        lastSaveTime: now,
      };
    }

    case 'EMERGENCY_LIQUIDATION': {
      if (!state.emergencyLiquidationAvailable) return state;
      
      const now = Date.now();
      if (state.lastEmergencyUse && now - state.lastEmergencyUse < 24 * 60 * 60 * 1000) {
        return state;
      }

      const toSell = state.roster.filter(m => 
        !m.isLocked && !m.isStarter && !m.isFavorite && m.status !== 'questing'
      );

      const totalValue = toSell.reduce((sum, m) => sum + calculateSellValue(m), 0);
      const liquidationValue = Math.floor(totalValue * 1.1);

      return {
        ...state,
        gold: state.gold + liquidationValue,
        roster: state.roster.filter(m => 
          m.isLocked || m.isStarter || m.isFavorite || m.status === 'questing'
        ),
        lastEmergencyUse: now,
        stats: {
          ...state.stats,
          totalGoldEarned: state.stats.totalGoldEarned + liquidationValue,
        },
      };
    }

    case 'BANKRUPTCY_RESET': {
      if (state.bankruptcyResetUsed) return state;
      if (state.gold >= 100) return state;

      const totalRosterValue = state.roster
        .filter(m => !m.isLocked && !m.isStarter && !m.isFavorite)
        .reduce((sum, m) => sum + calculateSellValue(m), 0);

      if (totalRosterValue >= 200) return state;
      if (state.emergencyLiquidationAvailable) {
        const now = Date.now();
        if (!state.lastEmergencyUse || now - state.lastEmergencyUse >= 24 * 60 * 60 * 1000) {
          return state;
        }
      }

      return {
        ...state,
        gold: state.gold + 200,
        fatigueMultiplier: 1.0,
        bankruptcyResetUsed: true,
        stats: {
          ...state.stats,
          totalGoldEarned: state.stats.totalGoldEarned + 200,
        },
      };
    }

    case 'EXPAND_ROSTER': {
      if (state.gold < 1000) return state;

      return {
        ...state,
        gold: state.gold - 1000,
        rosterSlots: state.rosterSlots + 5,
        questSlots: Math.floor((state.rosterSlots + 5) / 5) + 1,
        stats: {
          ...state.stats,
          totalGoldSpent: state.stats.totalGoldSpent + 1000,
        },
      };
    }

    case 'CLAIM_ACHIEVEMENT': {
      const achievement = ACHIEVEMENTS.find(a => a.id === action.achievementId);
      if (!achievement) return state;
      if (state.stats.achievementsUnlocked.includes(action.achievementId)) return state;
      if (!achievement.condition(state)) return state;

      return {
        ...state,
        gold: state.gold + achievement.reward,
        stats: {
          ...state.stats,
          achievementsUnlocked: [...state.stats.achievementsUnlocked, action.achievementId],
          totalGoldEarned: state.stats.totalGoldEarned + achievement.reward,
        },
      };
    }

    case 'EXPAND_QUEST_SLOTS': {
      // Cost increases: 500, 750, 1000, 1500, 2000...
      const baseCost = 500;
      const multiplier = 1 + (state.questSlotExpansions * 0.5);
      const cost = Math.floor(baseCost * multiplier);
      
      if (state.gold < cost) return state;

      return {
        ...state,
        gold: state.gold - cost,
        questSlots: state.questSlots + 1,
        questSlotExpansions: state.questSlotExpansions + 1,
        stats: {
          ...state.stats,
          totalGoldSpent: state.stats.totalGoldSpent + cost,
        },
      };
    }

    case 'RENAME_MERCENARY': {
      const merc = state.roster.find(m => m.id === action.mercenaryId);
      if (!merc) return state;
      const trimmedName = action.newName.trim();
      if (!trimmedName || trimmedName.length > 30) return state;

      return {
        ...state,
        roster: state.roster.map(m =>
          m.id === action.mercenaryId ? { ...m, name: trimmedName } : m
        ),
      };
    }

    case 'RESET_GAME': {
      return createInitialState();
    }

    case 'LOAD_SAVE': {
      return action.state;
    }

    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  pullCost: number;
  canPull: boolean;
  calculateSellValue: (merc: Mercenary) => number;
  calculateMercWage: (merc: Mercenary) => number;
  getQuestSlotCost: () => number;
  getTimeUntilBaseCost: () => string;
  getMarketTimeRemaining: () => string;
  getPendingAchievements: () => typeof ACHIEVEMENTS;
  manualSave: () => void;
  exportSave: () => string;
  importSave: (data: string) => boolean;
  resetGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

function loadSavedState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Basic validation - ensure it has required fields
      if (parsed && typeof parsed.gold === 'number' && Array.isArray(parsed.roster)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load save:', e);
  }
  return createInitialState();
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null, loadSavedState);

  // Auto-save every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 5000);
    return () => clearInterval(timer);
  }, [state]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state]);

  // Update timers
  useEffect(() => {
    const timer = setInterval(() => {
      dispatch({ type: 'UPDATE_TIMERS' });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Process completed quests
  useEffect(() => {
    const now = Date.now();
    const completedQuests = state.activeQuests.filter(q => now >= q.endTime);
    completedQuests.forEach(quest => {
      dispatch({ type: 'COMPLETE_QUEST', questId: quest.id });
    });
  }, [state.activeQuests]);

  const pullCost = calculatePullCost(state);
  const canPull = state.gold >= pullCost && state.roster.length < state.rosterSlots;

  const getTimeUntilBaseCost = useCallback(() => {
    if (state.fatigueMultiplier <= 1.01) return 'Now';
    const decayNeeded = state.fatigueMultiplier - 1.0;
    const minutesNeeded = Math.log(0.01 / decayNeeded) / Math.log(0.985);
    const totalMinutes = Math.max(0, Math.ceil(minutesNeeded));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, [state.fatigueMultiplier]);

  const getMarketTimeRemaining = useCallback(() => {
    const remaining = state.marketStateEndTime - Date.now();
    if (remaining <= 0) return 'Soon';
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}h ${minutes}m`;
  }, [state.marketStateEndTime]);

  const getPendingAchievements = useCallback(() => {
    return ACHIEVEMENTS.filter(a => 
      !state.stats.achievementsUnlocked.includes(a.id) && a.condition(state)
    );
  }, [state]);

  const getQuestSlotCost = useCallback(() => {
    const baseCost = 500;
    const multiplier = 1 + (state.questSlotExpansions * 0.5);
    return Math.floor(baseCost * multiplier);
  }, [state.questSlotExpansions]);

  const manualSave = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const exportSave = useCallback(() => {
    const saveJson = JSON.stringify(state);
    return btoa(saveJson);
  }, [state]);

  const importSave = useCallback((data: string): boolean => {
    try {
      const decoded = atob(data);
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed.gold === 'number' && Array.isArray(parsed.roster)) {
        dispatch({ type: 'LOAD_SAVE', state: parsed });
        localStorage.setItem(STORAGE_KEY, decoded);
        return true;
      }
    } catch (e) {
      console.error('Failed to import save:', e);
    }
    return false;
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: GameContextValue = {
    state,
    dispatch,
    pullCost,
    canPull,
    calculateSellValue,
    calculateMercWage,
    getQuestSlotCost,
    getTimeUntilBaseCost,
    getMarketTimeRemaining,
    getPendingAchievements,
    manualSave,
    exportSave,
    importSave,
    resetGame,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
