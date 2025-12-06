import { Trait } from '@/types/game';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TraitBadgeProps {
  trait: Trait;
}

export function TraitBadge({ trait }: TraitBadgeProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`text-xs px-2 py-0.5 rounded-full cursor-help transition-colors ${
              trait.isPositive
                ? 'bg-status-success/20 text-status-success hover:bg-status-success/30'
                : 'bg-destructive/20 text-destructive hover:bg-destructive/30'
            }`}
          >
            {trait.name}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{trait.name}</p>
            <p className="text-xs text-muted-foreground">{trait.description}</p>
            {trait.effectDescription && (
              <p className={`text-xs font-medium ${trait.isPositive ? 'text-status-success' : 'text-destructive'}`}>
                {trait.effectDescription}
              </p>
            )}
            {trait.statModifier && (
              <p className="text-xs text-muted-foreground">
                {trait.statModifier.value > 0 ? '+' : ''}{trait.statModifier.value} {trait.statModifier.stat.toUpperCase()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
