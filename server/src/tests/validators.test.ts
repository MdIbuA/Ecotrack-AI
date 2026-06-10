import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { validateCarbonEntry, validateGoal, validateProfile } from '../middleware/validators.js';

/**
 * Helper to run an express-validator chain against a mock request.
 * Returns the validation errors array.
 */
async function runValidation(
  validationChain: any[],
  body: Record<string, any>
): Promise<any[]> {
  const req = { body, headers: {}, query: {}, params: {} } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next: NextFunction = vi.fn();

  // Run each validator/middleware (except the last one which is checkValidation)
  for (const middleware of validationChain.slice(0, -1)) {
    await middleware.run(req);
  }

  const errors = validationResult(req);
  return errors.array();
}

// ────────────────────────────────────────────────────────
// validateCarbonEntry Tests
// ────────────────────────────────────────────────────────
describe('validateCarbonEntry', () => {
  const validEntry = {
    date: '2026-06-09',
    transportation: { carKm: 10, bikeKm: 0, busKm: 0, trainKm: 0, flightHours: 0 },
    energy: { electricityKwh: 5, acHours: 1, applianceFactor: 'low' },
    food: { dietType: 'vegan' },
    waste: { plasticBagCount: 0, foodWasteKg: 0, recyclingRate: 50 },
  };

  it('should reject when date is missing', async () => {
    const { date, ...bodyWithoutDate } = validEntry;
    const errors = await runValidation(validateCarbonEntry, bodyWithoutDate);
    const dateError = errors.find((e: any) => e.path === 'date');
    expect(dateError).toBeDefined();
  });

  it('should reject when transportation data is not an object', async () => {
    const errors = await runValidation(validateCarbonEntry, {
      ...validEntry,
      transportation: 'invalid-string',
    });
    const transportError = errors.find((e: any) => e.path === 'transportation');
    expect(transportError).toBeDefined();
  });

  it('should reject when carKm is non-numeric', async () => {
    const errors = await runValidation(validateCarbonEntry, {
      ...validEntry,
      transportation: { ...validEntry.transportation, carKm: 'abc' },
    });
    const carError = errors.find((e: any) => e.path === 'transportation.carKm');
    expect(carError).toBeDefined();
  });

  it('should reject invalid applianceFactor value', async () => {
    const errors = await runValidation(validateCarbonEntry, {
      ...validEntry,
      energy: { ...validEntry.energy, applianceFactor: 'extreme' },
    });
    const factorError = errors.find((e: any) => e.path === 'energy.applianceFactor');
    expect(factorError).toBeDefined();
  });

  it('should accept a valid complete carbon entry', async () => {
    const errors = await runValidation(validateCarbonEntry, validEntry);
    expect(errors.length).toBe(0);
  });
});

// ────────────────────────────────────────────────────────
// validateGoal Tests
// ────────────────────────────────────────────────────────
describe('validateGoal', () => {
  const validGoal = {
    category: 'energy',
    title: 'Reduce electricity usage',
    targetValue: 100,
    currentValue: 20,
    unit: 'kWh',
    startDate: '2026-06-01',
    targetDate: '2026-12-31',
  };

  it('should reject when title is missing', async () => {
    const { title, ...bodyWithoutTitle } = validGoal;
    const errors = await runValidation(validateGoal, bodyWithoutTitle);
    const titleError = errors.find((e: any) => e.path === 'title');
    expect(titleError).toBeDefined();
  });

  it('should reject an invalid category value', async () => {
    const errors = await runValidation(validateGoal, {
      ...validGoal,
      category: 'shopping',
    });
    const catError = errors.find((e: any) => e.path === 'category');
    expect(catError).toBeDefined();
  });

  it('should reject non-numeric targetValue', async () => {
    const errors = await runValidation(validateGoal, {
      ...validGoal,
      targetValue: 'a lot',
    });
    const targetErr = errors.find((e: any) => e.path === 'targetValue');
    expect(targetErr).toBeDefined();
  });

  it('should accept valid goal data', async () => {
    const errors = await runValidation(validateGoal, validGoal);
    expect(errors.length).toBe(0);
  });
});

// ────────────────────────────────────────────────────────
// validateProfile Tests
// ────────────────────────────────────────────────────────
describe('validateProfile', () => {
  it('should reject when displayName is empty', async () => {
    const errors = await runValidation(validateProfile, { displayName: '' });
    const nameError = errors.find((e: any) => e.path === 'displayName');
    expect(nameError).toBeDefined();
  });

  it('should reject when displayName is only whitespace', async () => {
    const errors = await runValidation(validateProfile, { displayName: '   ' });
    const nameError = errors.find((e: any) => e.path === 'displayName');
    expect(nameError).toBeDefined();
  });

  it('should accept valid displayName without photoURL', async () => {
    const errors = await runValidation(validateProfile, { displayName: 'Jane Doe' });
    expect(errors.length).toBe(0);
  });

  it('should accept valid displayName with a valid photoURL', async () => {
    const errors = await runValidation(validateProfile, {
      displayName: 'Jane Doe',
      photoURL: 'https://example.com/photo.jpg',
    });
    expect(errors.length).toBe(0);
  });

  it('should reject an invalid photoURL format', async () => {
    const errors = await runValidation(validateProfile, {
      displayName: 'Jane Doe',
      photoURL: 'not-a-url',
    });
    const urlError = errors.find((e: any) => e.path === 'photoURL');
    expect(urlError).toBeDefined();
  });
});
