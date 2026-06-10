import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import { validateCarbonEntry, validateGoal, validateProfile } from '../middleware/validators.js';
import { getProfile, createProfile, updateProfile } from '../controllers/userController.js';
import { createEntry, getEntries, getEntry, deleteEntry, getDashboardStats } from '../controllers/carbonController.js';
import { createGoal, getGoals, updateGoalProgress, deleteGoal } from '../controllers/goalController.js';
import { getAchievements, getBadges } from '../controllers/gamificationController.js';
import { getRecommendations, scanReceipt, generateReport } from '../controllers/aiController.js';

const router = Router();

// Configure multer for file uploads (receipt scanning)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Authentication and user routes
router.post('/users/profile', authMiddleware, createProfile);
router.get('/users/profile', authMiddleware, getProfile);
router.put('/users/profile', authMiddleware, validateProfile, updateProfile);

// Carbon Footprint entries
router.post('/carbon', authMiddleware, validateCarbonEntry, createEntry);
router.get('/carbon', authMiddleware, getEntries);
router.get('/carbon/stats', authMiddleware, getDashboardStats);
router.get('/carbon/:id', authMiddleware, getEntry);
router.delete('/carbon/:id', authMiddleware, deleteEntry);

// Goals
router.post('/goals', authMiddleware, validateGoal, createGoal);
router.get('/goals', authMiddleware, getGoals);
router.put('/goals/:id', authMiddleware, updateGoalProgress);
router.delete('/goals/:id', authMiddleware, deleteGoal);

// Gamification
router.get('/gamification/achievements', authMiddleware, getAchievements);
router.get('/gamification/badges', authMiddleware, getBadges);

// AI Layer
router.post('/ai/recommendations', authMiddleware, getRecommendations);
router.post('/ai/scan-receipt', authMiddleware, upload.single('receipt'), scanReceipt);
router.post('/ai/report', authMiddleware, generateReport);

export default router;
