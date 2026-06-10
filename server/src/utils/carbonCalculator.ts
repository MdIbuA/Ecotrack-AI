import { TransportationData, EnergyData, FoodData, WasteData } from '../models/types.js';

/**
 * Calculates carbon emissions from transportation (in kg CO2)
 */
export function calculateTransportationEmissions(data: TransportationData): number {
  const carEmissions = data.carKm * 0.21;
  const bikeEmissions = data.bikeKm * 0.0;
  const busEmissions = data.busKm * 0.089;
  const trainEmissions = data.trainKm * 0.041;
  const flightEmissions = data.flightHours * 250.0;

  return Number((carEmissions + bikeEmissions + busEmissions + trainEmissions + flightEmissions).toFixed(2));
}

/**
 * Calculates carbon emissions from energy (in kg CO2)
 */
export function calculateEnergyEmissions(data: EnergyData): number {
  const electricityEmissions = data.electricityKwh * 0.5;
  const acEmissions = data.acHours * 1.5;
  
  let applianceFactorVal = 1.0; // medium default
  if (data.applianceFactor === 'low') applianceFactorVal = 0.5;
  if (data.applianceFactor === 'high') applianceFactorVal = 2.0;

  // Assume the entry is typically daily; appliance usage is daily factor
  const applianceEmissions = applianceFactorVal; 

  return Number((electricityEmissions + acEmissions + applianceEmissions).toFixed(2));
}

/**
 * Calculates carbon emissions from food (in kg CO2 per day)
 */
export function calculateFoodEmissions(data: FoodData): number {
  let dailyRate = 7.19; // omnivore default
  if (data.dietType === 'vegan') dailyRate = 2.89;
  if (data.dietType === 'vegetarian') dailyRate = 3.81;

  return Number(dailyRate.toFixed(2));
}

/**
 * Calculates carbon emissions from waste (in kg CO2) with recycling offset
 */
export function calculateWasteEmissions(data: WasteData): number {
  const plasticEmissions = data.plasticBagCount * 0.033;
  const foodWasteEmissions = data.foodWasteKg * 2.5;
  const baseEmissions = plasticEmissions + foodWasteEmissions;
  
  // Recycling offset (recyclingRate is percentage, e.g. 50%)
  const recyclingRateDecimal = Math.min(Math.max(data.recyclingRate / 100, 0), 1);
  const totalWasteEmissions = baseEmissions * (1 - recyclingRateDecimal);

  return Number(totalWasteEmissions.toFixed(2));
}

/**
 * Aggregates all calculations into a single result object
 */
export function calculateTotalEmissions(
  transportation: TransportationData,
  energy: EnergyData,
  food: FoodData,
  waste: WasteData
) {
  const transEmissions = calculateTransportationEmissions(transportation);
  const engEmissions = calculateEnergyEmissions(energy);
  const fdEmissions = calculateFoodEmissions(food);
  const wstEmissions = calculateWasteEmissions(waste);
  const total = Number((transEmissions + engEmissions + fdEmissions + wstEmissions).toFixed(2));

  return {
    transportation: { ...transportation, emissions: transEmissions },
    energy: { ...energy, emissions: engEmissions },
    food: { ...food, emissions: fdEmissions },
    waste: { ...waste, emissions: wstEmissions },
    totalEmissions: total,
  };
}
