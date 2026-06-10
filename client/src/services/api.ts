import type { CarbonEntry, CarbonEntryInput, Goal, UserProfile, RecommendationItem } from '../models/types.js';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
}

async function apiRequest<T = unknown>(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    token?: string;
    isMultipart?: boolean;
  } = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, token, isMultipart = false } = options;

  const headers: Record<string, string> = {};

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    if (isMultipart) {
      config.body = body;
    } else {
      config.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const contentType = response.headers.get('content-type');
    
    let data: any;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { success: response.ok, text: await response.text() };
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error(`API Error on ${endpoint}:`, error);
    throw new Error(error.message || 'API request failed');
  }
}

export const apiService = {
  // ========== User Profile ==========
  getProfile: async (token: string) => {
    return apiRequest<UserProfile>('/users/profile', { token });
  },

  updateProfile: async (token: string, profile: Partial<UserProfile>) => {
    return apiRequest<UserProfile>('/users/profile', { method: 'PUT', token, body: profile });
  },

  createProfile: async (token: string) => {
    return apiRequest<UserProfile>('/users/profile', { method: 'POST', token });
  },

  // ========== Carbon Entries ==========
  getEntries: async (token: string, params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    const qs = query.toString();
    return apiRequest<CarbonEntry[]>(`/carbon${qs ? `?${qs}` : ''}`, { token });
  },

  createEntry: async (token: string, entry: CarbonEntryInput) => {
    return apiRequest<{ entry: CarbonEntry; pointsAwarded: number; unlockedBadges: string[] }>('/carbon', {
      method: 'POST',
      token,
      body: entry,
    });
  },

  getStats: async (token: string) => {
    return apiRequest<any>('/carbon/stats', { token });
  },

  // ========== Goals ==========
  getGoals: async (token: string) => {
    return apiRequest<Goal[]>('/goals', { token });
  },

  createGoal: async (token: string, goal: Omit<Goal, 'id' | 'userId' | 'status' | 'createdAt'>) => {
    return apiRequest<Goal>('/goals', { method: 'POST', token, body: goal });
  },

  updateGoal: async (token: string, goalId: string, updates: Partial<Goal>) => {
    return apiRequest<Goal>(`/goals/${goalId}`, { method: 'PUT', token, body: updates });
  },

  deleteGoal: async (token: string, goalId: string) => {
    return apiRequest<void>(`/goals/${goalId}`, { method: 'DELETE', token });
  },

  // ========== Gamification ==========
  getAchievements: async (token: string) => {
    return apiRequest<any>('/gamification/achievements', { token });
  },

  getBadges: async (token: string) => {
    return apiRequest<any[]>('/gamification/badges', { token });
  },

  // ========== AI Layer ==========
  getRecommendations: async (token: string) => {
    return apiRequest<{ recommendations: RecommendationItem[] }>('/ai/recommendations', { method: 'POST', token });
  },

  scanReceipt: async (token: string, file: File) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return apiRequest<any>('/ai/scan-receipt', {
      method: 'POST',
      token,
      body: formData,
      isMultipart: true,
    });
  },

  generateReport: async (token: string, month: string) => {
    return apiRequest<any>('/ai/report', {
      method: 'POST',
      token,
      body: { month },
    });
  },
};
