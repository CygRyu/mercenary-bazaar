import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { MercenaryCard } from './MercenaryCard';
import { QuestModal } from './QuestModal';
import { Mercenary } from '@/types/game';
import { Swords, Clock, Coins, CheckCircle, AlertTriangle, Users } from 'lucide-react';

export function QuestHallView() {
  const { state } = useGame();
  const [questTarget, setQuestTarget] = useState<Mercenary | null>(null);

  const availableMercs = state.roster.filter(m => m.status === 'available');
  const activeQuests = state.activeQuests;

  const formatTimeRemaining = (endTime: number) => {
    const remaining = endTime - Date.now();
    if (remaining <= 0) return 'Complete!';
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const getProgress = (startTime: number, endTime: number) => {
    const total = endTime - startTime;
    const elapsed = Date.now() - startTime;
    return Math.min(100, (elapsed / total) * 100);
  };

  return (
    <div className="space-y-8 fade-in">
      {/* Active Quests */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">Active Quests</h2>
          <span className="text-muted-foreground font-mono">
            ({activeQuests.length}/{state.questSlots} slots)
          </span>
        </div>

        {activeQuests.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
            <Swords className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No active quests</p>
            <p className="text-sm mt-1">Send mercenaries on quests to earn gold!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeQuests.map(quest => {
              const merc = state.roster.find(m => m.id === quest.mercenaryId);
              if (!merc) return null;
              
              const progress = getProgress(quest.startTime, quest.endTime);
              const isComplete = Date.now() >= quest.endTime;

              return (
                <div 
                  key={quest.id}
                  className="bg-card border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-status-success animate-pulse' : 'bg-status-info'}`} />
                      <span className="font-medium">{merc.name}</span>
                      <span className="text-sm text-muted-foreground">
                        Level {merc.level} {merc.rarity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className={isComplete ? 'text-status-success font-medium' : 'text-muted-foreground'}>
                        {formatTimeRemaining(quest.endTime)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="quest-progress">
                    <div 
                      className="quest-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Duration: {quest.duration}h
                    </span>
                    <span className="font-mono text-primary">
                      <Coins className="w-4 h-4 inline mr-1" />
                      {quest.minGold}-{quest.maxGold}g
                    </span>
                  </div>

                  {/* Risk display */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Injury: {quest.injuryChance.toFixed(1)}%
                    </span>
                    {quest.deathChance > 0 ? (
                      <span className="flex items-center gap-1 text-destructive/70">
                        Death: {quest.deathChance.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-status-success">
                        <CheckCircle className="w-3 h-3" />
                        Protected
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quest Summary */}
      <section className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-medium mb-3">Quest Statistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Completed</p>
            <p className="font-mono text-lg">{state.totalQuestsCompleted}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Gold Earned</p>
            <p className="font-mono text-lg text-primary">{state.totalQuestGold}g</p>
          </div>
          <div>
            <p className="text-muted-foreground">Quest Hours</p>
            <p className="font-mono text-lg">{state.totalQuestTime}h</p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg Gold/Hour</p>
            <p className="font-mono text-lg text-primary">
              {state.totalQuestTime > 0 
                ? Math.round(state.totalQuestGold / state.totalQuestTime)
                : 0}g
            </p>
          </div>
        </div>
      </section>

      {/* Available Mercenaries */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-lg">Available for Quests</h2>
          <span className="text-muted-foreground font-mono">({availableMercs.length})</span>
        </div>

        {availableMercs.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No mercenaries available</p>
            <p className="text-sm mt-1">All mercenaries are busy or recovering</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableMercs.map(merc => (
              <MercenaryCard
                key={merc.id}
                mercenary={merc}
                onSendQuest={() => setQuestTarget(merc)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Quest Modal */}
      {questTarget && (
        <QuestModal
          mercenary={questTarget}
          onClose={() => setQuestTarget(null)}
        />
      )}
    </div>
  );
}
