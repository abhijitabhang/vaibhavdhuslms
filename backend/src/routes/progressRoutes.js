import { Router } from 'express';
import { updateProgress, getCourseProgress } from '../controllers/progressController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/:courseId', authenticate, getCourseProgress);
router.post('/:lessonId', authenticate, updateProgress);

export default router;
