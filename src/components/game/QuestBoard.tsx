import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { Mercenary, Rarity } from '@/types/game';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Swords, Clock, Coins, AlertTriangle, Shield, 
  ChevronRight, Star, X, Zap 
} from 'lucide-react';
import { calculateTraitEffects, applySpeedModifier, applyRiskModifier, applyGoldModifier } from '@/lib/traitEffects';
import { TraitBadge } from './TraitBadge';

interface QuestOption {
  id: string;
  name: string;
  baseHours: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Dangerous';
  baseGoldPerHour: number;
  baseInjuryChance: number;
  baseDeathChance: number;
}

const AVAILABLE_QUESTS: QuestOption[] = [
  { id: 'patrol', name: 'Village Patrol', baseHours: 2, difficulty: 'Easy', baseGoldPerHour: 20, baseInjuryChance: 5, baseDeathChance: 0.5 },
  { id: 'escort', name: 'Merchant Escort', baseHours: 4, difficulty: 'Medium', baseGoldPerHour: 30, baseInjuryChance: 8, baseDeathChance: 1 },
  { id: 'dungeon', name: 'Dungeon Delve', baseHours: 6, difficulty: 'Hard', baseGoldPerHour: 40, baseInjuryChance: 12, baseDeathChance: 2 },
  { id: 'dragon', name: 'Dragon Hunt', baseHours: 8, difficulty: 'Dangerous', baseGoldPerHour: 60, baseInjuryChance: 18, baseDeathChance: 4 },
];

interface QuestBoardProps {
  onClose?: () => void;
}

export function QuestBoard({ onClose }: QuestBoardProps) {
  const { state, dispatch } = useGame();
  const [selectedQuest, setSelectedQuest] = useState<QuestOption | null>(null);
  const [selectedMerc, setSelectedMerc] = useState<Mercenary | null>(null);

  const availableMercs = state.roster.filter(m => m.status === 'available');
  const canSendQuest = state.activeQuests.length < state.questSlots;

  const calculateQuestDetails = (quest: QuestOption, merc: Mercenary) => {
    const traitEffects = calculateTraitEffects(merc);
    const totalStats = merc.stats.efficiency + merc.stats.resilience + merc.stats.skill;
    
    // Stats affect gold: +1% gold per 3 total stat points above 15
    const statGoldBonus = Math.max(0, Math.floor((totalStats - 15) / 3));
    
    // Calculate effective duration (traits can speed up quests)
    const effectiveDuration = applySpeedModifier(quest.baseHours, traitEffects.questSpeedModifier);
    
    // Calculate gold based on stats + traits
    const baseGold = quest.baseGoldPerHour * quest.baseHours;
    const variance = baseGold * 0.4;
    let minGold = baseGold - variance;
    let maxGold = baseGold + variance;
    
    // Apply stat bonus
    minGold = Math.floor(minGold * (1 + statGoldBonus / 100));
    maxGold = Math.floor(maxGold * (1 + statGoldBonus / 100));
    
    // Apply trait gold modifier
    minGold = applyGoldModifier(minGold, traitEffects.goldModifier);
    maxGold = applyGoldModifier(maxGold, traitEffects.goldModifier);
    
    // Favorite bonus
    if (merc.isFavorite) {
      minGold = Math.floor(minGold * 1.1);
      maxGold = Math.floor(maxGold * 1.1);
    }

    // Calculate risks with rarity, level, and trait modifiers
    const rarityRiskMultiplier: Record<Rarity, number> = {
      common: 1.2,
      uncommon: 1.0,
      rare: 0.85,
      epic: 0.7,
      legendary: 0.5,
    };

    let levelRiskMultiplier = 1;
    if (merc.level >= 21) levelRiskMultiplier = 0.6;
    else if (merc.level >= 11) levelRiskMultiplier = 0.8;

    let injuryChance = applyRiskModifier(
      quest.baseInjuryChance * rarityRiskMultiplier[merc.rarity] * levelRiskMultiplier,
      traitEffects.injuryModifier
    );
    
    let deathChance = applyRiskModifier(
      quest.baseDeathChance * rarityRiskMultiplier[merc.rarity] * levelRiskMultiplier,
      traitEffects.deathModifier
    );

    // Favorite protection
    if (merc.isFavorite) {
      injuryChance *= 0.8;
      deathChance = 0;
    }

    return {
      effectiveDuration: Math.round(effectiveDuration * 10) / 10,
      minGold,
      maxGold,
      injuryChance: Math.round(injuryChance * 10) / 10,
      deathChance: Math.round(deathChance * 10) / 10,
      statBonus: statGoldBonus,
      traitEffects,
    };
  };

  const handleSendQuest = () => {
    if (!selectedQuest || !selectedMerc || !canSendQuest) return;
    
    const details = calculateQuestDetails(selectedQuest, selectedMerc);
    
    dispatch({ 
      type: 'SEND_QUEST', 
      mercenaryId: selectedMerc.id, 
      duration: selectedQuest.baseHours,
      questDetails: {
        effectiveDuration: details.effectiveDuration,
        minGold: details.minGold,
        maxGold: details.maxGold,
        injuryChance: details.injuryChance,
        deathChance: details.deathChance,
      }
    });
    
    setSelectedQuest(null);
    setSelectedMerc(null);
    onClose?.();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-status-success';
      case 'Medium': return 'text-status-warning';
      case 'Hard': return 'text-rarity-epic';
      case 'Dangerous': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quest Selection */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Swords className="w-5 h-5 text-primary" />
          Available Quests
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {AVAILABLE_QUESTS.map(quest => (
            <button
              key={quest.id}
              onClick={() => setSelectedQuest(quest)}
              className={`p-4 rounded-lg border text-left transition-all ${
                selectedQuest?.id === quest.id
                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{quest.name}</span>
                <span className={`text-xs font-medium ${getDifficultyColor(quest.difficulty)}`}>
                  {quest.difficulty}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {quest.baseHours}h
                </span>
                <span className="flex items-center gap-1 text-primary">
                  <Coins className="w-3.5 h-3.5" />
                  ~{quest.baseGoldPerHour * quest.baseHours}g
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mercenary Selection */}
      {selectedQuest && (
        <div className="space-y-3 fade-in">
          <h3 className="font-semibold">Select Mercenary</h3>
          {availableMercs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No mercenaries available</p>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-4">
                {availableMercs.map(merc => {
                  const details = calculateQuestDetails(selectedQuest, merc);
                  const hasSpeedBonus = details.traitEffects.questSpeedModifier < 0;
                  
                  return (
                    <button
                      key={merc.id}
                      onClick={() => setSelectedMerc(merc)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        selectedMerc?.id === merc.id
                          ? 'border-primary bg-primary/10 ring-1 ring-primary'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {merc.isFavorite && <Star className="w-4 h-4 text-primary fill-current" />}
                          <span className="font-medium">{merc.name}</span>
                          <span className="text-xs text-muted-foreground">Lv.{merc.level}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform ${selectedMerc?.id === merc.id ? 'rotate-90' : ''}`} />
                      </div>
                      
                      {/* Traits */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {merc.traits.map((trait, i) => (
                          <TraitBadge key={i} trait={trait} />
                        ))}
                      </div>
                      
                      {/* Quest Preview */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className={`w-3 h-3 ${hasSpeedBonus ? 'text-status-success' : 'text-muted-foreground'}`} />
                          <span className={hasSpeedBonus ? 'text-status-success' : ''}>
                            {details.effectiveDuration}h
                            {hasSpeedBonus && <Zap className="w-3 h-3 inline ml-0.5" />}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-primary">
                          <Coins className="w-3 h-3" />
                          <span>{details.minGold}-{details.maxGold}g</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-status-warning" />
                          <span>{details.injuryChance}%</span>
                          {merc.isFavorite ? (
                            <Shield className="w-3 h-3 text-status-success ml-1" />
                          ) : details.deathChance > 0 && (
                            <span className="text-destructive ml-1">☠{details.deathChance}%</span>
                          )}
                        </div>
                      </div>
                      
                      {details.statBonus > 0 && (
                        <p className="text-xs text-status-success mt-1">
                          +{details.statBonus}% gold from high stats
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {/* Confirm Button */}
      {selectedQuest && selectedMerc && (
        <div className="flex items-center gap-3 pt-4 border-t border-border fade-in">
          <Button variant="ghost" onClick={() => { setSelectedQuest(null); setSelectedMerc(null); }}>
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button 
            onClick={handleSendQuest} 
            disabled={!canSendQuest}
            className="flex-1"
          >
            <Swords className="w-4 h-4 mr-2" />
            Send {selectedMerc.name} on {selectedQuest.name}
          </Button>
        </div>
      )}

      {!canSendQuest && (
        <p className="text-sm text-destructive text-center">
          All quest slots are full ({state.activeQuests.length}/{state.questSlots})
        </p>
      )}
    </div>
  );
}
