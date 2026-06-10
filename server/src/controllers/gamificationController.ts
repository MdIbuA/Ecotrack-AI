import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase.js';
import { UserProfile } from '../models/types.js';
import { BADGES, LEVELS, calculateLevel } from '../utils/achievements.js';

/**
 * Gets achievements details (available, locked, unlocked) for gamification page
 */
export async function getAchievements(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    const profile = userDoc.data() as UserProfile;
    const unlockedBadgeIds = new Set(profile.badges || []);

    const badgesResponse = BADGES.map((b) => ({
      ...b,
      unlocked: unlockedBadgeIds.has(b.id),
    }));

    const levelDetails = calculateLevel(profile.ecoPoints || 0);

    // Leaderboard simulation
    const leaderboard = [
      { name: 'Alice (You)', points: profile.ecoPoints, level: levelDetails.level, isSelf: true },
      { name: 'Bob EcoHunter', points: 3400, level: 5, isSelf: false },
      { name: 'Charlie ClimateGuard', points: 1950, level: 4, isSelf: false },
      { name: 'Diana NatureLove', points: 850, level: 3, isSelf: false },
      { name: 'Emma Sprouts', points: 420, level: 2, isSelf: false }
    ];

    // Sort leaderboard desc
    leaderboard.sort((a, b) => b.points - a.points);

    res.status(200).json({
      success: true,
      gamification: {
        ecoPoints: profile.ecoPoints,
        streak: profile.streak || 1,
        badges: badgesResponse,
        level: levelDetails.level,
        levelTitle: levelDetails.title,
        levelProgressPercent: levelDetails.progressPercent,
        nextLevelMinPoints: levelDetails.nextLevelMinPoints,
        leaderboard,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Gets badges list for user profile
 */
export async function getBadges(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const userDoc = await db.collection('users').doc(user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    const profile = userDoc.data() as UserProfile;
    const earnedBadgeIds = profile.badges || [];
    const earnedBadges = BADGES.filter((b) => earnedBadgeIds.includes(b.id));

    res.status(200).json({ success: true, badges: earnedBadges });
  } catch (error) {
    next(error);
  }
}
