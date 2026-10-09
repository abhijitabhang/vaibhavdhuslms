import { Router } from 'express';
import { downloadResource, getCourseResources } from '../controllers/resourceController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/course/:courseId', authenticate, getCourseResources);
router.get('/:resourceId/download', authenticate, downloadResource);

export default router;
