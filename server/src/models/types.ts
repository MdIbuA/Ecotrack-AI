export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  ecoPoints: number;
  level: number;
  streak: number;
  lastActiveDate?: string;
  badges: string[];
}

export interface TransportationData {
  carKm: number;
  bikeKm: number;
  busKm: number;
  trainKm: number;
  flightHours: number;
}

export interface EnergyData {
  electricityKwh: number;
  acHours: number;
  applianceFactor: 'low' | 'medium' | 'high';
}

export interface FoodData {
  dietType: 'vegan' | 'vegetarian' | 'omnivore';
}

export interface WasteData {
  plasticBagCount: number;
  foodWasteKg: number;
  recyclingRate: number;
}

export interface CarbonEntry {
  id: string;
  userId: string;
  date: string;
  transportation: TransportationData & { emissions: number };
  energy: EnergyData & { emissions: number };
  food: FoodData & { emissions: number };
  waste: WasteData & { emissions: number };
  totalEmissions: number;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  category: 'transportation' | 'energy' | 'food' | 'waste' | 'overall';
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  targetDate: string;
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  category: string;
  requiredPoints: number;
}

export interface RecommendationItem {
  title: string;
  description: string;
  category: string;
  impactScore: 'low' | 'medium' | 'high';
  difficultyScore: 'easy' | 'medium' | 'hard';
  potentialAnnualReductionKg: number;
  estimatedSavingsUsd: number;
}

export interface Recommendation {
  id: string;
  userId: string;
  generatedAt: string;
  items: RecommendationItem[];
}

export interface Report {
  id: string;
  userId: string;
  month: string;
  summary: string;
  insights: string[];
  totalEmissions: number;
  reductionProgress: number;
  generatedAt: string;
}
