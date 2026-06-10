import { Request, Response, NextFunction } from 'express';
import { isMockMode } from '../config/firebase.js';
import admin from 'firebase-admin';

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        name: string;
      };
    }
  }
}

/**
 * Authentication middleware to verify incoming Firebase Auth JWT ID Tokens
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<any> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (isMockMode) {
      // Allow fallback to standard mock user in mock dev mode
      req.user = {
        uid: 'mock-user-123',
        email: 'demo.user@ecotrack.ai',
        name: 'Eco Warrior Demo',
      };
      return next();
    }
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];

  if (isMockMode) {
    // Decode mock token parameters if it resembles user info, or default to mock user
    req.user = {
      uid: 'mock-user-123',
      email: 'demo.user@ecotrack.ai',
      name: 'Eco Warrior Demo',
    };
    return next();
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'User'),
    };
    next();
  } catch (error) {
    console.error('❌ Error verifying Firebase ID Token:', error);
    res.status(401).json({ success: false, error: 'Unauthorized: Invalid ID token' });
  }
}
