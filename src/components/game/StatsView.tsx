import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { ACHIEVEMENTS } from '@/data/achievements';
import { 
  Trophy, Coins, Swords, Users, TrendingUp, 
  AlertTriangle, Skull, Star, Gift
} from 'lucide-react';

export function StatsView() {
  const { state, dispatch, getPendingAchievements } = useGame();
  const pendingAchievements = getPendingAchievements();

  const handleClaimAchievement = (id: string) => {
    dispatch({ type: 'CLAIM_ACHIEVEMENT', achievementId: id });
  };

  const formatRarity = (rarity: string) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  return (
    <div className="space-y-8 fade-in">
      {/* Pending Achievements */}
      {pendingAchievements.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary animate-pulse" />
            <h2 className="font-semibold text-lg">Claim Rewards!</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {pendingAchievements.map(achievement => (
              <div 
                key={achievement.id}
                className="bg-primary/10 border border-primary/30 rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-primary">{achievement.name}</h3>
                  <span className="font-mono text-primary">+{achievement.reward}g</span>
                </div>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                <Button
                  onClick={() => handleClaimAchievement(achievement.id)}
                  size="sm"
                  className="w-full"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Claim Reward
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Economy Stats */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">Economy</h2>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Current Gold</p>
              <p className="font-mono text-2xl text-primary">{state.gold.toLocaleString()}g</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="font-mono text-xl">{state.stats.totalGoldEarned.toLocaleString()}g</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="font-mono text-xl">{state.stats.totalGoldSpent.toLocaleString()}g</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Highest Sale</p>
              <p className="font-mono text-xl">{state.stats.highestSellPrice}g</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pulling Stats */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-lg">Recruitment</h2>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Pulls</p>
              <p className="font-mono text-2xl">{state.totalPulls}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pity Counter</p>
              <p className="font-mono text-xl">{state.pityCounter}/40</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fatigue</p>
              <p className="font-mono text-xl">×{state.fatigueMultiplier.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rarest Pull</p>
              <p className={`font-mono text-xl text-rarity-${state.stats.rarestPull}`}>
                {formatRarity(state.stats.rarestPull)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quest Stats */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-lg">Quests</h2>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Quests Sent</p>
              <p className="font-mono text-2xl">{state.stats.totalQuestsSent}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="font-mono text-xl">{state.totalQuestsCompleted}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quest Gold</p>
              <p className="font-mono text-xl text-primary">{state.totalQuestGold}g</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quest Hours</p>
              <p className="font-mono text-xl">{state.totalQuestTime}h</p>
            </div>
          </div>
        </div>
      </section>

      {/* Roster Stats */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-lg">Roster</h2>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Current Roster</p>
              <p className="font-mono text-2xl">{state.roster.filter(m => m.status !== 'dead').length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Roster Slots</p>
              <p className="font-mono text-xl">{state.rosterSlots}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Injuries
              </p>
              <p className="font-mono text-xl text-status-warning">{state.stats.totalInjuries}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Skull className="w-3 h-3" />
                Deaths
              </p>
              <p className="font-mono text-xl text-destructive">{state.stats.totalDeaths}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">Achievements</h2>
          <span className="text-muted-foreground font-mono">
            ({state.stats.achievementsUnlocked.length}/{ACHIEVEMENTS.length})
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map(achievement => {
            const unlocked = state.stats.achievementsUnlocked.includes(achievement.id);
            return (
              <div 
                key={achievement.id}
                className={`rounded-lg p-4 border ${
                  unlocked 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'bg-card border-border opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-medium ${unlocked ? 'text-primary' : ''}`}>
                    {achievement.name}
                  </h3>
                  {unlocked && <Trophy className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                <p className="text-sm font-mono mt-2 text-primary">+{achievement.reward}g</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Collection Stats */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-lg">Collection</h2>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-medium mb-3">Traits Discovered ({state.collection.traitsDiscovered.length})</h3>
          <div className="flex flex-wrap gap-2">
            {state.collection.traitsDiscovered.map(trait => (
              <span 
                key={trait}
                className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
