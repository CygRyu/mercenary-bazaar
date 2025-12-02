import { Achievement, GameState } from '@/types/game';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_pull',
    name: 'First Steps',
    description: 'Complete your first pull',
    reward: 100,
    condition: (state: GameState) => state.totalPulls >= 1,
  },
  {
    id: 'first_sale',
    name: 'Business Mind',
    description: 'Sell your first mercenary',
    reward: 50,
    condition: (state: GameState) => state.stats.highestSellPrice > 0,
  },
  {
    id: 'first_rare',
    name: 'Notable Find',
    description: 'Pull a Rare mercenary',
    reward: 200,
    condition: (state: GameState) => 
      state.roster.some(m => m.rarity === 'rare') || 
      ['rare', 'epic', 'legendary'].includes(state.stats.rarestPull),
  },
  {
    id: 'first_epic',
    name: 'Elite Recruit',
    description: 'Pull an Epic mercenary',
    reward: 500,
    condition: (state: GameState) => 
      state.roster.some(m => m.rarity === 'epic') ||
      ['epic', 'legendary'].includes(state.stats.rarestPull),
  },
  {
    id: 'first_legendary',
    name: 'Living Legend',
    description: 'Pull a Legendary mercenary',
    reward: 1000,
    condition: (state: GameState) => 
      state.roster.some(m => m.rarity === 'legendary') ||
      state.stats.rarestPull === 'legendary',
  },
  {
    id: 'first_quest',
    name: 'Quest Giver',
    description: 'Send your first quest',
    reward: 100,
    condition: (state: GameState) => state.stats.totalQuestsSent >= 1,
  },
  {
    id: 'quest_master_25',
    name: 'Reliable Employer',
    description: 'Complete 25 quests without injury',
    reward: 300,
    condition: (state: GameState) => state.totalQuestsCompleted >= 25 && state.stats.totalInjuries === 0,
  },
  {
    id: 'quest_master_50',
    name: 'Quest Master',
    description: 'Complete 50 quests',
    reward: 300,
    condition: (state: GameState) => state.totalQuestsCompleted >= 50,
  },
  {
    id: 'risk_taker',
    name: 'Master of Risk',
    description: 'Complete 10 eight-hour quests',
    reward: 400,
    condition: (state: GameState) => {
      const longQuests = state.totalQuestTime / 8;
      return longQuests >= 10;
    },
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Obtain a mercenary with 70+ in all stats',
    reward: 750,
    condition: (state: GameState) => 
      state.roster.some(m => 
        m.stats.efficiency >= 70 && 
        m.stats.resilience >= 70 && 
        m.stats.skill >= 70
      ),
  },
  {
    id: 'collector_80',
    name: 'Master Collector',
    description: 'Discover 80% of all traits',
    reward: 2000,
    condition: (state: GameState) => {
      const totalTraits = 20; // Total unique traits in game
      return state.collection.traitsDiscovered.length >= totalTraits * 0.8;
    },
  },
  {
    id: 'favorites_30_days',
    name: 'Heart of Gold',
    description: 'Have 3 favorites for 30 days',
    reward: 1000,
    condition: (state: GameState) => {
      if (state.favorites.length < 3) return false;
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      return state.roster
        .filter(m => m.isFavorite && !m.isStarter)
        .every(m => Date.now() - m.career.hireDate >= thirtyDays);
    },
  },
];
