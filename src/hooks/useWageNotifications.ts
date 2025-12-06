import { useEffect, useRef } from 'react';
import { useGame } from '@/context/GameContext';
import { toast } from 'sonner';

export function useWageNotifications() {
  const { state, calculateMercWage } = useGame();
  const lastWagePayment = useRef(state.lastWagePayment);
  const lastRosterSize = useRef(state.roster.length);

  useEffect(() => {
    // Check if wages were just paid (lastWagePayment changed)
    if (state.lastWagePayment !== lastWagePayment.current) {
      const aliveMercs = state.roster.filter(m => m.status !== 'dead');
      const totalWages = aliveMercs.reduce((sum, m) => sum + calculateMercWage(m), 0);
      
      // Check if mercs left (roster size decreased unexpectedly)
      const mercsLeft = lastRosterSize.current - state.roster.length;
      
      if (mercsLeft > 0 && state.gold === 0) {
        toast.error(`Couldn't pay wages!`, {
          description: `${mercsLeft} mercenary${mercsLeft > 1 ? 'ies' : ''} left due to unpaid wages.`,
        });
      } else if (totalWages > 0) {
        toast.info(`Daily wages paid: ${totalWages}g`, {
          description: `Paid ${aliveMercs.length} mercenaries.`,
        });
      }
      
      lastWagePayment.current = state.lastWagePayment;
    }
    
    lastRosterSize.current = state.roster.length;
  }, [state.lastWagePayment, state.roster.length, state.gold, state.roster, calculateMercWage]);
}
