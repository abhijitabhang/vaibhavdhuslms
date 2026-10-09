import { Router } from 'express';
import { getPlatformSettings, updatePlatformSettings } from '../controllers/settingsController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getPlatformSettings);
router.put('/', authenticate, authorize('admin'), updatePlatformSettings);

export default router;
