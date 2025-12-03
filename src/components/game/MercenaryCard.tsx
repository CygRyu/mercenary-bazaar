import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { Mercenary, Rarity } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Lock, Unlock, Star, Swords, Coins, Heart, 
  Clock, AlertTriangle, Skull, ChevronDown, ChevronUp, Pencil, Check, X
} from 'lucide-react';

interface MercenaryCardProps {
  mercenary: Mercenary;
  compact?: boolean;
  showActions?: boolean;
  onSendQuest?: () => void;
}

const RARITY_COLORS: Record<Rarity, string> = {
  common: 'rarity-common',
  uncommon: 'rarity-uncommon',
  rare: 'rarity-rare',
  epic: 'rarity-epic',
  legendary: 'rarity-legendary',
};

const RARITY_TEXT: Record<Rarity, string> = {
  common: 'text-rarity-common',
  uncommon: 'text-rarity-uncommon',
  rare: 'text-rarity-rare',
  epic: 'text-rarity-epic',
  legendary: 'text-rarity-legendary',
};

const STATUS_BADGES: Record<string, { icon: typeof Clock; label: string; className: string }> = {
  available: { icon: Heart, label: 'Available', className: 'status-active' },
  questing: { icon: Swords, label: 'On Quest', className: 'status-active' },
  injured: { icon: AlertTriangle, label: 'Injured', className: 'status-injured' },
  resting: { icon: Clock, label: 'Resting', className: 'status-resting' },
  dead: { icon: Skull, label: 'Fallen', className: 'status-dead' },
};

export function MercenaryCard({ mercenary, compact = false, showActions = true, onSendQuest }: MercenaryCardProps) {
  const { dispatch, calculateSellValue, calculateMercWage } = useGame();
  const [expanded, setExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(mercenary.name);

  const sellValue = calculateSellValue(mercenary);
  const dailyWage = calculateMercWage(mercenary);
  const statusInfo = STATUS_BADGES[mercenary.status];
  const StatusIcon = statusInfo.icon;

  const handleToggleLock = () => {
    dispatch({ type: 'TOGGLE_LOCK', mercenaryId: mercenary.id });
  };

  const handleToggleFavorite = () => {
    dispatch({ type: 'TOGGLE_FAVORITE', mercenaryId: mercenary.id });
  };

  const handleSell = () => {
    dispatch({ type: 'SELL_MERCENARY', mercenaryId: mercenary.id });
  };

  const handleRename = () => {
    if (newName.trim() && newName.trim() !== mercenary.name) {
      dispatch({ type: 'RENAME_MERCENARY', mercenaryId: mercenary.id, newName: newName.trim() });
    }
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setNewName(mercenary.name);
    setIsRenaming(false);
  };

  const formatTimeRemaining = (endTime: number | null) => {
    if (!endTime) return '';
    const remaining = endTime - Date.now();
    if (remaining <= 0) return 'Ready';
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const daysOwned = Math.floor((Date.now() - mercenary.career.hireDate) / (24 * 60 * 60 * 1000));
  const successRate = mercenary.career.questsAttempted > 0 
    ? Math.round((mercenary.career.questsCompleted / mercenary.career.questsAttempted) * 100)
    : 0;

  if (compact) {
    return (
      <div className={`bg-card rounded-lg p-3 mercenary-card ${RARITY_COLORS[mercenary.rarity]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mercenary.isFavorite && <Star className="w-4 h-4 favorite-star" />}
            <span className="font-medium">{mercenary.name}</span>
          </div>
          <span className={`text-xs font-medium uppercase ${RARITY_TEXT[mercenary.rarity]}`}>
            {mercenary.rarity}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span className="font-mono">Lv.{mercenary.level}</span>
          <span className="font-mono">
            {mercenary.stats.efficiency}/{mercenary.stats.resilience}/{mercenary.stats.skill}
          </span>
          <span className="text-primary font-mono">{sellValue}g</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-lg overflow-hidden mercenary-card ${RARITY_COLORS[mercenary.rarity]} ${mercenary.isFavorite ? 'ring-1 ring-primary/50' : ''}`}>
      {/* Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {mercenary.isFavorite && <Star className="w-4 h-4 flex-shrink-0 favorite-star" />}
              {mercenary.isStarter && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                  STARTER
                </span>
              )}
              {isRenaming ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-6 text-sm px-2 w-32"
                    maxLength={30}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename();
                      if (e.key === 'Escape') cancelRename();
                    }}
                  />
                  <Button variant="ghost" size="sm" onClick={handleRename} className="h-6 w-6 p-0">
                    <Check className="w-3 h-3 text-status-success" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelRename} className="h-6 w-6 p-0">
                    <X className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1 group">
                  <h3 className="font-semibold truncate">{mercenary.name}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsRenaming(true)}
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium uppercase ${RARITY_TEXT[mercenary.rarity]}`}>
                {mercenary.rarity}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="font-mono text-sm">Level {mercenary.level}</span>
            </div>
          </div>
          
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusInfo.className}`}>
            <StatusIcon className="w-3 h-3" />
            <span>{statusInfo.label}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">EFF</span>
              <span className="font-mono">{mercenary.stats.efficiency}</span>
            </div>
            <div className="stat-bar">
              <div 
                className="stat-bar-fill bg-status-success"
                style={{ width: `${(mercenary.stats.efficiency / 75) * 100}%` }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">RES</span>
              <span className="font-mono">{mercenary.stats.resilience}</span>
            </div>
            <div className="stat-bar">
              <div 
                className="stat-bar-fill bg-status-info"
                style={{ width: `${(mercenary.stats.resilience / 75) * 100}%` }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">SKL</span>
              <span className="font-mono">{mercenary.stats.skill}</span>
            </div>
            <div className="stat-bar">
              <div 
                className="stat-bar-fill bg-rarity-epic"
                style={{ width: `${(mercenary.stats.skill / 75) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Traits */}
        <div className="flex flex-wrap gap-1.5">
          {mercenary.traits.map((trait, i) => (
            <span 
              key={i}
              className={`text-xs px-2 py-0.5 rounded-full ${
                trait.isPositive 
                  ? 'bg-status-success/20 text-status-success' 
                  : 'bg-destructive/20 text-destructive'
              }`}
              title={trait.description}
            >
              {trait.name}
            </span>
          ))}
        </div>

        {/* Morale & Value & Wage */}
        <div className="flex items-center justify-between text-sm">
          <div className="space-y-0.5">
            <span className="text-muted-foreground">
              Morale: <span className="text-foreground">{mercenary.morale}</span>
            </span>
            <div className="text-xs text-muted-foreground">
              Wage: <span className="text-status-info font-mono">{dailyWage}g/day</span>
            </div>
          </div>
          <span className="font-mono text-primary font-medium">
            <Coins className="w-3.5 h-3.5 inline mr-1" />
            {sellValue}g
          </span>
        </div>

        {/* Expandable Career Section */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>Career Stats</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expanded && (
          <div className="space-y-2 text-sm border-t border-border pt-3 fade-in">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Days Owned:</span>
                <span className="font-mono ml-2">{daysOwned}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Quests:</span>
                <span className="font-mono ml-2">
                  {mercenary.career.questsCompleted}/{mercenary.career.questsAttempted}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Success:</span>
                <span className="font-mono ml-2">{successRate}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Gold Earned:</span>
                <span className="font-mono ml-2 text-primary">{mercenary.career.questGoldEarned}g</span>
              </div>
              <div>
                <span className="text-muted-foreground">Injuries:</span>
                <span className="font-mono ml-2">{mercenary.career.timesInjured}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Quest Hours:</span>
                <span className="font-mono ml-2">{mercenary.career.totalQuestHours}h</span>
              </div>
            </div>
            {mercenary.career.consecutiveSuccesses > 0 && (
              <p className="text-status-success text-xs">
                🔥 {mercenary.career.consecutiveSuccesses} quest streak!
              </p>
            )}
          </div>
        )}

        {/* Status Timer */}
        {(mercenary.status === 'injured' || mercenary.status === 'resting') && (
          <div className="text-xs text-center text-muted-foreground">
            <Clock className="w-3 h-3 inline mr-1" />
            Ready in: {formatTimeRemaining(mercenary.injuryRecoveryTime || mercenary.restUntilTime)}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && mercenary.status !== 'dead' && (
        <div className="border-t border-border p-3 bg-muted/30 flex items-center gap-2 flex-wrap">
          {/* Lock Toggle */}
          {!mercenary.isStarter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleLock}
              className="h-8 px-2"
            >
              {mercenary.isLocked ? (
                <Lock className="w-4 h-4 text-primary" />
              ) : (
                <Unlock className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          )}

          {/* Favorite Toggle */}
          {!mercenary.isStarter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFavorite}
              className="h-8 px-2"
            >
              <Star className={`w-4 h-4 ${mercenary.isFavorite ? 'favorite-star fill-current' : 'text-muted-foreground'}`} />
            </Button>
          )}

          {/* Quest Button */}
          {mercenary.status === 'available' && onSendQuest && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onSendQuest}
              className="h-8"
            >
              <Swords className="w-4 h-4 mr-1" />
              Quest
            </Button>
          )}

          {/* Sell Button */}
          {!mercenary.isLocked && !mercenary.isStarter && mercenary.status !== 'questing' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSell}
              className="h-8 ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Coins className="w-4 h-4 mr-1" />
              Sell
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
