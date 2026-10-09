import { Router } from 'express';
import { enrollInCourse } from '../controllers/enrollmentController.js';
import { getMyCourses } from '../controllers/courseController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/my-courses', authenticate, getMyCourses);
router.post('/enroll/:courseId', authenticate, enrollInCourse);

export default router;
