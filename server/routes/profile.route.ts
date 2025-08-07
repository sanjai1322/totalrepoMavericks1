import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';

const router = Router();

// POST /api/profile - Create a new profile with AI skill extraction
router.post('/', ProfileController.createProfile);

// GET /api/profile/:userId - Get profile by user ID
router.get('/:userId', ProfileController.getProfile);

export { router as profileRouter };