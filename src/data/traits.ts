import { Trait } from '@/types/game';

export const POSITIVE_TRAITS: Trait[] = [
  {
    name: 'Prodigy',
    description: 'Learns skills at an exceptional rate',
    isPositive: true,
    valueModifier: 30,
  },
  {
    name: 'Lucky',
    description: 'Fortune favors this mercenary',
    isPositive: true,
    valueModifier: 25,
  },
  {
    name: 'Combat Specialist',
    description: 'Expert in battlefield tactics',
    isPositive: true,
    statModifier: { stat: 'skill', value: 8 },
    valueModifier: 40,
  },
  {
    name: 'Iron Will',
    description: 'Unbreakable mental fortitude',
    isPositive: true,
    statModifier: { stat: 'resilience', value: 8 },
    valueModifier: 35,
  },
  {
    name: 'Swift',
    description: 'Completes tasks with remarkable speed',
    isPositive: true,
    statModifier: { stat: 'efficiency', value: 8 },
    valueModifier: 35,
  },
  {
    name: 'Team Player',
    description: 'Works well with others',
    isPositive: true,
    valueModifier: 15,
  },
  {
    name: 'Tough',
    description: 'Resistant to injury',
    isPositive: true,
    statModifier: { stat: 'resilience', value: 5 },
    valueModifier: 20,
  },
  {
    name: 'Resourceful',
    description: 'Makes the most of any situation',
    isPositive: true,
    statModifier: { stat: 'efficiency', value: 5 },
    valueModifier: 20,
  },
  {
    name: 'Precise',
    description: 'Deadly accuracy in combat',
    isPositive: true,
    statModifier: { stat: 'skill', value: 5 },
    valueModifier: 20,
  },
  {
    name: 'Veteran',
    description: 'Seasoned by countless battles',
    isPositive: true,
    valueModifier: 25,
  },
  {
    name: 'Natural Leader',
    description: 'Inspires those around them',
    isPositive: true,
    valueModifier: 30,
  },
  {
    name: 'Eagle-Eyed',
    description: 'Nothing escapes their gaze',
    isPositive: true,
    statModifier: { stat: 'skill', value: 6 },
    valueModifier: 22,
  },
];

export const NEGATIVE_TRAITS: Trait[] = [
  {
    name: 'Reckless',
    description: 'Takes unnecessary risks',
    isPositive: false,
    valueModifier: -20,
  },
  {
    name: 'Clumsy',
    description: 'Prone to accidents',
    isPositive: false,
    statModifier: { stat: 'skill', value: -3 },
    valueModifier: -20,
  },
  {
    name: 'Lazy',
    description: 'Avoids hard work when possible',
    isPositive: false,
    statModifier: { stat: 'efficiency', value: -3 },
    valueModifier: -20,
  },
  {
    name: 'Fragile',
    description: 'Easily injured',
    isPositive: false,
    statModifier: { stat: 'resilience', value: -3 },
    valueModifier: -20,
  },
  {
    name: 'Cowardly',
    description: 'Flees from danger',
    isPositive: false,
    valueModifier: -20,
  },
  {
    name: 'Greedy',
    description: 'Always wants more than their share',
    isPositive: false,
    valueModifier: -15,
  },
  {
    name: 'Hot-Headed',
    description: 'Quick to anger',
    isPositive: false,
    valueModifier: -15,
  },
  {
    name: 'Superstitious',
    description: 'Plagued by unfounded fears',
    isPositive: false,
    valueModifier: -15,
  },
];

export const MORALE_STATES = [
  'Eager',
  'Content',
  'Loyal',
  'Determined',
  'Hopeful',
  'Stoic',
  'Focused',
  'Ready',
];

export const FIRST_NAMES = [
  'Gorin', 'Ralen', 'Theron', 'Kira', 'Borin', 'Sera', 'Magnus', 'Luna',
  'Dax', 'Nyla', 'Cormac', 'Ash', 'Vex', 'Zara', 'Ronan', 'Freya',
  'Drake', 'Ivy', 'Gareth', 'Mira', 'Tormund', 'Lyra', 'Aldric', 'Sable',
  'Brennan', 'Thalia', 'Orin', 'Vesper', 'Kaelen', 'Rowena', 'Bram', 'Elara',
];

export const EPITHETS = [
  'the Bold', 'the Swift', 'the Wise', 'the Fearless', 'the Silent',
  'the Brave', 'the Cunning', 'the Strong', 'the Just', 'the Wanderer',
  'Ironhand', 'Shadowbane', 'Fireheart', 'Stormborn', 'Nightwalker',
  'the Unyielding', 'the Relentless', 'the Patient', 'the Vigilant',
];
