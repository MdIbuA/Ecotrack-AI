import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// Use in-memory mock store to simulate Firestore
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
});

const mockCollection = (path: string) => ({
  doc: (id: string) => mockDocRef(path, id),
});

// Mock firebase config module
vi.mock('../config/firebase.js', () => ({
  db: {
    collection: (path: string) => mockCollection(path),
  },
  isMockMode: true,
}));

// Mock achievements utility
vi.mock('../utils/achievements.js', () => ({
  calculateLevel: vi.fn((points: number) => ({
    level: Math.floor(points / 100) + 1,
    title: 'Test Level',
    progressPercent: points % 100,
  })),
}));

import { createProfile, getProfile, updateProfile } from '../controllers/userController.js';

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

describe('User Controller', () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    mockStore.clear();
    mockNext = vi.fn();
  });

  describe('createProfile', () => {
    it('should create a new user profile when none exists', async () => {
      const req = createMockReq();
      const res = createMockRes();

      await createProfile(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          profile: expect.objectContaining({
            uid: 'test-user-1',
            email: 'test@ecotrack.ai',
            displayName: 'Test User',
            ecoPoints: 0,
            level: 1,
            badges: [],
          }),
        })
      );
    });

    it('should return existing profile if user already exists', async () => {
      // Pre-populate store
      mockStore.set('users/test-user-1', {
        uid: 'test-user-1',
        email: 'test@ecotrack.ai',
        displayName: 'Existing User',
        ecoPoints: 500,
        level: 3,
        badges: ['first_entry'],
      });

      const req = createMockReq();
      const res = createMockRes();

      await createProfile(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          profile: expect.objectContaining({
            displayName: 'Existing User',
            ecoPoints: 500,
          }),
        })
      );
    });

    it('should return 401 when no user context is present', async () => {
      const req = createMockReq({ user: undefined });
      const res = createMockRes();

      await createProfile(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('getProfile', () => {
    it('should return existing profile with level details', async () => {
      mockStore.set('users/test-user-1', {
        uid: 'test-user-1',
        email: 'test@ecotrack.ai',
        displayName: 'Test User',
        ecoPoints: 250,
        level: 2,
        badges: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        streak: 5,
      });

      const req = createMockReq();
      const res = createMockRes();

      await getProfile(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          profile: expect.objectContaining({
            uid: 'test-user-1',
            levelTitle: 'Test Level',
          }),
        })
      );
    });

    it('should auto-create profile when user is authenticated but no profile exists', async () => {
      const req = createMockReq();
      const res = createMockRes();

      await getProfile(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          profile: expect.objectContaining({
            uid: 'test-user-1',
            ecoPoints: 0,
          }),
        })
      );
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields successfully', async () => {
      mockStore.set('users/test-user-1', {
        uid: 'test-user-1',
        email: 'test@ecotrack.ai',
        displayName: 'Old Name',
        ecoPoints: 0,
        level: 1,
        badges: [],
      });

      const req = createMockReq({
        body: { displayName: 'New Name', photoURL: 'https://example.com/photo.jpg' },
      });
      const res = createMockRes();

      await updateProfile(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      // Verify store was updated
      const stored = mockStore.get('users/test-user-1');
      expect(stored.displayName).toBe('New Name');
      expect(stored.photoURL).toBe('https://example.com/photo.jpg');
    });

    it('should return 404 when profile does not exist', async () => {
      const req = createMockReq({
        body: { displayName: 'New Name' },
      });
      const res = createMockRes();

      await updateProfile(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('not found'),
        })
      );
    });
  });
});
