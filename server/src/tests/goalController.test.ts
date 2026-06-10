import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// In-memory mock store for Firestore simulation
const mockStore = new Map<string, any>();

const mockDocRef = (collectionPath: string, id: string) => ({
  id,
  get: vi.fn(async () => {
    const data = mockStore.get(`${collectionPath}/${id}`);
    return {
      exists: data !== undefined,
      data: () => (data ? JSON.parse(JSON.stringify(data)) : null),
    };
  }),
  set: vi.fn(async (data: any) => {
    mockStore.set(`${collectionPath}/${id}`, data);
  }),
  update: vi.fn(async (data: any) => {
    const existing = mockStore.get(`${collectionPath}/${id}`) || {};
    mockStore.set(`${collectionPath}/${id}`, { ...existing, ...data });
  }),
  delete: vi.fn(async () => {
    mockStore.delete(`${collectionPath}/${id}`);
  }),
});

const mockQueryWhere = (collectionPath: string, filters: Array<{ field: string; val: any }>) => ({
  get: vi.fn(async () => {
    const docs: any[] = [];
    const prefix = `${collectionPath}/`;
    for (const [key, val] of mockStore.entries()) {
      if (key.startsWith(prefix)) {
        let matches = true;
        for (const filter of filters) {
          if (val[filter.field] !== filter.val) matches = false;
        }
        if (matches) {
          docs.push({
            id: key.replace(prefix, ''),
            exists: true,
            data: () => JSON.parse(JSON.stringify(val)),
          });
        }
      }
    }
    return { docs };
  }),
  where: (field: string, _op: string, val: any) =>
    mockQueryWhere(collectionPath, [...filters, { field, val }]),
});

const mockCollection = (path: string) => ({
  doc: (id: string) => mockDocRef(path, id),
  where: (field: string, _op: string, val: any) =>
    mockQueryWhere(path, [{ field, val }]),
});

// Mock firebase config module
vi.mock('../config/firebase.js', () => ({
  db: {
    collection: (path: string) => mockCollection(path),
  },
  isMockMode: true,
}));

// Mock uuid to get deterministic IDs
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-goal-uuid-1'),
}));

import { createGoal, getGoals, updateGoalProgress, deleteGoal } from '../controllers/goalController.js';

/** Helper to create a mock Express Request */
function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    body: {},
    params: {},
    user: {
      uid: 'test-user-1',
      email: 'test@ecotrack.ai',
      name: 'Test User',
    },
    ...overrides,
  } as unknown as Request;
}

/** Helper to create a mock Express Response */
function createMockRes(): Response {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis() as any,
    json: vi.fn().mockReturnThis() as any,
  };
  return res as Response;
}

describe('Goal Controller', () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    mockStore.clear();
    mockNext = vi.fn();
  });

  describe('createGoal', () => {
    it('should create a goal with correct defaults', async () => {
      const req = createMockReq({
        body: {
          category: 'energy',
          title: 'Reduce electricity',
          targetValue: 100,
          currentValue: 0,
          unit: 'kWh',
          startDate: '2026-06-01',
          targetDate: '2026-12-31',
        },
      });
      const res = createMockRes();

      await createGoal(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          goal: expect.objectContaining({
            id: 'test-goal-uuid-1',
            userId: 'test-user-1',
            category: 'energy',
            title: 'Reduce electricity',
            status: 'active',
          }),
        })
      );

      // Verify data was stored
      const stored = mockStore.get('goals/test-goal-uuid-1');
      expect(stored).toBeDefined();
      expect(stored.status).toBe('active');
    });

    it('should return 401 when no user is present', async () => {
      const req = createMockReq({ user: undefined });
      const res = createMockRes();

      await createGoal(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('getGoals', () => {
    it('should return goals for the current user', async () => {
      // Seed goals
      mockStore.set('goals/goal-1', {
        id: 'goal-1',
        userId: 'test-user-1',
        category: 'energy',
        title: 'Goal 1',
        status: 'active',
      });
      mockStore.set('goals/goal-2', {
        id: 'goal-2',
        userId: 'test-user-1',
        category: 'food',
        title: 'Goal 2',
        status: 'active',
      });
      mockStore.set('goals/goal-3', {
        id: 'goal-3',
        userId: 'other-user',
        category: 'waste',
        title: 'Goal 3',
        status: 'active',
      });

      const req = createMockReq();
      const res = createMockRes();

      await getGoals(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonCall = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonCall.success).toBe(true);
      expect(jsonCall.goals).toHaveLength(2);
      expect(jsonCall.goals.every((g: any) => g.userId === 'test-user-1')).toBe(true);
    });

    it('should return empty array when user has no goals', async () => {
      const req = createMockReq();
      const res = createMockRes();

      await getGoals(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonCall = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonCall.goals).toHaveLength(0);
    });
  });

  describe('updateGoalProgress', () => {
    it('should update the currentValue of a goal', async () => {
      mockStore.set('goals/goal-1', {
        id: 'goal-1',
        userId: 'test-user-1',
        category: 'energy',
        title: 'Reduce electricity',
        targetValue: 100,
        currentValue: 20,
        status: 'active',
      });

      const req = createMockReq({
        params: { id: 'goal-1' } as any,
        body: { currentValue: 50 },
      });
      const res = createMockRes();

      await updateGoalProgress(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonCall = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonCall.goal.currentValue).toBe(50);
    });

    it('should return 404 when goal does not exist', async () => {
      const req = createMockReq({
        params: { id: 'nonexistent-goal' } as any,
        body: { currentValue: 50 },
      });
      const res = createMockRes();

      await updateGoalProgress(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 when goal belongs to another user', async () => {
      mockStore.set('goals/goal-other', {
        id: 'goal-other',
        userId: 'other-user-id',
        category: 'food',
        title: 'Other user goal',
        targetValue: 50,
        currentValue: 10,
        status: 'active',
      });

      const req = createMockReq({
        params: { id: 'goal-other' } as any,
        body: { currentValue: 25 },
      });
      const res = createMockRes();

      await updateGoalProgress(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteGoal', () => {
    it('should delete a goal owned by the user', async () => {
      mockStore.set('goals/goal-1', {
        id: 'goal-1',
        userId: 'test-user-1',
        category: 'energy',
        title: 'Goal to delete',
        status: 'active',
      });

      const req = createMockReq({
        params: { id: 'goal-1' } as any,
      });
      const res = createMockRes();

      await deleteGoal(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('removed'),
        })
      );
      expect(mockStore.has('goals/goal-1')).toBe(false);
    });

    it('should return 404 when trying to delete a nonexistent goal', async () => {
      const req = createMockReq({
        params: { id: 'nonexistent' } as any,
      });
      const res = createMockRes();

      await deleteGoal(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 when trying to delete another user goal', async () => {
      mockStore.set('goals/goal-other', {
        id: 'goal-other',
        userId: 'different-user',
        category: 'food',
        title: 'Not your goal',
        status: 'active',
      });

      const req = createMockReq({
        params: { id: 'goal-other' } as any,
      });
      const res = createMockRes();

      await deleteGoal(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
