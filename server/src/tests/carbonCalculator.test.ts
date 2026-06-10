import { describe, it, expect } from 'vitest';
import {
  calculateTransportationEmissions,
  calculateEnergyEmissions,
  calculateFoodEmissions,
  calculateWasteEmissions,
  calculateTotalEmissions
} from '../utils/carbonCalculator.js';

describe('Carbon Calculation Engine Unit Tests', () => {
  it('should calculate transportation emissions correctly', () => {
    const data = {
      carKm: 100, // 100 * 0.21 = 21 kg
      bikeKm: 50,  // 0 kg
      busKm: 20,   // 20 * 0.089 = 1.78 kg
      trainKm: 10,  // 10 * 0.041 = 0.41 kg
      flightHours: 2 // 2 * 250 = 500 kg
    };
    const emissions = calculateTransportationEmissions(data);
    expect(emissions).toBeCloseTo(523.19, 1);
  });

  it('should calculate energy emissions correctly', () => {
    const data = {
      electricityKwh: 50, // 50 * 0.5 = 25 kg
      acHours: 6,         // 6 * 1.5 = 9 kg
      applianceFactor: 'high' as const // 2.0 daily appliance weight
    };
    const emissions = calculateEnergyEmissions(data);
    expect(emissions).toBe(36.0);
  });

  it('should calculate food diet emissions correctly', () => {
    expect(calculateFoodEmissions({ dietType: 'vegan' })).toBe(2.89);
    expect(calculateFoodEmissions({ dietType: 'vegetarian' })).toBe(3.81);
    expect(calculateFoodEmissions({ dietType: 'omnivore' })).toBe(7.19);
  });

  it('should calculate waste emissions with recycling offsets correctly', () => {
    const data = {
      plasticBagCount: 10, // 10 * 0.033 = 0.33 kg
      foodWasteKg: 4,      // 4 * 2.5 = 10 kg
      recyclingRate: 50    // 50% offset
    };
    const emissions = calculateWasteEmissions(data);
    expect(emissions).toBeCloseTo(5.17, 1);
  });

  it('should compile aggregated total emissions breakdown correctly', () => {
    const transport = { carKm: 10, bikeKm: 0, busKm: 0, trainKm: 0, flightHours: 0 }; // 2.1
    const energy = { electricityKwh: 10, acHours: 0, applianceFactor: 'medium' as const }; // 5 + 1 = 6.0
    const food = { dietType: 'vegan' as const }; // 2.89
    const waste = { plasticBagCount: 0, foodWasteKg: 0, recyclingRate: 0 }; // 0

    const result = calculateTotalEmissions(transport, energy, food, waste);
    expect(result.totalEmissions).toBeCloseTo(10.99, 1);
    expect(result.transportation.emissions).toBe(2.1);
    expect(result.energy.emissions).toBe(6.0);
  });
});
