import { describe, it, expect } from 'vitest';
import { calculateLevel, calculateEcoPoints, checkNewBadges } from '../utils/achievements.js';
import { UserProfile, CarbonEntry } from '../models/types.js';

describe('Gamification achievements Unit Tests', () => {
  it('should map XP points to correct levels and titles', () => {
    // Level 1 check
    const lvl1 = calculateLevel(50);
    expect(lvl1.level).toBe(1);
    expect(lvl1.title).toBe('Green Starter');
    expect(lvl1.progressPercent).toBe(50); // 50/100

    // Level 3 check
    const lvl3 = calculateLevel(600);
    expect(lvl3.level).toBe(3);
    expect(lvl3.title).toBe('Nature Friend');

    // Level 6 check (Earth Guardian threshold 5000)
    const lvl6 = calculateLevel(5500);
    expect(lvl6.level).toBe(6);
    expect(lvl6.title).toBe('Earth Guardian');
    expect(lvl6.progressPercent).toBe(100);
  });

  it('should calculate correct Eco Points award values', () => {
    const entry: CarbonEntry = {
      id: 'test-1',
      userId: 'user-1',
      date: '2026-06-09',
      transportation: { carKm: 0, bikeKm: 0, busKm: 0, trainKm: 0, flightHours: 0, emissions: 0 },
      energy: { electricityKwh: 0, acHours: 0, applianceFactor: 'low', emissions: 0.5 },
      food: { dietType: 'vegan', emissions: 2.89 },
      waste: { plasticBagCount: 0, foodWasteKg: 0, recyclingRate: 100, emissions: 0 },
      totalEmissions: 3.39, // under 5 kg CO2
      createdAt: new Date().toISOString()
    };

    const points = calculateEcoPoints(entry);
    // Base 50 + Low Carbon (<5kg) 30 + Vegan 20 + Zero Waste 25 + Recycling (>50%) 15 = 140
    expect(points).toBe(140);
  });

  it('should check and unlock earned badges correctly', () => {
    const profile: UserProfile = {
      uid: 'user-1',
      email: 'eco.test@domain.com',
      displayName: 'Eco Test User',
      createdAt: new Date().toISOString(),
      ecoPoints: 0,
      level: 1,
      streak: 1,
      badges: []
    };

    const entry: CarbonEntry = {
      id: 'entry-1',
      userId: 'user-1',
      date: '2026-06-09',
      transportation: { carKm: 0, bikeKm: 0, busKm: 0, trainKm: 0, flightHours: 0, emissions: 0 },
      energy: { electricityKwh: 0, acHours: 0, applianceFactor: 'low', emissions: 0.5 },
      food: { dietType: 'vegan', emissions: 2.89 },
      waste: { plasticBagCount: 0, foodWasteKg: 0, recyclingRate: 0, emissions: 0 },
      totalEmissions: 3.39,
      createdAt: new Date().toISOString()
    };

    const unlocked = checkNewBadges(profile, entry, []);
    expect(unlocked).toContain('first_entry');
    expect(unlocked).toContain('low_carbon_day');
    expect(unlocked).toContain('vegan_day');
    expect(unlocked).toContain('zero_waste_day');
  });
});
