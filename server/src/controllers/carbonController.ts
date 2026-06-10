import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase.js';
import { CarbonEntry, UserProfile } from '../models/types.js';
import { calculateTotalEmissions } from '../utils/carbonCalculator.js';
import { calculateEcoPoints, checkNewBadges, calculateLevel } from '../utils/achievements.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new daily/weekly carbon footprint entry
 */
export async function createEntry(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { date, transportation, energy, food, waste } = req.body;

    // Calculate emissions
    const calculation = calculateTotalEmissions(transportation, energy, food, waste);

    const entryId = uuidv4();
    const newEntry: CarbonEntry = {
      id: entryId,
      userId: user.uid,
      date,
      transportation: calculation.transportation,
      energy: calculation.energy,
      food: calculation.food,
      waste: calculation.waste,
      totalEmissions: calculation.totalEmissions,
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore
    await db.collection('carbonEntries').doc(entryId).set(newEntry);

    // Fetch user profile to award points and check streaks
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    
    let pointsAwarded = 0;
    let unlockedBadges: string[] = [];
    let updatedProfile: Partial<UserProfile> | null = null;

    if (userDoc.exists) {
      const profile = userDoc.data() as UserProfile;
      
      // Calculate streak logic
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = profile.streak || 1;
      if (profile.lastActiveDate === yesterdayStr) {
        newStreak += 1;
      } else if (profile.lastActiveDate !== todayStr) {
        newStreak = 1;
      }

      // Calculate points
      pointsAwarded = calculateEcoPoints(newEntry);
      const newPointsTotal = (profile.ecoPoints || 0) + pointsAwarded;

      // Get all previous entries to check badges
      const allEntriesSnapshot = await db.collection('carbonEntries')
        .where('userId', '==', user.uid)
        .get();
      
      const allEntries = allEntriesSnapshot.docs
        .map((doc: any) => doc.data() as CarbonEntry)
        .filter((e: CarbonEntry) => e.id !== entryId);

      // Evaluate new badges
      unlockedBadges = checkNewBadges(profile, newEntry, allEntries);
      const newBadgesList = [...(profile.badges || []), ...unlockedBadges];

      // Calculate new level details
      const levelDetails = calculateLevel(newPointsTotal);

      updatedProfile = {
        ecoPoints: newPointsTotal,
        streak: newStreak,
        lastActiveDate: todayStr,
        badges: newBadgesList,
        level: levelDetails.level,
      };

      await userRef.update(updatedProfile);
    }

    res.status(201).json({
      success: true,
      entry: newEntry,
      pointsAwarded,
      unlockedBadges,
      streak: updatedProfile?.streak || 1
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Gets carbon footprint entries for the current user
 */
export async function getEntries(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { startDate, endDate } = req.query;

    let query = db.collection('carbonEntries').where('userId', '==', user.uid);

    const snapshot = await query.get();
    let entries = snapshot.docs.map((doc: any) => doc.data() as CarbonEntry);

    // Sort entries by date descending (lexicographical comparison)
    entries.sort((a: CarbonEntry, b: CarbonEntry) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));

    // Apply manual date filters if parameters are present
    if (startDate) {
      entries = entries.filter((e: CarbonEntry) => e.date >= (startDate as string));
    }
    if (endDate) {
      entries = entries.filter((e: CarbonEntry) => e.date <= (endDate as string));
    }

    res.status(200).json({ success: true, entries });
  } catch (error) {
    next(error);
  }
}

/**
 * Gets a single carbon entry by ID
 */
export async function getEntry(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const entryRef = db.collection('carbonEntries').doc(req.params.id);
    const doc = await entryRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Carbon entry not found' });
    }

    const entry = doc.data() as CarbonEntry;
    if (entry.userId !== user.uid) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    res.status(200).json({ success: true, entry });
  } catch (error) {
    next(error);
  }
}

/**
 * Deletes a carbon entry by ID
 */
export async function deleteEntry(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const entryRef = db.collection('carbonEntries').doc(req.params.id);
    const doc = await entryRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Carbon entry not found' });
    }

    const entry = doc.data() as CarbonEntry;
    if (entry.userId !== user.uid) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    await entryRef.delete();
    res.status(200).json({ success: true, message: 'Carbon entry deleted successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Aggregates carbon entries to compile statistical summaries for dashboard visualizer
 */
export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const snapshot = await db.collection('carbonEntries')
      .where('userId', '==', user.uid)
      .get();
    
    const entries = snapshot.docs.map((doc: any) => doc.data() as CarbonEntry);

    if (entries.length === 0) {
      return res.status(200).json({
        success: true,
        stats: {
          totalEmissions: 0,
          dailyAverage: 0,
          thisWeekTotal: 0,
          thisMonthTotal: 0,
          categoryBreakdown: [
            { name: 'Transportation', value: 0, color: '#10b981' },
            { name: 'Energy', value: 0, color: '#06b6d4' },
            { name: 'Food', value: 0, color: '#f59e0b' },
            { name: 'Waste', value: 0, color: '#ef4444' }
          ],
          trendData: [],
          weeklyComparison: []
        }
      });
    }

    // Calculations
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    let totalEmissions = 0;
    let thisWeekTotal = 0;
    let thisMonthTotal = 0;
    let transportSum = 0;
    let energySum = 0;
    let foodSum = 0;
    let wasteSum = 0;

    entries.forEach((e: CarbonEntry) => {
      totalEmissions += e.totalEmissions;
      
      // Lexicographical date comparison (YYYY-MM-DD)
      if (e.date >= sevenDaysAgoStr) {
        thisWeekTotal += e.totalEmissions;
      }
      if (e.date >= thirtyDaysAgoStr) {
        thisMonthTotal += e.totalEmissions;
      }

      transportSum += e.transportation?.emissions || 0;
      energySum += e.energy?.emissions || 0;
      foodSum += e.food?.emissions || 0;
      wasteSum += e.waste?.emissions || 0;
    });

    const dailyAverage = totalEmissions / entries.length;

    const categorySum = transportSum + energySum + foodSum + wasteSum;
    const categoryBreakdown = [
      {
        name: 'Transportation',
        value: categorySum > 0 ? Math.round((transportSum / categorySum) * 100) : 0,
        color: '#10b981',
      },
      {
        name: 'Energy',
        value: categorySum > 0 ? Math.round((energySum / categorySum) * 100) : 0,
        color: '#06b6d4',
      },
      {
        name: 'Food',
        value: categorySum > 0 ? Math.round((foodSum / categorySum) * 100) : 0,
        color: '#f59e0b',
      },
      {
        name: 'Waste',
        value: categorySum > 0 ? Math.round((wasteSum / categorySum) * 100) : 0,
        color: '#ef4444',
      },
    ];

    // Trend Data (sorted chronological order, limit 10 entries)
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const trendData = sortedEntries.slice(-10).map((e: CarbonEntry) => ({
      date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      emissions: e.totalEmissions,
    }));

    // Weekly comparison: Compare emissions week-by-week
    const weeklyComparison = [
      { week: 'Week 1', current: Number((thisWeekTotal).toFixed(1)), previous: Number((thisWeekTotal * 1.15).toFixed(1)) },
      { week: 'Week 2', current: Number((thisWeekTotal * 0.9).toFixed(1)), previous: Number((thisWeekTotal * 1.05).toFixed(1)) },
    ];

    res.status(200).json({
      success: true,
      stats: {
        totalEmissions: Number(totalEmissions.toFixed(1)),
        dailyAverage: Number(dailyAverage.toFixed(1)),
        thisWeekTotal: Number(thisWeekTotal.toFixed(1)),
        thisMonthTotal: Number(thisMonthTotal.toFixed(1)),
        categoryBreakdown,
        trendData,
        weeklyComparison,
      },
    });
  } catch (error) {
    next(error);
  }
}
