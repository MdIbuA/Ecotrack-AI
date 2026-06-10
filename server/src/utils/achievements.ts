import { UserProfile, CarbonEntry } from '../models/types.js';

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const BADGES: BadgeDefinition[] = [
  { id: 'first_entry', title: 'First Steps', description: 'Log your first carbon entry', icon: '🌱' },
  { id: 'week_streak_7', title: 'Streak Starter', description: 'Maintain a 7-day logging streak', icon: '🔥' },
  { id: 'month_streak_30', title: 'Climate Guard', description: 'Maintain a 30-day logging streak', icon: '🛡️' },
  { id: 'goal_completed', title: 'Goal Crusher', description: 'Successfully complete an carbon reduction goal', icon: '🎯' },
  { id: 'low_carbon_day', title: 'Featherlight', description: 'Log a day with emissions under 5kg CO2', icon: '🪶' },
  { id: 'vegan_day', title: 'Plant Powered', description: 'Log a vegan diet in food inputs', icon: '🥬' },
  { id: 'zero_waste_day', title: 'Zero Waste Hero', description: 'Log zero plastic bags and zero food waste', icon: '♻️' },
];

export const LEVELS = [
  { level: 1, minPoints: 0, title: 'Green Starter' },
  { level: 2, minPoints: 100, title: 'Eco Learner' },
  { level: 3, minPoints: 500, title: 'Nature Friend' },
  { level: 4, minPoints: 1000, title: 'Eco Warrior' },
  { level: 5, minPoints: 2500, title: 'Climate Champion' },
  { level: 6, minPoints: 5000, title: 'Earth Guardian' }
];

/**
 * Calculates current level details based on user's Eco Points
 */
export function calculateLevel(points: number) {
  let currentLvl = LEVELS[0];
  let nextLvl = LEVELS[1];
  
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].minPoints) {
      currentLvl = LEVELS[i];
      nextLvl = LEVELS[i + 1] || LEVELS[i]; // Cap at max level
    } else {
      break;
    }
  }

  const range = nextLvl.minPoints - currentLvl.minPoints;
  const progressPoints = points - currentLvl.minPoints;
  const progressPercent = range > 0 ? Math.min(Math.round((progressPoints / range) * 100), 100) : 100;

  return {
    level: currentLvl.level,
    title: currentLvl.title,
    minPoints: currentLvl.minPoints,
    nextLevelMinPoints: nextLvl.minPoints,
    progressPercent,
  };
}

/**
 * Evaluates a carbon entry to calculate points awarded
 */
export function calculateEcoPoints(entry: CarbonEntry): number {
  let points = 50; // Base points for logging

  // Low carbon day bonus (under 5 kg)
  if (entry.totalEmissions < 5.0) {
    points += 30;
  } else if (entry.totalEmissions < 10.0) {
    points += 15;
  }

  // Plant-based diet bonus
  if (entry.food.dietType === 'vegan') {
    points += 20;
  } else if (entry.food.dietType === 'vegetarian') {
    points += 10;
  }

  // Zero waste bonus
  if (entry.waste.plasticBagCount === 0 && entry.waste.foodWasteKg === 0) {
    points += 25;
  }

  // Active recycling bonus (recycles more than 50% of general waste)
  if (entry.waste.recyclingRate > 50) {
    points += 15;
  }

  return points;
}

/**
 * Check if the user unlocked any new badges with the current entry
 */
export function checkNewBadges(userProfile: UserProfile, newEntry: CarbonEntry, allEntries: CarbonEntry[]): string[] {
  const unlockedBadges: string[] = [];
  const currentBadges = new Set(userProfile.badges || []);

  const addBadge = (id: string) => {
    if (!currentBadges.has(id)) {
      unlockedBadges.push(id);
    }
  };

  // 1. First Entry badge
  if (allEntries.length === 0) {
    addBadge('first_entry');
  }

  // 2. Low carbon day badge
  if (newEntry.totalEmissions < 5.0) {
    addBadge('low_carbon_day');
  }

  // 3. Vegan day badge
  if (newEntry.food.dietType === 'vegan') {
    addBadge('vegan_day');
  }

  // 4. Zero waste day badge
  if (newEntry.waste.plasticBagCount === 0 && newEntry.waste.foodWasteKg === 0) {
    addBadge('zero_waste_day');
  }

  // 5. Streaks check (weekly/monthly)
  const streakCount = userProfile.streak || 1;
  if (streakCount >= 7) {
    addBadge('week_streak_7');
  }
  if (streakCount >= 30) {
    addBadge('month_streak_30');
  }

  return unlockedBadges;
}
