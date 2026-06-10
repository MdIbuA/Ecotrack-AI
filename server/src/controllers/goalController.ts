import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase.js';
import { Goal } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new environmental goal
 */
export async function createGoal(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { category, title, targetValue, currentValue, unit, startDate, targetDate } = req.body;

    const goalId = uuidv4();
    const newGoal: Goal = {
      id: goalId,
      userId: user.uid,
      category,
      title,
      targetValue,
      currentValue,
      unit,
      startDate,
      targetDate,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    await db.collection('goals').doc(goalId).set(newGoal);

    res.status(201).json({ success: true, goal: newGoal });
  } catch (error) {
    next(error);
  }
}

/**
 * Gets all goals belonging to the current user
 */
export async function getGoals(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const snapshot = await db.collection('goals')
      .where('userId', '==', user.uid)
      .get();
    
    const goals = snapshot.docs.map((doc: any) => doc.data() as Goal);

    res.status(200).json({ success: true, goals });
  } catch (error) {
    next(error);
  }
}

/**
 * Updates an active goal progress value
 */
export async function updateGoalProgress(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { currentValue, status } = req.body;
    const goalRef = db.collection('goals').doc(req.params.id);
    const doc = await goalRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }

    const goal = doc.data() as Goal;
    if (goal.userId !== user.uid) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const updates: Partial<Goal> = {};
    if (currentValue !== undefined) {
      updates.currentValue = currentValue;
      // Automatically complete goal if target is met/exceeded
      // (For reduction goals, it is met if current value goes below target,
      // for habit goals, if current meets or exceeds target. Assume habit increase or reduction target check)
      if (currentValue >= goal.targetValue) {
        updates.status = 'completed';
        
        // Award Eco points on completion
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          const profile = userDoc.data() as any;
          const newPoints = (profile.ecoPoints || 0) + 150; // Goal completed bonus
          const badges = [...(profile.badges || [])];
          if (!badges.includes('goal_completed')) {
            badges.push('goal_completed');
          }
          await userRef.update({
            ecoPoints: newPoints,
            badges
          });
        }
      }
    }
    
    if (status) {
      updates.status = status;
    }

    await goalRef.update(updates);
    
    const updatedGoal = { ...goal, ...updates };

    res.status(200).json({ success: true, goal: updatedGoal });
  } catch (error) {
    next(error);
  }
}

/**
 * Deletes a goal
 */
export async function deleteGoal(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const goalRef = db.collection('goals').doc(req.params.id);
    const doc = await goalRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }

    const goal = doc.data() as Goal;
    if (goal.userId !== user.uid) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    await goalRef.delete();
    res.status(200).json({ success: true, message: 'Goal removed successfully' });
  } catch (error) {
    next(error);
  }
}
