import { useGame } from '@/context/GameContext';
import { Mercenary, Rarity } from '@/types/game';
import { Button } from '@/components/ui/button';
import { X, Swords, Clock, Coins, AlertTriangle, Shield } from 'lucide-react';

interface QuestModalProps {
  mercenary: Mercenary;
  onClose: () => void;
}

const QUEST_DURATIONS = [
  { hours: 2, label: '2 hours', recommended: false },
  { hours: 4, label: '4 hours', recommended: false },
  { hours: 6, label: '6 hours', recommended: true },
  { hours: 8, label: '8 hours', recommended: false },
];

function calculateReward(duration: number, isFavorite: boolean) {
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

function calculateRisks(merc: Mercenary): { injury: number; death: number } {
  const baseRisks: Record<Rarity, { injury: number; death: number }> = {
    common: { injury: 10, death: 2 },
    uncommon: { injury: 8, death: 1.5 },
    rare: { injury: 7, death: 1 },
    epic: { injury: 6, death: 0.8 },
    legendary: { injury: 5, death: 0.5 },
  };

  let { injury, death } = baseRisks[merc.rarity];

  if (merc.level >= 21) {
    injury *= 0.6;
    death *= 0.6;
  } else if (merc.level >= 11) {
    injury *= 0.8;
    death *= 0.8;
  }

  if (merc.isFavorite) {
    injury *= 0.8;
    death = 0;
  }

  return { 
    injury: Math.round(injury * 10) / 10, 
    death: Math.round(death * 10) / 10 
  };
}

export function QuestModal({ mercenary, onClose }: QuestModalProps) {
  const { state, dispatch } = useGame();
  const risks = calculateRisks(mercenary);

  const canSendQuest = state.activeQuests.length < state.questSlots;

  const handleSendQuest = (duration: number) => {
    dispatch({ type: 'SEND_QUEST', mercenaryId: mercenary.id, duration });
    onClose();
  };

  const riskLevel = risks.injury < 6 ? 'LOW' : risks.injury < 8 ? 'MEDIUM' : 'HIGH';
  const riskColor = riskLevel === 'LOW' ? 'text-status-success' : riskLevel === 'MEDIUM' ? 'text-status-warning' : 'text-destructive';

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-md shadow-xl fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Send on Quest</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Mercenary Info */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h3 className="font-medium">{mercenary.name}</h3>
              <p className="text-sm text-muted-foreground">
                Level {mercenary.level} {mercenary.rarity}
              </p>
            </div>
            {mercenary.isFavorite && (
              <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary font-medium">
                Favorite
              </span>
            )}
          </div>

          {/* Risk Assessment */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Risk Assessment:</span>
              <span className={`text-sm font-medium ${riskColor}`}>{riskLevel}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-status-warning" />
                <span>Injury: {risks.injury}%</span>
              </div>
              <div className="flex items-center gap-2">
                {mercenary.isFavorite ? (
                  <>
                    <Shield className="w-4 h-4 text-status-success" />
                    <span className="text-status-success">Protected</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span>Death: {risks.death}%</span>
                  </>
                )}
              </div>
            </div>
            {mercenary.isFavorite && (
              <p className="text-xs text-status-success">
                Favorites cannot die on quests, only get injured (max 8h recovery)
              </p>
            )}
          </div>

          {/* Quest Options */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Choose Quest Duration:</p>
            <div className="grid gap-2">
              {QUEST_DURATIONS.map(({ hours, label, recommended }) => {
                const reward = calculateReward(hours, mercenary.isFavorite);
                return (
                  <button
                    key={hours}
                    onClick={() => handleSendQuest(hours)}
                    disabled={!canSendQuest}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border transition-colors
                      ${recommended 
                        ? 'border-primary/50 bg-primary/5 hover:bg-primary/10' 
                        : 'border-border hover:bg-muted/50'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{label}</span>
                      {recommended && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 font-mono text-primary">
                      <Coins className="w-4 h-4" />
                      <span>{reward.min}-{reward.max}g</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {!canSendQuest && (
            <p className="text-sm text-destructive text-center">
              Quest slots full ({state.activeQuests.length}/{state.questSlots})
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
