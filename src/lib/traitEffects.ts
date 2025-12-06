import { Mercenary, Trait } from '@/types/game';

export interface TraitEffects {
  questSpeedModifier: number; // percentage modifier (negative = faster)
  injuryModifier: number; // percentage modifier (negative = safer)
  deathModifier: number; // percentage modifier (negative = safer)
  goldModifier: number; // percentage modifier (positive = more gold)
  xpModifier: number; // percentage modifier (positive = more xp)
}

export function calculateTraitEffects(merc: Mercenary): TraitEffects {
  const effects: TraitEffects = {
    questSpeedModifier: 0,
    injuryModifier: 0,
    deathModifier: 0,
    goldModifier: 0,
    xpModifier: 0,
  };

  for (const trait of merc.traits) {
    if (trait.questSpeedModifier) effects.questSpeedModifier += trait.questSpeedModifier;
    if (trait.injuryModifier) effects.injuryModifier += trait.injuryModifier;
    if (trait.deathModifier) effects.deathModifier += trait.deathModifier;
    if (trait.goldModifier) effects.goldModifier += trait.goldModifier;
    if (trait.xpModifier) effects.xpModifier += trait.xpModifier;
  }

  return effects;
}

export function applySpeedModifier(baseDuration: number, modifier: number): number {
  const multiplier = 1 + (modifier / 100);
  return Math.max(0.5, baseDuration * multiplier); // Minimum 30 minutes per hour
}

export function applyRiskModifier(baseRisk: number, modifier: number): number {
  const multiplier = 1 + (modifier / 100);
  return Math.max(0, baseRisk * multiplier);
}

export function applyGoldModifier(baseGold: number, modifier: number): number {
  const multiplier = 1 + (modifier / 100);
  return Math.floor(baseGold * multiplier);
}

export function applyXpModifier(baseXp: number, modifier: number): number {
  const multiplier = 1 + (modifier / 100);
  return Math.floor(baseXp * multiplier);
}
