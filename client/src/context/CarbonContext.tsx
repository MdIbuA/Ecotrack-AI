import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { apiService } from '../services/api.js';
import type { CarbonEntry, CarbonEntryInput, Goal } from '../models/types.js';
import { useAuth } from './AuthContext.js';

interface DashboardStats {
  totalEmissions: number;
  dailyAverage: number;
  thisWeekTotal: number;
  thisMonthTotal: number;
  categoryBreakdown: Array<{ name: string; value: number; color: string }>;
  trendData: Array<{ date: string; emissions: number }>;
  weeklyComparison: Array<{ week: string; current: number; previous: number }>;
}

const defaultStats: DashboardStats = {
  totalEmissions: 156.2,
  dailyAverage: 5.2,
  thisWeekTotal: 36.4,
  thisMonthTotal: 126.8,
  categoryBreakdown: [
    { name: 'Transportation', value: 42, color: '#10b981' },
    { name: 'Energy', value: 28, color: '#06b6d4' },
    { name: 'Food', value: 20, color: '#f59e0b' },
    { name: 'Waste', value: 10, color: '#ef4444' }
  ],
  trendData: [
    { date: 'Jun 1', emissions: 12.5 },
    { date: 'Jun 2', emissions: 10.8 },
    { date: 'Jun 3', emissions: 15.2 },
    { date: 'Jun 4', emissions: 8.9 },
    { date: 'Jun 5', emissions: 11.3 },
    { date: 'Jun 6', emissions: 9.7 },
    { date: 'Jun 7', emissions: 13.1 },
    { date: 'Jun 8', emissions: 7.5 },
    { date: 'Jun 9', emissions: 10.2 },
    { date: 'Jun 10', emissions: 8.1 },
  ],
  weeklyComparison: [
    { week: 'Week 1', current: 36.4, previous: 41.8 },
    { week: 'Week 2', current: 32.8, previous: 36.4 },
  ]
};

interface CarbonContextType {
  entries: CarbonEntry[];
  goals: Goal[];
  stats: DashboardStats;
  loading: boolean;
  fetchEntries: () => Promise<void>;
  fetchGoals: () => Promise<void>;
  fetchStats: () => Promise<void>;
  createEntry: (entry: CarbonEntryInput) => Promise<any>;
  createGoal: (goal: Omit<Goal, 'id' | 'userId' | 'status' | 'createdAt'>) => Promise<any>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<any>;
  deleteGoal: (goalId: string) => Promise<any>;
}

const CarbonContext = createContext<CarbonContextType | undefined>(undefined);

export function CarbonProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CarbonEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(false);

  const getToken = useCallback(async () => {
    if (!user) return '';
    // Firebase auth user or mock session check
    return user.getIdToken ? await user.getIdToken() : 'mock-token';
  }, [user]);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const response = await apiService.getEntries(token);
      if (response && response.success && response.entries) {
        setEntries(response.entries);
      }
    } catch (err) {
      console.warn('API error loading carbon entries. Keeping local cache.', err);
    }
  }, [user, getToken]);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const response = await apiService.getGoals(token);
      if (response && response.success && response.goals) {
        setGoals(response.goals);
      }
    } catch (err) {
      console.warn('API error loading goals. Keeping local cache.', err);
    }
  }, [user, getToken]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const response = await apiService.getStats(token);
      if (response && response.success && response.stats) {
        setStats(response.stats);
      }
    } catch (err) {
      console.warn('API error loading stats. Keeping local defaults.', err);
    }
  }, [user, getToken]);

  const createEntry = useCallback(async (entry: CarbonEntryInput) => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await apiService.createEntry(token, entry);
      if (response && response.success) {
        // Refresh entries and stats
        await fetchEntries();
        await fetchStats();
        return response;
      }
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Failed to submit carbon calculation');
    } finally {
      setLoading(false);
    }
  }, [getToken, fetchEntries, fetchStats]);

  const createGoal = useCallback(async (goal: Omit<Goal, 'id' | 'userId' | 'status' | 'createdAt'>) => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await apiService.createGoal(token, goal);
      if (response && response.success) {
        await fetchGoals();
        return response;
      }
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  }, [getToken, fetchGoals]);

  const updateGoal = useCallback(async (goalId: string, updates: Partial<Goal>) => {
    try {
      const token = await getToken();
      const response = await apiService.updateGoal(token, goalId, updates);
      if (response && response.success) {
        await fetchGoals();
        return response;
      }
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Failed to update goal progress');
    }
  }, [getToken, fetchGoals]);

  const deleteGoal = useCallback(async (goalId: string) => {
    try {
      const token = await getToken();
      const response = await apiService.deleteGoal(token, goalId);
      if (response && response.success) {
        await fetchGoals();
        return response;
      }
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Failed to remove goal');
    }
  }, [getToken, fetchGoals]);

  // Load active data on user change
  useEffect(() => {
    if (user) {
      fetchEntries();
      fetchGoals();
      fetchStats();
    } else {
      setEntries([]);
      setGoals([]);
      setStats(defaultStats);
    }
  }, [user, fetchEntries, fetchGoals, fetchStats]);

  return (
    <CarbonContext.Provider
      value={{
        entries,
        goals,
        stats,
        loading,
        fetchEntries,
        fetchGoals,
        fetchStats,
        createEntry,
        createGoal,
        updateGoal,
        deleteGoal,
      }}
    >
      {children}
    </CarbonContext.Provider>
  );
}

export function useCarbon() {
  const context = useContext(CarbonContext);
  if (!context) {
    throw new Error('useCarbon must be used within a CarbonProvider');
  }
  return context;
}
