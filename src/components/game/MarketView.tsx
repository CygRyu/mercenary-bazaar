import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Sparkles, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { MercenaryCard } from './MercenaryCard';
import { Mercenary, MarketState } from '@/types/game';

const MARKET_LABELS: Record<MarketState, { label: string; description: string; className: string }> = {
  slow: { label: 'Slow Day', description: 'Quality is low today', className: 'market-slow' },
  average: { label: 'Average Talent', description: 'Standard recruitment pool', className: 'market-average' },
  veteran: { label: "Veterans' Gathering", description: 'Experienced fighters available', className: 'market-veteran' },
  heroes: { label: "Heroes' Fair", description: 'Legendary champions sighted!', className: 'market-heroes' },
};

export function MarketView() {
  const { state, dispatch, pullCost, canPull, getTimeUntilBaseCost, getMarketTimeRemaining } = useGame();
  const [lastPulled, setLastPulled] = useState<Mercenary | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const marketInfo = MARKET_LABELS[state.marketState];
  const pityProgress = (state.pityCounter / 40) * 100;
  const isPityReady = state.pityCounter >= 40;

  const handlePull = () => {
    if (!canPull || isAnimating) return;
    
    setIsAnimating(true);
    
    // Find the new mercenary after pull
    const previousIds = new Set(state.roster.map(m => m.id));
    dispatch({ type: 'PULL_MERCENARY' });
    
    setTimeout(() => {
      const newMerc = state.roster.find(m => !previousIds.has(m.id));
      if (newMerc) {
        setLastPulled(newMerc);
      }
      setIsAnimating(false);
    }, 100);
  };

  // Get last pulled from roster
  const actualLastPulled = state.roster.length > 1 
    ? state.roster[state.roster.length - 1] 
    : null;

  return (
    <div className="space-y-6 fade-in">
      {/* New Player Bonus Banner */}
      {state.newPlayerPhase.active && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-primary font-medium">
            <Sparkles className="w-4 h-4" />
            <span>New Recruit Bonus: {state.newPlayerPhase.pullsRemaining}/3 pulls remaining</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Commons disabled during this phase!
          </p>
        </div>
      )}

      {/* Market State */}
      <div className="text-center space-y-2">
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${marketInfo.className}`}>
          {marketInfo.label}
        </span>
        <p className="text-muted-foreground text-sm">{marketInfo.description}</p>
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          Changes in {getMarketTimeRemaining()}
        </p>
      </div>

      {/* Pity Counter */}
      <div className="max-w-md mx-auto space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Pity Progress</span>
          <span className="font-mono text-foreground">{state.pityCounter}/40</span>
        </div>
        <div className={`pity-bar ${isPityReady ? 'pity-bar-ready' : ''}`}>
          <div 
            className="pity-bar-fill"
            style={{ width: `${pityProgress}%` }}
          />
        </div>
        {isPityReady && (
          <p className="text-center text-primary text-sm font-medium animate-pulse">
            Pity Reward Available! Double Epic/Legendary chance!
          </p>
        )}
      </div>

      {/* Pull Button */}
      <div className="text-center space-y-3">
        <Button
          onClick={handlePull}
          disabled={!canPull || isAnimating}
          size="lg"
          className="pull-button h-14 px-8 text-lg font-semibold"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          {isAnimating ? 'Recruiting...' : 'Hire Mercenary'}
        </Button>

        <div className="space-y-1">
          <p className="font-mono text-lg">
            Cost:{' '}
            <span className={!state.dailyDiscountUsed ? 'text-status-success' : 'text-primary'}>
              {pullCost}g
            </span>
            {!state.dailyDiscountUsed && (
              <span className="text-status-success text-sm ml-2">(Daily Discount!)</span>
            )}
          </p>
          
          {state.dailyDiscountUsed && state.fatigueMultiplier > 1.01 && (
            <p className="text-sm text-muted-foreground">
              Normal: {Math.floor(100 * state.fatigueMultiplier)}g (×{state.fatigueMultiplier.toFixed(2)})
            </p>
          )}
          
          {state.fatigueMultiplier > 1.01 && (
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Base cost in: {getTimeUntilBaseCost()}
            </p>
          )}
        </div>

        {!canPull && (
          <p className="text-sm text-destructive flex items-center justify-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {state.gold < pullCost 
              ? 'Not enough gold'
              : 'Roster full'
            }
          </p>
        )}
      </div>

      {/* Last Pull Preview */}
      {actualLastPulled && !actualLastPulled.isStarter && (
        <div className="max-w-sm mx-auto space-y-2 slide-in-right">
          <p className="text-center text-sm text-muted-foreground">Last Recruited:</p>
          <MercenaryCard mercenary={actualLastPulled} compact />
        </div>
      )}
    </div>
  );
}
