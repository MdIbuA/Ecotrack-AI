import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase.js';
import { UserProfile } from '../models/types.js';
import { calculateLevel } from '../utils/achievements.js';

/**
 * Creates or fetches the user profile on first sign-in
 */
export async function createProfile(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized user context' });
    }

    const userRef = db.collection('users').doc(user.uid);
    const doc = await userRef.get();

    if (doc.exists) {
      return res.status(200).json({ success: true, profile: doc.data() });
    }

    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.name || user.email.split('@')[0],
      createdAt: new Date().toISOString(),
      ecoPoints: 0,
      level: 1,
      streak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      badges: [],
    };

    await userRef.set(newProfile);

    res.status(201).json({ success: true, profile: newProfile });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves the current user's profile
 */
export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized user context' });
    }

    const userRef = db.collection('users').doc(user.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      // Auto-create profile if missing but user is authenticated
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.name || user.email.split('@')[0],
        createdAt: new Date().toISOString(),
        ecoPoints: 0,
        level: 1,
        streak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        badges: [],
      };
      await userRef.set(newProfile);
      return res.status(200).json({ success: true, profile: newProfile });
    }

    const profile = doc.data() as UserProfile;
    
    // Dynamically calculate level properties in case points changed
    const levelDetails = calculateLevel(profile.ecoPoints);
    const responseProfile = {
      ...profile,
      level: levelDetails.level,
      levelTitle: levelDetails.title,
      levelProgressPercent: levelDetails.progressPercent,
    };

    res.status(200).json({ success: true, profile: responseProfile });
  } catch (error) {
    next(error);
  }
}

/**
 * Updates displayName or photoURL in user profile
 */
export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized user context' });
    }

    const { displayName, photoURL } = req.body;
    const userRef = db.collection('users').doc(user.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    const updates: Partial<UserProfile> = {};
    if (displayName) updates.displayName = displayName;
    if (photoURL) updates.photoURL = photoURL;

    await userRef.update(updates);

    const updatedDoc = await userRef.get();
    res.status(200).json({ success: true, profile: updatedDoc.data() });
  } catch (error) {
    next(error);
  }
}
