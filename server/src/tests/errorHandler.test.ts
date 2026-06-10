import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, errorHandler } from '../middleware/errorHandler.js';
import { Request, Response, NextFunction } from 'express';

/** Helper to create a mock Express Response */
function createMockRes(): Response {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis() as any,
    json: vi.fn().mockReturnThis() as any,
  };
  return res as Response;
}

describe('AppError Class', () => {
  it('should set the correct message and default statusCode', () => {
    const error = new AppError('Something went wrong');
    expect(error.message).toBe('Something went wrong');
    expect(error.statusCode).toBe(400);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it('should set a custom statusCode when provided', () => {
    const error = new AppError('Not Found', 404);
    expect(error.message).toBe('Not Found');
    expect(error.statusCode).toBe(404);
  });

  it('should set a 500 statusCode for internal server errors', () => {
    const error = new AppError('Server failure', 500);
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Server failure');
  });
});

describe('errorHandler Middleware', () => {
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {} as Request;
    mockRes = createMockRes();
    mockNext = vi.fn();
    // Reset NODE_ENV between tests
    vi.unstubAllEnvs();
  });

  it('should return correct JSON format for an AppError', () => {
    const error = new AppError('Validation failed', 422);
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(422);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Validation failed',
      })
    );
  });

  it('should default to status 500 for errors without a statusCode', () => {
    const error = new Error('Unexpected failure');
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Unexpected failure',
      })
    );
  });

  it('should hide stack trace when NODE_ENV is production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const error = new AppError('Production error', 500);
    errorHandler(error, mockReq, mockRes, mockNext);

    const jsonCall = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(jsonCall.stack).toBeUndefined();
  });

  it('should include stack trace when NODE_ENV is development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const error = new AppError('Dev error', 500);
    errorHandler(error, mockReq, mockRes, mockNext);

    const jsonCall = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(jsonCall.stack).toBeDefined();
    expect(typeof jsonCall.stack).toBe('string');
  });

  it('should use default message when error has no message', () => {
    const error = { statusCode: 503 } as any;
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(503);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'An unexpected error occurred',
      })
    );
  });
});
