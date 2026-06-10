import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// Mock the firebase config module before importing auth middleware
vi.mock('../config/firebase.js', () => ({
  isMockMode: false,
  db: {},
  default: {},
}));

// Mock firebase-admin
vi.mock('firebase-admin', () => ({
  default: {
    auth: vi.fn(() => ({
      verifyIdToken: vi.fn(),
    })),
  },
}));

import { authMiddleware } from '../middleware/auth.js';
import * as firebaseConfig from '../config/firebase.js';
import admin from 'firebase-admin';

/** Helper to create a mock Express Request */
function createMockReq(headers: Record<string, string> = {}): Request {
  return {
    headers,
    user: undefined,
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

describe('Auth Middleware', () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    mockNext = vi.fn();
    vi.restoreAllMocks();
  });

  it('should return 401 when no Authorization header is present in non-mock mode', async () => {
    // Ensure mock mode is off
    Object.defineProperty(firebaseConfig, 'isMockMode', { value: false, writable: true });

    const req = createMockReq({});
    const res = createMockRes();

    await authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Unauthorized'),
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization header has invalid format', async () => {
    Object.defineProperty(firebaseConfig, 'isMockMode', { value: false, writable: true });

    const req = createMockReq({ authorization: 'Basic abc123' });
    const res = createMockRes();

    await authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should set mock user and call next() when in mock mode without header', async () => {
    Object.defineProperty(firebaseConfig, 'isMockMode', { value: true, writable: true });

    const req = createMockReq({});
    const res = createMockRes();

    await authMiddleware(req, res, mockNext);

    expect(req.user).toBeDefined();
    expect(req.user!.uid).toBe('mock-user-123');
    expect(req.user!.email).toBe('demo.user@ecotrack.ai');
    expect(req.user!.name).toBe('Eco Warrior Demo');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should set mock user when in mock mode even with a Bearer token', async () => {
    Object.defineProperty(firebaseConfig, 'isMockMode', { value: true, writable: true });

    const req = createMockReq({ authorization: 'Bearer some-token-value' });
    const res = createMockRes();

    await authMiddleware(req, res, mockNext);

    expect(req.user).toBeDefined();
    expect(req.user!.uid).toBe('mock-user-123');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should extract uid, email, name from decoded Firebase token', async () => {
    Object.defineProperty(firebaseConfig, 'isMockMode', { value: false, writable: true });

    const mockDecodedToken = {
      uid: 'firebase-user-abc',
      email: 'real@example.com',
      name: 'Real User',
    };

    const mockVerifyIdToken = vi.fn().mockResolvedValue(mockDecodedToken);
    (admin.auth as ReturnType<typeof vi.fn>).mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    });

    const req = createMockReq({ authorization: 'Bearer valid-firebase-token' });
    const res = createMockRes();

    await authMiddleware(req, res, mockNext);

    expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-firebase-token');
    expect(req.user).toEqual({
      uid: 'firebase-user-abc',
      email: 'real@example.com',
      name: 'Real User',
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 401 when Firebase token verification fails', async () => {
    Object.defineProperty(firebaseConfig, 'isMockMode', { value: false, writable: true });

    const mockVerifyIdToken = vi.fn().mockRejectedValue(new Error('Token expired'));
    (admin.auth as ReturnType<typeof vi.fn>).mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    });

    const req = createMockReq({ authorization: 'Bearer expired-token' });
    const res = createMockRes();

    await authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Invalid ID token'),
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });
});
