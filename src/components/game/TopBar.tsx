import { useGame } from '@/context/GameContext';
import { Coins, Users, Swords, Gift } from 'lucide-react';

export function TopBar() {
  const { state } = useGame();

  const questingCount = state.activeQuests.length;
  const availableRoster = state.roster.filter(m => m.status !== 'dead').length;

  return (
    <header className="bg-card border-b border-border px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-mono text-lg font-bold text-primary tracking-tight">
          MERCENARY GACHA HUNTER
        </h1>
        
        <div className="flex items-center gap-6 text-sm">
          {/* Gold */}
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-primary" />
            <span className="font-mono font-semibold text-primary">
              {state.gold.toLocaleString()}g
            </span>
          </div>

          {/* Roster */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-foreground">
              {availableRoster}/{state.rosterSlots}
            </span>
          </div>

          {/* Active Quests */}
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-foreground">
              {questingCount}/{state.questSlots}
            </span>
          </div>

          {/* Daily Discount Indicator */}
          {!state.dailyDiscountUsed && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/20 text-primary text-xs font-medium">
              <Gift className="w-3 h-3" />
              <span>Daily Discount</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
