import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { MercenaryCard } from './MercenaryCard';
import { QuestModal } from './QuestModal';
import { Button } from '@/components/ui/button';
import { Mercenary, Rarity } from '@/types/game';
import { AlertTriangle, Users, Coins, Plus, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortOption = 'newest' | 'oldest' | 'rarity' | 'level' | 'value';
type FilterOption = 'all' | 'available' | 'questing' | 'favorites';

const RARITY_ORDER: Record<Rarity, number> = {
  legendary: 5,
  epic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};

export function BarracksView() {
  const { state, dispatch, calculateSellValue } = useGame();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [questTarget, setQuestTarget] = useState<Mercenary | null>(null);
  const [showLiquidationConfirm, setShowLiquidationConfirm] = useState(false);
  const [liquidationInput, setLiquidationInput] = useState('');

  const filteredAndSorted = [...state.roster]
    .filter(m => m.status !== 'dead')
    .filter(m => {
      switch (filterBy) {
        case 'available': return m.status === 'available';
        case 'questing': return m.status === 'questing';
        case 'favorites': return m.isFavorite;
        default: return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return a.pullTimestamp - b.pullTimestamp;
        case 'rarity': return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
        case 'level': return b.level - a.level;
        case 'value': return calculateSellValue(b) - calculateSellValue(a);
        default: return b.pullTimestamp - a.pullTimestamp;
      }
    });

  const canExpand = state.gold >= 1000;
  const liquidatableCount = state.roster.filter(m => 
    !m.isLocked && !m.isStarter && !m.isFavorite && m.status !== 'questing'
  ).length;
  const liquidationValue = state.roster
    .filter(m => !m.isLocked && !m.isStarter && !m.isFavorite && m.status !== 'questing')
    .reduce((sum, m) => sum + calculateSellValue(m), 0);

  const canLiquidate = state.emergencyLiquidationAvailable && 
    liquidatableCount > 0 &&
    (!state.lastEmergencyUse || Date.now() - state.lastEmergencyUse >= 24 * 60 * 60 * 1000);

  const handleExpandRoster = () => {
    dispatch({ type: 'EXPAND_ROSTER' });
  };

  const handleLiquidation = () => {
    if (liquidationInput === 'LIQUIDATE') {
      dispatch({ type: 'EMERGENCY_LIQUIDATION' });
      setShowLiquidationConfirm(false);
      setLiquidationInput('');
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-lg">Barracks</h2>
          <span className="text-muted-foreground font-mono">
            ({filteredAndSorted.length}/{state.rosterSlots})
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter */}
          <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
            <SelectTrigger className="w-32 h-9">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="questing">On Quest</SelectItem>
              <SelectItem value="favorites">Favorites</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="rarity">Rarity</SelectItem>
              <SelectItem value="level">Level</SelectItem>
              <SelectItem value="value">Value</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="secondary"
          onClick={handleExpandRoster}
          disabled={!canExpand}
          className="h-9"
        >
          <Plus className="w-4 h-4 mr-1" />
          Expand Roster (+5)
          <span className="ml-2 font-mono text-primary">1000g</span>
        </Button>

        {canLiquidate && (
          <Button
            variant="destructive"
            onClick={() => setShowLiquidationConfirm(true)}
            className="h-9"
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            Emergency Liquidation
          </Button>
        )}
      </div>

      {/* Liquidation Confirmation */}
      {showLiquidationConfirm && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive">Emergency Liquidation</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This will sell {liquidatableCount} mercenaries for{' '}
                <span className="text-primary font-mono">{Math.floor(liquidationValue * 1.1)}g</span>{' '}
                (110% value). Favorites and locked mercenaries are protected.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Type LIQUIDATE to confirm"
              value={liquidationInput}
              onChange={(e) => setLiquidationInput(e.target.value)}
              className="flex-1 h-9 px-3 rounded-md bg-muted border border-border text-sm font-mono"
            />
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLiquidation}
              disabled={liquidationInput !== 'LIQUIDATE'}
            >
              Confirm
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowLiquidationConfirm(false);
                setLiquidationInput('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Mercenary Grid */}
      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No mercenaries found</p>
          {filterBy !== 'all' && (
            <Button 
              variant="link" 
              onClick={() => setFilterBy('all')}
              className="mt-2"
            >
              Show all
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSorted.map(merc => (
            <MercenaryCard
              key={merc.id}
              mercenary={merc}
              onSendQuest={() => setQuestTarget(merc)}
            />
          ))}
        </div>
      )}

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
