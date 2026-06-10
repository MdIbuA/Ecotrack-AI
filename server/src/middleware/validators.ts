import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Helper middleware to check for validation errors
 */
const checkValidation = (req: Request, res: Response, next: NextFunction): any => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

export const validateCarbonEntry = [
  body('date').isISO8601().withMessage('Date must be in valid ISO 8601 format (YYYY-MM-DD)'),
  body('transportation').isObject().withMessage('Transportation data is required'),
  body('transportation.carKm').isNumeric().withMessage('Car distance must be a number'),
  body('transportation.bikeKm').isNumeric().withMessage('Bike distance must be a number'),
  body('transportation.busKm').isNumeric().withMessage('Bus distance must be a number'),
  body('transportation.trainKm').isNumeric().withMessage('Train distance must be a number'),
  body('transportation.flightHours').isNumeric().withMessage('Flight hours must be a number'),
  
  body('energy').isObject().withMessage('Energy data is required'),
  body('energy.electricityKwh').isNumeric().withMessage('Electricity Kwh must be a number'),
  body('energy.acHours').isNumeric().withMessage('AC usage hours must be a number'),
  body('energy.applianceFactor').isIn(['low', 'medium', 'high']).withMessage('Appliance factor must be low, medium, or high'),
  
  body('food').isObject().withMessage('Food data is required'),
  body('food.dietType').isIn(['vegan', 'vegetarian', 'omnivore']).withMessage('Diet type must be vegan, vegetarian, or omnivore'),
  
  body('waste').isObject().withMessage('Waste data is required'),
  body('waste.plasticBagCount').isNumeric().withMessage('Plastic bag count must be a number'),
  body('waste.foodWasteKg').isNumeric().withMessage('Food waste in kg must be a number'),
  body('waste.recyclingRate').isFloat({ min: 0, max: 100 }).withMessage('Recycling rate must be a percentage between 0 and 100'),
  
  checkValidation
];

export const validateGoal = [
  body('category').isIn(['transportation', 'energy', 'food', 'waste', 'overall']).withMessage('Goal category must be transportation, energy, food, waste, or overall'),
  body('title').isString().notEmpty().withMessage('Goal title is required'),
  body('targetValue').isNumeric().withMessage('Target value must be a number'),
  body('currentValue').isNumeric().withMessage('Current value must be a number'),
  body('unit').isString().notEmpty().withMessage('Unit of measurement is required'),
  body('startDate').isISO8601().withMessage('Start date must be in YYYY-MM-DD format'),
  body('targetDate').isISO8601().withMessage('Target date must be in YYYY-MM-DD format'),
  
  checkValidation
];

export const validateProfile = [
  body('displayName').isString().trim().notEmpty().withMessage('Display name is required'),
  body('photoURL').optional({ checkFalsy: true }).isURL().withMessage('Photo URL must be a valid URL'),
  
  checkValidation
];
